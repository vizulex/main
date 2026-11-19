import React from "react";
import {AbsoluteFill, OffthreadVideo, Img, staticFile, useCurrentFrame} from "remotion";
import {G} from "../episode/kit";
import caps from "./caps.json";

/* Рилс «5 нишевых хобби»: без монтажа, только субтитры по одному слову на блокноте справа сверху (как в примере Влады).
   Тонкий шрифт, без анимации. Исходники — public/ep2r/notebook (не в git), звук подкладывается ffmpeg. */
const src = (n: string) => staticFile(`ep2r/notebook/${n}`);
const NB = {x: 735, y: 355, w: 330};       // блокнот 600×481 → высота ≈ 265
const TX = {cx: NB.x + NB.w * 0.47, cy: NB.y + NB.w * (481 / 600) * 0.5};

export const Notebook: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const cur = (caps as any[]).find((c) => t >= c.s && t < c.e);
  const size = cur ? Math.min(40, 240 / (cur.w.length * 0.58)) : 40;
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <OffthreadVideo src={src("vid.mp4")} muted style={{width: 1080, height: 1920}} />
      <Img src={src("notebook.png")} style={{position: "absolute", left: NB.x, top: NB.y, width: NB.w, filter: "drop-shadow(0 8px 14px rgba(0,0,0,.3))"}} />
      {cur && <div style={{position: "absolute", left: TX.cx - 150, width: 300, top: TX.cy - size * 0.62, textAlign: "center", whiteSpace: "nowrap",
        fontFamily: G, fontWeight: 400, fontSize: size, color: "#161616"}}>{cur.w}</div>}
    </AbsoluteFill>
  );
};
