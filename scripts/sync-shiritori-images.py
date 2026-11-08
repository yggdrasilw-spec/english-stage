"""Apply the reviewed, portable image links; no sibling checkout or network needed."""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://shiritori-images.yggdrasil-learning.workers.dev/assets/shiritori/'

def sync(check=False):
    source = json.loads((ROOT/'scripts/shiritori-image-links.json').read_text(encoding='utf-8'))
    links = source['links']
    cards = json.loads((ROOT/'dist/data/grade5.json').read_text(encoding='utf-8'))
    ids = {c['id'] for c in cards}
    assert source['schema']==1 and set(links)<=ids
    adoptions = []
    for c in cards:
        if c['id'] not in links: continue
        link = links[c['id']]
        assert c['en']==link['english'] and c['ja']==link['japanese'], c['id']+' changed meaning'
        if 'localFile' in link:
            import re
            assert re.fullmatch(r'assets/vocabulary/(?:g5-w-[a-z-]+\.svg|eiken-audit-\d+\.png)', link['localFile']), c['id']+' invalid local image'
            assert (ROOT/'dist'/link['localFile']).is_file(), c['id']+' missing local image'
        else:
            assert '/' not in link['file'] and '..' not in link['file']
        c['image'] = {'url':link.get('localFile') or BASE+link['file'], 'credit':link['credit'],
            'sourceWord':link['sourceWord'], 'sourceMeaning':link['sourceMeaning'],
            'sourceSheet':link.get('sourceSheet'), 'sourceReview':link['sourceReview']}
        adoptions.append({'id':c['id'],**c['image'],'status':link.get('adoptionStatus','日本語の語義・登録済み類語と参照元の確認記録を照合')})
    for path,data in [('dist/data/grade5.json', cards), ('IMAGE_ADOPTIONS.json', adoptions)]:
        expected=json.dumps(data,ensure_ascii=False,indent=2)+'\n'
        target=ROOT/path
        if check:
            assert target.read_text(encoding='utf-8')==expected, path+' is stale; run npm run images:sync'
        else: target.write_text(expected,encoding='utf-8')
    words=[c for c in cards if c['kind']=='word']
    previous_path=ROOT/'reports/shiritori-image-missing.json'
    previous={c['id']:c for c in json.loads(previous_path.read_text(encoding='utf-8'))} if previous_path.exists() else {}
    missing=[previous.get(c['id'], {'id':c['id'],'en':c['en'],'ja':c['ja'],'kind':'word','status':'未接続','dictionaryCandidates':[],'reason':'新しい語彙の語義と画像を確認する。','action':'共有アセットへ登録後に対応表へ追加。'}) for c in words if not c.get('image')]
    expected=json.dumps(missing,ensure_ascii=False,indent=2)+'\n'
    if check:
        assert previous_path.read_text(encoding='utf-8')==expected, 'Missing-image report is stale'
    else:
        previous_path.parent.mkdir(parents=True,exist_ok=True)
        previous_path.write_text(expected,encoding='utf-8')
        import csv
        with (ROOT/'reports/shiritori-image-missing.csv').open('w',encoding='utf-8-sig',newline='') as stream:
            writer=csv.writer(stream);writer.writerow(['カードID','英語','日本語','状況','辞書候補（語義要確認）','理由','更新手順'])
            for c in missing:writer.writerow([c['id'],c['en'],c['ja'],c['status'],' / '.join(v['word']+'：'+v['meaning'] for v in c['dictionaryCandidates']),c['reason'],c['action']])
    illustrated_words=sum(bool(c.get('image')) for c in words)
    illustrated_phrases=sum(bool(c.get('image')) for c in cards if c['kind']=='phrase')
    print(f"{'PASS' if check else 'Updated'}: {illustrated_words}/{len(words)} words and {illustrated_phrases}/155 phrases illustrated; {len(missing)} words remain in reports/shiritori-image-missing.csv")

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check',action='store_true')
    sync(parser.parse_args().check)
