import json, re
W=json.load(open('words_flat.json')); EX=json.load(open('extras.json'))
FPS=30
def cl(o): return re.sub(r'[^\wа-яё-]','',o.lower())
dele={}  # idx -> reason
def D(idx,reason):
    for i in idx: dele.setdefault(i,reason)
# что берём в выпуск (индексы слов, включительно); всё остальное — дубли, звонок, дубли хуков для рилсов
KEEP=[(6,41),(75,94),(125,134),(146,186),(208,336),(337,2367),(2388,3917)]
inkeep=lambda i: any(a<=i<=b for a,b in KEEP)
for i in range(len(W)):
    if not inkeep(i): D([i],'дубль / лишний кусок')
D(range(779,804),'дубль: «Я про них уже говорила… Из чего же они сделаны? Из нейронов…»')
D(range(1667,1683),'дубль: «вот скажи на самом деле часто… предвкушение пятницы…»')
D([1893],'фальстарт «потому что ты…»'); D([1906,1907],'дубль «Я ждала…»')
D([2905,2906],'фальстарт «психологии есть»'); D(range(3789,3798),'дубль «подведём итог в трёх фразах»')
D([155],'лишнее «и»'); D([469,470],'запинка «и… наверное»'); D([500],'повтор «и И»'); D([2420],'оговорка «любой»')
D([2739],'повтор «которые которым»'); D([2753,2754],'запинка «в больше»'); D([3677,3678],'запинка «на ну на себе»')
# слова-паразиты
words=[cl(w['orig']) for w in W]
def sent_start(i):
    j=i-1
    while j>=0 and j in dele: j-=1
    return j<0 or W[j]['orig'].strip()[-1:] in '.?!…' or W[i]['s']-W[j]['e']>0.7
for i,w in enumerate(words):
    if i in dele: continue
    o=W[i]['orig'].strip()
    if w in ('эм','ээ','эээ','мм','ммм','э','типа'): D([i],'паразит «%s»'%w)
    elif w=='ну' and (o.endswith(',') or sent_start(i)): D([i],'паразит «ну»')
    elif w=='как' and i+1<len(W) and words[i+1]=='бы' and (i+2>=len(W) or words[i+2] not in ('это','не','ни')): D([i,i+1],'паразит «как бы»')
    elif w=='получается': D([i],'паразит «получается»')
    elif w=='то' and i+1<len(W) and words[i+1]=='есть' and sent_start(i): D([i,i+1],'паразит «то есть» в начале фразы')
    elif w=='вот' and o.endswith(',') and sent_start(i): D([i],'паразит «вот»')
    elif i+1<len(W) and w==words[i+1] and len(w)>1 and not w.isdigit() and W[i+1]['s']-W[i]['e']<0.6: D([i],'повтор «%s %s»'%(w,w))
# filler sounds in gaps
def filler_in(s,e):
    for x in EX:
        if x[0]<e-0.05 and x[1]>s+0.05:
            t=x[2].replace(' ','')
            if (x[1]-x[0])>=0.3 and re.fullmatch(r'[аэмыоиеуйнхг-]{1,3}',t): return True
    return False
keep=[i for i in range(len(W)) if i not in dele]
cuts=[]  # (src_s, src_e, reason)
for a,b in zip(keep,keep[1:]):
    A,B=W[a],W[b]; g=B['s']-A['e']
    between=[dele[i] for i in range(a+1,b)]
    fz=filler_in(A['e'],B['s'])
    send=A['orig'].strip()[-1:] in '.?!'
    if between: target=0.3 if send else 0.12
    elif g>0.5: target=0.3 if send else 0.2
    elif fz: target=0.15
    else: continue
    if g<=target+0.06 and not between: continue
    pa=max(0.05,target*0.5); pb=max(0.05,target*0.5)
    cs,ce=A['e']+pa,B['s']-pb
    if ce-cs<0.06: continue
    reason=between[0] if between else ('звук-паразит («ээ/мм») в паузе' if fz else f'пауза {g:.1f} с → {target:.1f} с')
    cuts.append([cs,ce,reason,a,b])
start=max(0,W[KEEP[0][0]]['s']-0.3); end=W[KEEP[-1][1]]['e']+0.7
# keep ranges from cuts
rng=[]; cur=start
for cs,ce,_,_,_ in cuts:
    rng.append([cur,cs]); cur=ce
rng.append([cur,end])
import os
XC=json.load(open('extra_cuts.json')) if os.path.exists('extra_cuts.json') else []
for cs,ce,tg,_ in XC:
    new=[]
    for r0,r1 in rng:
        if ce<=r0 or cs>=r1: new.append([r0,r1]); continue
        if cs>r0: new.append([r0,cs])
        if ce<r1: new.append([ce,r1])
    rng=new
    cuts.append([cs,ce,'паразит «%s» (2-й проход)'%{'тоесть':'то есть','какбы':'как бы'}.get(tg,tg),None,None])
cuts.sort(key=lambda c:c[0])
snap=lambda t: round(t*FPS)/FPS
rng=[[snap(s),snap(e)] for s,e in rng]
rng=[r for r in rng if r[1]-r[0]>=1/FPS]
# intro after «об этом»
iw=41  # «…давайте разбираться вместе.» — после холодного хука
intro_src=W[iw]['e']
# out mapping
out=0; segs=[]
for s,e in rng:
    segs.append({"src_s":s,"src_e":e,"out_s":round(out,4)}); out+=e-s
def s2o(t):
    for g in segs:
        if g['src_s']-1e-6<=t<=g['src_e']+1e-6: return g['out_s']+(t-g['src_s'])
    # in a cut: map to next seg start
    for g in segs:
        if g['src_s']>t: return g['out_s']
    return out
INTRO_LEN=15.0
intro_out=None
# split: find seg containing intro_src; insert intro at end of that seg (snap)
for k,g in enumerate(segs):
    if g['src_s']<=intro_src<=g['src_e']+0.5:
        cut_at=snap(min(g['src_e'],intro_src+0.6)); 
        rest={"src_s":cut_at,"src_e":g['src_e']}
        g['src_e']=cut_at
        intro_out=g['out_s']+(cut_at-g['src_s'])
        if rest['src_e']-rest['src_s']>=1/FPS: segs.insert(k+1,rest)
        break
# recompute out times with intro gap
out=0
for g in segs:
    if abs(out-intro_out)<1e-6 or (out>=intro_out-1e-6 and not any('intro_done' in x for x in segs)):
        pass
    g['out_s']=round(out,4)
    out+=g['src_e']-g['src_s']
    if abs(out-intro_out)<1e-4: out+=INTRO_LEN; g['intro_done']=True
total=out
def src2out(t):
    for g in segs:
        if g['src_s']-1e-6<=t<=g['src_e']+1e-6: return g['out_s']+(t-g['src_s'])
    for g in segs:
        if g['src_s']>t: return g['out_s']
    return total
words_out=[{"i":i,"w":W[i]['orig'],"o":round(src2out(W[i]['s']),3),"oe":round(src2out(W[i]['e']),3)} for i in keep]
log=[{"src":round(c[0],2),"src_end":round(c[1],2),"out":round(src2out(c[1]),2),"reason":c[2],
      "ctx":(' '.join(W[j]['orig'] for j in range(max(0,c[3]-3),c[3]+1))+' ✂ '+' '.join(W[j]['orig'] for j in range(c[4],min(len(W),c[4]+3)))) if c[3] is not None else ''} for c in cuts]
json.dump({"fps":FPS,"segs":segs,"intro_out":intro_out,"intro_len":INTRO_LEN,"total":total,"words":words_out,"log":log},open('edl.json','w'),ensure_ascii=False)
removed=sum(c[1]-c[0] for c in cuts)
print('segments',len(segs),'cuts',len(cuts),'removed %.1f s'%removed,'total out %.1f s = %d:%02d'%(total,total//60,total%60),'intro at %.2f'%intro_out)
import collections; print(collections.Counter(c[2].split('«')[0].split(':')[0].strip() for c in cuts))
