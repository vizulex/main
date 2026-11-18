import React from "react";
import {AbsoluteFill, OffthreadVideo, Sequence, Freeze, Img, staticFile, useCurrentFrame, Easing, interpolate} from "remotion";
import {loadFont as loadPlayfair} from "@remotion/google-fonts/PlayfairDisplay";
import {C, U, G, L, SP, fr, Appear, gridPaper} from "../episode/kit";
import {Gx} from "./scenes";
import {Paper} from "../ep2/collage";
import {Item, Scene} from "../ep2/scenes2";
import reels from "./data/reels2.json";
import {Stack2} from "./Stack2";

/* Рилсы 2-го выпуска (копия Reel.tsx: исходник у каждого рилса свой, графика — коллаж из ep2).
   Вертикальный рилс 1080×1920. Стиль по примерам: спокойные мелкие субтитры, крупные слова ЗА мной
   (я вырезана по маске — matte_reels.py — и стою поверх текста), курсив с засечками для акцентов,
   во время графики я внизу на половине экрана или в кружке. Звук — mix_reels.py. */

const PF = loadPlayfair("italic", {weights: ["600"], subsets: ["cyrillic", "latin"]}).fontFamily;
type R = (typeof reels)[number];
const INTRO_LEN = 0;
const FACE = {x: 960, y: 560};
const MATTE = {x: 660, w: 600};
const fit = (txt: string, max: number, width = 980, k = 0.8) => Math.min(max, width / (Math.max(...txt.split("\n").map((l) => l.length)) * k));
const col = (k?: string) => (k ? (C as any)[k] ?? k : "#fff");
const soft = "0 2px 14px rgba(0,0,0,.55), 0 0 2px rgba(0,0,0,.5)";

/* ---------- раскладка: полный кадр / половина / кружок ---------- */
type Box = {x: number; y: number; w: number; h: number; r: number; ax: number; ay: number; z: number};
const FULLB: Box = {x: 0, y: 0, w: 1080, h: 1920, r: 0, ax: 540, ay: 860, z: 1.22};
const SPLIT: Box = {x: 40, y: 1010, w: 1000, h: 860, r: 44, ax: 540, ay: 1390, z: 1.2};
const CIRCLE: Box = {x: 700, y: 150, w: 340, h: 340, r: 170, ax: 870, ay: 345, z: 1.5};
const mix = (a: Box, b: Box, p: number): Box => ({x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, w: a.w + (b.w - a.w) * p, h: a.h + (b.h - a.h) * p,
  r: a.r + (b.r - a.r) * p, ax: a.ax + (b.ax - a.ax) * p, ay: a.ay + (b.ay - a.ay) * p, z: a.z + (b.z - a.z) * p});

const sceneAt = (r: R, f: number) => {
  for (const g of r.gfx as Gx[]) {
    if (!g.mode) continue;
    const s = fr(g.s), e = fr(g.e);
    if (f >= s && f < e) return {g, p: Math.min(L(f, s, s + 11, 0, 1), L(f, e - 11, e, 1, 0))};
  }
  return null;
};

const zoomAt = (r: R, t: number) => {
  let z = 1.22, zs = 0, ze = r.dur;
  r.zoom.forEach(([s, v], i) => { if (s <= t) { z = v; zs = s; ze = r.zoom[i + 1]?.[0] ?? r.dur; } });
  return z * (1 + 0.03 * Math.min(1, (t - zs) / Math.max(1, ze - zs)));
};

/* Кадр aroll внутри коробки b; children рисуются в координатах aroll (1920×1080) — туда же кладём маску */
const Frame: React.FC<{b: Box; z: number; children: React.ReactNode; border?: number}> = ({b, z, children, border = 0}) => {
  const S = (1920 / 1080) * z;
  return (
    <div style={{position: "absolute", left: b.x, top: b.y, width: b.w, height: b.h, borderRadius: b.r, overflow: "hidden",
      boxShadow: border ? `0 18px 50px rgba(20,16,40,${0.35 * border})` : "none", outline: border ? `${5 * border}px solid rgba(255,255,255,${border})` : "none"}}>
      <div style={{position: "absolute", left: b.ax - b.x - FACE.x * S, top: b.ay - b.y - FACE.y * S, width: 1920, height: 1080, transform: `scale(${S})`, transformOrigin: "0 0"}}>
        {children}
      </div>
    </div>
  );
};

const ARoll: React.FC<{r: R}> = ({r}) => (
  <>
    <Sequence durationInFrames={fr(r.segs[0].at)} layout="none">
      <Freeze frame={0}><OffthreadVideo src={staticFile(r.src)} startFrom={fr(r.segs[0].s - INTRO_LEN)} muted style={{position: "absolute", width: 1920, height: 1080, filter: "contrast(1.04) saturate(1.06)"}} /></Freeze>
    </Sequence>
    {r.segs.map((sg, i) => (
      <Sequence key={i} from={fr(sg.at)} durationInFrames={Math.max(1, fr(sg.e - sg.s))} layout="none">
        <OffthreadVideo src={staticFile(r.src)} startFrom={fr(sg.s - INTRO_LEN)} muted style={{position: "absolute", width: 1920, height: 1080, filter: "contrast(1.04) saturate(1.06)"}} />
      </Sequence>
    ))}
  </>
);

const Matte: React.FC<{r: R}> = ({r}) => (
  <>
    {r.matte.map(([a, b], k) => (
      <Sequence key={k} from={fr(a)} durationInFrames={Math.max(1, fr(b) - fr(a))} layout="none">
        <OffthreadVideo transparent src={staticFile(`ep2r/matte/${r.id}_${k}.webm`)} muted style={{position: "absolute", left: MATTE.x, top: 0, width: MATTE.w, height: 1080}} />
      </Sequence>
    ))}
  </>
);

/* ---------- маленький коллажный декор в начале (стикеры Влады, вырезаны с белого фона) ---------- */
const Decos: React.FC<{g: Gx; f: number}> = ({g, f}) => (
  <>{g.items.map((it: any, i: number) => {
    const s = fr(it.t), e = fr(g.e);
    if (f < s || f > e) return null;
    const sp = SP(f, s, 9, 220), out = L(f, e - 6, e, 1, 0);
    return <Img key={i} src={staticFile(it.src)} style={{position: "absolute", left: it.x, top: it.y, width: it.w, opacity: Math.min(1, sp * 1.6) * out,
      transform: `translate(-50%,-50%) rotate(${(it.rot ?? 0) + (1 - sp) * 25}deg) scale(${0.5 + 0.5 * sp})`, filter: "drop-shadow(2px 4px 3px rgba(0,0,0,.3))"}} />;
  })}</>
);

/* ---------- крупное слово за мной ---------- */
type BT = {s: number; e: number; big: string; small?: string; color?: string};
const BehindWord: React.FC<{b: BT; f: number}> = ({b, f}) => {
  const s = fr(b.s), e = fr(b.e);
  if (f < s - 1 || f > e) return null;
  const pin = L(f, s, s + 9, 0, 1, Easing.out(Easing.cubic)), pout = L(f, e - 7, e, 1, 0);
  const lines = b.big.split("\n");
  const size = fit(b.big, 270, 1000, 0.82);
  const top = 300 - (lines.length * size * 0.95) / 2;
  return (
    <div style={{position: "absolute", left: 0, right: 0, top, textAlign: "center", opacity: pin * pout, filter: `blur(${(1 - pin) * 14}px)`, transform: `scale(${1.06 - 0.06 * pin})`}}>
      {lines.map((ln, i) => (
        <div key={i} style={{fontFamily: U, fontWeight: 800, fontSize: size, lineHeight: 0.95, letterSpacing: "-0.03em", color: col(b.color), whiteSpace: "nowrap", textShadow: "0 12px 40px rgba(20,16,40,.35)"}}>{ln}</div>
      ))}
    </div>
  );
};
const SmallLine: React.FC<{b: BT; f: number}> = ({b, f}) => {
  if (!b.small) return null;
  const s = fr(b.s) + 3, e = fr(b.e);
  if (f < s || f > e) return null;
  const lines = b.big.split("\n");
  const size = fit(b.big, 270, 1000, 0.82);
  const top = 300 - (lines.length * size * 0.95) / 2 - 92;
  const p = L(f, s, s + 9, 0, 1, Easing.out(Easing.cubic)) * L(f, e - 7, e, 1, 0);
  return (
    <div style={{position: "absolute", left: 60, right: 60, top, textAlign: "center", opacity: p, transform: `translateY(${(1 - p) * 14}px)`,
      fontFamily: PF, fontStyle: "italic", fontWeight: 600, fontSize: b.small.length > 26 ? 50 : 62, color: "#fff", textShadow: soft}}>{b.small}</div>
  );
};

/* ---------- мелкие элементы ---------- */
const Chip: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{display: "inline-block", background: "rgba(255,255,255,.93)", color: C.ink, fontFamily: G, fontWeight: 700, fontSize: 40, padding: "10px 26px", borderRadius: 999, boxShadow: "0 8px 26px rgba(20,16,40,.22)", whiteSpace: "pre-line", textAlign: "center", ...style}}>{children}</div>
);

const Overlay: React.FC<{g: Gx; f: number}> = ({g, f}) => {
  const s = fr(g.s), e = fr(g.e);
  switch (g.kind) {
    case "blurlist": { // список: все пункты видны сразу, но размыты; открываются, когда я про них говорю (+ штамп «МИФ»)
      const pin = L(f, s, s + 8, 0, 1, Easing.out(Easing.cubic));
      return (
        <div style={{position: "absolute", top: g.top ?? 250, left: g.stamps ? 40 : 50, right: 40, opacity: pin, transform: `translateY(${(1 - pin) * -20}px)`}}>
          <div style={{display: "inline-block", background: C.ink, color: "#fff", fontFamily: G, fontWeight: 800, fontSize: 40, lineHeight: 1.15, padding: "12px 24px", borderRadius: 14, marginBottom: 16, maxWidth: 940}}>{g.head}</div>
          {g.items.map((it: any, i: number) => {
            const at = fr(it.t), open = L(f, at, at + 8, 0, 1, Easing.out(Easing.cubic));
            const st = g.stamps ? fr(g.stamps[i]) : null;
            const sp = st !== null && f >= st ? Math.min(1, (f - st) / 5) : 0;
            return (
              <div key={i} style={{position: "relative", marginBottom: 14, paddingLeft: g.stamps ? 150 : 0}}>
                <div style={{display: "inline-block", background: "rgba(255,255,255,.94)", color: C.ink, fontFamily: G, fontWeight: 700, fontSize: 38, lineHeight: 1.2,
                  padding: "10px 22px", borderRadius: 14, boxShadow: "0 8px 26px rgba(20,16,40,.22)", maxWidth: 940,
                  filter: `blur(${(1 - open) * 11}px)`, transform: `scale(${1 + 0.05 * Math.sin(open * Math.PI)})`, transformOrigin: "0 50%"}}>{it.text}</div>
                {sp > 0 && <div style={{position: "absolute", left: 0, top: 2, transform: `rotate(-12deg) scale(${2.2 - 1.2 * sp})`, opacity: sp,
                  border: `5px solid ${C.mandarin}`, color: C.mandarin, fontFamily: U, fontWeight: 900, fontSize: 38, padding: "0 12px", borderRadius: 10, background: "rgba(255,255,255,.85)", letterSpacing: "0.06em"}}>МИФ</div>}
                {sp > 0 && <div style={{position: "absolute", left: 160, right: 0, top: "52%", height: 5, background: C.mandarin, borderRadius: 3, transformOrigin: "0 50%", transform: `scaleX(${sp * 0.9})`, opacity: 0.85}} />}
              </div>
            );
          })}
        </div>
      );
    }
    case "chips": return (
      <div style={{position: "absolute", top: g.y ?? 420, left: 40, right: 40, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 18}}>
        {g.items.map((it: any, i: number) => <Appear key={i} f={f} s={fr(it.t)} e={e} mode="up"><Chip>{it.text}</Chip></Appear>)}
      </div>
    );
    case "list": {
      const k = fr(g.strike);
      return (
        <div style={{position: "absolute", top: 400, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 16}}>
          {g.items.map((it: any, i: number) => (
            <Appear key={i} f={f} s={fr(it.t)} e={e} mode="up">
              <div style={{position: "relative"}}>
                <Chip style={{fontSize: 48}}>{it.text}</Chip>
                <div style={{position: "absolute", left: 10, top: "48%", height: 6, width: `${L(f, k + i * 3, k + i * 3 + 7, 0, 92)}%`, background: C.mandarin, borderRadius: 3}} />
              </div>
            </Appear>
          ))}
          <Appear f={f} s={k + 6} e={e} mode="up"><div style={{fontFamily: PF, fontStyle: "italic", fontWeight: 600, fontSize: 70, color: "#fff", textShadow: soft}}>неправда</div></Appear>
        </div>
      );
    }
    case "quote": {
      const ta = fr(g.ta), tb = fr(g.tb);
      return (
        <div style={{position: "absolute", top: 360, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 22}}>
          <Appear f={f} s={ta} e={e} mode="up">
            <div style={{position: "relative"}}>
              <Chip style={{fontSize: 48}}>{g.a}</Chip>
              <div style={{position: "absolute", left: 12, top: "48%", height: 6, width: `${L(f, tb - 4, tb + 4, 0, 90)}%`, background: C.mandarin, borderRadius: 3}} />
            </div>
          </Appear>
          <Appear f={f} s={tb} e={e} mode="up">
            <div style={{fontFamily: PF, fontStyle: "italic", fontWeight: 600, fontSize: 76, lineHeight: 1.1, textAlign: "center", color: "#fff", textShadow: soft, whiteSpace: "pre-line"}}>{g.b}</div>
          </Appear>
        </div>
      );
    }
    case "pingpong": {
      if (f < s || f > e) return null;
      const x = 0.5 + 0.5 * Math.sin((f - s) * 0.42);
      return (
        <Appear f={f} s={s} e={e} mode="up" style={{position: "absolute", top: 430, left: 0, width: 1080, height: 140}}>
          <div style={{position: "absolute", left: 70, top: 20}}><Chip>задача 1</Chip></div>
          <div style={{position: "absolute", right: 70, top: 20}}><Chip>задача 2</Chip></div>
          <div style={{position: "absolute", left: 360 + x * 300, top: 38, width: 46, height: 46, borderRadius: 23, background: C.lemon, boxShadow: "0 6px 18px rgba(0,0,0,.3)"}} />
        </Appear>
      );
    }
    default: return null;
  }
};

const Title: React.FC<{r: R; f: number; left: boolean}> = ({r, f, left}) => {
  const s = fr(r.hook_end);
  if (f < s || !r.title) return null;
  const p = L(f, s, s + 10, 0, 1, Easing.out(Easing.cubic));
  return (
    <div style={{position: "absolute", top: 170, left: left ? 50 : 0, width: left ? 620 : 1080, display: "flex", justifyContent: left ? "flex-start" : "center", opacity: p, transform: `translateY(${(1 - p) * -16}px)`}}>
      <div style={{background: "rgba(20,16,40,.55)", backdropFilter: "blur(10px)", color: "#fff", fontFamily: G, fontWeight: 600, fontSize: 34, padding: "10px 24px", borderRadius: 999}}>
        <span style={{display: "inline-block", width: 12, height: 12, borderRadius: 6, background: C.lemon, marginRight: 12, verticalAlign: "middle"}} />{r.title}
      </div>
    </div>
  );
};

const Timer: React.FC<{r: R; f: number}> = ({r, f}) => {
  if (!r.timer) return null;
  const T = typeof r.timer === "number" ? r.timer : 47;  // число — обратный отсчёт от T до 0
  const t = f / 30 / r.speed, sec = typeof r.timer === "number" ? Math.max(0, Math.ceil(T - t)) : Math.min(47, Math.floor(t)), p = Math.min(1, t / T);
  const R0 = 62, circ = 2 * Math.PI * R0;
  return (
    <div style={{position: "absolute", right: 50, top: 150, width: 150, height: 150}}>
      <svg width={150} height={150} style={{position: "absolute"}}>
        <circle cx={75} cy={75} r={72} fill="rgba(20,16,40,.5)" />
        <circle cx={75} cy={75} r={R0} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth={6} />
        <circle cx={75} cy={75} r={R0} fill="none" stroke={(typeof r.timer === "number" ? sec <= 5 : sec >= 40) ? C.mandarin : "#fff"} strokeWidth={6} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - p)} transform="rotate(-90 75 75)" />
      </svg>
      <div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: G, fontWeight: 700, fontSize: 50, color: "#fff"}}>{sec}<span style={{fontSize: 24, marginLeft: 3, marginTop: 14}}>с</span></div>
    </div>
  );
};

const Captions: React.FC<{r: R; f: number; dark: boolean; y: number}> = ({r, f, dark, y}) => {
  const t = f / 30;
  if (t < r.hook_end) return null;
  const c = r.caps.find((x) => t >= x.s - 0.03 && t < x.e);
  if (!c) return null;
  return (
    <div style={{position: "absolute", top: y, left: 110, right: 110, textAlign: "center", fontFamily: G, fontWeight: 600, fontSize: 44, lineHeight: 1.25,
      color: dark ? C.ink : "#fff", textShadow: dark ? "none" : soft}}>{c.w.map((w) => w.w).join(" ")}</div>
  );
};

const NamePlate: React.FC<{r: R; f: number}> = ({r, f}) => {
  const s = fr(r.hook_end) + 6, e = s + 90;
  if (f < s || f > e) return null;
  const p = L(f, s, s + 10, 0, 1, Easing.out(Easing.cubic)) * L(f, e - 8, e, 1, 0);
  return (
    <div style={{position: "absolute", left: 70, top: 1520, display: "flex", gap: 18, alignItems: "stretch", opacity: p, transform: `translateX(${(1 - p) * -30}px)`}}>
      <div style={{width: 6, borderRadius: 3, background: C.lemon}} />
      <div>
        <div style={{fontFamily: G, fontWeight: 700, fontSize: 40, color: "#fff", textShadow: soft}}>Влада</div>
        <div style={{fontFamily: G, fontWeight: 500, fontSize: 28, color: "rgba(255,255,255,.85)", textShadow: soft}}>Анти брейнрот подкаст</div>
      </div>
    </div>
  );
};

const Cta: React.FC<{r: R; f: number; split?: boolean}> = ({r, f, split}) => {
  const s = fr(r.dur - 2.6);
  if (f < s) return null;
  const p = L(f, s, s + 10, 0, 1, Easing.out(Easing.cubic));
  return (
    <div style={{position: "absolute", top: split ? 925 : 1500, width: "100%", display: "flex", justifyContent: "center", opacity: p, transform: `translateY(${(1 - p) * 20}px)`}}>
      <div style={{display: "flex", alignItems: "center", gap: 18, background: "rgba(255,255,255,.94)", borderRadius: 999, padding: "12px 30px 12px 14px", boxShadow: "0 10px 30px rgba(20,16,40,.25)"}}>
        <div style={{width: 56, height: 56, borderRadius: 28, background: C.mandarin, display: "flex", alignItems: "center", justifyContent: "center"}}>
          <div style={{width: 0, height: 0, borderTop: "11px solid transparent", borderBottom: "11px solid transparent", borderLeft: "18px solid #fff", marginLeft: 5}} />
        </div>
        <div style={{fontFamily: G, fontWeight: 600, fontSize: 34, color: C.ink}}>{r.cta[0]} <b style={{fontWeight: 800}}>{r.cta[1]}</b></div>
      </div>
    </div>
  );
};

export const Reel2: React.FC<{id: string; noMatte?: boolean}> = ({id, noMatte}) => {
  const f = useCurrentFrame();
  const r = reels.find((x) => x.id === id)!;
  if ((r as any).layout === "stack") return <Stack2 r={r} f={f} noMatte={noMatte} />;
  const t = f / 30;
  const gfx = r.gfx as Gx[];
  const sc = sceneAt(r, f);
  const p = sc ? Easing.inOut(Easing.cubic)(sc.p) : 0;
  const target = sc?.g.mode === "circle" ? CIRCLE : SPLIT;
  const z = zoomAt(r, t) * (1 + (t < r.hook_end ? 0.05 * L(f, 0, fr(r.hook_end), 0, 1) : 0));
  const box = mix({...FULLB, z}, target, p);
  const bts: BT[] = [{s: 0, e: r.hook_end, big: r.hook.big, small: r.hook.small}, ...gfx.filter((g) => g.kind === "bt") as any];
  const full = p < 0.01;
  const active = gfx.filter((g) => !g.mode && g.kind !== "bt" && t >= Math.max(g.s - 0.4, r.hook_end) && t <= g.e + 0.4);
  const btOn = bts.some((b) => t >= b.s - 0.1 && t <= b.e + 0.1);
  const leftTitle = r.timer || (sc?.g.mode === "circle" && p > 0.5);
  const capY = 1330 + (sc?.g.mode === "split" ? 400 * p : 0);  // на половине экрана — ниже лица
  return (
    <AbsoluteFill style={{background: C.ink, overflow: "hidden"}}>
      {/* фон под графикой */}
      {p > 0 && <AbsoluteFill style={{opacity: p}}><Paper kind={(sc?.g.bg ?? "grid") as any} /></AbsoluteFill>}
      {sc && p > 0 && (
        <div style={{position: "absolute", left: 0, top: 270, width: 1080, height: 740, opacity: p, transform: `translateY(${(1 - p) * 40}px)`}}>
          {(sc.g.items ?? []).map((it: any, i: number) => <Item key={i} f={f} it={it} e={fr(sc.g.e)} />)}
          {sc.g.scene && <Scene f={f} g={{...sc.g, kind: sc.g.scene}} />}
        </div>
      )}
      {/* я: полный кадр или карточка/кружок */}
      <Frame b={box} z={box.z} border={p}><ARoll r={r} /></Frame>
      {full && <AbsoluteFill style={{background: "linear-gradient(180deg, rgba(20,16,40,.38) 0%, rgba(20,16,40,0) 30%, rgba(20,16,40,0) 62%, rgba(20,16,40,.45) 100%)"}} />}
      {/* слова за мной, затем я поверх (маска) */}
      {full && bts.map((b, i) => <BehindWord key={i} b={b} f={f} />)}
      {full && !noMatte && <Frame b={box} z={box.z}><Matte r={r} /></Frame>}
      {full && bts.map((b, i) => <SmallLine key={i} b={b} f={f} />)}
      {active.map((g) => <Overlay key={g.kind + g.s} g={g} f={f} />)}
      {gfx.filter((g) => g.kind === "decos").map((g, i) => <Decos key={"d" + i} g={g} f={f} />)}
      {!(full && btOn) && <Title r={r} f={f} left={leftTitle} />}
      <Timer r={r} f={f} />
      <Captions r={r} f={f} dark={sc?.g.mode === "circle" && p > 0.5} y={capY} />
      {full && <NamePlate r={r} f={f} />}
      <Cta r={r} f={f} split={sc?.g.mode === "split" && p > 0.5} />
    </AbsoluteFill>
  );
};
