import React from "react";
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame, Easing} from "remotion";
import {Intro} from "../intro/Intro";
import {L, fr} from "../episode/kit";
import {P, Paper, TORN, shadow, Tape} from "./collage";
import {Scene, FULLSCREEN} from "./scenes2";
import ep2 from "./data/ep2.json";

/* Эпизод 2 «Инструкция к мозгу: дофамин». Коллажный стиль из «Монтажной».
   Раскладки кадра с Владой: full — весь кадр; window — рваное «окно» на бумаге (как звонок);
   circle — лицо в кружке; side — окно сбоку, коллаж с другой стороны. */

type G = {kind: string; s: number; e: number; lay?: string; side?: string; bg?: string; [k: string]: any};
type Box = {x: number; y: number; w: number; h: number; r: number; rot: number; z: number; ox: number; oy: number};
const FULLB: Box = {x: 0, y: 0, w: 1920, h: 1080, r: 0, rot: 0, z: 1, ox: 0, oy: 0};
const LAYS: Record<string, Box> = {
  window: {x: 380, y: 150, w: 1160, h: 690, r: 0, rot: -1.2, z: 1.05, ox: 0, oy: 20},
  "side-left": {x: 90, y: 170, w: 860, h: 740, r: 0, rot: -2, z: 1.18, ox: 0, oy: 30},
  "side-right": {x: 970, y: 170, w: 860, h: 740, r: 0, rot: 2, z: 1.18, ox: 0, oy: 30},
  circle: {x: 1380, y: 600, w: 400, h: 400, r: 200, rot: 0, z: 1.9, ox: 0, oy: -80},
  "circle-left": {x: 140, y: 600, w: 400, h: 400, r: 200, rot: 0, z: 1.9, ox: 0, oy: -80},
  hidden: {x: 760, y: 1200, w: 400, h: 400, r: 200, rot: 0, z: 1.5, ox: 0, oy: 0},
  "half-right": {x: 960, y: 0, w: 960, h: 1080, r: 0, rot: 0, z: 1.0, ox: 0, oy: 0},
  "half-left": {x: 0, y: 0, w: 960, h: 1080, r: 0, rot: 0, z: 1.0, ox: 0, oy: 0},
  "bottom-rect": {x: 700, y: 700, w: 520, h: 340, r: 14, rot: 0, z: 1.25, ox: 0, oy: 10},
  "square-right": {x: 1080, y: 150, w: 740, h: 740, r: 14, rot: 2, z: 1.35, ox: 0, oy: 20},
  "polaroid-right": {x: 860, y: 100, w: 980, h: 760, r: 6, rot: 2, z: 1.15, ox: 0, oy: 20},
  "square-tall": {x: 1030, y: 80, w: 830, h: 920, r: 14, rot: 1.5, z: 1.3, ox: 0, oy: 0},
  "circle-big": {x: 1250, y: 400, w: 600, h: 600, r: 300, rot: 0, z: 1.75, ox: 0, oy: -60},
};
const PLAIN = new Set(["half-right", "half-left"]);
const FRAMED = new Set(["bottom-rect", "square-right", "polaroid-right", "square-tall"]);
const mix = (a: Box, b: Box, p: number): Box => {
  const m = (k: keyof Box) => a[k] + (b[k] - a[k]) * p;
  return {x: m("x"), y: m("y"), w: m("w"), h: m("h"), r: m("r"), rot: m("rot"), z: m("z"), ox: m("ox"), oy: m("oy")};
};
const zoomAt = (t: number, zoom: number[][]) => { let z = 1; for (const [s, v] of zoom) { if (s <= t) z = v; else break; } return z; };
const FACE = {x: 975, y: 560}; // лицо в кадре (1920×1080)

export const Ep2: React.FC<{photo: string; aroll?: string}> = ({photo, aroll = "ep2/aroll.mp4"}) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const D = ep2 as any;
  const introF = fr(D.intro_out), introLen = fr(D.intro_len);
  const gfx = D.graphics as G[];
  const active = gfx.filter((g) => t >= g.s - 0.6 && t <= g.e + 0.6);
  // раскладка кадра: берём графику с lay, плавный вход/выход 12 кадров
  const lg = active.find((g) => g.lay && t >= g.s && t < g.e);
  let p = 0, target = FULLB, paper = "grid";
  if (lg) {
    p = Math.min(L(f, fr(lg.s), fr(lg.s) + 12, 0, 1), L(f, fr(lg.e) - 12, fr(lg.e), 1, 0));
    target = LAYS[lg.lay!] ?? FULLB; paper = lg.bg ?? "grid";
  }
  p = Easing.inOut(Easing.cubic)(p);
  const zFull = zoomAt(t, D.zoom);
  const box = mix({...FULLB, z: zFull}, target, p);
  const S = box.z * Math.max(box.w / 1920, box.h / 1080);
  const isCircle = target.r > 100;
  const lname = lg?.lay ?? "";
  const plain = PLAIN.has(lname), framed = FRAMED.has(lname), torn = p > 0.02 && !isCircle && !plain && !framed;
  // точка, вокруг которой кадрируем: центр кадра на полном экране (с подтяжкой к лицу при зуме) → лицо в окне/кружке
  const k = Math.min(1, (zFull - 1) * 3) * (1 - p) + p;
  const cx = 960 + (FACE.x - 960) * k, cy = 540 + (FACE.y - 540) * k;
  const video = (
    <div style={{position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, overflow: "hidden", transform: `rotate(${box.rot}deg)`,
      borderRadius: box.r, clipPath: torn ? TORN : undefined, filter: p > 0.02 && !plain ? shadow : undefined,
      outline: (isCircle || framed) && p > 0.02 ? `${(lname === "polaroid-right" ? 20 : 10) * p}px solid #fff` : undefined}}>
      <div style={{position: "absolute", left: box.w / 2 - cx * S + box.ox * p, top: box.h / 2 - cy * S + box.oy * p,
        width: 1920, height: 1080, transform: `scale(${S})`, transformOrigin: "0 0"}}>
        <Sequence durationInFrames={introF} layout="none">
          <OffthreadVideo src={staticFile(aroll)} muted style={{width: 1920, height: 1080}} />
        </Sequence>
        <Sequence from={introF + introLen} layout="none">
          <OffthreadVideo src={staticFile(aroll)} startFrom={introF} muted style={{width: 1920, height: 1080}} />
        </Sequence>
      </div>
    </div>
  );
  const fullScene = active.find((g) => FULLSCREEN.has(g.kind) && t >= g.s && t < g.e);
  return (
    <AbsoluteFill style={{background: P.ink}}>
      {p > 0 && <AbsoluteFill style={{opacity: p}}><Paper kind={paper as any} /></AbsoluteFill>}
      {video}
      {p > 0.5 && torn && <><Tape x={box.x + 40} y={box.y + 10} rot={-28} w={190} /><Tape x={box.x + box.w - 40} y={box.y + box.h - 6} rot={-24} w={190} /></>}
      {active.filter((g) => !FULLSCREEN.has(g.kind)).map((g, i) => <Scene key={g.kind + g.s + i} f={f} g={g} />)}
      {fullScene && <Scene f={f} g={fullScene} />}
      <Sequence from={introF} durationInFrames={introLen}>
        <Intro episode={2} photo={photo} />
      </Sequence>
    </AbsoluteFill>
  );
};
