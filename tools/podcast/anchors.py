import json, re
E=json.load(open('edl.json')); WO=E['words']
def cl(o): return re.sub(r'[^\wа-яё]','',o.lower().replace('ё','е'))
toks=[cl(w['w']) for w in WO]
def find(phrase, after=0.0, end=False):
    p=[cl(x) for x in phrase.split()]
    for i in range(len(toks)):
        if WO[i]['o']<after: continue
        if all(i+k<len(toks) and toks[i+k].startswith(p[k]) for k in range(len(p))):
            return round(WO[i+len(p)-1]['oe'] if end else WO[i]['o'],2)
    raise SystemExit('NOT FOUND: '+phrase+' after %.1f'%after)
