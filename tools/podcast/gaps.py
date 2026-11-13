import json, numpy as np, soundfile as sf
a, sr = sf.read('raw/audio16k.wav', dtype='float32')
segs=[json.loads(l) for l in open('transcript_words.jsonl')]
W=[w for s in segs for w in s['words']]
hop=160; fr=np.sqrt(np.convolve(a**2, np.ones(400)/400, 'same')[::hop])  # 10ms frames rms
db=20*np.log10(fr+1e-9)
floor=np.percentile(db,10); thr=floor+18
print('floor',round(floor,1),'thr',round(thr,1))
def voiced(s,e):
    i,j=int(s*100),int(e*100); v=db[i:j]>thr
    return v.sum()/100.0
gaps=[]
for k in range(len(W)-1):
    s,e=W[k]['e'],W[k+1]['s']
    if e-s>=0.3:
        gaps.append((s,e,voiced(s+0.05,e-0.05),k))
# long words (possibly hiding hesitations)
json.dump({"gaps":gaps},open('gaps.json','w'))
print('gaps>=0.3s:',len(gaps),' total gap time',round(sum(g[1]-g[0] for g in gaps),1))
print('gaps with >=0.25s voiced:')
for s,e,v,k in gaps:
    if v>=0.25: print(f"{int(s//60):02d}:{s%60:05.2f}-{int(e//60):02d}:{e%60:05.2f} dur {e-s:4.1f} voiced {v:4.2f} | ...{''.join(w['w'] for w in W[max(0,k-4):k+1])} || {''.join(w['w'] for w in W[k+1:k+5])}")
lw=[w for w in W if (w['e']-w['s'])>0.9]
print('long words',len(lw))
for w in lw[:40]: print(f"{w['s']:.2f} {w['e']-w['s']:.2f} {w['w']}")
