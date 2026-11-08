import importlib.util
from pathlib import Path
import tempfile
import unittest
import json
import hashlib
import re

spec = importlib.util.spec_from_file_location('builder', Path(__file__).with_name('build_clips.py'))
b = importlib.util.module_from_spec(spec)
spec.loader.exec_module(b)


class BuilderTests(unittest.TestCase):
    # unittest style also runs under pytest. No cloud SDK or credentials needed.
    def test_acoustic_glides(self):
        for v in ('u','d','flat'):
            with self.subTest(v=v):
                frames, backend = b.f0_frames(b.glide(v),dry=True)
                delta, got = b.contour(frames,.86,1.28)
                self.assertEqual(got,v,(delta,backend))

    def test_no_voiced_audio(self):
        self.assertEqual(b.contour([(0,0)],0,1),(None,'flat'))

    def test_original_word_mode_unchanged(self):
        root=Path(__file__).resolve().parent.parent
        metadata=b.read(root/'tts/original-word-mode.sha256.json')
        source=(root/'accent.html').read_text(encoding='utf-8')
        block=source[source.index(metadata['start']):source.index(metadata['end'])]
        self.assertEqual(hashlib.sha256(block.encode()).hexdigest(),metadata['sha256'])

    def test_questions_and_missing_audio_fallback(self):
        root=Path(__file__).resolve().parent.parent
        questions=b.read(root/'tts/questions.json')
        self.assertEqual(len(questions),29)
        self.assertEqual(len({q['id'] for q in questions}),29)
        self.assertEqual({q['p'] for q in questions},set(range(8)))
        self.assertIn('function voiceMock(', (root/'accent.html').read_text(encoding='utf-8'))

    def test_registered_real_audio_is_complete_and_matches_manifest(self):
        root=Path(__file__).resolve().parent.parent
        manifest=b.read(root/'tts/manifest.json',[])
        if not manifest:
            return  # Clean installs may intentionally have no generated audio.
        questions=b.read(root/'tts/questions.json')
        source=(root/'accent.html').read_text(encoding='utf-8')
        clips=json.loads(re.search(r'const CLIPS=(.*?);',source).group(1))
        overrides=b.read(root/'tts/overrides.json',dict(accept=[],reject=[]))
        lookup={r['id']+'_'+r['v']:r for r in manifest}
        for key,clip in clips.items():
            row=lookup[key]
            self.assertTrue(b.accepted(row,overrides));self.assertFalse(row['dry_run'])
            self.assertTrue((root/clip['file']).is_file())
            self.assertGreater((root/clip['file']).stat().st_size,100)
            self.assertEqual(clip['T'],row['T']);self.assertEqual(clip['dur'],row['dur'])
            self.assertEqual(len(clip['T']),len(next(q for q in questions if q['id']==row['id'])['s'].split(' ')))
            self.assertIn(row['id']+'_'+('d' if row['v']=='u' else 'u'),clips)

    def test_without_ffmpeg_retains_real_wav_extension(self):
        with tempfile.TemporaryDirectory() as tmp:
            raw=b.glide('flat')
            data,pts,file,warnings=b.postprocess(raw,{'w0':.08},Path(tmp)/'clip.mp3',None)
            self.assertEqual(file.suffix,'.wav');self.assertEqual(data,raw)
            self.assertTrue(warnings);self.assertFalse((Path(tmp)/'clip.mp3').exists())

    def test_timings(self):
        q={'s':'Can you swim?'}
        T, approx=b.timings(q,b.glide('u'),{'w0':.08,'w1':.4,'w2':.7})
        self.assertEqual(T,[80,400,700]);self.assertFalse(approx)
        T, approx=b.timings(q,b.glide('u'),{})
        self.assertTrue(approx);self.assertEqual(len(T),3)
        self.assertEqual(T,sorted(T))

    def test_ssml_and_prompts(self):
        cfg=b.read(Path(__file__).with_name('config.json'))
        q=dict(s='Do you want tea or coffee?',n='d',p=2)
        self.assertIn('coffee.</speak>',b.request_spec(q,'d','ssml',1,cfg)['ssml'])
        self.assertIn('coffee?</speak>',b.request_spec(q,'d','ssml',0,cfg)['ssml'])
        self.assertIn('coffee?</speak>',b.request_spec(q,'u','ssml',0,cfg)['ssml'])
        self.assertIn('coffee.</speak>',b.request_spec(q,'u','ssml',1,cfg)['ssml'])
        self.assertEqual(b.request_spec(q,'u','ssml',0,cfg)['ssml'].count('<mark'),6)
        self.assertIn('each earlier option',b.prompt(q,'u'))

    def test_reject_wins(self):
        r=dict(id='0a',v='u',**{'pass':True})
        self.assertFalse(b.accepted(r,dict(accept=['0a_u'],reject=['0a_u'])))

    def test_sync_idempotent_and_bounded(self):
        old_here,old_root=b.HERE,b.ROOT
        try:
            with tempfile.TemporaryDirectory() as tmp:
                b.ROOT=Path(tmp);b.HERE=b.ROOT/'tts';b.HERE.mkdir()
                b.write(b.HERE/'config.json',dict(html='accent.html',ssml_voice='en-US-Neural2-F',speaking_rate=.9))
                b.write(b.HERE/'questions.json',[dict(id='0a',s='Really?',p=0)])
                before='prefix\n/*QD_START*/old/*QD_END*/\nmiddle\n/*CLIPS_START*/old/*CLIPS_END*/\nsuffix'
                path=b.ROOT/'accent.html';path.write_text(before,encoding='utf-8')
                (b.ROOT/'u.mp3').write_bytes(b'fixture');(b.ROOT/'d.mp3').write_bytes(b'fixture')
                rows=[dict(id='0a',v=v,file=v+'.mp3',T=[0],dur=1000,engine='ssml',voice='en-US-Neural2-F',speaking_rate=.9,**{'pass':True}) for v in ('u','d')]
                b.sync_html(rows);once=path.read_bytes();b.sync_html(rows)
                self.assertEqual(once,path.read_bytes())
                s=path.read_text(encoding='utf-8');self.assertTrue(s.startswith('prefix\n'));self.assertTrue(s.endswith('\nsuffix'));self.assertIn('\nmiddle\n',s)
                self.assertIn('0a_u',s)
                rows[0]['voice']='en-US-Neural2-H';b.sync_html(rows)
                self.assertIn('const CLIPS={};',path.read_text(encoding='utf-8'))
                rows[0]['voice']='en-US-Neural2-F'
                rows[0]['dry_run']=True;b.sync_html(rows)
                self.assertIn('const CLIPS={};',path.read_text(encoding='utf-8'))
                rows[0]['dry_run']=False;rows[1]['engine']='gemini';b.sync_html(rows)
                self.assertIn('const CLIPS={};',path.read_text(encoding='utf-8'))
        finally:
            b.HERE,b.ROOT=old_here,old_root

    def test_pair_warnings(self):
        rows=[dict(id='0a',engine='ssml',warnings=[],metrics=dict(duration=1,db=-10,lead=0,tail=0)),
              dict(id='0a',engine='ssml',warnings=[],metrics=dict(duration=1.4,db=-14,lead=.2,tail=.2))]
        b.pair_warnings(rows)
        self.assertEqual(len(rows[0]['warnings']),3)


if __name__=='__main__':
    unittest.main()
