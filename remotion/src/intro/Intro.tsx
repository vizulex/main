import React from "react";
import {AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, spring, Easing, random} from "remotion";
import {loadFont as loadUnbounded} from "@remotion/google-fonts/Unbounded";
import {loadFont as loadGolos} from "@remotion/google-fonts/GolosText";
import {loadFont as loadCaveat} from "@remotion/google-fonts/Caveat";

/* Интро «Анти брейнрот подкаст» · 1920×1080 · 30 fps · 450 кадров.
   Таймлайн привязан к битам трека (≈123 BPM, бит ≈ 14.5 кадра).
   Звуковые эффекты лежат в sfx.json и сводятся скриптом mix_audio.py. */

const U = loadUnbounded("normal", {weights: ["500", "800"], subsets: ["cyrillic", "latin"]}).fontFamily;
const G = loadGolos("normal", {weights: ["400", "500", "700"], subsets: ["cyrillic", "latin"]}).fontFamily;
const CV = loadCaveat("normal", {weights: ["700"], subsets: ["cyrillic", "latin"]}).fontFamily;

const C = {
  ink: "#221C46", milk: "#FFFAF2", paper: "#F4F2F7", mandarin: "#FF7A2F", lilac: "#9C7BFF",
  mint: "#4FE0B0", lemon: "#FFE04A", bubble: "#FF8AC5", sky: "#8FD3FF",
  lilac50: "#EFE9FF", mint50: "#DDFBF0", lemon50: "#FFF7CC", sky50: "#E3F4FF", bubble50: "#FFE6F3",
};

export type IntroProps = {episode: number; photo?: string};

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const L = (f: number, a: number, b: number, x: number, y: number, e = Easing.inOut(Easing.cubic)) =>
  interpolate(f, [a, b], [x, y], {...clamp, easing: e});
const SP = (f: number, s: number, damping = 12, stiffness = 180) =>
  spring({frame: f - s, fps: 30, config: {damping, stiffness}});

/* ---------- бумага ---------- */
const grid = (line = "rgba(156,123,255,.28)", bg = C.milk, step = 26): React.CSSProperties => ({
  backgroundColor: bg,
  backgroundImage: `linear-gradient(${line} 1.5px, transparent 1.5px), linear-gradient(90deg, ${line} 1.5px, transparent 1.5px)`,
  backgroundSize: `${step}px ${step}px`,
});
const lined = (bg = C.milk): React.CSSProperties => ({
  backgroundColor: bg,
  backgroundImage: `linear-gradient(90deg, transparent 58px, rgba(255,138,197,.7) 58px, rgba(255,138,197,.7) 61px, transparent 61px), repeating-linear-gradient(transparent 0 33px, rgba(143,211,255,.75) 33px 35px)`,
});
const gingham: React.CSSProperties = {
  backgroundColor: C.sky50,
  backgroundImage: `repeating-linear-gradient(0deg, rgba(143,211,255,.45) 0 14px, transparent 14px 28px), repeating-linear-gradient(90deg, rgba(143,211,255,.45) 0 14px, transparent 14px 28px)`,
};
const dots = (bg: string, dot: string): React.CSSProperties => ({
  backgroundColor: bg, backgroundImage: `radial-gradient(${dot} 2.4px, transparent 2.8px)`, backgroundSize: "22px 22px",
});

/* ---------- мелкие компоненты ---------- */
const St: React.FC<{k: string; w: number}> = ({k, w}) => (
  <Img src={staticFile(`intro/st/${k}.svg`)} style={{width: w, height: w, display: "block"}} />
);

const Halftone: React.FC = () => (
  <div style={{position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(34,28,70,.55) 1.1px, transparent 1.6px)", backgroundSize: "7px 7px", mixBlendMode: "multiply", opacity: 0.35}} />
);

const Circle: React.FC<{src: string; size: number; bg: string; pos?: string}> = ({src, size, bg, pos = "center 30%"}) => (
  <div style={{width: size, height: size, borderRadius: "50%", overflow: "hidden", background: bg, border: "7px solid #fff", boxShadow: "0 10px 24px rgba(34,28,70,.28)", position: "relative"}}>
    <Img src={staticFile(src)} style={{width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, filter: "grayscale(1) contrast(1.3) brightness(1.05)", mixBlendMode: "multiply"}} />
    <Halftone />
  </div>
);

/** Появление с пружиной. mode "pop": 0→1 с перелётом; "slap": 160%→100%. Покадровая «дрожь» как в стоп-моушене. */
const Pop: React.FC<{
  f: number; at: number; x: number; y: number; rot?: number; mode?: "pop" | "slap"; z?: number;
  exitAt?: number; dx?: number; dy?: number; float?: number; boil?: boolean; children: React.ReactNode;
}> = ({f, at, x, y, rot = 0, mode = "pop", z = 1, exitAt, dx = 0, dy = 0, float = 0, boil = true, children}) => {
  if (f < at) return null;
  const s = SP(f, at, mode === "pop" ? 10 : 12, 210);
  const sc = mode === "pop" ? s : interpolate(s, [0, 1], [1.6, 1]);
  const op = Math.min(1, (f - at) / 3);
  const jit = boil ? (random(`j${Math.floor(f / 4)}-${at}-${x}`) - 0.5) * 3 : 0;
  const fl = float ? Math.sin((f + x) / 18) * float : 0;
  let ex = 0, ey = 0, eo = 1;
  if (exitAt !== undefined && f >= exitAt) {
    const p = L(f, exitAt, exitAt + 14, 0, 1, Easing.in(Easing.cubic));
    ex = dx * p; ey = dy * p; eo = 1 - p;
  }
  return (
    <div style={{position: "absolute", left: x, top: y, zIndex: z, opacity: op * eo,
      transform: `translate(${ex}px, ${ey + fl}px) scale(${sc}) rotate(${rot + jit}deg)`}}>
      {children}
    </div>
  );
};

const WriteOn: React.FC<{f: number; at: number; dur: number; style: React.CSSProperties; children: React.ReactNode}> = ({f, at, dur, style, children}) => {
  if (f < at) return null;
  const p = L(f, at, at + dur, 0, 100, Easing.linear);
  return <div style={{position: "absolute", whiteSpace: "nowrap", clipPath: `inset(-20% ${100 - p}% -20% -5%)`, ...style}}>{children}</div>;
};

const Typed: React.FC<{f: number; at: number; text: string; cpf?: number; style: React.CSSProperties}> = ({f, at, text, cpf = 1, style}) => {
  if (f < at) return null;
  const n = Math.min(text.length, Math.floor((f - at) / cpf) + 1);
  const caret = n < text.length || Math.floor(f / 8) % 2 === 0;
  return <div style={{position: "absolute", whiteSpace: "pre", ...style}}>{text.slice(0, n)}<span style={{opacity: caret ? 1 : 0}}>▍</span></div>;
};

const Draw: React.FC<{f: number; at: number; dur: number; d: string; w: number; h: number; color: string; sw?: number; style: React.CSSProperties}> = ({f, at, dur, d, w, h, color, sw = 5, style}) => {
  if (f < at) return null;
  const p = L(f, at, at + dur, 0, 1, Easing.out(Easing.quad));
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: "absolute", overflow: "visible", ...style}}>
      <path d={d} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
    </svg>
  );
};

const Cross: React.FC<{x: number; y: number; c?: string}> = ({x, y, c = C.ink}) => (
  <div style={{position: "absolute", left: x - 12, top: y - 12, width: 24, height: 24}}>
    <div style={{position: "absolute", left: 11, top: 0, width: 2.5, height: 24, background: c}} />
    <div style={{position: "absolute", top: 11, left: 0, height: 2.5, width: 24, background: c}} />
  </div>
);

/* Зерно бумаги: шум меняется каждые 2 кадра — «живая» плёночная фактура */
const Grain: React.FC<{f: number; o?: number}> = ({f, o = 0.16}) => (
  <svg width="1920" height="1080" style={{position: "absolute", inset: 0, opacity: o, mixBlendMode: "overlay", pointerEvents: "none"}}>
    <filter id={`g${Math.floor(f / 2)}`}>
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={Math.floor(f / 2)} />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="1920" height="1080" filter={`url(#g${Math.floor(f / 2)})`} />
  </svg>
);

/* ---------- блокнот ---------- */
const PW = 520, PH = 680;
const face: React.CSSProperties = {position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", borderRadius: "4px 16px 16px 4px", overflow: "hidden"};
const pageShadow = "inset 22px 0 30px -18px rgba(34,28,70,.35)";

const Cover: React.FC = () => (
  <div style={{...face, background: C.lilac, backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,.06) 0 3px, transparent 3px 7px)", boxShadow: "inset 26px 0 0 rgba(34,28,70,.18), inset 0 0 0 4px rgba(34,28,70,.25)"}}>
    <div style={{position: "absolute", right: 70, top: 0, bottom: 0, width: 26, background: C.mint, boxShadow: "inset 0 0 0 3px rgba(34,28,70,.2)"}} />
    <div style={{position: "absolute", left: 80, top: 230, width: 300, padding: "26px 20px", background: C.milk, borderRadius: 14, border: `4px solid ${C.ink}`, transform: "rotate(-3deg)", textAlign: "center"}}>
      <div style={{fontFamily: CV, fontWeight: 700, fontSize: 64, color: C.ink, lineHeight: 1}}>мысли</div>
      <div style={{fontFamily: G, fontWeight: 500, fontSize: 22, color: C.ink, letterSpacing: "0.2em", marginTop: 8}}>И ИДЕИ</div>
    </div>
    <div style={{position: "absolute", left: 50, top: 60}}><St k="star" w={110} /></div>
    <div style={{position: "absolute", left: 300, top: 470, transform: "rotate(12deg)"}}><St k="button" w={100} /></div>
    <div style={{position: "absolute", left: 60, top: 500}}><St k="sparkle" w={80} /></div>
    <div style={{position: "absolute", left: 290, top: 80, transform: "rotate(10deg)"}}><St k="dotstar" w={90} /></div>
  </div>
);
const InsideCover: React.FC = () => (
  <div style={{...face, transform: "rotateY(180deg)", borderRadius: "16px 4px 4px 16px", ...dots(C.lilac50, "rgba(156,123,255,.45)")}} />
);

const flipPages = [
  {bg: lined(), img: "img/moon.png", word: "космос", ix: 250, iy: 120, iw: 200},
  {bg: gingham, img: "img/vitruvian.jpg", word: "пропорции", ix: 150, iy: 140, iw: 230},
  {bg: dots(C.bubble50, "rgba(255,138,197,.5)"), img: "img/neurons_cut.png", word: "нейроны", ix: 160, iy: 120, iw: 220},
  {bg: grid("rgba(255,224,74,.6)", C.lemon50), img: "img/tesla.jpg", word: "опыт", ix: 90, iy: 170, iw: 340},
  {bg: lined(C.sky50), img: "img/deepfield.jpg", word: "вселенная", ix: 140, iy: 140, iw: 250},
  {bg: grid(), img: "img/darwin.jpg", word: "эволюция", ix: 170, iy: 130, iw: 200},
  {bg: dots(C.mint50, "rgba(79,224,176,.6)"), img: "img/microscope_cut.png", word: "наблюдай", ix: 150, iy: 150, iw: 220},
  {bg: gingham, img: "img/newton_blake.jpg", word: "вопрос?", ix: 100, iy: 160, iw: 320},
];
const FLIP0 = 42, FLIP_STEP = 6, FLIP_LEN = 10;

const Notebook: React.FC<{f: number; photo: string}> = ({f, photo}) => {
  const opened = f >= 44;
  const coverRot = L(f, 32, 46, 0, -180, Easing.inOut(Easing.quad));
  return (
    <div style={{position: "absolute", left: 0, top: 0, width: PW * 2, height: PH, transformStyle: "preserve-3d"}}>
      {/* блоки страниц */}
      <div style={{position: "absolute", left: PW, top: 0, width: PW, height: PH, borderRadius: "4px 16px 16px 4px", background: "#e9e3f5",
        boxShadow: "8px 8px 0 #ddd4f0, 14px 14px 0 #cbbfe6, 0 30px 60px rgba(0,0,0,.45)"}} />
      {f >= 40 && <div style={{position: "absolute", left: 0, top: 0, width: PW, height: PH, borderRadius: "16px 4px 4px 16px", background: "#e9e3f5",
        boxShadow: "-8px 8px 0 #ddd4f0, -14px 14px 0 #cbbfe6, 0 30px 60px rgba(0,0,0,.45)"}} />}
      {/* статичные страницы разворота */}
      <div style={{position: "absolute", left: PW, top: 0, width: PW, height: PH, borderRadius: "4px 16px 16px 4px", overflow: "hidden", ...lined(), boxShadow: pageShadow}} />
      {opened && <div style={{position: "absolute", left: 0, top: 0, width: PW, height: PH, borderRadius: "16px 4px 4px 16px", overflow: "hidden", ...grid(), boxShadow: "inset -22px 0 30px -18px rgba(34,28,70,.35)", zIndex: 5}} />}
      {/* контент разворота */}
      {f >= 100 && <SpreadContent f={f} photo={photo} />}
      {/* листающиеся страницы */}
      {flipPages.map((p, i) => {
        const s = FLIP0 + i * FLIP_STEP;
        if (f > s + FLIP_LEN) return null;
        const r = L(f, s, s + FLIP_LEN, 0, -180, Easing.inOut(Easing.sin));
        const lift = Math.sin((-r / 180) * Math.PI) * 30;
        return (
          <div key={i} style={{position: "absolute", left: PW, top: 0, width: PW, height: PH, transformOrigin: "left center", transformStyle: "preserve-3d",
            transform: `rotateY(${r}deg) translateZ(${lift + (8 - i) * 0.4}px)`, zIndex: f >= s ? 40 : 30 - i}}>
            <div style={{...face, ...p.bg, boxShadow: pageShadow}}>
              <Img src={staticFile(`intro/${p.img}`)} style={{position: "absolute", left: p.ix, top: p.iy, width: p.iw, border: p.img.endsWith(".jpg") ? "8px solid #fff" : "none", boxShadow: p.img.endsWith(".jpg") ? "0 6px 14px rgba(34,28,70,.25)" : "none", transform: `rotate(${i % 2 ? 4 : -5}deg)`}} />
              <div style={{position: "absolute", left: 90, top: 470, fontFamily: CV, fontWeight: 700, fontSize: 70, color: i % 2 ? C.lilac : C.bubble, transform: "rotate(-4deg)"}}>{p.word}</div>
            </div>
            <div style={{...face, transform: "rotateY(180deg)", borderRadius: "16px 4px 4px 16px", ...grid()}} />
          </div>
        );
      })}
      {/* обложка */}
      <div style={{position: "absolute", left: PW - 6, top: -6, width: PW + 12, height: PH + 12, transformOrigin: "6px center", transformStyle: "preserve-3d",
        transform: `rotateY(${coverRot}deg) translateZ(${f < 44 ? 8 : 0}px)`, zIndex: f < 44 ? 60 : 1}}>
        <Cover />
        <InsideCover />
      </div>
      {/* тень корешка */}
      {opened && <div style={{position: "absolute", left: PW - 30, top: 0, width: 60, height: PH, zIndex: 6, background: "linear-gradient(90deg, transparent, rgba(34,28,70,.22), transparent)"}} />}
    </div>
  );
};

/* Разворот: фото, научные картинки, пометки — всё появляется по битам */
const SpreadContent: React.FC<{f: number; photo: string}> = ({f, photo}) => (
  <div style={{position: "absolute", inset: 0, zIndex: 20}}>
    {/* левая страница */}
    <Pop f={f} at={162} x={34} y={30} float={4}><div style={{transform: `rotate(${f / 3}deg)`}}><Img src={staticFile("intro/img/earth.png")} style={{width: 150, filter: "drop-shadow(0 8px 12px rgba(34,28,70,.3))"}} /></div></Pop>
    <Pop f={f} at={119} x={100} y={120} rot={-4} mode="slap" z={3}>
      <div style={{width: 320, padding: "16px 16px 70px", background: "#fff", boxShadow: "0 14px 30px rgba(34,28,70,.3)", position: "relative"}}>
        <div style={{width: 288, height: 330, background: C.lilac50, overflow: "hidden", position: "relative"}}>
          <Img src={staticFile(photo)} style={{width: "100%", height: "100%", objectFit: "cover"}} />
        </div>
        <div style={{position: "absolute", left: 0, right: 0, bottom: 10, textAlign: "center", fontFamily: CV, fontWeight: 700, fontSize: 46, color: C.ink}}>это я</div>
        <div style={{position: "absolute", left: 90, top: -30, transform: "rotate(-4deg)"}}><St k="tape" w={150} /></div>
      </div>
    </Pop>
    <Pop f={f} at={191} x={16} y={520} rot={-3}><Img src={staticFile("intro/img/neurons_cut.png")} style={{width: 150, mixBlendMode: "multiply", opacity: 0.85}} /></Pop>
    <Pop f={f} at={219} x={360} y={470} rot={6}><Img src={staticFile("intro/img/microscope_cut.png")} style={{width: 140, mixBlendMode: "multiply"}} /></Pop>
    <Pop f={f} at={249} x={400} y={40} mode="slap" rot={12} float={3}><St k="star" w={90} /></Pop>
    <Pop f={f} at={252} x={40} y={430} mode="slap"><St k="sparkle" w={64} /></Pop>
    {f >= 249 && <><Cross x={470} y={300} c={C.lilac} /><Cross x={210} y={610} c={C.lilac} /></>}

    {/* правая страница */}
    <Pop f={f} at={133} x={560} y={36} rot={-6} float={3}><Circle src="intro/img/einstein.jpg" size={170} bg={C.lilac} /></Pop>
    <Pop f={f} at={205} x={860} y={34} rot={5} float={3}><Circle src="intro/img/curie.jpg" size={140} bg={C.mint} /></Pop>
    <Pop f={f} at={148} x={640} y={215} rot={-2}><Img src={staticFile("intro/img/brain_cut.png")} style={{width: 310, filter: "drop-shadow(0 6px 10px rgba(34,28,70,.25))"}} /></Pop>
    <Draw f={f} at={152} dur={12} w={120} h={80} color={C.bubble} d="M110 10 C80 0 40 20 20 60 M8 44 L20 62 L38 52" style={{left: 880, top: 220}} />
    <WriteOn f={f} at={156} dur={14} style={{left: 900, top: 160, fontFamily: CV, fontWeight: 700, fontSize: 62, color: C.bubble, transform: "rotate(-6deg)"}}>мозг!</WriteOn>
    <WriteOn f={f} at={177} dur={18} style={{left: 590, top: 470, fontFamily: CV, fontWeight: 700, fontSize: 70, color: C.ink, transform: "rotate(-3deg)"}}>E = mc²</WriteOn>
    <Draw f={f} at={190} dur={10} w={220} h={20} color={C.lemon} sw={10} d="M4 12 C60 4 140 16 214 8" style={{left: 585, top: 545}} />
    <Pop f={f} at={235} x={900} y={430} mode="slap" rot={-8} float={4}><St k="bulb" w={110} /></Pop>
    <Typed f={f} at={207} cpf={1} text={"гипотеза №1: скроллинг ≠ отдых"} style={{left: 590, top: 612, fontFamily: G, fontWeight: 500, fontSize: 25, color: C.ink}} />
    <Pop f={f} at={240} x={950} y={596} mode="slap"><St k="check" w={56} /></Pop>
    {f >= 249 && <><Cross x={830} y={190} /><Cross x={1000} y={360} c={C.bubble} /></>}
  </div>
);

/* ---------- титул ---------- */
const TitleScene: React.FC<{f: number; episode: number; photo: string}> = ({f, episode, photo}) => {
  const ex = 424; // вылет элементов
  const zoom = L(f, 266, 450, 1.0, 1.06, Easing.linear);
  // «брейнрот»: сначала глитч, после штампа «АНТИ» — чистый
  const glitchy = f < 293;
  const gx = glitchy ? (random(`gx${Math.floor(f / 2)}`) - 0.5) * 26 : 0;
  const gy = glitchy ? (random(`gy${Math.floor(f / 2)}`) - 0.5) * 10 : 0;
  const brOp = f < 279 ? 0 : 1;
  const brShadow = glitchy
    ? `${-10 + gx / 2}px 0 ${C.bubble}, ${10 - gx / 2}px 0 ${C.sky}`
    : `0 0 0 transparent`;
  const stampS = f >= 293 ? SP(f, 293, 9, 260) : 0;
  const podS = f >= 308 ? SP(f, 308, 13, 170) : 0;
  const ep = String(episode).padStart(2, "0");
  const epAt = 337;
  const rolling = f >= epAt && f < epAt + 10;
  const epText = rolling ? String(Math.floor(random(`ep${f}`) * 90) + 10) : ep;
  const ruler = L(f, 322, 340, 0, 1, Easing.out(Easing.cubic));
  return (
    <AbsoluteFill style={{...grid("rgba(156,123,255,.22)", C.milk, 40)}}>
      <div style={{position: "absolute", inset: 0, transform: `scale(${zoom})`}}>
        {[[180, 300], [1740, 300], [180, 980], [1740, 980], [960, 120]].map(([x, y], i) => <Cross key={i} x={x} y={y} c={i % 2 ? C.lilac : C.ink} />)}

        {/* верхняя строка */}
        <Typed f={f} at={300} cpf={1} text={"ПОДКАСТ О МОЗГЕ, НАУКЕ И САМОРАЗВИТИИ"} style={{right: 300, top: 712, textAlign: "right", fontFamily: G, fontWeight: 700, fontSize: 24, letterSpacing: "0.16em", color: C.ink, opacity: f >= ex ? L(f, ex, ex + 10, 1, 0) : 1}} />

        {/* «брейнрот» */}
        <div style={{position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", opacity: brOp,
          transform: `translate(${gx}px, ${gy}px) skewX(${glitchy ? gx / 4 : 0}deg) scale(${f < 293 ? 1 : 1 + 0.05 * (1 - SP(f, 293, 10, 200))})`}}>
          <span style={{fontFamily: U, fontWeight: 800, fontSize: 228, letterSpacing: "-0.04em", color: C.ink, textShadow: brShadow, lineHeight: 1}}>брейнрот</span>
        </div>

        {/* штамп «АНТИ» */}
        {f >= 293 && (
          <div style={{position: "absolute", left: 240, top: 150, transform: `scale(${interpolate(stampS, [0, 1], [2.4, 1])}) rotate(-7deg)`, opacity: Math.min(1, (f - 293) / 2), zIndex: 3}}>
            <div style={{background: C.bubble, color: C.milk, fontFamily: U, fontWeight: 800, fontSize: 96, padding: "6px 30px 14px", borderRadius: 22, border: `5px solid ${C.ink}`, boxShadow: `8px 8px 0 ${C.ink}`, letterSpacing: "0.02em"}}>АНТИ</div>
          </div>
        )}

        {/* «подкаст» с точкой вместо «о» */}
        {f >= 308 && (
          <div style={{position: "absolute", right: 300, top: 555, transform: `translateX(${(1 - podS) * 120}px)`, opacity: Math.min(1, (f - 308) / 4), display: "flex", alignItems: "center", gap: 2,
            fontFamily: G, fontWeight: 500, fontSize: 118, color: C.ink, letterSpacing: "0.04em"}}>
            <span>п</span>
            <span style={{display: "inline-block", width: 70, height: 70, borderRadius: "50%", background: C.lilac, marginTop: 22, transform: `scale(${SP(f, 312, 8, 220)})`}} />
            <span>дкаст</span>
          </div>
        )}

        {/* линейка и координаты */}
        <div style={{position: "absolute", left: 120, top: 905, height: 6, width: 1680 * ruler, background: C.bubble, borderRadius: 3}} />
        {Array.from({length: 43}).map((_, i) => (i * 40 <= 1680 * ruler) ? (
          <div key={i} style={{position: "absolute", left: 120 + i * 40, top: i % 5 ? 889 : 877, width: 3, height: i % 5 ? 16 : 28, background: C.bubble}} />
        ) : null)}
        <Typed f={f} at={324} cpf={1} text={"59.9343° N, 30.3351° E · САНКТ-ПЕТЕРБУРГ"} style={{left: 120, top: 935, fontFamily: G, fontWeight: 500, fontSize: 24, letterSpacing: "0.12em", color: C.ink, opacity: 0.75}} />

        {/* эпизод */}
        {f >= epAt && (
          <div style={{position: "absolute", left: 360, top: 600, transform: `scale(${SP(f, epAt, 10, 220)}) rotate(-4deg)`, zIndex: 4}}>
            <div style={{display: "inline-block", background: "#fff", fontFamily: G, fontWeight: 700, fontSize: 30, letterSpacing: "0.18em", padding: "4px 16px", borderRadius: 8, color: C.ink, border: `3px solid ${C.ink}`}}>ЭПИЗОД</div>
            <div style={{fontFamily: U, fontWeight: 800, fontSize: 170, color: C.lemon, lineHeight: 1, marginTop: 4,
              textShadow: `-5px 0 ${C.bubble}, 5px 0 ${C.sky}, 9px 11px 0 ${C.ink}`}}>{epText}</div>
          </div>
        )}

        {/* картинки вокруг */}
        <Pop f={f} at={352} x={30} y={20} rot={-6} float={6} exitAt={ex} dx={-500} dy={-300}><Circle src="intro/img/einstein.jpg" size={190} bg={C.lilac} /></Pop>
        <Pop f={f} at={359} x={1630} y={40} float={5} exitAt={ex} dx={500} dy={-300}><div style={{transform: `rotate(${f / 4}deg)`}}><Img src={staticFile("intro/img/moon.png")} style={{width: 220, filter: "drop-shadow(0 10px 18px rgba(34,28,70,.35))"}} /></div></Pop>
        <Pop f={f} at={366} x={10} y={700} rot={-4} float={5} exitAt={ex} dx={-600} dy={300}><Img src={staticFile("intro/img/brain_cut.png")} style={{width: 290, filter: "drop-shadow(0 8px 12px rgba(34,28,70,.25))"}} /></Pop>
        <Pop f={f} at={373} x={1640} y={380} rot={7} float={4} exitAt={ex} dx={600} dy={0}>
          <div style={{width: 210, padding: "10px 10px 40px", background: "#fff", boxShadow: "0 10px 22px rgba(34,28,70,.3)"}}>
            <div style={{width: 190, height: 210, background: C.lilac50, overflow: "hidden"}}><Img src={staticFile(photo)} style={{width: "100%", height: "100%", objectFit: "cover"}} /></div>
          </div>
        </Pop>
        <Pop f={f} at={380} x={40} y={380} rot={4} float={4} exitAt={ex} dx={-600} dy={0}><Circle src="intro/img/lovelace.jpg" size={160} bg={C.bubble} pos="center 20%" /></Pop>
        <Pop f={f} at={387} x={1200} y={20} rot={-5} float={4} exitAt={ex} dx={300} dy={-400}><Circle src="intro/img/darwin.jpg" size={140} bg={C.mint} pos="center 20%" /></Pop>

        {/* наклейки */}
        <Pop f={f} at={355} x={480} y={70} mode="slap" rot={-12} float={5} exitAt={ex} dx={-200} dy={-400}><St k="star" w={110} /></Pop>
        <Pop f={f} at={369} x={1500} y={230} mode="slap" float={4} exitAt={ex} dx={400} dy={-300}><St k="sparkle" w={90} /></Pop>
        <Pop f={f} at={383} x={800} y={760} mode="slap" rot={-8} float={5} exitAt={ex} dx={-300} dy={400}><St k="bulb" w={120} /></Pop>
        <Pop f={f} at={390} x={1100} y={760} mode="slap" rot={10} float={5} exitAt={ex} dx={100} dy={400}><St k="book" w={110} /></Pop>
        <Pop f={f} at={395} x={800} y={60} mode="slap" rot={6} float={4} exitAt={ex} dx={0} dy={-400}><St k="planet" w={110} /></Pop>
        <Pop f={f} at={398} x={1790} y={640} mode="slap" float={4} exitAt={ex} dx={400} dy={200}><St k="dotstar" w={90} /></Pop>

        {/* разлёт искр вокруг заголовка */}
        {f >= 395 && f < 430 && Array.from({length: 12}).map((_, i) => {
          const a = (i / 12) * Math.PI * 2, p = L(f, 395, 418, 0, 1, Easing.out(Easing.cubic));
          const r = 380 + p * 260;
          return <div key={i} style={{position: "absolute", left: 960 + Math.cos(a) * r * 1.5 - 20, top: 500 + Math.sin(a) * r * 0.7 - 20, opacity: 1 - p, transform: `scale(${0.5 + p})`}}><St k="sparkle" w={40} /></div>;
        })}
      </div>
      <Grain f={f} o={0.12} />
    </AbsoluteFill>
  );
};

/* ---------- сцена со столом ---------- */
export const Intro: React.FC<IntroProps> = ({episode, photo = "intro/st/me_happy.svg"}) => {
  const f = useCurrentFrame();

  // полёт блокнота и раскрытие
  const fly = SP(f, 0, 14, 110);
  const ty = (1 - fly) * 950 + (f >= 17 && f < 32 ? Math.sin((f - 17) / 3) * 4 : 0);
  const rx = f < 30 ? L(f, 0, 17, 60, 24, Easing.out(Easing.cubic)) : L(f, 30, 46, 24, 0);
  const rz = f < 30 ? L(f, 0, 17, 28, -4, Easing.out(Easing.cubic)) : L(f, 30, 46, -4, 0);
  const spine = L(f, 32, 46, 700, 960);
  // камера
  const cs = f < 100 ? 1 : f < 119 ? L(f, 100, 118, 1, 1.5, Easing.out(Easing.cubic)) : L(f, 119, 268, 1.5, 1.6, Easing.linear);
  const ctx = f < 119 ? 0 : L(f, 119, 268, 60, -60, Easing.linear);
  const crot = f < 119 ? 0 : L(f, 119, 268, -1.5, 1.2, Easing.linear);
  const shake = f >= 119 && f < 127 ? (random(`s${f}`) - 0.5) * (127 - f) * 3 : 0;

  // переход: сиреневый круг, за ним титул
  const r1 = L(f, 264, 280, 0, 120, Easing.in(Easing.cubic));
  const r2 = L(f, 270, 287, 0, 120, Easing.inOut(Easing.cubic));
  const fadeOut = L(f, 440, 450, 0, 1, Easing.in(Easing.quad));

  return (
    <AbsoluteFill style={{background: C.ink, overflow: "hidden"}}>
      {f < 290 && (
        <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, #3A3178 0%, ${C.ink} 70%)`}}>
          <AbsoluteFill style={{...dots("transparent", "rgba(255,250,242,.07)"), backgroundSize: "36px 36px"}} />
          {/* звёздочки на столе */}
          {[[200, 160, "sparkle", 0], [1680, 210, "star", 6], [260, 860, "dotstar", 12], [1620, 840, "sparkle", 18], [980, 90, "sparkle", 9]].map(([x, y, k, d], i) => (
            <div key={i} style={{position: "absolute", left: x as number, top: y as number, opacity: f < 100 ? 0.85 : L(f, 100, 112, 0.85, 0),
              transform: `scale(${0.7 + 0.3 * Math.sin((f + (d as number) * 4) / 7)}) rotate(${f * 1.5}deg)`}}>
              <St k={k as string} w={70} />
            </div>
          ))}
          <div style={{position: "absolute", inset: 0, perspective: 2400, transform: `translate(${ctx + shake}px, ${shake / 2}px) scale(${cs}) rotate(${crot}deg)`, transformStyle: "preserve-3d"}}>
            <div style={{position: "absolute", left: spine - PW, top: (1080 - PH) / 2, width: PW * 2, height: PH, transformStyle: "preserve-3d",
              transform: `translateY(${ty}px) rotateX(${rx}deg) rotateZ(${rz}deg)`}}>
              <Notebook f={f} photo={photo} />
            </div>
          </div>
          <Grain f={f} o={0.14} />
        </AbsoluteFill>
      )}
      {f >= 264 && <AbsoluteFill style={{background: C.lilac, clipPath: `circle(${r1}% at 50% 50%)`}} />}
      {f >= 270 && <AbsoluteFill style={{clipPath: `circle(${r2}% at 50% 50%)`}}><TitleScene f={f} episode={episode} photo={photo} /></AbsoluteFill>}
      {fadeOut > 0 && <AbsoluteFill style={{background: C.ink, opacity: fadeOut}} />}
    </AbsoluteFill>
  );
};
