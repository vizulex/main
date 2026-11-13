import React from "react";
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame, Easing} from "remotion";
import {Intro} from "../intro/Intro";
import {C, L, fr, gridPaper, Grain} from "./kit";
import {Overlay} from "./Overlays";
import {FullScene, SplitPanel, FULL, SPLIT} from "./Scenes";
import ep1 from "./data/ep1.json";

/* Эпизод подкаста: смонтированная запись (aroll.mp4) + интро + графика по таймлайну из data/*.json.
   Звук сводится отдельно (mix_episode.py) и подкладывается после рендера. */

type Data = typeof ep1;
export type EpisodeProps = {data?: Data; aroll: string; photo: string; episode: number};

const zoomAt = (t: number, zoom: number[][]) => {
  let z = 1;
  for (const [s, v] of zoom) { if (s <= t) z = v; else break; }
  return z;
};

export const Episode: React.FC<EpisodeProps> = ({data = ep1, aroll, photo, episode}) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const introF = fr(data.intro_out), introLen = fr(data.intro_len);
  const gfx = data.graphics as any[];
  const active = gfx.filter((g) => t >= g.s - 0.5 && t <= g.e + 0.5);
  const full = active.find((g) => FULL.has(g.kind) && t >= g.s && t < g.e);
  const split = active.find((g) => SPLIT.has(g.kind));
  // раздельный экран: прогресс входа/выхода
  let sp = 0;
  if (split) sp = Math.min(L(f, fr(split.s), fr(split.s) + 14, 0, 1), L(f, fr(split.e) - 14, fr(split.e), 1, 0));
  const z = zoomAt(t, data.zoom as number[][]);
  const zoom = sp > 0 ? 1 : z;
  // прямоугольник видео: полный кадр → карточка слева
  const rect = {x: L(sp, 0, 1, 0, 80, Easing.linear), y: L(sp, 0, 1, 0, 90, Easing.linear), w: L(sp, 0, 1, 1920, 840, Easing.linear), h: L(sp, 0, 1, 1080, 900, Easing.linear)};

  const video = (
    <div style={{position: "absolute", left: rect.x, top: rect.y, width: rect.w, height: rect.h, overflow: "hidden",
      borderRadius: sp * 34, border: sp > 0 ? `${sp * 6}px solid ${C.ink}` : "none", boxShadow: sp > 0 ? `${sp * 12}px ${sp * 12}px 0 ${C.ink}` : "none", transform: `rotate(${-1.5 * sp}deg)`}}>
      <div style={{position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) translateX(${sp * 70}px) scale(${zoom * (1 + sp * 0.12)})`, transformOrigin: "46% 38%"}}>
        <Sequence durationInFrames={introF} layout="none">
          <OffthreadVideo src={staticFile(aroll)} muted style={{width: 1920, height: 1080}} />
        </Sequence>
        <Sequence from={introF + introLen} layout="none">
          <OffthreadVideo src={staticFile(aroll)} startFrom={introF} muted style={{width: 1920, height: 1080}} />
        </Sequence>
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{background: C.ink}}>
      {sp > 0 && <AbsoluteFill style={{...gridPaper(), opacity: sp}} />}
      {video}
      {split && <SplitPanel f={f} g={split} />}
      {active.filter((g) => !FULL.has(g.kind) && !SPLIT.has(g.kind)).map((g, i) => <Overlay key={g.kind + g.s} f={f} g={g} />)}
      {full && <FullScene f={f} g={full} photo={photo} />}
      {sp > 0 && <Grain f={f} o={0.08 * sp} />}
      <Sequence from={introF} durationInFrames={introLen}>
        <Intro episode={episode} photo={photo} />
      </Sequence>
    </AbsoluteFill>
  );
};
