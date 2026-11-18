import React from "react";
import {AbsoluteFill, OffthreadVideo, Sequence, Freeze, Img, Loop, staticFile, Easing} from "remotion";
import {C, G, L, fr, SP} from "../episode/kit";
import {P, HAND, AMATIC, MONO, PF, OSW, Label, shadow} from "../ep2/collage";
import {Item as EpItem} from "../ep2/scenes2";

/* Рилсы-списки 2-го выпуска (3 вещи / 3 привычки / 3 мифа): горизонтальное видео полосой посередине,
   сверху и снизу — визуализация (как в референсах Влады). В начале — коллаж из её картинок (папка на Диске),
   шрифты цветные, не белые. Данные — тот же reels2.json, r.layout === "stack". */

const W = 1080, BY = 620, BH = 680;
const PAPER = "#F4F0E8";
const FACE = {x: 975, y: 560};
const col = (k?: string) => (k ? (P as any)[k] ?? (C as any)[k] ?? k : P.ink);
const FONTS: Record<string, string> = {hand: HAND, amatic: AMATIC, mono: MONO, pf: PF, g: G};

type R = any;
type Gx = {kind: string; s: number; e: number; [k: string]: any};

const HookText: React.FC<{r: R; f: number}> = ({r, f}) => {
  const h = r.hookText; if (!h) return null;
  const e = fr(r.hook_end), s0 = fr(h.t ?? 0.3);
  if (f < s0 || f > e + 6) return null;
  const p = SP(f, s0, 11, 170) * L(f, e - 2, e + 6, 1, 0);
  return <div style={{position: "absolute", left: 0, right: 0, top: h.y ?? 300, textAlign: "center", opacity: Math.min(1, p * 1.4), transform: `scale(${0.85 + 0.15 * p})`}}>
    <div style={{fontFamily: h.font === "mono" ? MONO : h.font === "pf" ? PF : G, fontWeight: 800, fontStyle: h.font === "pf" ? "italic" : "normal", fontSize: h.size ?? 150, lineHeight: 0.95,
      color: col(h.color), letterSpacing: "-0.02em", textShadow: "0 6px 24px rgba(30,26,46,.25)", WebkitTextStroke: h.stroke ? `3px ${col(h.stroke)}` : undefined, paintOrder: "stroke fill", whiteSpace: "pre-line"}}>{h.text}</div>
    {h.sub && <div style={{marginTop: 10, fontFamily: G, fontWeight: 600, fontSize: 40, color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,.45)"}}>{h.sub}</div>}
  </div>;
};

const Band: React.FC<{r: R; f: number; noMatte?: boolean}> = ({r, f, noMatte}) => {
  const t = f / 30;
  let zi = 0; (r.segs as any[]).forEach((sg, i) => { if (sg.at <= t) zi = i; });
  const z = (zi % 2 === 0 ? 1.0 : 1.1) * (1 + 0.02 * Math.min(1, (t - r.segs[zi].at) / 4));
  const S = (BH / 1080) * z;
  const vid = (startFrom: number) => <OffthreadVideo src={staticFile(r.src)} startFrom={startFrom} muted style={{width: 1920, height: 1080}} />;
  return (
    <div style={{position: "absolute", left: 0, top: BY, width: W, height: BH, overflow: "hidden", boxShadow: "0 10px 40px rgba(30,26,46,.18)"}}>
      <div style={{position: "absolute", left: W / 2 - FACE.x * S, top: BH / 2 - FACE.y * S + (z - 1) * 120, width: 1920, height: 1080, transform: `scale(${S})`, transformOrigin: "0 0"}}>
        <Sequence durationInFrames={fr(r.segs[0].at)} layout="none"><Freeze frame={0}>{vid(0)}</Freeze></Sequence>
        {(r.segs as any[]).map((sg, i) => (
          <Sequence key={i} from={fr(sg.at)} durationInFrames={Math.max(1, fr(sg.e - sg.s))} layout="none">{vid(fr(sg.s))}</Sequence>
        ))}
      </div>
      {!noMatte && <div style={{position: "absolute", left: W / 2 - FACE.x * S, top: BH / 2 - FACE.y * S + (z - 1) * 120, width: 1920, height: 1080, transform: `scale(${S})`, transformOrigin: "0 0"}}>
        {(r.matte as number[][]).map(([a, b], k) => (
          <Sequence key={k} from={fr(a)} durationInFrames={Math.max(1, fr(b) - fr(a))} layout="none">
            <OffthreadVideo transparent src={staticFile(`ep2r/matte/${r.id}_${k}.webm`)} muted style={{position: "absolute", left: 660, top: 0, width: 600, height: 1080}} />
          </Sequence>
        ))}
      </div>}
    </div>
  );
};

/* картинка коллажа: появляется с подскоком, уходит в e */
const Pic: React.FC<{f: number; it: any; e: number}> = ({f, it, e}) => {
  const s = fr(it.t), ee = fr(it.e ?? e);
  if (f < s || f > ee) return null;
  const sp = SP(f, s, 10, 210), out = L(f, ee - 6, ee, 1, 0);
  const st: React.CSSProperties = {width: "100%", height: "100%", objectFit: "cover", display: "block"};
  return (
    <div style={{position: "absolute", left: it.x, top: it.y, width: it.w, height: it.h, opacity: Math.min(1, sp * 1.6) * out,
      transform: `rotate(${it.rot ?? 0}deg) scale(${0.86 + 0.14 * sp})`, boxShadow: "0 8px 24px rgba(30,26,46,.22)",
      outline: it.frame ? "10px solid #fff" : undefined, overflow: "hidden", borderRadius: it.r ?? 0,
      ...(it.pol ? {background: "#fff", padding: "12px 12px 44px", overflow: "visible", outline: undefined} : {})}}>
      {it.video ? <Loop durationInFrames={it.loop ?? 46}><OffthreadVideo src={staticFile(it.src)} muted style={st} /></Loop> : <Img src={staticFile(it.src)} style={st} />}
    </div>
  );
};

const Item: React.FC<{f: number; it: any; e: number}> = ({f, it, e}) => {
  if (it.k === "label") {
    return <Label f={f} s={fr(it.t)} e={fr(it.e ?? e)} text={it.text} x={it.x} y={it.y} size={it.size ?? 46} rot={it.rot ?? -2}
      bg={col(it.bg ?? "paper")} color={col(it.color ?? "ink")} font={FONTS[it.font ?? "hand"]} tape={it.tape ?? true} maxW={it.maxW ?? 900} v={it.v} />;
  }
  if (it.k === "text") {
    const s = fr(it.t), ee = fr(it.e ?? e);
    if (f < s || f > ee) return null;
    const p = SP(f, s, 10, 200) * L(f, ee - 6, ee, 1, 0);
    return <div style={{position: "absolute", left: 0, right: 0, top: it.y, textAlign: "center", opacity: Math.min(1, p * 1.5), transform: `scale(${0.8 + 0.2 * p}) rotate(${it.rot ?? 0}deg)`,
      fontFamily: FONTS[it.font ?? "mono"], fontWeight: it.font === "pf" ? 800 : 400, fontStyle: it.font === "pf" ? "italic" : "normal", fontSize: it.size ?? 96, lineHeight: 1.02,
      color: col(it.color ?? "pink"), WebkitTextStroke: it.stroke === false ? undefined : `${it.sw ?? 3}px ${col(it.strokeColor ?? "ink")}`, paintOrder: "stroke fill", whiteSpace: "pre-line"}}>
      {it.bg ? <span style={{background: col(it.bg), padding: "2px 22px 8px", borderRadius: 10, boxShadow: "0 6px 18px rgba(30,26,46,.18)"}}>{it.text}</span> : it.text}</div>;
  }
  if (it.k === "deco") { // маленький коллажный стикер (вырезан с белого фона)
    const s0 = fr(it.t), ee = fr(it.e ?? e);
    if (f < s0 || f > ee) return null;
    const sp = SP(f, s0, 9, 220), out = L(f, ee - 6, ee, 1, 0);
    return <Img src={staticFile(it.src)} style={{position: "absolute", left: it.x, top: it.y, width: it.w, opacity: Math.min(1, sp * 1.6) * out,
      transform: `translate(-50%,-50%) rotate(${(it.rot ?? 0) + (1 - sp) * 25}deg) scale(${0.5 + 0.5 * sp})`, filter: "drop-shadow(2px 4px 3px rgba(30,26,46,.25))"}} />;
  }
  if (["cut", "ransom", "digits", "strike", "hourglass", "clicker", "bar", "tape"].includes(it.k)) return <EpItem f={f} it={it} e={e} />;
  return <Pic f={f} it={it} e={e} />;
};

/* размытый список сверху: пункты видны сразу, открываются по очереди; у мифов — штамп «МИФ» */
const List: React.FC<{f: number; g: Gx}> = ({f, g}) => {
  const s = fr(g.s), pin = L(f, s, s + 8, 0, 1, Easing.out(Easing.cubic));
  const nums = [P.red, P.blue, P.pink];
  return (
    <div style={{position: "absolute", left: 50, right: 50, top: g.top ?? 36, opacity: pin, transform: `translateY(${(1 - pin) * -20}px)`}}>
      <div style={{fontFamily: AMATIC, fontWeight: 700, fontSize: g.hs ?? 66, lineHeight: 0.95, color: P.red, marginBottom: 12, maxWidth: g.timer ? 760 : 980}}>{g.head}</div>
      {g.items.map((it: any, i: number) => {
        const at = fr(it.t), open = L(f, at, at + 8, 0, 1, Easing.out(Easing.cubic));
        const st = g.stamps ? fr(g.stamps[i]) : null;
        const sp = st !== null && f >= st ? Math.min(1, (f - st) / 5) : 0;
        return (
          <div key={i} style={{position: "relative", display: "flex", alignItems: "center", gap: 18, marginBottom: 10, width: "fit-content", maxWidth: g.timer ? 800 : 980}}>
            <div style={{flex: "0 0 auto", width: 56, height: 56, borderRadius: 28, background: nums[i % 3], color: "#fff", fontFamily: MONO, fontSize: 28,
              display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.8 + 0.2 * open})`}}>{i + 1}</div>
            <div style={{position: "relative", fontFamily: HAND, fontSize: g.fs ?? 42, lineHeight: 1.05, color: P.ink, background: "#fff", padding: "8px 20px", borderRadius: 12,
              boxShadow: "0 6px 18px rgba(30,26,46,.12)", filter: `blur(${(1 - open) * 12}px)`}}>
              {it.text}
              {sp > 0 && <div style={{position: "absolute", left: 14, right: 14, top: "52%", height: 6, background: P.red, borderRadius: 3, transformOrigin: "0 50%", transform: `scaleX(${sp})`, opacity: 0.9}} />}
            </div>
            {sp > 0 && <div style={{position: "absolute", left: "100%", marginLeft: 8, top: 4, transform: `rotate(-12deg) scale(${2.2 - 1.2 * sp})`, opacity: sp, border: `6px solid ${P.red}`, color: P.red,
              fontFamily: MONO, fontSize: 40, padding: "2px 16px", borderRadius: 10, background: "rgba(255,255,255,.9)"}}>МИФ</div>}
          </div>
        );
      })}
    </div>
  );
};

const Captions: React.FC<{r: R; f: number}> = ({r, f}) => {
  const t = f / 30;
  if (t < r.hook_end) return null;
  const c = (r.caps as any[]).find((x) => t >= x.s - 0.03 && t < x.e);
  if (!c) return null;
  return <div style={{position: "absolute", top: BY + BH + 18, left: 60, right: 60, textAlign: "center", fontFamily: G, fontWeight: 600, fontSize: 42, lineHeight: 1.2, color: P.ink}}>
    {c.w.map((w: any) => w.w).join(" ")}</div>;
};

const Timer: React.FC<{r: R; f: number}> = ({r, f}) => {
  if (typeof r.timer !== "number") return null;
  const t = f / 30 / r.speed, sec = Math.max(0, Math.ceil(r.timer - t)), p = Math.min(1, t / r.timer);
  const R0 = 58, circ = 2 * Math.PI * R0;
  return (
    <div style={{position: "absolute", right: 40, top: 40, width: 140, height: 140}}>
      <svg width={140} height={140} style={{position: "absolute"}}>
        <circle cx={70} cy={70} r={66} fill="#fff" stroke={P.ink} strokeWidth={4} />
        <circle cx={70} cy={70} r={R0} fill="none" stroke={sec <= 5 ? P.red : P.yellow} strokeWidth={9} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * p} transform="rotate(-90 70 70)" />
      </svg>
      <div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 40, color: sec <= 5 ? P.red : P.ink}}>{sec}</div>
    </div>
  );
};

const Cta: React.FC<{r: R; f: number}> = ({r, f}) => {
  const s = fr(r.dur - 2.6);
  if (f < s) return null;
  const p = SP(f, s, 10, 200);
  return <div style={{position: "absolute", left: 0, right: 0, top: 1846, display: "flex", justifyContent: "center", opacity: Math.min(1, p * 1.5), transform: `scale(${0.85 + 0.15 * p})`}}>
    <div style={{background: P.yellow, border: `4px solid ${P.ink}`, borderRadius: 18, padding: "12px 28px", fontFamily: G, fontWeight: 600, fontSize: 38, color: P.ink, boxShadow: `6px 6px 0 ${P.ink}`}}>
      {r.cta[0]} <b style={{fontWeight: 800}}>{r.cta[1]}</b></div></div>;
};

export const Stack2: React.FC<{r: R; f: number; noMatte?: boolean}> = ({r, f, noMatte}) => {
  const t = f / 30;
  const gfx = r.gfx as Gx[];
  return (
    <AbsoluteFill style={{background: PAPER, overflow: "hidden"}}>
      <AbsoluteFill style={{backgroundImage: "radial-gradient(rgba(30,26,46,.07) 1px, transparent 1.4px)", backgroundSize: "9px 9px"}} />
      {gfx.filter((g) => g.kind === "pics" && g.under).map((g, i) => <React.Fragment key={"u" + i}>{g.items.map((it: any, j: number) => <Item key={j} f={f} it={it} e={fr(g.e)} />)}</React.Fragment>)}
      <Band r={r} f={f} noMatte={noMatte} />
      {gfx.filter((g) => g.kind === "pics" && !g.under && t >= g.s - 0.2 && t <= g.e + 0.3).map((g, i) => <React.Fragment key={"p" + i}>{g.items.map((it: any, j: number) =>
        <Item key={j} f={f} it={it} e={it.k === "label" || it.k === "text" ? Math.min(fr(g.e), fr(r.dur - 2.7)) : fr(g.e)} />)}</React.Fragment>)}
      {gfx.filter((g) => g.kind === "blurlist" && t >= g.s - 0.2).map((g, i) => <List key={"l" + i} f={f} g={{...g, timer: !!r.timer}} />)}
      <div style={{position: "absolute", left: 0, right: 0, top: BY}}><HookText r={r} f={f} /></div>
      <Timer r={r} f={f} />
      <Captions r={r} f={f} />
      <Cta r={r} f={f} />
    </AbsoluteFill>
  );
};
