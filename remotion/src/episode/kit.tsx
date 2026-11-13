import React from "react";
import {Img, staticFile, interpolate, spring, Easing, random} from "remotion";
import {loadFont as loadUnbounded} from "@remotion/google-fonts/Unbounded";
import {loadFont as loadGolos} from "@remotion/google-fonts/GolosText";
import {loadFont as loadCaveat} from "@remotion/google-fonts/Caveat";

export const U = loadUnbounded("normal", {weights: ["500", "700", "800"], subsets: ["cyrillic", "latin"]}).fontFamily;
export const G = loadGolos("normal", {weights: ["400", "500", "700", "800"], subsets: ["cyrillic", "latin"]}).fontFamily;
export const CV = loadCaveat("normal", {weights: ["700"], subsets: ["cyrillic", "latin"]}).fontFamily;

export const C = {
  ink: "#221C46", milk: "#FFFAF2", paper: "#F4F2F7", mandarin: "#FF7A2F", lilac: "#9C7BFF",
  mint: "#4FE0B0", lemon: "#FFE04A", bubble: "#FF8AC5", sky: "#8FD3FF",
  lilac50: "#EFE9FF", mint50: "#DDFBF0", lemon50: "#FFF7CC", sky50: "#E3F4FF", bubble50: "#FFE6F3",
};
export const FPS = 30;
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
export const L = (f: number, a: number, b: number, x: number, y: number, e = Easing.inOut(Easing.cubic)) =>
  interpolate(f, [a, b], [x, y], {...clamp, easing: e});
export const SP = (f: number, s: number, damping = 12, stiffness = 180) =>
  f < s ? 0 : spring({frame: f - s, fps: FPS, config: {damping, stiffness}});
export const fr = (t: number) => Math.round(t * FPS);

export const gridPaper = (line = "rgba(156,123,255,.22)", bg = C.milk, step = 40): React.CSSProperties => ({
  backgroundColor: bg,
  backgroundImage: `linear-gradient(${line} 1.5px, transparent 1.5px), linear-gradient(90deg, ${line} 1.5px, transparent 1.5px)`,
  backgroundSize: `${step}px ${step}px`,
});
export const dotsPaper = (bg = C.paper): React.CSSProperties => ({
  backgroundColor: bg, backgroundImage: "radial-gradient(rgba(34,28,70,.16) 1.6px, transparent 1.8px)", backgroundSize: "26px 26px",
});

export const St: React.FC<{k: string; w: number; style?: React.CSSProperties}> = ({k, w, style}) => (
  <Img src={staticFile(`intro/st/${k}.svg`)} style={{width: w, height: w, display: "block", ...style}} />
);

/** Появление-«шлёп» и исчезновение элемента. s/e — кадры. */
export const Appear: React.FC<{f: number; s: number; e?: number; mode?: "pop" | "slap" | "up" | "left" | "right"; rot?: number; style?: React.CSSProperties; children: React.ReactNode}> =
  ({f, s, e, mode = "pop", rot = 0, style, children}) => {
    if (f < s) return null;
    const sp = SP(f, s, mode === "slap" ? 11 : 13, mode === "slap" ? 220 : 170);
    const out = e !== undefined ? L(f, e - 8, e, 1, 0, Easing.in(Easing.cubic)) : 1;
    if (out <= 0) return null;
    let tr = "";
    if (mode === "pop") tr = `scale(${sp * (0.85 + 0.15 * out)})`;
    if (mode === "slap") tr = `scale(${interpolate(sp, [0, 1], [1.5, 1]) * (0.85 + 0.15 * out)})`;
    if (mode === "up") tr = `translateY(${(1 - sp) * 50 + (1 - out) * 20}px)`;
    if (mode === "left") tr = `translateX(${(1 - sp) * -120}px)`;
    if (mode === "right") tr = `translateX(${(1 - sp) * 120}px)`;
    return <div style={{...style, opacity: Math.min(1, (f - s) / 3) * out, transform: `${tr} rotate(${rot}deg)`}}>{children}</div>;
  };

export const Plate: React.FC<{children: React.ReactNode; bg?: string; color?: string; size?: number; style?: React.CSSProperties}> = ({children, bg = "#fff", color = C.ink, size = 26, style}) => (
  <span style={{display: "inline-block", background: bg, color, fontFamily: G, fontWeight: 700, fontSize: size, padding: "4px 14px", borderRadius: 10, border: `3px solid ${C.ink}`, ...style}}>{children}</span>
);

export const bignumStyle = (size: number): React.CSSProperties => ({
  fontFamily: U, fontWeight: 800, fontSize: size, color: C.lemon, lineHeight: 1, letterSpacing: "-0.02em",
  textShadow: `-${size / 34}px 0 ${C.bubble}, ${size / 34}px 0 ${C.sky}, ${size / 18}px ${size / 15}px 0 ${C.ink}`,
});

export const Card: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{background: C.milk, borderRadius: 26, border: `4px solid ${C.ink}`, boxShadow: `10px 10px 0 ${C.ink}`, padding: "26px 30px", ...style}}>{children}</div>
);

export const Draw: React.FC<{f: number; s: number; dur: number; d: string; w: number; h: number; color: string; sw?: number; style?: React.CSSProperties; dash?: string}> =
  ({f, s, dur, d, w, h, color, sw = 6, style, dash}) => {
    if (f < s) return null;
    const p = L(f, s, s + dur, 0, 1, Easing.out(Easing.quad));
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: "absolute", overflow: "visible", ...style}}>
        <defs><mask id={`m${s}${w}`}><path d={d} fill="none" stroke="#fff" strokeWidth={sw + 4} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} /></mask></defs>
        <path d={d} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} mask={`url(#m${s}${w})`} />
      </svg>
    );
  };

export const Grain: React.FC<{f: number; o?: number}> = ({f, o = 0.1}) => (
  <svg width="1920" height="1080" style={{position: "absolute", inset: 0, opacity: o, mixBlendMode: "overlay", pointerEvents: "none"}}>
    <filter id={`eg${Math.floor(f / 2)}`}><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={Math.floor(f / 2) % 50} /><feColorMatrix type="saturate" values="0" /></filter>
    <rect width="1920" height="1080" filter={`url(#eg${Math.floor(f / 2)})`} />
  </svg>
);

export const jitter = (f: number, key: string, amp = 1.5) => (random(`${key}-${Math.floor(f / 4)}`) - 0.5) * amp * 2;
