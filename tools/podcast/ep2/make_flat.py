"""aligned.json → words_flat.json (слова по порядку) и extras.json (что звучит в паузах между словами)."""
import json
A = json.load(open('aligned.json'))
W = []
for seg in A:
    by = {}
    for w in seg['words']:  # число раскладывается на несколько частей — склеиваем обратно в одно слово
        k = w['wi']
        if k in by: by[k]['s'] = min(by[k]['s'], w['s']); by[k]['e'] = max(by[k]['e'], w['e']); by[k]['w'] += ' ' + w['w']
        else: by[k] = dict(w, seg=seg['seg'])
    W.extend(by.values())
W.sort(key=lambda w: w['s'])
json.dump(W, open('words_flat.json', 'w'), ensure_ascii=False)
EX = []
for seg in A:
    ws = seg['words']; gd = seg['greedy']
    for k in range(len(ws) - 1):
        a, b = ws[k]['e'], ws[k + 1]['s']
        if b - a < 0.1: continue
        chars = [(t, c) for t, c in gd if a + 0.02 <= t <= b - 0.02]
        txt = ''.join(c for _, c in chars).strip()
        if txt:
            EX.append([chars[0][0], chars[-1][0] + 0.1, txt, ' '.join(x['orig'] for x in ws[max(0, k - 2):k + 1]), ' '.join(x['orig'] for x in ws[k + 1:k + 4]), seg['seg']])
json.dump(EX, open('extras.json', 'w'), ensure_ascii=False)
print('words', len(W), 'extras', len(EX))
