from pathlib import Path
import json,collections
R=Path(__file__).resolve().parents[1]/'data'
def load(n): return json.loads((R/n).read_text(encoding='utf-8'))
ps=load('prefixes.json'); ws=load('words.json'); stages=load('stages.json'); mvp=load('mvp.json')
pid={p['id'] for p in ps}; assert len(pid)==len(ps)
ids=set()
for w in ws:
    assert w['id'] not in ids,w['id']; ids.add(w['id'])
    assert w['prefix_id'] in pid
    assert 1 <= w['stage'] <= 4
    assert w['word'] and w['base'] and w['meaning_ja']
    assert isinstance(w['quiz_eligible'],bool)
    assert w['review_status']!='verified' # all remain provisional until reviewed
assert len(ps)>35 and len(ws)>150
assert len(mvp['prefix_ids'])==14
assert all(i in pid for i in mvp['prefix_ids'])
assert {s['stage'] for s in stages}=={1,2,3,4}
print('PASS:',len(ps),'prefix lessons,',len(ws),'word entries,',len(mvp['prefix_ids']),'MVP lessons')
