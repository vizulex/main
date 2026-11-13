import json, re, numpy as np, soundfile as sf, torch, torchaudio
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
from num2words import num2words
torch.set_num_threads(4)
MID='jonatasgrosman/wav2vec2-large-xlsr-53-russian'
proc=Wav2Vec2Processor.from_pretrained(MID); model=Wav2Vec2ForCTC.from_pretrained(MID).eval()
vocab=proc.tokenizer.get_vocab(); inv={v:k for k,v in vocab.items()}
a,sr=sf.read('raw/audio16k.wav',dtype='float32')
segs=[json.loads(l) for l in open('transcript_words.jsonl')]
LAT={'reels':'рилс','tiktok':'тикток','time':'тайм','management':'менеджмент'}
TR=dict(zip('abcdefghijklmnopqrstuvwxyz','абкдефгхийклмнопкрстуввксиз'))
def norm_word(w):
    w=w.lower().replace('ё','е')
    w=re.sub(r'(\d+)[,.](\d+)',lambda m:num2words(int(m.group(1)),lang='ru')+' и '+num2words(int(m.group(2)),lang='ru'),w)
    w=re.sub(r'\d+',lambda m:' '+num2words(int(m.group()),lang='ru')+' ',w)
    w=w.replace('%',' процентов ')
    out=[]
    for t in re.split(r'[\s\-]+',w):
        t=re.sub(r'[^a-zа-я]','',t)
        if not t: continue
        if re.search('[a-z]',t): t=LAT.get(t,''.join(TR.get(c,'') for c in t))
        out.append(t)
    return out
FR=0.02  # 20ms per frame
res=[]
for si,s in enumerate(segs):
    t0=max(0,s['start']-0.4); t1=min(len(a)/sr,s['end']+0.4)
    if si+1<len(segs): t1=min(t1,segs[si+1]['start']+0.2)
    if si>0: t0=max(t0,segs[si-1]['end']-0.2)
    chunk=a[int(t0*sr):int(t1*sr)]
    with torch.no_grad():
        iv=proc(chunk,sampling_rate=16000,return_tensors='pt').input_values
        em=torch.log_softmax(model(iv).logits,-1)[0]
    words=[]; toks=[]; owner=[]
    for wi,w in enumerate(s['words']):
        for part in norm_word(w['w']):
            ids=[vocab[c] for c in part if c in vocab]
            if not ids: continue
            words.append((wi,part))
            for c in ids: toks.append(c); owner.append(len(words)-1)
    if not toks: continue
    T=em.shape[0]
    try:
        ali,sc=torchaudio.functional.forced_align(em[None],torch.tensor([toks],dtype=torch.int32),blank=0)
    except Exception as ex:
        print('fail',si,ex); continue
    ali=ali[0].numpy(); sc=sc[0].exp().numpy()
    # token spans
    spans=[]; ti=-1; prev=0
    for f,tk in enumerate(ali):
        if tk!=0 and (tk!=prev or f==0 or ali[f-1]==0):
            ti+=1; spans.append([f,f])
        elif tk!=0: spans[-1][1]=f
        prev=tk
    wspan={}
    for k,(f0,f1) in enumerate(spans[:len(owner)]):
        o=owner[k]; wspan.setdefault(o,[f0,f1]); wspan[o][1]=f1
    aw=[]
    for o,(f0,f1) in sorted(wspan.items()):
        wi,part=words[o]
        aw.append({"w":part,"orig":s['words'][wi]['w'].strip(),"wi":wi,"s":round(t0+f0*FR,3),"e":round(t0+(f1+1)*FR,3)})
    # greedy decode of the whole chunk with times, to find extra speech
    g=em.argmax(-1).numpy(); gd=[]
    for f,tk in enumerate(g):
        if tk>4 and (f==0 or g[f-1]!=tk): gd.append((round(t0+f*FR,2),inv[tk]))
        elif tk==4 and (f==0 or g[f-1]!=4): gd.append((round(t0+f*FR,2),' '))
    res.append({"seg":si,"t0":t0,"t1":t1,"words":aw,"greedy":gd})
    print(si,len(aw),flush=True)
json.dump(res,open('aligned.json','w'),ensure_ascii=False)
print('done')
