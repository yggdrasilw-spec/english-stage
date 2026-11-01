"""Append the reviewed vocabulary supplement without changing published cards."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def sync():
    path=ROOT/'dist/data/grade5.json'
    cards=json.loads(path.read_text(encoding='utf-8'))
    extra=json.loads((ROOT/'scripts/grade5-expansion-03.json').read_text(encoding='utf-8'))
    by_id={c['id']:c for c in cards}
    for c in extra:
        if c['id'] in by_id:
            assert {k:v for k,v in by_id[c['id']].items() if k!='image'}=={k:v for k,v in c.items() if k!='image'}, c['id']+' learning content changed; review before updating'
        else:
            assert not any(old['en'].casefold()==c['en'].casefold() for old in cards), c['en']
            cards.append(c)
    path.write_text(json.dumps(cards,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (ROOT/'AUDIO_SCRIPT.json').write_text(json.dumps([{'id':c['id'],'word':c['en'],'example':c['example']} for c in cards],ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Vocabulary supplement: {len(extra)} items; total {len(cards)}')
    # Apply images after the complete deck exists, including newly added vocabulary.
    import runpy
    runpy.run_path(str(ROOT/"scripts/sync-print-ho-kan-vocabulary.py"))["sync"]()
if __name__=='__main__': sync()
