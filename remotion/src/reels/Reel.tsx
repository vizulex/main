import React from "react";
import {AbsoluteFill, OffthreadVideo, Sequence, Freeze, staticFile, useCurrentFrame, Easing, interpolate} from "remotion";
import {C, U, G, CV, L, SP, fr, St, Appear, gridPaper, Grain, bignumStyle, jitter} from "../episode/kit";
import reels from "./data/reels.json";

/* Вертикальный рилс 1080×1920 из смонтированного эпизода (aroll.mp4) + графика по data/reels.json.
   Звук сводится отдельно: mix_reels.py. */

type R = (typeof reels)[number];
type Gx = {kind: string; s: number; e: number; [k: string]: any};
const INTRO_LEN = 15;            // в aroll нет 15 с интро, а в таймлайне голоса есть
const FACE = {x: 960, y: 560};   // лицо в кадре aroll (1920×1080)
const ANCHOR = {x: 540, y: 860}; // куда ставим лицо в вертикали
const FULL = new Set(["planreal", "dablin", "tradeoff", "attn", "hellyes", "checklist", "loops", "plan"]);
const fit = (txt: string, max: number, width = 960, k = 0.82) => Math.min(max, width / (Math.max(...txt.split("\n").map((l) => l.length)) * k));
const col = (k?: string) => (k ? (C as any)[k] ?? k : C.lemon);

const stroke = (w: number): React.CSSProperties => ({WebkitTextStroke: `${w}px ${C.ink}`, paintOrder: "stroke fill"});
const shake = (f: number, s: number, amp = 14, len = 10) => {
  if (f < s || f > s + len) return {x: 0, y: 0};
  const k = 1 - (f - s) / len;
  return {x: Math.sin((f - s) * 2.7) * amp * k, y: Math.cos((f - s) * 3.3) * amp * 0.7 * k};
};

/* ---------- видео ---------- */
const zoomAt = (r: R, t: number, f: number) => {
  let z = 1.22, zs = 0, ze = r.dur;
  r.zoom.forEach(([s, v], i) => { if (s <= t) { z = v; zs = s; ze = r.zoom[i + 1]?.[0] ?? r.dur; } });
  z += 0.035 * Math.min(1, (t - zs) / Math.max(1, ze - zs));       // медленный наезд внутри куска
  for (const p of r.punch) if (t >= p - 0.05 && t < p + 2.2) z += 0.1 * L(f, fr(p) - 2, fr(p) + 3, 0, 1, Easing.out(Easing.back(2)));
  if (t < r.hook_end) z += 0.06 * L(f, 0, fr(r.hook_end), 0, 1);
  return z;
};

const Video: React.FC<{r: R; f: number}> = ({r, f}) => {
  const t = f / 30;
  const S = (1920 / 1080) * zoomAt(r, t, f);
  const sh = shake(f, 6, 18, 12);
  return (
    <div style={{position: "absolute", left: ANCHOR.x - FACE.x * S + sh.x, top: ANCHOR.y - FACE.y * S + sh.y, width: 1920, height: 1080, transform: `scale(${S})`, transformOrigin: "0 0", filter: "contrast(1.06) saturate(1.12) brightness(1.03)"}}>
      <Sequence durationInFrames={fr(r.segs[0].at)} layout="none">
        <Freeze frame={0}><OffthreadVideo src={staticFile("ep1/aroll.mp4")} startFrom={fr(r.segs[0].s - INTRO_LEN)} muted style={{width: 1920, height: 1080}} /></Freeze>
      </Sequence>
      {r.segs.map((sg, i) => (
        <Sequence key={i} from={fr(sg.at)} durationInFrames={Math.max(1, fr(sg.e - sg.s))} layout="none">
          <OffthreadVideo src={staticFile("ep1/aroll.mp4")} startFrom={fr(sg.s - INTRO_LEN)} muted style={{width: 1920, height: 1080}} />
        </Sequence>
      ))}
    </div>
  );
};

/* ---------- хук и заголовок ---------- */
const Hook: React.FC<{r: R; f: number}> = ({r, f}) => {
  const he = fr(r.hook_end);
  if (f > he + 2) return null;
  const out = L(f, he - 7, he, 0, 1, Easing.in(Easing.cubic));
  const big = SP(f, 2, 10, 230);
  const sh = shake(f, 6, 16, 12);
  return (
    <AbsoluteFill style={{opacity: 1 - out}}>
      <AbsoluteFill style={{background: `rgba(29,24,56,${0.62 * (1 - out)})`}} />
      <div style={{position: "absolute", top: 470, width: "100%", display: "flex", justifyContent: "center", transform: `translate(${sh.x}px, ${sh.y}px) scale(${1 + out * 0.35})`}}>
        <div style={{background: C.milk, border: `5px solid ${C.ink}`, borderRadius: 18, padding: "12px 26px", maxWidth: 900, transform: `rotate(-2deg) scale(${interpolate(SP(f, -6), [0, 1], [0.8, 1])})`,
          fontFamily: G, fontWeight: 800, fontSize: 46, lineHeight: 1.15, color: C.ink, textAlign: "center", boxShadow: `8px 8px 0 ${C.ink}`}}>{r.hook.small}</div>
      </div>
      <div style={{position: "absolute", top: 650, width: "100%", textAlign: "center", transform: `translate(${sh.x * 1.4}px, ${sh.y}px) scale(${interpolate(big, [0, 1], [2.4, 1]) * (1 + out * 0.5)}) rotate(${-3 + jitter(f, "hk", 0.6)}deg)`, opacity: f < 2 ? 0 : 1}}>
        {r.hook.big.split("\n").map((ln, i) => (
          <div key={i} style={{...bignumStyle(fit(r.hook.big, 200, 980, 0.84)), ...stroke(14), whiteSpace: "nowrap"}}>{ln}</div>
        ))}
      </div>
      <Appear f={f} s={10} mode="slap" rot={14} style={{position: "absolute", right: 60, top: 300}}><St k={r.hook.st} w={190} /></Appear>
    </AbsoluteFill>
  );
};

const Title: React.FC<{r: R; f: number}> = ({r, f}) => {
  const s = fr(r.hook_end) - 2;
  if (f < s) return null;
  const p = SP(f, s, 11, 200);
  const left = r.timer;
  return (
    <div style={{position: "absolute", top: 150, left: left ? 50 : 0, width: left ? 760 : 1080, display: "flex", justifyContent: left ? "flex-start" : "center",
      transform: `translateY(${(1 - p) * -260}px) rotate(${-2 + jitter(f, "tt", 0.35)}deg)`}}>
      <div style={{background: C.lemon, border: `6px solid ${C.ink}`, borderRadius: 22, padding: "14px 30px", boxShadow: `9px 9px 0 ${C.ink}`,
        fontFamily: U, fontWeight: 800, fontSize: 50, lineHeight: 1.12, color: C.ink, textAlign: left ? "left" : "center", whiteSpace: "pre-line"}}>{r.title}</div>
    </div>
  );
};

const Timer: React.FC<{r: R; f: number}> = ({r, f}) => {
  if (!r.timer) return null;
  const t = f / 30 / r.speed, sec = Math.min(47, Math.floor(t)), p = Math.min(1, t / 47);  // после ускорения — реальные секунды
  const pulse = 1 + 0.08 * Math.max(0, 1 - (t % 1) * 6);
  const R0 = 70, circ = 2 * Math.PI * R0;
  return (
    <div style={{position: "absolute", right: 46, top: 140, width: 190, height: 190, transform: `scale(${pulse})`}}>
      <svg width={190} height={190} style={{position: "absolute"}}>
        <circle cx={95} cy={95} r={86} fill={C.ink} />
        <circle cx={95} cy={95} r={R0} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={16} />
        <circle cx={95} cy={95} r={R0} fill="none" stroke={sec >= 40 ? C.mandarin : C.mint} strokeWidth={16} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - p)} transform="rotate(-90 95 95)" />
      </svg>
      <div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: U, fontWeight: 800, fontSize: 64, color: "#fff"}}>{sec}</div>
      <div style={{position: "absolute", bottom: -34, width: "100%", textAlign: "center", fontFamily: G, fontWeight: 800, fontSize: 26, color: "#fff", ...stroke(6)}}>сек</div>
    </div>
  );
};

/* ---------- субтитры ---------- */
const Captions: React.FC<{r: R; f: number}> = ({r, f}) => {
  const t = f / 30;
  if (t < r.hook_end) return null;
  const c = r.caps.find((x) => t >= x.s - 0.03 && t < x.e);
  if (!c) return null;
  const p = SP(f, fr(c.s) - 1, 12, 260);
  return (
    <div style={{position: "absolute", top: 1215, left: 60, right: 60, display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 30, rowGap: 0,
      transform: `scale(${interpolate(p, [0, 1], [0.7, 1])}) rotate(${jitter(f, "cp" + c.s, 0.25)}deg)`}}>
      {c.w.map((w, i) => {
        const on = t >= w.s - 0.02;
        const cur = on && (i === c.w.length - 1 || t < c.w[i + 1].s);
        return (
          <span key={i} style={{fontFamily: U, fontWeight: 800, fontSize: 74, lineHeight: 1.2, color: cur ? C.lemon : "#fff", opacity: on ? 1 : 0.78,
            display: "inline-block", transform: `scale(${cur ? 1.08 : 1})`, ...stroke(13), textShadow: `0 7px 0 ${C.ink}`}}>{w.w}</span>
        );
      })}
    </div>
  );
};

/* ---------- оверлеи в верхней зоне ---------- */
const TOP = 400;

const Pill: React.FC<{bg?: string; color?: string; size?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({bg = "#fff", color = C.ink, size = 50, children, style}) => (
  <div style={{display: "inline-block", background: bg, color, fontFamily: U, fontWeight: 800, fontSize: size, padding: "10px 26px", borderRadius: 18, border: `6px solid ${C.ink}`, boxShadow: `7px 7px 0 ${C.ink}`, whiteSpace: "pre-line", textAlign: "center", lineHeight: 1.1, ...style}}>{children}</div>
);

const countUp = (f: number, s: number, txt: string) => {
  const m = txt.match(/^([^\d]*)(\d+)(.*)$/);
  if (!m) return txt;
  return m[1] + Math.round(parseInt(m[2]) * L(f, s, s + 12, 0, 1, Easing.out(Easing.cubic))) + m[3];
};

const Overlay: React.FC<{g: Gx; f: number}> = ({g, f}) => {
  const s = fr(g.s), e = fr(g.e);
  switch (g.kind) {
    case "chips": return (
      <div style={{position: "absolute", top: TOP + 10, left: 40, right: 40, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 22}}>
        {g.items.map((it: any, i: number) => (
          <Appear key={i} f={f} s={fr(it.t)} e={e} mode="slap" rot={[-5, 4, -3][i % 3]}><Pill bg={col(it.bg)}>{it.text}</Pill></Appear>
        ))}
      </div>
    );
    case "kinetic": return (
      <div style={{position: "absolute", top: TOP - 10, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 14}}>
        {g.lines.map((ln: any, i: number) => {
          const st = ln.strikeAt ? L(f, fr(ln.strikeAt), fr(ln.strikeAt) + 6, 0, 1) : 0;
          return (
            <Appear key={i} f={f} s={fr(ln.t)} e={e} mode={ln.big ? "slap" : "up"} rot={i % 2 ? 2 : -3}>
              {ln.big
                ? <div style={{position: "relative", fontFamily: U, fontWeight: 800, fontSize: fit(ln.text, 96, 980, 0.8), color: col(ln.color), ...stroke(14), textShadow: `0 9px 0 ${C.ink}`, whiteSpace: "nowrap"}}>
                    {ln.text}
                    {st > 0 && <div style={{position: "absolute", left: -10, top: "52%", height: 16, width: `${st * 104}%`, background: C.mandarin, borderRadius: 8, border: `4px solid ${C.ink}`}} />}
                  </div>
                : <Pill bg={C.ink} color="#fff" size={44}>{ln.text}</Pill>}
            </Appear>
          );
        })}
      </div>
    );
    case "bignum": {
      const a = fr(g.at), sh = shake(f, a, 16, 10);
      return (
        <Appear f={f} s={s} e={e} mode="pop" style={{position: "absolute", top: TOP - 40, width: "100%", textAlign: "center"}}>
          <div style={{transform: `translate(${sh.x}px, ${sh.y}px) rotate(-3deg)`}}>
            <div style={{...bignumStyle(220), ...stroke(16)}}>{f < a ? "0%" : countUp(f, a, g.value)}</div>
            <Appear f={f} s={a + 6} mode="up"><Pill bg={C.ink} color="#fff" size={46} style={{marginTop: 6}}>{g.label}</Pill></Appear>
          </div>
        </Appear>
      );
    }
    case "stamp": {
      const p = SP(f, s, 10, 260), sh = shake(f, s + 3, 20, 12);
      if (f < s || f > e) return null;
      const out = L(f, e - 6, e, 1, 0);
      return (
        <div style={{position: "absolute", top: TOP - 20, width: "100%", display: "flex", justifyContent: "center", opacity: Math.min(1, (f - s) / 2) * out}}>
          <div style={{position: "relative", transform: `translate(${sh.x}px, ${sh.y}px) scale(${interpolate(p, [0, 1], [2.6, 1])}) rotate(-8deg)`}}>
            <div style={{border: `12px solid ${col(g.color)}`, outline: `5px solid ${C.ink}`, borderRadius: 26, padding: "14px 40px", background: "rgba(255,250,242,.94)",
              fontFamily: U, fontWeight: 800, fontSize: 92, lineHeight: 1.04, color: C.ink, textAlign: "center", whiteSpace: "pre-line", textTransform: "uppercase"}}>{g.text}</div>
            {g.st && <Appear f={f} s={s + 6} mode="slap" rot={16} style={{position: "absolute", right: -70, top: -80}}><St k={g.st} w={160} /></Appear>}
          </div>
        </div>
      );
    }
    case "sticker": return <Appear f={f} s={s} e={e} mode="slap" rot={g.rot} style={{position: "absolute", left: g.x, top: g.y}}><St k={g.k} w={g.w} /></Appear>;
    case "list": {
      const k = fr(g.strike);
      return (
        <div style={{position: "absolute", top: TOP - 10, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 18}}>
          {g.items.map((it: any, i: number) => (
            <Appear key={i} f={f} s={fr(it.t)} e={e} mode="left" rot={i ? 2 : -2}>
              <div style={{position: "relative"}}>
                <Pill bg={i ? C.sky : C.mint} size={56}>{it.text}</Pill>
                <div style={{position: "absolute", left: -14, top: "46%", height: 14, width: `${L(f, k + i * 3, k + i * 3 + 6, 0, 112)}%`, background: C.mandarin, borderRadius: 7, border: `4px solid ${C.ink}`}} />
              </div>
            </Appear>
          ))}
          <Appear f={f} s={k + 6} e={e} mode="slap" rot={-9}><Pill bg={C.mandarin} color="#fff" size={54}>неправда</Pill></Appear>
        </div>
      );
    }
    case "quote": {
      const ta = fr(g.ta), tb = fr(g.tb);
      return (
        <div style={{position: "absolute", top: TOP - 20, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 20}}>
          <Appear f={f} s={ta} e={e} mode="slap" rot={-3}>
            <div style={{position: "relative"}}>
              <Pill bg="#fff" size={58}>{g.a}</Pill>
              <div style={{position: "absolute", left: -12, top: "46%", height: 14, width: `${L(f, tb - 4, tb + 3, 0, 110)}%`, background: C.mandarin, borderRadius: 7, border: `4px solid ${C.ink}`}} />
            </div>
          </Appear>
          <Appear f={f} s={tb} e={e} mode="slap" rot={2}>
            <div style={{fontFamily: U, fontWeight: 800, fontSize: 68, lineHeight: 1.12, textAlign: "center", color: C.lemon, ...stroke(13), textShadow: `0 8px 0 ${C.ink}`, whiteSpace: "pre-line"}}>{g.b}</div>
          </Appear>
        </div>
      );
    }
    case "pingpong": {
      if (f < s || f > e) return null;
      const x = 0.5 + 0.5 * Math.sin((f - s) * 0.42);
      const hit = Math.abs(Math.cos((f - s) * 0.42)) > 0.96;
      return (
        <Appear f={f} s={s} e={e} mode="pop" style={{position: "absolute", top: TOP + 20, left: 0, width: 1080, height: 200}}>
          <div style={{position: "absolute", left: 50, top: 30}}><Pill bg={C.mint} size={44} style={{transform: `rotate(-5deg) scale(${x < 0.1 ? 1.1 : 1})`}}>задача 1</Pill></div>
          <div style={{position: "absolute", right: 50, top: 30}}><Pill bg={C.bubble} size={44} style={{transform: `rotate(5deg) scale(${x > 0.9 ? 1.1 : 1})`}}>задача 2</Pill></div>
          <div style={{position: "absolute", left: 330 + x * 360, top: 40 - Math.abs(Math.sin((f - s) * 0.42)) * 0 , width: 60, height: 60, borderRadius: 30, background: C.lemon, border: `6px solid ${C.ink}`, transform: `scale(${hit ? 1.25 : 1})`}} />
        </Appear>
      );
    }
    default: return null;
  }
};

/* ---------- полноэкранные сцены ---------- */
const Scene: React.FC<{g: Gx; f: number}> = ({g, f}) => {
  const s = fr(g.s), e = fr(g.e);
  if (f < s - 1 || f > e) return null;
  const pin = L(f, s, s + 8, 1, 0, Easing.out(Easing.cubic));
  const pout = L(f, e - 7, e, 0, 1, Easing.in(Easing.cubic));
  const tx = pin * 1150 - pout * 1150, rot = pin * 8 - pout * 6;
  return (
    <AbsoluteFill style={{transform: `translateX(${tx}px) rotate(${rot}deg)`, ...gridPaper("rgba(156,123,255,.25)", C.milk, 54)}}>
      <div style={{position: "absolute", left: 0, right: 0, top: 380, height: 760}}>
        <SceneBody g={g} f={f} s={s} e={e} />
      </div>
    </AbsoluteFill>
  );
};

const Label: React.FC<{children: React.ReactNode; bg?: string; size?: number; rot?: number}> = ({children, bg = C.ink, size = 40, rot = -3}) => (
  <div style={{display: "inline-block", background: bg, color: bg === C.ink ? "#fff" : C.ink, fontFamily: G, fontWeight: 800, fontSize: size, padding: "6px 20px", borderRadius: 12, transform: `rotate(${rot}deg)`, border: `4px solid ${C.ink}`}}>{children}</div>
);

const Bubble: React.FC<{children: React.ReactNode; bg?: string; size?: number}> = ({children, bg = "#fff", size = 60}) => (
  <div style={{position: "relative", background: bg, border: `6px solid ${C.ink}`, borderRadius: 30, padding: "16px 30px", fontFamily: U, fontWeight: 800, fontSize: size, color: C.ink, boxShadow: `8px 8px 0 ${C.ink}`, whiteSpace: "nowrap"}}>{children}</div>
);

const SceneBody: React.FC<{g: Gx; f: number; s: number; e: number}> = ({g, f, s, e}) => {
  switch (g.kind) {
    case "planreal": {
      const tp = fr(g.tp), tr = fr(g.tr), u = 15;
      const wp = L(f, tp, tp + 12, 0, g.plan * u, Easing.out(Easing.cubic));
      const wr = L(f, tr, tr + 16, 0, g.real * u, Easing.out(Easing.back(1.4)));
      const sh = shake(f, tr + 14, 14, 10);
      return (
        <div style={{padding: "40px 70px", transform: `translate(${sh.x}px, ${sh.y}px)`}}>
          <Label>план</Label>
          <div style={{display: "flex", alignItems: "center", gap: 20, margin: "16px 0 56px"}}>
            <div style={{height: 110, width: wp, background: C.mint, border: `6px solid ${C.ink}`, borderRadius: 18}} />
            {f >= tp && <div style={{fontFamily: U, fontWeight: 800, fontSize: 70, color: C.ink}}>{countUp(f, tp, `${g.plan}`)} <span style={{fontSize: 40}}>дня</span></div>}
          </div>
          <Label bg={C.mandarin}>реальность</Label>
          <div style={{display: "flex", alignItems: "center", gap: 20, marginTop: 16}}>
            <div style={{height: 110, width: wr, background: C.mandarin, border: `6px solid ${C.ink}`, borderRadius: 18}} />
          </div>
          {f >= tr && <div style={{fontFamily: U, fontWeight: 800, fontSize: 92, color: C.ink, marginTop: 14}}>{countUp(f, tr, `${g.real}`)} <span style={{fontSize: 48}}>дней</span></div>}
          <Appear f={f} s={tr + 16} mode="slap" rot={-10} style={{position: "absolute", right: 70, top: 470}}><Pill bg={C.lemon} size={70}>+22 дня</Pill></Appear>
          <Appear f={f} s={s + 4} mode="pop" rot={10} style={{position: "absolute", right: 80, top: 10}}><St k="book" w={150} /></Appear>
        </div>
      );
    }
    case "dablin": {
      const t2 = fr(g.t2), sh = shake(f, t2 + 2, 16, 12);
      return (
        <div style={{padding: "0 60px", display: "flex", flexDirection: "column", gap: 40}}>
          <Appear f={f} s={s + 2} mode="left">
            <div style={{display: "flex", alignItems: "center", gap: 26}}>
              <St k="me_happy" w={250} />
              <div><Label bg={C.mint}>сейчас</Label><div style={{height: 14}} /><Bubble bg={C.mint}>«Да, конечно!»</Bubble></div>
            </div>
          </Appear>
          <Appear f={f} s={t2} mode="right">
            <div style={{display: "flex", alignItems: "center", gap: 26, justifyContent: "flex-end", transform: `translate(${sh.x}px, ${sh.y}px)`}}>
              <div style={{textAlign: "right"}}><Label bg={C.bubble} rot={3}>через месяц</Label><div style={{height: 14}} /><Bubble bg={C.bubble} size={80}>«…блин»</Bubble></div>
              <St k="me_wow" w={250} />
            </div>
          </Appear>
        </div>
      );
    }
    case "tradeoff": {
      const t2 = fr(g.t2), sh = shake(f, t2 + 3, 18, 12);
      return (
        <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 30, paddingTop: 30}}>
          <Appear f={f} s={s + 2} mode="slap" rot={-4}><Pill bg={C.mint} size={150}>ДА</Pill></Appear>
          <Appear f={f} s={s + 8} mode="pop"><div style={{fontFamily: G, fontWeight: 800, fontSize: 52, color: C.ink}}>одной задаче</div></Appear>
          <Appear f={f} s={t2} mode="slap" rot={6}>
            <div style={{transform: `translate(${sh.x}px, ${sh.y}px)`}}><Pill bg={C.mandarin} color="#fff" size={150}>= НЕТ</Pill></div>
          </Appear>
          <Appear f={f} s={t2 + 6} mode="pop"><div style={{fontFamily: G, fontWeight: 800, fontSize: 52, color: C.ink}}>другой</div></Appear>
        </div>
      );
    }
    case "attn": return (
      <div style={{padding: "30px 60px", display: "flex", flexDirection: "column", gap: 44}}>
        {g.bars.map((b: any, i: number) => {
          const t = fr(b.t), w = L(f, t, t + 12, 0, (b.v / 150) * 760, Easing.out(Easing.cubic));
          const last = i === g.bars.length - 1;
          const pulse = last && f > t + 12 ? 1 + 0.04 * Math.sin((f - t) * 0.5) : 1;
          return (
            <Appear key={i} f={f} s={t} mode="left">
              <div style={{display: "flex", alignItems: "center", gap: 18}}><Label bg={last ? C.mandarin : C.ink}>{b.year}</Label></div>
              <div style={{display: "flex", alignItems: "center", gap: 22, marginTop: 12}}>
                <div style={{height: 100, width: w, background: last ? C.mandarin : [C.mint, C.sky][i], border: `6px solid ${C.ink}`, borderRadius: 18, transform: `scaleY(${pulse})`}} />
                <div style={{fontFamily: U, fontWeight: 800, fontSize: last ? 76 : 60, color: C.ink, whiteSpace: "nowrap"}}>{b.label}</div>
              </div>
            </Appear>
          );
        })}
      </div>
    );
    case "hellyes": {
      const tn = fr(g.tn), tx = fr(g.tx), sh = shake(f, tx + 3, 18, 12);
      return (
        <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 46, paddingTop: 20}}>
          <Appear f={f} s={s + 2} mode="slap" rot={-3}>
            <div style={{display: "flex", alignItems: "center", gap: 20}}><Pill bg={C.mint} size={96}>100% ДА</Pill><St k="check" w={130} /></div>
          </Appear>
          <Appear f={f} s={s + 8} mode="pop"><div style={{fontFamily: G, fontWeight: 800, fontSize: 50, color: C.ink}}>берёшь</div></Appear>
          <Appear f={f} s={tn} mode="slap" rot={3}>
            <div style={{position: "relative", transform: `translate(${sh.x}px, ${sh.y}px)`}}>
              <Pill bg={C.lilac} color="#fff" size={84}>сомнения…</Pill>
              {f >= tx && <div style={{position: "absolute", left: "50%", top: "50%", transform: `translate(-50%,-50%) scale(${interpolate(SP(f, tx, 10, 260), [0, 1], [2.6, 1])}) rotate(-12deg)`,
                border: `12px solid ${C.mandarin}`, outline: `5px solid ${C.ink}`, borderRadius: 20, padding: "4px 30px", background: "rgba(255,250,242,.95)", fontFamily: U, fontWeight: 800, fontSize: 110, color: C.mandarin}}>НЕТ</div>}
            </div>
          </Appear>
        </div>
      );
    }
    case "checklist": {
      const items = ["чемпионат", "хакатон", "проект №1", "проект №2", "ещё курс", "ещё клуб"];
      const tg = fr(g.tg);
      return (
        <div style={{display: "flex", justifyContent: "center", paddingTop: 10}}>
          <div style={{position: "relative", width: 760, background: "#fff", border: `6px solid ${C.ink}`, borderRadius: 26, boxShadow: `12px 12px 0 ${C.ink}`, padding: "30px 40px", transform: "rotate(-2deg)"}}>
            {items.map((it, i) => {
              const ti = s + 4 + i * 4, cross = i % 2 === 1 && f >= tg + (i >> 1) * 4;
              return (
                <Appear key={i} f={f} s={ti} mode="left">
                  <div style={{display: "flex", alignItems: "center", gap: 22, height: 92, position: "relative", opacity: cross ? 0.55 : 1}}>
                    <div style={{width: 58, height: 58, borderRadius: 12, border: `6px solid ${C.ink}`, background: f >= ti + 4 ? C.mint : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: U, fontWeight: 800, fontSize: 40}}>{f >= ti + 4 ? "✓" : ""}</div>
                    <div style={{fontFamily: G, fontWeight: 800, fontSize: 54, color: C.ink}}>{it}</div>
                    {i % 2 === 1 && <div style={{position: "absolute", left: 80, top: 40, height: 12, width: L(f, tg + (i >> 1) * 4, tg + (i >> 1) * 4 + 6, 0, 420), background: C.mandarin, borderRadius: 6}} />}
                  </div>
                </Appear>
              );
            })}
            <Appear f={f} s={tg + 12} mode="slap" rot={-8} style={{position: "absolute", right: -40, bottom: -70}}>
              <div style={{fontFamily: CV, fontWeight: 700, fontSize: 96, color: C.mandarin, ...stroke(0), textShadow: `3px 3px 0 ${C.ink}`}}>ради галочки</div>
            </Appear>
          </div>
        </div>
      );
    }
    case "loops": {
      const tasks = ["реферат", "имейлы", "стартап", "дедлайн"];
      return (
        <div style={{position: "relative", height: 760}}>
          <div style={{position: "absolute", left: 540 - 140, top: 380 - 140}}><Appear f={f} s={s + 2} mode="pop"><St k="me_wow" w={280} /></Appear></div>
          {tasks.map((tk, i) => {
            const a = (f - s) * 0.07 + (i * Math.PI) / 2, rr = 290;
            const x = 540 + Math.cos(a) * rr, y = 380 + Math.sin(a) * rr * 0.78;
            return (
              <React.Fragment key={i}>
                <svg width={1080} height={760} style={{position: "absolute", left: 0, top: 0, overflow: "visible"}}>
                  <ellipse cx={540} cy={380} rx={rr - 40 + i * 26} ry={(rr - 40 + i * 26) * 0.78} fill="none" stroke={[C.mint, C.bubble, C.sky, C.lemon][i]} strokeWidth={8} strokeDasharray="70 26"
                    strokeDashoffset={-(f - s) * (4 + i)} opacity={L(f, s + i * 3, s + i * 3 + 8, 0, 0.9)} />
                </svg>
                <Appear f={f} s={s + 4 + i * 4} mode="pop" style={{position: "absolute", left: x - 120, top: y - 40, width: 240, display: "flex", justifyContent: "center"}}>
                  <Pill bg={[C.mint, C.bubble, C.sky, C.lemon][i]} size={40}>{tk}</Pill>
                </Appear>
              </React.Fragment>
            );
          })}
        </div>
      );
    }
    case "plan": {
      const t1 = fr(g.t1), t2 = fr(g.t2), t3 = fr(g.t3);
      const row = (t: number, when: string, what: string, bg: string, ck: number) => (
        <Appear f={f} s={t} mode="left">
          <div style={{display: "flex", alignItems: "center", gap: 20, marginTop: 26}}>
            <Label bg={bg} size={38}>{when}</Label>
            <div style={{fontFamily: CV, fontWeight: 700, fontSize: 74, color: C.ink, lineHeight: 1}}>{what}</div>
            {f >= ck && <Appear f={f} s={ck} mode="slap" rot={-8}><St k="check" w={90} /></Appear>}
          </div>
        </Appear>
      );
      return (
        <div style={{display: "flex", justifyContent: "center", paddingTop: 20}}>
          <div style={{position: "relative", width: 900, background: "#fff", border: `6px solid ${C.ink}`, borderRadius: 26, boxShadow: `12px 12px 0 ${C.ink}`, padding: "34px 40px 46px", transform: "rotate(-1.5deg)"}}>
            <div style={{position: "relative", display: "inline-block"}}>
              <div style={{fontFamily: CV, fontWeight: 700, fontSize: 84, color: C.ink, opacity: f > t1 ? 0.5 : 1}}>написать реферат</div>
              <div style={{position: "absolute", left: -10, top: "52%", height: 12, width: `${L(f, t1, t1 + 6, 0, 106)}%`, background: C.mandarin, borderRadius: 6}} />
            </div>
            {row(t1, "сегодня 19:00", "цели и содержание", C.mint, t3)}
            {row(t2, "завтра", "пункт 1 и 2", C.sky, t3 + 5)}
          </div>
        </div>
      );
    }
    default: return null;
  }
};

/* ---------- финальная плашка ---------- */
const Cta: React.FC<{r: R; f: number}> = ({r, f}) => {
  const s = fr(r.dur - 2.6);
  if (f < s) return null;
  return (
    <Appear f={f} s={s} mode="up" style={{position: "absolute", top: 1450, width: "100%", display: "flex", justifyContent: "center"}}>
      <div style={{display: "flex", alignItems: "center", gap: 20, background: C.milk, border: `6px solid ${C.ink}`, borderRadius: 26, padding: "16px 30px", boxShadow: `9px 9px 0 ${C.ink}`, transform: `rotate(-2deg) scale(${1 + 0.03 * Math.sin((f - s) * 0.4)})`}}>
        <div style={{width: 78, height: 78, borderRadius: 39, background: C.mandarin, border: `5px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center"}}>
          <div style={{width: 0, height: 0, borderTop: "16px solid transparent", borderBottom: "16px solid transparent", borderLeft: `26px solid #fff`, marginLeft: 6}} />
        </div>
        <div>
          <div style={{fontFamily: G, fontWeight: 800, fontSize: 36, color: C.ink}}>{r.cta[0]}</div>
          <div style={{fontFamily: U, fontWeight: 800, fontSize: 44, color: C.ink}}>{r.cta[1]}</div>
        </div>
      </div>
    </Appear>
  );
};

export const Reel: React.FC<{id: string}> = ({id}) => {
  const f = useCurrentFrame();
  const r = reels.find((x) => x.id === id)!;
  const t = f / 30;
  const gfx = r.gfx as Gx[];
  const active = gfx.filter((g) => t >= g.s - 0.4 && t <= g.e + 0.4);
  const flash = gfx.some((g) => FULL.has(g.kind) && (Math.abs(f - fr(g.s)) < 2)) || Math.abs(f - fr(r.hook_end)) < 2;
  return (
    <AbsoluteFill style={{background: C.ink, overflow: "hidden"}}>
      <Video r={r} f={f} />
      <AbsoluteFill style={{background: "linear-gradient(180deg, rgba(29,24,56,.45) 0%, rgba(29,24,56,0) 22%, rgba(29,24,56,0) 58%, rgba(29,24,56,.55) 100%)"}} />
      {active.filter((g) => !FULL.has(g.kind)).map((g) => <Overlay key={g.kind + g.s} g={g} f={f} />)}
      {active.filter((g) => FULL.has(g.kind)).map((g) => <Scene key={g.kind + g.s} g={g} f={f} />)}
      <Hook r={r} f={f} />
      <Title r={r} f={f} />
      <Timer r={r} f={f} />
      <Captions r={r} f={f} />
      <Cta r={r} f={f} />
      <div style={{position: "absolute", left: 0, top: 0, height: 12, width: `${(t / r.dur) * 100}%`, background: C.lemon, borderRight: `4px solid ${C.ink}`}} />
      {flash && <AbsoluteFill style={{background: "#fff", opacity: 0.55}} />}
      <Grain f={f} o={0.07} />
    </AbsoluteFill>
  );
};
