import React from "react";
import {AbsoluteFill, OffthreadVideo, Img, Loop, staticFile, useCurrentFrame, interpolate, Easing, spring, useVideoConfig} from "remotion";
import {G} from "../episode/kit";
import caps from "./caps.json";

/* Рилс «Мона Лиза / хайп 1911» (сырое видео уже без пауз, монтаж минимальный).
   Хук: много картинок внизу по бокам + текст «расширяем кругозор за 30 секунд».
   Дальше картинки внизу по словам. Субтитры по одному слову «падают» в чашку кофе справа сверху.
   Исходники — public/ep2r/coffee (не в git). Звук подкладывается отдельно (ffmpeg). */

const fr = (t: number) => Math.round(t * 30);
const src = (n: string) => staticFile(`ep2r/coffee/${n}`);
const HOOK_END = 4.4;

type P = {n: string; t: number; e: number; x: number; y: number; w: number; rot?: number; video?: boolean};
const PICS: P[] = [
  // хук: коллаж по бокам в нижней части
  {n: "hook_a.jpg", t: 0.0, e: HOOK_END, x: 40, y: 1010, w: 250, rot: -4},
  {n: "hook_b.jpg", t: 0.15, e: HOOK_END, x: 795, y: 1000, w: 250, rot: 4},
  {n: "hook_f.jpg", t: 0.3, e: HOOK_END, x: 60, y: 1360, w: 210, rot: 3},
  {n: "hook_c.jpg", t: 0.45, e: HOOK_END, x: 760, y: 1290, w: 300, rot: -3},
  {n: "hook_d.jpg", t: 0.6, e: HOOK_END, x: 200, y: 1580, w: 290, rot: -2},
  {n: "galaxy.mp4", t: 0.75, e: HOOK_END, x: 640, y: 1540, w: 330, rot: 2, video: true},
  {n: "hook_e.jpg", t: 0.9, e: HOOK_END, x: 360, y: 1770, w: 340, rot: -1},
  // по словам
  {n: "monalisa.jpg", t: 4.66, e: 13.8, x: 770, y: 1140, w: 250, rot: 3},          // «самую известную картину»
  {n: "louvre_a.jpg", t: 8.0, e: 13.8, x: 50, y: 1160, w: 280, rot: -3},           // «в 1911 году»
  {n: "louvre_b.jpg", t: 11.7, e: 13.8, x: 120, y: 1420, w: 330, rot: 2},          // «картин Лувра»
  {n: "monalisa.jpg", t: 14.64, e: 18.9, x: 60, y: 1190, w: 230, rot: -3},         // «её украл»
  {n: "chest.jpg", t: 17.24, e: 18.9, x: 690, y: 1300, w: 340, rot: 3},           // «в сундуке»
  {n: "newspapers.jpg", t: 20.24, e: 23.45, x: 60, y: 1200, w: 300, rot: -4},      // «в газетах»
  {n: "people_monalisa.jpg", t: 24.26, e: 30.2, x: 770, y: 1110, w: 260, rot: 3},  // «картину вернули»
  {n: "monalisa.jpg", t: 34.32, e: 37.1, x: 70, y: 1210, w: 230, rot: -3},         // «первый раз… в 1911»
];

const Pic: React.FC<{p: P; f: number}> = ({p, f}) => {
  const {fps} = useVideoConfig();
  const s = fr(p.t), e = fr(p.e);
  if (f < s || f > e) return null;
  const sp = spring({frame: f - s, fps, config: {damping: 14, stiffness: 220}});
  const out = interpolate(f, [e - 5, e], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const st: React.CSSProperties = {width: "100%", display: "block"};
  return (
    <div style={{position: "absolute", left: p.x, top: p.y, width: p.w, opacity: Math.min(1, sp * 1.5) * out,
      transform: `rotate(${p.rot ?? 0}deg) scale(${0.8 + 0.2 * sp})`, boxShadow: "0 10px 28px rgba(0,0,0,.35)"}}>
      {p.video ? <Loop durationInFrames={47}><OffthreadVideo src={src(p.n)} muted style={st} /></Loop> : <Img src={src(p.n)} style={st} />}
    </div>
  );
};

const HookText: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  const e = fr(HOOK_END);
  if (f > e) return null;
  const lines = ["расширяем", "кругозор", "за 30 секунд"];
  const out = interpolate(f, [e - 5, e], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <div style={{position: "absolute", left: 60, right: 60, top: 1110, textAlign: "center", opacity: out}}>
      {lines.map((ln, i) => {
        const sp = spring({frame: f - i * 4, fps, config: {damping: 12, stiffness: 200}});
        return <div key={i} style={{fontFamily: G, fontWeight: 800, fontSize: 104, lineHeight: 0.98, color: "#6FF0F5", letterSpacing: "-0.02em",
          WebkitTextStroke: "5px #1A2466", paintOrder: "stroke fill", textShadow: "0 6px 22px rgba(0,0,0,.35)",
          opacity: Math.min(1, sp * 1.5), transform: `translateY(${(1 - sp) * 30}px) scale(${0.9 + 0.1 * sp})`}}>{ln}</div>;
      })}
    </div>
  );
};

/* Чашка: ширина 360, центр кофе ≈ (166, 145) от левого верхнего угла, радиус ≈ 105 */
const CUP = {x: 700, y: 290, w: 360, cx: 166, cy: 145};
const CoffeeCaps: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const i = (caps as any[]).findIndex((c) => t >= c.s && t < c.e);
  const cur = i >= 0 ? (caps as any[])[i] : null;
  const ls = cur ? fr(cur.s) : 0;
  const land = cur ? interpolate(f - ls, [0, 4], [0, 1], {extrapolateRight: "clamp", easing: Easing.in(Easing.quad)}) : 1;
  const hit = cur ? interpolate(f - ls, [3, 5, 10], [0, 1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}) : 0;  // удар о кофе
  const ripple = cur ? interpolate(f - ls, [4, 16], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}) : 1;
  const len = cur ? cur.w.length : 1;
  const size = Math.min(44, 200 / (len * 0.56));
  const X = CUP.x + CUP.cx, Y = CUP.y + CUP.cy;
  return (
    <>
      <Img src={src("cup.png")} style={{position: "absolute", left: CUP.x, top: CUP.y, width: CUP.w, filter: "drop-shadow(0 10px 18px rgba(0,0,0,.35))",
        transform: `scale(${1 + 0.025 * hit})`, transformOrigin: `${CUP.cx}px ${CUP.cy}px`}} />
      {cur && ripple < 1 && (
        <div style={{position: "absolute", left: X - 30 - 70 * ripple, top: Y - 22 - 50 * ripple, width: 60 + 140 * ripple, height: 44 + 100 * ripple,
          borderRadius: "50%", border: "2px solid rgba(255,240,220,.7)", opacity: 1 - ripple}} />
      )}
      {cur && (
        <div style={{position: "absolute", left: X - 110, width: 220, top: Y - size * 0.62 - (1 - land) * 150, textAlign: "center", fontFamily: G, fontWeight: 700, fontSize: size,
          color: "#fff", whiteSpace: "nowrap", opacity: Math.min(1, land * 2), transform: `scale(${1.35 - 0.35 * land - 0.06 * hit}) rotate(${(1 - land) * -8}deg)`,
          textShadow: "0 2px 6px rgba(0,0,0,.85), 0 0 14px rgba(0,0,0,.6)"}}>{cur.w}</div>
      )}
    </>
  );
};

export const Coffee: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <OffthreadVideo src={src("vid.mp4")} muted style={{width: 1080, height: 1920}} />
      {PICS.map((p, i) => <Pic key={i} p={p} f={f} />)}
      <HookText f={f} />
      <CoffeeCaps f={f} />
    </AbsoluteFill>
  );
};
