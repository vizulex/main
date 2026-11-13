import json, re
W=json.load(open('words_flat.json')); EX=json.load(open('extras.json'))
FPS=30
def cl(o): return re.sub(r'[^\wа-яё-]','',o.lower())
dele={}  # idx -> reason
def D(idx,reason):
    for i in idx: dele[i]=reason
filler_single=[41,86,93,97,98,238,268,432,434,498,499,500,513,522,526,667,673,684,718,726,811,857,888,925,965,982,983,1003,1054,1078,1079,1186,1266,1311,1348,1412,1510,1710,1738,1743,1763,1831,1873,1926,1935,2008,2015,2027,2029,2070,2266,2296,2344,2352,2466,2475,2477,2613,2665,2678,2762,2772,2778,2816,2841,2905,2955,3090,3095]
for i in filler_single: D([i],'паразит «%s»'%cl(W[i]['orig']))
for i in [284,427,988,1802,2908,2958,3233,3297]:
    assert cl(W[i]['orig'])=='как' and cl(W[i+1]['orig'])=='бы',i; D([i,i+1],'паразит «как бы»')
for i,w in enumerate(W):
    if cl(w['orig'])=='принципе' and cl(W[i-1]['orig'])=='в': D([i-1,i],'паразит «в принципе»')
for i in [338,357,463,478,625,643,737,771,792,1028,1105,1119,1139,1410,1506,1574,1707,1824,1853,1886,2032,2082,2099,2119,2142,2187,2323,2523,2576,2720,2942,3014,3088]:
    assert cl(W[i]['orig'])=='то' and cl(W[i+1]['orig'])=='есть',i; D([i,i+1],'паразит «то есть» в начале фразы')
D(range(1130,1135),'дубль: «Давайте мы вот сейчас посчитаем» (повтор предыдущей фразы)')
D(range(1372,1377),'фальстарт: «тебе дают какой-то вот…» → «если у тебя новый проект»')
D([2639,2640],'запинка: «вот такой такая» → «такая»')
assert cl(W[1372]['orig'])=='тебе' and cl(W[2640]['orig'])=='такой' and cl(W[1130]['orig'])=='давайте'
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
start=max(0,W[0]['s']-0.3); end=W[-1]['e']+0.7
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
iw=[i for i in range(len(W)) if cl(W[i]['orig']).startswith('этом') and W[i]['s']<70][0]
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
        cut_at=snap(min(g['src_e'],intro_src+0.45)); 
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
