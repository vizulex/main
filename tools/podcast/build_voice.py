import json, numpy as np, soundfile as sf
E=json.load(open('edl.json')); a,sr=sf.read('raw/audio48k.wav',dtype='float32')
total=int(round(E['total']*sr)); out=np.zeros(total,dtype=np.float32)
F=int(0.008*sr)
for g in E['segs']:
    s,e=int(round(g['src_s']*sr)),int(round(g['src_e']*sr)); x=a[s:e].copy()
    n=min(F,len(x)//2); ramp=np.linspace(0,1,n,dtype=np.float32)
    x[:n]*=ramp; x[-n:]*=ramp[::-1]
    o=int(round(g['out_s']*sr)); out[o:o+len(x)]+=x[:total-o]
sf.write('voice_raw.wav',out,sr)
print('ok',len(out)/sr)
