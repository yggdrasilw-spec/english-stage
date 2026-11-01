"""Apply independently authored examples and the singular/plural teaching diagrams."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def sync():
    rows = [line.split('|') for line in (ROOT/'scripts/reviewed-examples.txt').read_text('utf-8').splitlines() if line]
    examples = {en: (example, ja, points.split('・')) for en, example, ja, points in rows}
    assert len(rows) == len(examples) == 153
    for path in ['dist/data/grade5.json', 'scripts/grade5-expansion-02.json']:
        cards = json.loads((ROOT/path).read_text('utf-8'))
        for c in cards:
            if c['en'] in examples:
                c['example'], c['exampleJa'], c['grammarPoints'] = examples[c['en']]
                c['exampleAudioText'] = c['example']
                c['revision'] = max(3, c['revision'])
                c['explanation'] = f"{c['en']}：{c['ja']}。学ぶ表現：{'・'.join(c['grammarPoints'])}。"
            if c['en'] == 'tooth':
                c['ja'] = '歯（1本）'
                c['explanation'] = 'tooth は歯1本。one tooth / a tooth と言うよ。2本以上は teeth に形が変わり、two teeth / my teeth と言います。tooths にはしません。'
            if c['en'] == 'teeth':
                c['ja'] = '歯（2本以上）'
                c['explanation'] = 'teeth は tooth の複数形。歯をまとめて言うときは my teeth。I brush my teeth. は「歯を磨きます」。1本なら a tooth / one tooth と言います。'
                c['revision'] = max(3, c['revision'])
                c['grammarPoints'] = ['不規則複数', '習慣']
        (ROOT/path).write_text(json.dumps(cards, ensure_ascii=False, indent=2)+'\n', 'utf-8')
    cards = json.loads((ROOT/'dist/data/grade5.json').read_text('utf-8'))
    (ROOT/'AUDIO_SCRIPT.json').write_text(json.dumps([{'id': c['id'], 'word': c['audioText'], 'example': c['example']} for c in cards],ensure_ascii=False,indent=2)+'\n','utf-8')
    print('Applied 153 contextual examples and tooth/teeth explanations')

if __name__ == '__main__':
    sync()
