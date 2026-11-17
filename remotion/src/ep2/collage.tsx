import React from "react";
import {Img, staticFile, interpolate, Easing, random} from "remotion";
import {loadFont as loadNeucha} from "@remotion/google-fonts/Neucha";
import {loadFont as loadAmatic} from "@remotion/google-fonts/AmaticSC";
import {loadFont as loadRubikMono} from "@remotion/google-fonts/RubikMonoOne";
import {loadFont as loadPlayfair} from "@remotion/google-fonts/PlayfairDisplay";
import {loadFont as loadOswald} from "@remotion/google-fonts/Oswald";
import {loadFont as loadKurale} from "@remotion/google-fonts/Kurale";
import {C, U, G, L, SP} from "../episode/kit";

/* Коллажный «скрапбук»-стиль 2-го выпуска: вырезки с белой обводкой и бумажной тенью, скотч,
   надписи от руки на рваной бумаге, буквы-вырезки, растровые цифры. Картинки — public/ep2/lib (из «Монтажной»). */

export const HAND = loadNeucha("normal", {weights: ["400"], subsets: ["cyrillic", "latin"]}).fontFamily;
export const AMATIC = loadAmatic("normal", {weights: ["700"], subsets: ["cyrillic", "latin"]}).fontFamily;
export const MONO = loadRubikMono("normal", {weights: ["400"], subsets: ["cyrillic", "latin"]}).fontFamily;
export const PF = loadPlayfair("italic", {weights: ["600", "800"], subsets: ["cyrillic", "latin"]}).fontFamily;
export const OSW = loadOswald("normal", {weights: ["700"], subsets: ["cyrillic", "latin"]}).fontFamily;
export const KUR = loadKurale("normal", {weights: ["400"], subsets: ["cyrillic", "latin"]}).fontFamily;

export const P = {paper: "#F3EEE3", kraft: "#D8C3A0", ink: "#1E1A2E", red: "#E2452F", pink: "#F27BAE", yellow: "#F6C935", blue: "#1F5BFF", tape: "rgba(240,190,210,.8)"};
export const lib = (n: string) => staticFile(`ep2/lib/${n}`);

/** Появление вырезки: «шлёп» с поворотом, лёгкое покачивание, уход вниз. */
export const pop = (f: number, s: number, e: number, seed: string) => {
  if (f < s || f > e) return null;
  const sp = SP(f, s, 10, 210);
  const out = L(f, e - 7, e, 1, 0, Easing.in(Easing.cubic));
  const wob = Math.sin((f - s) / 9 + random(seed) * 6) * 1.6;
  return {o: Math.min(1, (f - s) / 2) * out, sc: interpolate(sp, [0, 1], [1.45, 1]) * (0.9 + 0.1 * out), wob, dy: (1 - out) * 40};
};

export const shadow = "drop-shadow(6px 9px 0 rgba(30,26,46,.22)) drop-shadow(0 2px 6px rgba(0,0,0,.18))";

/** Вырезка из библиотеки. */
export const Cut: React.FC<{f: number; s: number; e: number; src: string; x: number; y: number; w: number; rot?: number; seed?: string; flip?: number; style?: React.CSSProperties}> =
  ({f, s, e, src, x, y, w, rot = 0, seed = src, flip, style}) => {
    const p = pop(f, s, e, seed + s); if (!p) return null;
    const fl = flip !== undefined ? flip : 0;
    return (
      <Img src={lib(src)} style={{position: "absolute", left: x, top: y + p.dy, width: w, opacity: p.o, filter: shadow,
        transform: `translate(-50%,-50%) rotate(${rot + p.wob + fl}deg) scale(${p.sc})`, ...style}} />
    );
  };

/** Полоска скотча. */
export const Tape: React.FC<{x: number; y: number; w?: number; rot?: number; color?: string}> = ({x, y, w = 150, rot = -8, color = P.tape}) => (
  <div style={{position: "absolute", left: x, top: y, width: w, height: w * 0.28, background: color, transform: `translate(-50%,-50%) rotate(${rot}deg)`,
    clipPath: "polygon(3% 0,97% 4%,100% 30%,96% 52%,100% 78%,97% 100%,2% 96%,0 70%,4% 46%,0 22%)", mixBlendMode: "multiply"}} />
);

/** Рваная бумажка с надписью от руки. */
export const Label: React.FC<{f: number; s: number; e: number; text: string; x: number; y: number; size?: number; rot?: number; bg?: string; color?: string; font?: string; tape?: boolean; maxW?: number}> =
  ({f, s, e, text, x, y, size = 56, rot = -3, bg = P.paper, color = P.ink, font = HAND, tape = true, maxW = 760}) => {
    const p = pop(f, s, e, text); if (!p) return null;
    return (
      <div style={{position: "absolute", left: x, top: y + p.dy, opacity: p.o, transform: `translate(-50%,-50%) rotate(${rot + p.wob * 0.4}deg) scale(${p.sc})`, filter: shadow}}>
        <div style={{background: bg, color, fontFamily: font, fontSize: size, lineHeight: 1.12, padding: `${size * 0.22}px ${size * 0.45}px`, maxWidth: maxW, whiteSpace: "pre-line", textAlign: "center",
          clipPath: "polygon(0 4%,8% 0,22% 3%,38% 0,55% 4%,71% 1%,88% 3%,100% 0,98% 30%,100% 62%,97% 100%,80% 96%,63% 100%,44% 96%,27% 100%,10% 97%,0 100%,2% 64%,0 33%)"}}>{text}</div>
        {tape && <Tape x={size * 0.6} y={0} w={size * 2.2} rot={-14} />}
      </div>
    );
  };

/** Буквы-вырезки (как «whimsy»): каждая буква своим шрифтом на своей бумажке. */
const RANSOM_FONTS = () => [MONO, PF, OSW, U, KUR, AMATIC];
const RANSOM_BG = [P.paper, "#fff", P.yellow, P.ink, P.pink, P.kraft, "#EDE6FF"];
export const Ransom: React.FC<{f: number; s: number; e: number; text: string; x: number; y: number; size?: number; stagger?: number; rot?: number}> =
  ({f, s, e, text, x, y, size = 120, stagger = 2, rot = -2}) => {
    if (f < s || f > e) return null;
    const out = L(f, e - 7, e, 1, 0);
    const fonts = RANSOM_FONTS();
    let k = 0;
    return (
      <div style={{position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg)`, display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: size * 0.35, rowGap: size * 0.12, opacity: out, width: "max-content", maxWidth: 1500}}>
        {text.split(" ").map((word, wi) => (
          <div key={wi} style={{display: "flex", gap: size * 0.06, whiteSpace: "nowrap"}}>
            {[...word].map((ch) => {
              const i = k++;
              const r = random(text + i), r2 = random(text + "b" + i);
              const bg = RANSOM_BG[Math.floor(r * RANSOM_BG.length)];
              const dark = bg === P.ink;
              const sp = SP(f, s + i * stagger, 9, 240);
              return (
                <div key={i} style={{fontFamily: fonts[Math.floor(r2 * fonts.length)], fontSize: size * (0.85 + r * 0.3), lineHeight: 1, background: bg, color: dark ? "#fff" : r > 0.7 ? P.red : P.ink,
                  padding: `${size * 0.06}px ${size * 0.1}px`, transform: `rotate(${(r - 0.5) * 14}deg) translateY(${(r2 - 0.5) * size * 0.15}px) scale(${sp})`, filter: shadow, fontStyle: r2 > 0.8 ? "italic" : "normal", textTransform: r > 0.5 ? "uppercase" : "none"}}>{ch}</div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

/** Растровые цифры из библиотеки (вместо печатных). */
const DIG: Record<string, string[]> = {"0": ["08"], "1": ["00", "12"], "2": ["04", "14"], "3": ["01", "10"], "4": ["02"], "5": ["03"], "6": ["05"], "7": ["06"], "8": ["09"], "9": ["07"]};
export const Digits: React.FC<{f: number; s: number; e: number; value: string; x: number; y: number; h?: number; rot?: number}> = ({f, s, e, value, x, y, h = 220, rot = -3}) => {
  if (f < s || f > e) return null;
  const out = L(f, e - 7, e, 1, 0);
  const seen: Record<string, number> = {};
  return (
    <div style={{position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg)`, display: "flex", alignItems: "center", opacity: out}}>
      {[...value].map((ch, i) => {
        const sp = SP(f, s + i * 3, 9, 240);
        const v = DIG[ch];
        if (!v) return <span key={i} style={{fontFamily: MONO, fontSize: h * 0.55, color: P.ink, margin: `0 ${h * 0.04}px`, transform: `scale(${sp})`, display: "inline-block"}}>{ch}</span>;
        const k = v[(seen[ch] = (seen[ch] ?? -1) + 1) % v.length];
        return <Img key={i} src={lib(`digits_${k}.png`)} style={{height: h, marginLeft: i ? -h * 0.12 : 0, transform: `scale(${sp}) rotate(${(random(value + i) - 0.5) * 10}deg)`}} />;
      })}
    </div>
  );
};

/** Песочные часы, которые иногда переворачиваются на 180°. */
export const Hourglass: React.FC<{f: number; s: number; e: number; x: number; y: number; w?: number}> = ({f, s, e, x, y, w = 220}) => {
  const p = pop(f, s, e, "hg"); if (!p) return null;
  const k = (f - s) % 75, flip = Math.floor((f - s) / 75) * 180 + interpolate(k, [55, 72], [0, 180], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic)});
  return <Img src={lib("hourglass.png")} style={{position: "absolute", left: x, top: y + p.dy, width: w, opacity: p.o, filter: shadow, transform: `translate(-50%,-50%) rotate(${flip}deg) scale(${p.sc})`}} />;
};

/** Курсор, который «кликает» по точке. */
export const Clicker: React.FC<{f: number; s: number; e: number; x: number; y: number; w?: number}> = ({f, s, e, x, y, w = 130}) => {
  if (f < s || f > e) return null;
  const move = L(f, s, s + 14, 0, 1, Easing.out(Easing.cubic));
  const press = f >= s + 16 && f < s + 20 ? 0.86 : 1;
  const out = L(f, e - 6, e, 1, 0);
  return <Img src={lib("cursor.png")} style={{position: "absolute", left: x + (1 - move) * 260, top: y + (1 - move) * 180, width: w, opacity: out, filter: shadow, transform: `scale(${press})`, transformOrigin: "20% 10%"}} />;
};

/** Фон-бумага: тетрадная клетка, крафт или рваные страницы. */
export const Paper: React.FC<{kind?: "grid" | "kraft" | "pages" | "stripes"}> = ({kind = "grid"}) => {
  if (kind === "pages") return <Img src={lib("torn_pages.jpg")} style={{position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "saturate(.7) brightness(1.05)"}} />;
  if (kind === "stripes") return <Img src={lib("stripes.jpg")} style={{position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover"}} />;
  const bg = kind === "kraft" ? {backgroundColor: P.kraft, backgroundImage: "radial-gradient(rgba(80,50,20,.12) 1px, transparent 1.4px)", backgroundSize: "7px 7px"} :
    {backgroundColor: "#FBFAF5", backgroundImage: "linear-gradient(rgba(90,120,200,.18) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(90,120,200,.18) 1.5px, transparent 1.5px)", backgroundSize: "44px 44px"};
  return <div style={{position: "absolute", inset: 0, ...bg}} />;
};

/** Рваный край (маска) для «окна» с видео. */
export const TORN = "polygon(0.5% 1.5%,9% 0,21% 1.2%,34% 0.2%,47% 1.4%,61% 0,74% 1.1%,88% 0.3%,99.5% 1.2%,99% 18%,100% 37%,99.2% 56%,100% 77%,99.4% 98.6%,86% 100%,72% 98.8%,58% 100%,43% 98.9%,29% 100%,15% 99%,0.6% 99.6%,0 80%,0.8% 61%,0 40%,0.7% 20%)";
