import React from "react";
import {AbsoluteFill, Img, staticFile} from "remotion";
import {P, Paper, Ransom, Tape, PF, shadow} from "../ep2/collage";
import {U} from "../episode/kit";

/* Баннер YouTube 2560×1440. Безопасная зона (видна везде): 1546×423 по центру → x 507–2053, y 508–931.
   Полоса, видная на компьютере: вся ширина, y 508–931. Слева — «брейнрот», справа — «анти». */
const BIG = 999;
const img = (n: string) => staticFile(`ep2r/img/${n}`);
const deco = (n: string) => staticFile(`ep2r/deco/${n}.png`);

const Pol: React.FC<{src: string; x: number; y: number; w: number; h: number; rot: number; tape?: number}> = ({src, x, y, w, h, rot, tape}) => (
  <div style={{position: "absolute", left: x, top: y, width: w, transform: `translate(-50%,-50%) rotate(${rot}deg)`}}>
    <div style={{background: "#fff", padding: "10px 10px 34px", boxShadow: "0 10px 26px rgba(30,26,46,.22)"}}>
      <Img src={img(src)} style={{width: w - 20, height: h, objectFit: "cover", display: "block"}} />
    </div>
    {tape !== undefined && <Tape x={w / 2} y={4} w={110} rot={tape} />}
  </div>
);
const D: React.FC<{n: string; x: number; y: number; w: number; rot?: number}> = ({n, x, y, w, rot = 0}) => (
  <Img src={deco(n)} style={{position: "absolute", left: x, top: y, width: w, transform: `translate(-50%,-50%) rotate(${rot}deg)`, filter: shadow}} />
);

export const Banner: React.FC<{guides?: boolean}> = ({guides}) => (
  <AbsoluteFill style={{background: "#FBFAF5"}}>
    <Paper kind="grid" />

    {/* левая сторона: брейнрот (всё в полосе y 508–931, левее безопасной зоны) */}
    <Pol src="7114.jpg" x={275} y={640} w={240} h={165} rot={-6} tape={-10} />
    <Pol src="7112.jpg" x={135} y={815} w={165} h={150} rot={-4} />
    <Pol src="dopamine_eye.jpg" x={385} y={812} w={185} h={145} rot={5} />
    <D n="d_eye_bolt" x={455} y={585} w={90} rot={8} />
    <D n="d_star_black" x={95} y={590} w={78} rot={-14} />

    {/* правая сторона: анти */}
    <Pol src="hook_books.jpg" x={2295} y={645} w={240} h={170} rot={6} tape={8} />
    <Pol src="hook_light.jpg" x={2175} y={825} w={200} h={140} rot={-5} />
    <Pol src="hook_galaxy.jpg" x={2430} y={820} w={165} h={150} rot={4} />
    <D n="d_star_yellow" x={2110} y={590} w={88} rot={12} />
    <D n="d_coffee" x={2475} y={560} w={86} rot={-8} />

    {/* центр: надпись */}
    <Ransom f={BIG} s={0} e={BIG * 10} text="БРЕЙНРОТ" x={1280} y={705} size={165} stagger={0} rot={-1} />
    <div style={{position: "absolute", left: 790, top: 585, transform: "translate(-50%,-50%) rotate(-7deg)", fontFamily: PF, fontStyle: "italic", fontWeight: 800,
      fontSize: 70, color: P.ink, background: P.yellow, padding: "0 28px 10px", boxShadow: "0 6px 0 rgba(30,26,46,.18)"}}>анти</div>
    <div style={{position: "absolute", left: 1290, top: 862, transform: "translate(-50%,-50%) rotate(1.5deg)", fontFamily: U, fontWeight: 800, fontSize: 74,
      letterSpacing: "0.04em", color: "#fff", background: P.ink, padding: "8px 36px 12px", textTransform: "uppercase"}}>подкаст</div>
    <Tape x={1290} y={818} w={120} rot={-4} />
    <D n="d_lips" x={1880} y={790} w={86} rot={10} />
    <D n="d_star_pinkblue" x={1640} y={880} w={62} rot={-12} />

    {guides && (
      <>
        <div style={{position: "absolute", left: 0, right: 0, top: 508, height: 423, border: "4px dashed rgba(30,90,255,.6)"}} />
        <div style={{position: "absolute", left: 507, width: 1546, top: 508, height: 423, border: "4px solid rgba(226,69,47,.8)"}} />
      </>
    )}
  </AbsoluteFill>
);
