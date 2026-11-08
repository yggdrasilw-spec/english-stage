#!/usr/bin/env python3
"""Offline question-intonation builder. No credentials are read in dry-run."""
import argparse
import hashlib
import html
import io
import json
import math
import os
from pathlib import Path
import re
import shutil
import statistics
import subprocess
import sys
import wave
from array import array
from functools import lru_cache

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SR = 24000


def read(path, default=None):
    return json.loads(path.read_text(encoding='utf-8')) if path.exists() else default


def write(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def wav_bytes(samples, sr=SR):
    data = array('h', (int(max(-1, min(1, x)) * 32767) for x in samples))
    if sys.byteorder != 'little':
        data.byteswap()
    out = io.BytesIO()
    with wave.open(out, 'wb') as w:
        w.setparams((1, 2, sr, 0, 'NONE', 'not compressed'))
        w.writeframes(data.tobytes())
    return out.getvalue()


def load_wav(data):
    with wave.open(io.BytesIO(data), 'rb') as w:
        if w.getnchannels() != 1 or w.getsampwidth() != 2:
            raise ValueError('Expected mono LINEAR16 WAV')
        sr = w.getframerate()
        a = array('h', w.readframes(w.getnframes()))
        if sys.byteorder != 'little':
            a.byteswap()
        return [x / 32768 for x in a], sr


def glide(v, seconds=1.2):
    """Known acoustic fixture, not a spoken English recording."""
    phase = 0
    samples = [0.] * int(.08 * SR)
    for i in range(int(seconds * SR)):
        t = i / SR
        # A steep terminal contour gives >2st between the specified windows.
        st = (1 if v == 'u' else -1 if v == 'd' else 0) * 36 * max(0, t - seconds + .4)
        phase += 2 * math.pi * 180 * 2 ** (st / 12) / SR
        env = min(1, t / .02, (seconds - t) / .02)
        samples.append(.22 * max(0, env) * math.sin(phase))
    return wav_bytes(samples + [0.] * int(.08 * SR))


def active_span(samples, sr):
    # 10ms RMS avoids treating zero crossings as silence.
    step = max(1, int(sr * .01))
    rms = [math.sqrt(sum(x*x for x in samples[i:i+step]) / max(1, len(samples[i:i+step])))
           for i in range(0, len(samples), step)]
    threshold = max(.003, max(rms, default=0) * .025)
    ids = [i for i, x in enumerate(rms) if x >= threshold]
    return (ids[0] * .01, min(len(samples)/sr, (ids[-1]+1)*.01)) if ids else (0, 0)


def f0_frames(data, dry=False):
    samples, sr = load_wav(data)
    backend = 'parselmouth'
    try:
        import parselmouth
        snd = parselmouth.Sound(samples, sampling_frequency=sr)
        pitch = snd.to_pitch_ac(time_step=.01, pitch_floor=75, pitch_ceiling=500)
        frames = list(zip(pitch.xs().tolist(), pitch.selected_array['frequency'].tolist()))
    except ImportError:
        if not dry:
            raise RuntimeError('Real audio analysis requires praat-parselmouth; install requirements.txt')
        backend = 'dry-sine-zero-crossing'
        frames = []
        for k in range(int(.02*sr), len(samples)-int(.02*sr), int(.01*sr)):
            seg = samples[k-int(.02*sr):k+int(.02*sr)]
            crossings = [i + (-seg[i])/(seg[i+1]-seg[i]) for i in range(len(seg)-1)
                         if seg[i] <= 0 < seg[i+1]]
            f = sr*(len(crossings)-1)/(crossings[-1]-crossings[0]) if len(crossings)>1 else 0
            frames.append((k/sr, f if 75 <= f <= 500 and max(seg, default=0)>.01 else 0))
    # Reject isolated octave outliers against a local median in log-frequency.
    cleaned = []
    for i, (t, f) in enumerate(frames):
        near = [x for _, x in frames[max(0,i-3):i+4] if x > 0]
        if f > 0 and near and abs(12*math.log2(f/statistics.median(near))) > 9:
            f = 0
        cleaned.append((t, f))
    return cleaned, backend


def contour(frames, start, end, threshold=2.):
    voiced = [(t, f) for t, f in frames if start <= t <= end and f > 0]
    if not voiced:
        return None, 'flat'
    end = voiced[-1][0] + .005
    tail = [f for t, f in voiced if end-.1 <= t <= end]
    prev = [f for t, f in voiced if end-.25 <= t < end-.1]
    if len(tail) < 3 or len(prev) < 3:
        return None, 'flat'
    delta = 12*math.log2(statistics.median(tail)/statistics.median(prev))
    return round(delta, 3), 'u' if delta >= threshold else 'd' if delta <= -threshold else 'flat'


def timings(q, data, points):
    samples, sr = load_wav(data)
    a, b = active_span(samples, sr)
    words = q['s'].split(' ')
    exact = len(points) == len(words) and all(f'w{i}' in points for i in range(len(words)))
    if exact:
        values = [points[f'w{i}'] for i in range(len(words))]
        exact = all(math.isfinite(x) and 0 <= x <= len(samples)/sr for x in values) and values == sorted(values)
    if exact:
        return [max(0, points[f'w{i}']*1000) for i in range(len(words))], False
    weights = [max(1, len(re.sub(r'[^\w]', '', x))) for x in words]
    total = sum(weights)
    return [1000*(a+(b-a)*sum(weights[:i])/total) for i in range(len(words))], True


def analyze(q, v, data, T, approx, cfg, dry=False):
    samples, sr = load_wav(data)
    a, b = active_span(samples, sr)
    frames, backend = f0_frames(data, dry)
    start = a + .65*(b-a) if approx else max(a, T[-1]/1000)
    delta, direction = contour(frames, start, b, cfg['threshold_st'])
    warnings = []
    if backend != 'parselmouth':
        warnings.append('Praat unavailable: dry-run sine-only F0 estimator')
    if q['p'] in (2, 3):
        ws = q['s'].split(' ')
        for i, word in enumerate(ws[:-1]):
            if word.endswith(',') or ws[i+1].lower() == 'or':
                _, d = contour(frames, T[i]/1000, T[i+1]/1000, cfg['threshold_st'])
                if d != 'u':
                    warnings.append(f'earlier option w{i} not rising' + (' (approximate timing)' if approx else ''))
    if approx:
        warnings.append('approximate word timing; human check required')
    rms = math.sqrt(sum(x*x for x in samples)/max(1,len(samples)))
    return dict(delta_st=delta, **{'pass':direction == v}, warnings=warnings,
                metrics=dict(duration=len(samples)/sr, db=20*math.log10(max(rms,1e-9)), lead=a, tail=len(samples)/sr-b))


def ffmpeg_path():
    if os.environ.get('FFMPEG'):
        return os.environ['FFMPEG']
    found = shutil.which('ffmpeg')
    if not found:
        try:
            import imageio_ffmpeg
            found = imageio_ffmpeg.get_ffmpeg_exe()
        except (ImportError, RuntimeError):
            pass
    return found


def postprocess(data, points, output, ffmpeg):
    samples, sr = load_wav(data)
    a, b = active_span(samples, sr)
    start = max(0, a-.08)
    end = min(len(samples)/sr, b+.08)
    if not ffmpeg:
        # Never disguise WAV bytes with an .mp3 extension.
        output = output.with_suffix('.wav')
        output.write_bytes(data)
        return data, points, output, ['ffmpeg unavailable: trim/loudnorm/MP3 skipped; WAV retained']
    cropped = wav_bytes(samples[int(start*sr):int(end*sr)], sr)
    result = subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-i','pipe:0',
                             '-af','loudnorm=I=-16:TP=-1.5:LRA=11','-ac','1','-ar',str(SR),
                             '-f','wav','pipe:1'], input=cropped, capture_output=True, check=True).stdout
    # ffmpeg pipe WAV may have an unknown frame count; wave still reads actual bytes.
    output.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-i','pipe:0',
                    '-ac','1','-ar',str(SR),'-codec:a','libmp3lame','-b:a','96k',str(output)],
                   input=result, capture_output=True, check=True)
    # Analyze the encoded delivery signal, not only the pre-encoding waveform.
    decoded = subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-i',str(output),
                              '-ac','1','-ar',str(SR),'-f','wav','pipe:1'],capture_output=True,check=True).stdout
    return decoded, {k:max(0,t-start) for k,t in points.items()}, output, []


def prompt(q, v):
    result = 'Speak clearly and a little slowly, in a friendly tone for children learning English. '
    result += ('Say the sentence as a genuine question, and make your pitch rise clearly on the last word.' if v=='u'
               else 'Say the sentence calmly, and make your pitch fall clearly on the last word.')
    if q['p'] in (2,3):
        result += ' Raise your pitch on each earlier option.'
    return result


def request_spec(q, v, engine, variant, cfg):
    voice = cfg['ssml_voice'] if engine == 'ssml' else cfg['gemini']['voice']
    spec = dict(engine=engine, voice=voice, language=cfg['language_code'], rate=cfg['speaking_rate'])
    if engine == 'ssml':
        # Natural side: ? then .; opposite side uses target-dependent order.
        punctuation = ('?', '.') if v == q['n'] or v == 'u' else ('.', '?')
        sentence = q['s'].rstrip('?.!') + punctuation[variant % 2]
        spec['ssml'] = '<speak>' + ' '.join(f'<mark name="w{i}"/>'+html.escape(w) for i,w in enumerate(sentence.split(' '))) + '</speak>'
    else:
        spec.update(text=q['s'], prompt=prompt(q,v), model=cfg['gemini']['model'])
    return spec


@lru_cache(maxsize=1)
def tts_client():
    """Prefer ADC; optionally reuse an existing local gcloud login in memory."""
    from google.cloud import texttospeech_v1beta1 as tts
    from google.auth.exceptions import DefaultCredentialsError
    try:
        return tts.TextToSpeechClient(transport='rest')
    except DefaultCredentialsError:
        if os.environ.get('TTS_USE_GCLOUD_AUTH') != '1':
            raise
        from google.oauth2.credentials import Credentials
        gcloud = shutil.which('gcloud.cmd' if os.name=='nt' else 'gcloud')
        if not gcloud:
            raise RuntimeError('gcloud not available; configure ADC')
        # SDK uses its own Python runtime; isolate it from build-only packages.
        sdk_env = {k:v for k,v in os.environ.items() if k.upper() not in ('PYTHONPATH','PYTHONHOME')}
        options = dict(capture_output=True,text=True,check=True,env=sdk_env,
                       **({'creationflags':subprocess.CREATE_NO_WINDOW} if os.name=='nt' else {}))
        try:
            token = subprocess.run([gcloud,'auth','print-access-token'],**options).stdout.strip()
        except subprocess.CalledProcessError as exc:
            # stderr contains diagnostics, while stdout may contain a token.
            message = re.sub(r'[\w.+-]+@[\w.-]+','[account]',exc.stderr or '')
            raise RuntimeError('gcloud authentication failed: '+message) from None
        project = os.environ.get('GOOGLE_CLOUD_QUOTA_PROJECT') or subprocess.run([gcloud,'config','get-value','project'],**options).stdout.strip()
        return tts.TextToSpeechClient(credentials=Credentials(token,quota_project_id=project),transport='rest')


def synthesize(spec, cache, dry, q, v, force=False):
    key = hashlib.sha256(json.dumps(dict(spec=spec,dry=dry),sort_keys=True).encode()).hexdigest()
    base = cache/key
    wav = base.with_suffix('.wav')
    meta = base.with_suffix('.json')
    if wav.exists() and meta.exists() and not force:
        return wav.read_bytes(), read(meta)['points']
    if dry:
        data = glide(v, max(1.2, len(q['s'].split(' '))*.38))
        points = {}
    else:
        from google.cloud import texttospeech_v1beta1 as tts
        client = tts_client()  # Credentials remain in process memory only.
        audio = tts.AudioConfig(audio_encoding=tts.AudioEncoding.LINEAR16,
                               sample_rate_hertz=SR, speaking_rate=spec['rate'])
        voice = tts.VoiceSelectionParams(language_code=spec['language'], name=spec['voice'],
                                        **({'model_name':spec['model']} if spec['engine']=='gemini' else {}))
        inp = tts.SynthesisInput(ssml=spec['ssml']) if spec['engine']=='ssml' else tts.SynthesisInput(text=spec['text'],prompt=spec['prompt'])
        kwargs = dict(input=inp,voice=voice,audio_config=audio)
        if spec['engine']=='ssml':
            kwargs['enable_time_pointing'] = [tts.SynthesizeSpeechRequest.TimepointType.SSML_MARK]
        response = client.synthesize_speech(request=tts.SynthesizeSpeechRequest(**kwargs),timeout=60)
        data = response.audio_content
        points = {t.mark_name:t.time_seconds for t in response.timepoints}
    cache.mkdir(parents=True, exist_ok=True)
    wav.write_bytes(data)
    write(meta,dict(points=points,request=spec))
    return data, points


def psola(data, start, v, strength):
    import parselmouth
    from parselmouth.praat import call
    samples, sr = load_wav(data)
    snd = parselmouth.Sound(samples,sampling_frequency=sr)
    manipulation = call(snd,'To Manipulation',.01,75,500)
    tier = call(manipulation,'Extract pitch tier')
    frames, _ = f0_frames(data)
    voiced = [(t,f) for t,f in frames if t>=start and f>0]
    if not voiced:
        raise ValueError('PSOLA: no voiced final word')
    a, b = voiced[0][0], voiced[-1][0]
    # Concentrate the specified 5–7st movement into the terminal 200ms.
    # A longer ramp can become flat in the measurement when the final word
    # has an unvoiced consonant between its syllables (e.g. coffee).
    a = max(a, b-.2)
    base = statistics.median([f for t,f in voiced if t<=a+.1] or [voiced[0][1]])
    call(tier,'Remove points between',a,b+.01)
    for j in range(21):
        t = a+(b-a)*j/20
        hz = max(76,min(499,base*2**((1 if v=='u' else -1)*strength*j/20/12)))
        call(tier,'Add point',t,hz)
    call([tier,manipulation],'Replace pitch tier')
    result = call(manipulation,'Get resynthesis (overlap-add)')
    return wav_bytes(result.values[0],sr)


def accepted(row, overrides):
    key = row['id']+'_'+row['v']
    return key not in overrides['reject'] and (row['pass'] or key in overrides['accept'])


def sync_html(manifest=None):
    cfg = read(HERE/'config.json')
    path = ROOT/cfg['html']
    source = path.read_text(encoding='utf-8')
    questions = read(HERE/'questions.json')
    rows = read(HERE/'manifest.json',[]) if manifest is None else manifest
    overrides = read(HERE/'overrides.json',dict(accept=[],reject=[]))
    eligible = [r for r in rows if not r.get('dry_run') and accepted(r,overrides) and (ROOT/r['file']).is_file()
                and r.get('speaking_rate') == cfg.get('speaking_rate')
                and r.get('voice') == (cfg.get('ssml_voice') if r['engine']=='ssml' else cfg.get('gemini',{}).get('voice'))]
    # Neural2 and Gemini cannot share one voice. Never publish mixed voices,
    # even when each individual contour passes or is manually accepted.
    voice_engine = eligible[0]['engine'] if eligible else None
    clips = {r['id']+'_'+r['v']:dict(file=r['file'],T=r['T'],dur=r['dur']) for r in eligible if r['engine']==voice_engine}
    clips = {key:value for key,value in clips.items() if key[:-1]+('d' if key[-1]=='u' else 'u') in clips}
    for tag, value in [('QD','const QD='+json.dumps(questions,ensure_ascii=False,separators=(',',':'))+';'),
                       ('CLIPS','const CLIPS='+json.dumps(clips,ensure_ascii=False,separators=(',',':'))+';')]:
        pattern = re.compile(r'/\*'+tag+r'_START\*/.*?/\*'+tag+r'_END\*/', re.S)
        if len(pattern.findall(source)) != 1:
            raise ValueError(f'Expected one {tag} marker pair')
        source = pattern.sub(lambda _:f'/*{tag}_START*/\n{value}\n/*{tag}_END*/', source)
    path.write_text(source,encoding='utf-8',newline='\n')


def pair_warnings(rows):
    for qid in {r['id'] for r in rows}:
        pair = [r for r in rows if r['id']==qid]
        if len(pair)!=2:
            continue
        a,b = [r['metrics'] for r in pair]
        issues = []
        if max(a['duration'],b['duration'])/max(.01,min(a['duration'],b['duration']))>1.2:
            issues.append('A/B duration differs >20%')
        if abs(a['db']-b['db'])>3:
            issues.append('A/B volume differs >3dB')
        if any(abs(a[k]-b[k])>.15 for k in ('lead','tail')):
            issues.append('A/B silence differs >150ms')
        if pair[0]['engine']!=pair[1]['engine']:
            issues.append('A/B voice engines differ: excluded from CLIPS; review/rebuild as a pair')
        for r in pair:
            r['warnings'].extend(issues)


def report(rows, questions, dest):
    qs = {q['id']:q for q in questions}
    notice = ('DRY-RUN は英語ではなく試験用グライド音です。' if any(r.get('dry_run') for r in rows)
              else 'Google Cloud TTSで生成した英語音声です。')
    cards = []
    for r in rows:
        key = r['id']+'_'+r['v']
        cards.append(f'<article data-key="{key}"><h2>{key} {"↗" if r["v"]=="u" else "↘"}</h2><p>{html.escape(qs[r["id"]]["s"])}</p>'
                     f'<p>Δ {r["delta_st"]} st · {"PASS" if r["pass"] else "NG"} · {html.escape(r["engine"]+" / "+r["recipe"])}</p>'
                     f'<audio controls preload="none" src="{html.escape(os.path.relpath(ROOT/r["file"],dest.parent).replace(chr(92),"/"))}"></audio>'
                     f'<p>{html.escape("; ".join(r["warnings"]))}</p><button data-v="accept">OK</button> <button data-v="reject">NG</button> <button data-v="clear">未確認</button><output></output></article>')
    dest.write_text('''<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>しつもんの声・音声確認</title>
<style>body{font:16px system-ui;margin:16px;background:#f4f1ff;color:#241f5c}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px}article{background:white;padding:16px;border-radius:12px}audio,textarea{width:100%}button{padding:12px;margin:4px}p{overflow-wrap:anywhere}output{display:block}header{position:sticky;top:0;background:#f4f1ff;padding:8px}h2{font-size:20px}</style>
<h1>しつもんの声・音声確認</h1><p>'''+html.escape(notice)+'''測定PASSも人の聞き取りを保証しません。OK/NGは端末に保存されます。</p><header><button id="copy">overrides.json をコピー</button><button id="load">既存の判定を読み込む</button><textarea id="json" aria-label="overrides JSON" rows="3"></textarea><p id="status"></p></header><main>'''+''.join(cards)+'''</main><script>
const storageKey='question-voice-review-v1:'+location.pathname;let decisions={};try{decisions=JSON.parse(localStorage.getItem(storageKey)||'{}')}catch(e){}
const box=document.querySelector('#json');function update(){document.querySelectorAll('article').forEach(a=>a.querySelector('output').textContent=decisions[a.dataset.key]||'未確認');box.value=JSON.stringify({accept:Object.keys(decisions).filter(k=>decisions[k]==='accept'),reject:Object.keys(decisions).filter(k=>decisions[k]==='reject')},null,2);try{localStorage.setItem(storageKey,JSON.stringify(decisions))}catch(e){}}
document.querySelectorAll('article button').forEach(b=>b.onclick=()=>{const k=b.closest('article').dataset.key;if(b.dataset.v==='clear')delete decisions[k];else decisions[k]=b.dataset.v;update()});
document.querySelector('#load').onclick=()=>{try{const x=JSON.parse(box.value);decisions={};for(const k of x.accept||[])decisions[k]='accept';for(const k of x.reject||[])decisions[k]='reject';update()}catch(e){document.querySelector('#status').textContent='JSONを確認してください'}};
document.querySelector('#copy').onclick=async()=>{update();try{await navigator.clipboard.writeText(box.value);document.querySelector('#status').textContent='コピーしました'}catch(e){box.focus();box.select();document.querySelector('#status').textContent='選択したJSONをコピーしてください'}};update();</script></html>''',encoding='utf-8')


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',nargs='?',choices=['sync-html'])
    parser.add_argument('--dry-run',action='store_true')
    parser.add_argument('--only')
    parser.add_argument('--force',action='store_true')
    parser.add_argument('--engine',choices=['ssml','gemini','all'],default='all')
    parser.add_argument('--max-attempts',type=int)
    args = parser.parse_args(argv)
    if args.command:
        sync_html()
        return
    cfg = read(HERE/'config.json')
    if not re.fullmatch(r'en-US-(Neural2|Wavenet|Standard)-[A-Z]',cfg['ssml_voice']):
        parser.error('Use a supported en-US Neural2/Wavenet/Standard SSML voice')
    attempts = args.max_attempts if args.max_attempts is not None else cfg['max_attempts']
    if attempts < 1:
        parser.error('--max-attempts must be positive')
    if args.engine=='gemini' and not cfg['gemini']['enabled']:
        parser.error('Enable gemini in config.json first')
    questions = read(HERE/'questions.json')
    only = set(args.only.split(',')) if args.only else {q['id'] for q in questions}
    if only - {q['id'] for q in questions}:
        parser.error('Unknown question id in --only')
    outdir = HERE/'dry-run' if args.dry_run else HERE
    outdir.mkdir(parents=True,exist_ok=True)
    manifest_path = outdir/'manifest.json'
    previous = read(manifest_path,[])
    rows = {r['id']+'_'+r['v']:r for r in previous}
    overrides = read(HERE/'overrides.json',dict(accept=[],reject=[]))
    fingerprint = hashlib.sha256(json.dumps(dict(config=cfg,engine=args.engine),sort_keys=True).encode()).hexdigest()
    ffmpeg = ffmpeg_path()
    if not ffmpeg:
        print('WARNING: ffmpeg not found; WAV fallback, no trim/normalization/MP3',file=sys.stderr)
    for q in questions:
        if q['id'] not in only:
            continue
        for v in ('u','d'):
            key = q['id']+'_'+v
            signature = hashlib.sha256((fingerprint+json.dumps(q,sort_keys=True)).encode()).hexdigest()
            old = rows.get(key)
            if old and old.get('signature')==signature and accepted(old,overrides) and (ROOT/old['file']).is_file() and not args.force:
                continue
            audio_dir = outdir/'audio' if args.dry_run else ROOT/'audio/q'
            audio_dir.mkdir(parents=True,exist_ok=True)
            output = audio_dir/(key+'.mp3')
            candidates = []
            errors = []
            recipes = [('ssml',i) for i in range(2)] if args.engine!='gemini' else []
            if cfg['gemini']['enabled'] and args.engine!='ssml':
                recipes += [('gemini',i) for i in range(max(1,attempts-2))]
            for engine, variant in recipes[:attempts]:
                try:
                    spec = request_spec(q,v,engine,variant,cfg)
                    # Distinct Gemini retries are cached separately; SSML repeated specs reuse cache.
                    if engine=='gemini': spec['attempt']=variant
                    raw, points = synthesize(spec,HERE/'cache',args.dry_run,q,v,args.force)
                    data, pts, file, warns = postprocess(raw,points,output,ffmpeg)
                    T, approx = timings(q,data,pts)
                    info = analyze(q,v,data,T,approx,cfg,args.dry_run)
                    info['warnings'] += warns
                    cand = dict(info,raw=raw,points=points,processed=data,T=T,approx=approx,file=file,
                                engine='dry-run' if args.dry_run else engine,recipe=f'punctuation-{variant}' if engine=='ssml' else 'prompt')
                    candidates.append(cand)
                    if info['pass']: break
                except Exception as e:
                    errors.append(f'{engine}: {type(e).__name__}: {e}')
            if candidates and not any(c['pass'] for c in candidates) and not args.dry_run:
                closest = max(candidates,key=lambda c:(c['delta_st'] or 0)*(1 if v=='u' else -1))
                for strength in ((5,6,7) if v=='u' else (5,6)):
                    try:
                        T, approx = timings(q,closest['raw'],closest['points'])
                        s, sr = load_wav(closest['raw']); a,b = active_span(s,sr)
                        start = a+.65*(b-a) if approx else T[-1]/1000
                        raw = psola(closest['raw'],start,v,strength)
                        data, pts, file, warns = postprocess(raw,closest['points'],output,ffmpeg)
                        T, approx = timings(q,data,pts)
                        info = analyze(q,v,data,T,approx,cfg)
                        info['warnings'] += warns
                        candidates.append(dict(info,raw=raw,points=closest['points'],processed=data,T=T,approx=approx,file=file,engine=closest['engine'],recipe='psola'))
                        if info['pass']: break
                    except Exception as e:
                        errors.append(f'psola: {type(e).__name__}: {e}')
                        break
            if not candidates:
                raise RuntimeError(f'{key}: no audio generated: '+ '; '.join(errors))
            chosen = next((c for c in candidates if c['pass']),max(candidates,key=lambda c:(c['delta_st'] or 0)*(1 if v=='u' else -1)))
            # Last attempted file may differ from the selected best candidate.
            data, pts, file, warns = postprocess(chosen['raw'],chosen['points'],output,ffmpeg)
            T, approx = timings(q,data,pts)
            info = analyze(q,v,data,T,approx,cfg,args.dry_run)
            rows[key] = dict(id=q['id'],v=v,file=file.relative_to(ROOT).as_posix(),dur=round(len(load_wav(data)[0])/SR*1000),
                             T=[round(t) for t in T],engine=chosen['engine'],recipe=chosen['recipe'],approx=approx,
                             voice=cfg['gemini']['voice'] if chosen['engine']=='gemini' else cfg['ssml_voice'],speaking_rate=cfg['speaking_rate'],
                             dry_run=args.dry_run,signature=signature,**info)
            rows[key]['warnings'] += warns+errors
            write(manifest_path,list(rows.values()))  # resumable after each clip
            print(key,rows[key]['delta_st'],'PASS' if rows[key]['pass'] else 'NG')
    result = sorted(rows.values(),key=lambda r:(r['id'],r['v']=='d'))
    # Recompute pair warnings rather than accumulating them on repeated runs.
    for row in result:
        row['warnings']=[w for w in row['warnings'] if not w.startswith('A/B ')]
    pair_warnings(result)
    write(manifest_path,result)
    report(result,questions,outdir/'report.html')
    if not args.dry_run:
        sync_html(result)
    print(f'{sum(r["pass"] for r in result)}/{len(result)} pass; report: {outdir/"report.html"}')


if __name__=='__main__':
    main()
