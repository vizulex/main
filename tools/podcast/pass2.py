import json,re,numpy as np,soundfile as sf,torch
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
torch.set_num_threads(4)
MID='jonatasgrosman/wav2vec2-large-xlsr-53-russian'
proc=Wav2Vec2Processor.from_pretrained(MID); model=Wav2Vec2ForCTC.from_pretrained(MID).eval()
inv={v:k for k,v in proc.tokenizer.get_vocab().items()}
E=json.load(open('edl.json')); a,sr=sf.read('voice16k.wav',dtype='float32')
Q=[json.loads(l) for l in open('qa_words.jsonl')]
def cl(o): return re.sub(r'[^\wа-яё]','',o.lower())
KEEP_Q={14,247,387,660,663,781,1075,1124,1304,1796,1982,2314,2446,2875}  # оставить (внутри фразы / смысловые)
targets=[]
for i,w in enumerate(Q):
    c=cl(w['w']); n=cl(Q[i+1]['w']) if i+1<len(Q) else ''
    if i in KEEP_Q: continue
    if c=='вот': targets.append((i,'вот'))
    elif c=='ну': targets.append((i,'ну'))
    elif c=='как' and n=='бы': targets.append((i,'какбы'))
    elif c=='то' and n=='есть' and w['w'].strip().startswith('То'): targets.append((i,'тоесть'))
def o2s(t):
    for g in E['segs']:
        if g['out_s']-1e-6<=t<=g['out_s']+(g['src_e']-g['src_s'])+1e-6: return g['src_s']+(t-g['out_s']),g
    return None,None
cuts=[];report=[]
for i,tgt in targets:
    t=Q[i]['s']; w0=max(0,t-0.8); w1=min(len(a)/sr,t+1.4)
    x=a[int(w0*sr):int(w1*sr)]
    with torch.no_grad():
        em=torch.log_softmax(model(proc(x,sampling_rate=16000,return_tensors='pt').input_values).logits,-1)[0]
    g=em.argmax(-1).numpy()
    # char runs
    runs=[]
    for f,tk in enumerate(g):
        if tk>4:
            if runs and runs[-1][0]==tk and runs[-1][2]==f-1: runs[-1][2]=f
            else: runs.append([tk,f,f])
        elif tk==4: runs.append([4,f,f])
    s=''.join(inv[r[0]] if r[0]!=4 else ' ' for r in runs)
    flat=[(inv[r[0]] if r[0]!=4 else ' ',r[1],r[2]) for r in runs]
    letters=[(c,f0,f1) for c,f0,f1 in flat if c!=' ']
    seq=''.join(c for c,_,_ in letters)
    best=None
    PAT={'вот':r'в[оау]?[тд]|вто|[ыи]?от','ну':r'ну|но','какбы':r'(ка)?к?а?бы|ибы','тоесть':r'т[оуаыи]?[еэиь]?с[тьт]*|туть|тоес'}[tgt]
    for m in re.finditer(PAT,seq):
        if abs(w0+letters[m.start()][1]*0.02-t)>0.55: continue
        f0=letters[m.start()][1]; f1=letters[m.end()-1][2]
        tc=w0+f0*0.02
        if best is None or abs(tc-t)<abs(best[0]-t): best=(tc,w0+(f1+1)*0.02)
    if best is None:
        report.append((t,tgt,'не нашла по буквам',seq)); continue
    os_,oe=best[0]-0.03,best[1]+0.04
    ss,gs=o2s(os_); se,ge=o2s(oe)
    if ss is None or se is None:
        report.append((t,tgt,'вне сегментов — пропуск',seq)); continue
    if gs is not ge:
        cuts.append([round(ss,3),round(gs['src_e'],3),tgt,round(t,2)]); cuts.append([round(ge['src_s'],3),round(se,3),tgt,round(t,2)])
    else:
        cuts.append([round(ss,3),round(se,3),tgt,round(t,2)])
    report.append((t,tgt,'вырезаю',f'{ss:.2f}-{se:.2f}'))
json.dump(cuts,open('extra_cuts.json','w'),ensure_ascii=False)
for r in report: print(f"{int(r[0]//60):02d}:{r[0]%60:05.2f} {r[1]:7s} {r[2]} {r[3]}")
print(len(cuts),'cuts')
