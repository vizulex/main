import React from "react";
import {AbsoluteFill, Img, staticFile, Easing} from "remotion";
import {C, U, G, CV, L, SP, fr, St, Appear, Plate, Card, Draw, bignumStyle, gridPaper, dotsPaper, Grain} from "./kit";
import type {Gfx} from "./Overlays";

export const FULL = new Set(["chapter", "weeks", "loop", "attention", "recap3", "endcard"]);
export const SPLIT = new Set(["bars", "budget", "matrix", "energy", "rules"]);

const Title: React.FC<{children: React.ReactNode; size?: number}> = ({children, size = 64}) => (
  <div style={{fontFamily: U, fontWeight: 800, fontSize: size, color: C.ink, lineHeight: 1.08, letterSpacing: "-0.02em"}}>{children}</div>
);
const Note: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{fontFamily: G, fontWeight: 500, fontSize: 24, color: C.ink, opacity: 0.65, letterSpacing: "0.04em"}}>{children}</div>
);

/* ===== полноэкранные ===== */
export const FullScene: React.FC<{f: number; g: Gfx; photo: string}> = ({f, g, photo}) => {
  const s = fr(g.s);
  switch (g.kind) {
    case "chapter": {
      const p = SP(f, s, 14, 160);
      return (
        <AbsoluteFill style={{background: C.lilac}}>
          <AbsoluteFill style={{...dotsPaper("transparent"), opacity: 0.5}} />
          <div style={{position: "absolute", left: 160, top: 250, transform: `translateX(${(1 - p) * -200}px)`, opacity: p}}>
            <div style={{...bignumStyle(260)}}>{g.n}</div>
          </div>
          <Appear f={f} s={s + 6} mode="up" style={{position: "absolute", left: 160, top: 560, width: 1500}}>
            <div style={{fontFamily: U, fontWeight: 800, fontSize: 88, color: C.milk, lineHeight: 1.05, textShadow: `6px 6px 0 ${C.ink}`}}>{g.title}</div>
          </Appear>
          <Appear f={f} s={s + 12} mode="slap" rot={12} style={{position: "absolute", right: 200, top: 150}}><St k="star" w={170} /></Appear>
          <Appear f={f} s={s + 16} mode="slap" style={{position: "absolute", right: 360, top: 330}}><St k="sparkle" w={110} /></Appear>
          <Grain f={f} o={0.12} />
        </AbsoluteFill>);
    }
    case "weeks": {
      const at = fr(g.at); const cols = 80, rows = 50, gap = 12;
      const fill = L(f, at, at + 45, 0, cols * rows, Easing.out(Easing.quad));
      const lived = 18 * 52;
      return (
        <AbsoluteFill style={{...gridPaper()}}>
          <div style={{position: "absolute", left: 110, top: 150, width: 720}}>
            <Appear f={f} s={s} mode="up"><div style={{...bignumStyle(140)}}>4000</div><Title size={84}>недель</Title></Appear>
            <Appear f={f} s={s + 8} mode="up"><div style={{fontFamily: G, fontWeight: 600, fontSize: 40, color: C.ink, marginTop: 14}}>{g.sub}</div></Appear>
            <Appear f={f} s={at + 50} mode="slap" rot={-4} style={{marginTop: 40}}><Plate bg={C.bubble} size={34}>времени конечно — задач бесконечно</Plate></Appear>
            <Appear f={f} s={at + 30} mode="up" style={{marginTop: 30}}><div style={{fontFamily: CV, fontWeight: 700, fontSize: 46, color: C.lilac, lineHeight: 1.05}}>● = одна неделя<br />сиреневые — уже прожиты (18 лет)</div></Appear>
            <div style={{fontFamily: G, fontSize: 22, color: C.ink, opacity: .6, marginTop: 30}}>Оливер Беркман, «Четыре тысячи недель», 2021</div>
          </div>
          <svg width={cols * gap} height={rows * gap} style={{position: "absolute", right: 110, top: (1080 - rows * gap) / 2}}>
            {Array.from({length: Math.floor(fill)}).map((_, i) => (
              <circle key={i} cx={(i % cols) * gap + gap / 2} cy={Math.floor(i / cols) * gap + gap / 2} r={4.3} fill={i < lived ? C.lilac : C.ink} opacity={i < lived ? 1 : 0.8} />
            ))}
          </svg>
          <Grain f={f} o={0.1} />
        </AbsoluteFill>);
    }
    case "loop": {
      const R = 300, cx = 1180, cy = 560;
      const rot = L(f, s + 30, fr(g.e), 0, 360, Easing.linear);
      return (
        <AbsoluteFill style={{...gridPaper()}}>
          <div style={{position: "absolute", left: 110, top: 160, width: 520}}>
            <Appear f={f} s={s} mode="up"><Title size={78}>{g.title}</Title></Appear>
            <Appear f={f} s={s + 10} mode="up"><div style={{fontFamily: CV, fontWeight: 700, fontSize: 58, color: C.bubble, marginTop: 24}}>замкнутый круг</div></Appear>
            <Appear f={f} s={s + 16} mode="up"><Note>Оливер Беркман</Note></Appear>
          </div>
          <svg width="1920" height="1080" style={{position: "absolute", inset: 0}}>
            <circle cx={cx} cy={cy} r={R} fill="none" stroke={C.lilac} strokeWidth={10} strokeDasharray="4 22" strokeLinecap="round" />
            <g transform={`rotate(${rot} ${cx} ${cy})`}><circle cx={cx} cy={cy - R} r={20} fill={C.bubble} stroke={C.ink} strokeWidth={5} /></g>
          </svg>
          {g.items.map((t: string, i: number) => {
            const a = -Math.PI / 2 + (i / g.items.length) * Math.PI * 2;
            return (
              <Appear key={i} f={f} s={s + 10 + i * 12} mode="slap" style={{position: "absolute", left: cx + Math.cos(a) * R - 170, top: cy + Math.sin(a) * R - 45, width: 340, textAlign: "center"}}>
                <div style={{background: [C.lemon, C.mint, C.sky, C.bubble][i], border: `4px solid ${C.ink}`, borderRadius: 18, padding: "16px 10px", fontFamily: G, fontWeight: 800, fontSize: 34, color: C.ink, boxShadow: `7px 7px 0 ${C.ink}`}}>{t}</div>
              </Appear>);
          })}
          <Grain f={f} o={0.1} />
        </AbsoluteFill>);
    }
    case "attention": {
      const max = 150;
      return (
        <AbsoluteFill style={{...gridPaper()}}>
          <div style={{position: "absolute", left: 140, top: 110, width: 1600}}>
            <Appear f={f} s={s} mode="up"><Title size={66}>{g.title}</Title></Appear>
            <Appear f={f} s={s + 6} mode="up"><Note>{g.note}</Note></Appear>
            <div style={{marginTop: 70, display: "flex", flexDirection: "column", gap: 46}}>
              {g.bars.map((b: any, i: number) => {
                const bs = fr(b.t); const w = L(f, bs, bs + 16, 0, (b.v / max) * 1180, Easing.out(Easing.cubic));
                return (
                  <div key={i} style={{display: "flex", alignItems: "center", gap: 30, opacity: f >= bs ? 1 : 0.15}}>
                    <div style={{width: 140, fontFamily: U, fontWeight: 800, fontSize: 48, color: C.ink}}>{b.label}</div>
                    <div style={{height: 96, width: Math.max(w, 6), background: [C.mint, C.lemon, C.bubble][i], border: `5px solid ${C.ink}`, borderRadius: 20, boxShadow: `8px 8px 0 ${C.ink}`}} />
                    {f >= bs + 10 && <div style={{...bignumStyle(70), whiteSpace: "nowrap"}}>{b.txt}</div>}
                  </div>);
              })}
            </div>
          </div>
          <Grain f={f} o={0.1} />
        </AbsoluteFill>);
    }
    case "recap3": return (
      <AbsoluteFill style={{background: C.ink}}>
        <AbsoluteFill style={{...dotsPaper("transparent"), opacity: 0.25}} />
        <div style={{position: "absolute", left: 160, top: 120, width: 1600}}>
          <Appear f={f} s={s} mode="up"><div style={{fontFamily: U, fontWeight: 800, fontSize: 70, color: C.milk}}>{g.title}</div></Appear>
          <div style={{display: "flex", gap: 40, marginTop: 60}}>
            {g.items.map((it: any, i: number) => (
              <Appear key={i} f={f} s={fr(it.t)} mode="slap" rot={[-3, 2, -2][i]}>
                <div style={{width: 470, height: 300, background: [C.lemon, C.sky, C.bubble][i], border: `5px solid ${C.milk}`, borderRadius: 28, padding: 30, display: "flex", flexDirection: "column", justifyContent: "space-between"}}>
                  <div style={{fontFamily: U, fontWeight: 800, fontSize: 90, color: C.ink, lineHeight: 1}}>{i + 1}</div>
                  <div style={{fontFamily: G, fontWeight: 800, fontSize: 46, color: C.ink, lineHeight: 1.1}}>{it.txt}</div>
                </div>
              </Appear>))}
          </div>
          {g.punch && <Appear f={f} s={fr(g.punch.t)} mode="up" style={{marginTop: 70}}><div style={{fontFamily: CV, fontWeight: 700, fontSize: 96, color: C.bubble}}>{g.punch.txt}</div></Appear>}
        </div>
        <Grain f={f} o={0.12} />
      </AbsoluteFill>);
    case "endcard": return (
      <AbsoluteFill style={{...gridPaper("rgba(156,123,255,.22)", C.milk, 40)}}>
        <Appear f={f} s={s} mode="slap" rot={-5} style={{position: "absolute", left: 150, top: 170}}>
          <div style={{width: 420, padding: "18px 18px 80px", background: "#fff", boxShadow: "0 16px 34px rgba(34,28,70,.3)", position: "relative"}}>
            <div style={{width: 384, height: 440, overflow: "hidden", background: C.lilac50}}><Img src={staticFile(photo)} style={{width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 25%"}} /></div>
            <div style={{position: "absolute", left: 0, right: 0, bottom: 18, textAlign: "center", fontFamily: CV, fontWeight: 700, fontSize: 50, color: C.ink}}>до встречи!</div>
          </div>
        </Appear>
        <div style={{position: "absolute", left: 700, top: 200, width: 1100}}>
          <Appear f={f} s={s + 6} mode="slap" rot={-5}><span style={{display: "inline-block", background: C.bubble, color: C.milk, fontFamily: U, fontWeight: 800, fontSize: 90, padding: "4px 26px 12px", borderRadius: 20, border: `5px solid ${C.ink}`, boxShadow: `8px 8px 0 ${C.ink}`}}>АНТИ</span></Appear>
          <Appear f={f} s={s + 10} mode="up"><div style={{fontFamily: U, fontWeight: 800, fontSize: 130, color: C.ink, lineHeight: 1, marginTop: 10}}>брейнрот</div></Appear>
          <Appear f={f} s={s + 18} mode="up"><div style={{fontFamily: G, fontWeight: 700, fontSize: 44, color: C.ink, marginTop: 40}}>Какую тему разобрать дальше? Пиши в комментариях</div></Appear>
          <div style={{display: "flex", gap: 18, marginTop: 30}}>
            {["прокрастинация", "как вылезти из телефона", "как принимать решения"].map((t, i) => (
              <Appear key={i} f={f} s={s + 26 + i * 6} mode="slap" rot={[-3, 2, -2][i]}><Plate size={30} bg={[C.lemon, C.mint, C.sky][i]}>{t}</Plate></Appear>))}
          </div>
          <Appear f={f} s={s + 50} mode="up" style={{marginTop: 50}}><div style={{fontFamily: CV, fontWeight: 700, fontSize: 70, color: C.lilac}}>подписывайся, если зашло ♡</div></Appear>
        </div>
        <Grain f={f} o={0.1} />
      </AbsoluteFill>);
    default: return null;
  }
};

/* ===== правая панель раздельного экрана ===== */
export const SplitPanel: React.FC<{f: number; g: Gfx}> = ({f, g}) => {
  const s = fr(g.s);
  const box: React.CSSProperties = {position: "absolute", left: 990, top: 90, width: 850, height: 900};
  switch (g.kind) {
    case "bars": {
      const max = 60, H = 500;
      return (
        <div style={box}>
          <Appear f={f} s={s + 6} mode="up"><Title size={50}>{g.title}</Title></Appear>
          <Appear f={f} s={s + 10} mode="up"><Note>{g.note}</Note></Appear>
          <div style={{display: "flex", alignItems: "flex-end", gap: 60, height: H + 120, marginTop: 30, paddingLeft: 30}}>
            {g.bars.map((b: any, i: number) => {
              const bs = fr(b.t); const h = L(f, bs, bs + 14, 0, (b.v / max) * H, Easing.out(Easing.cubic));
              return (
                <div key={i} style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: 200}}>
                  {f >= bs + 8 && <div style={{...bignumStyle(70)}}>{b.v}</div>}
                  <div style={{width: 160, height: h, background: [C.mint, C.bubble, C.sky][i], border: `5px solid ${C.ink}`, borderRadius: "18px 18px 6px 6px", boxShadow: `7px 7px 0 ${C.ink}`}} />
                  <div style={{fontFamily: G, fontWeight: 800, fontSize: 28, color: C.ink, textAlign: "center", opacity: f >= bs ? 1 : 0.2}}>{b.label}</div>
                </div>);
            })}
          </div>
          {g.extra && <Appear f={f} s={fr(g.extra.t)} mode="slap" rot={-4} style={{position: "absolute", right: 0, top: 160}}><Plate bg={C.lemon} size={36}>{g.extra.txt}</Plate></Appear>}
          <div style={{fontFamily: G, fontWeight: 600, fontSize: 26, color: C.ink, opacity: 0.6, marginTop: 6, paddingLeft: 30}}>{g.unit}</div>
        </div>);
    }
    case "budget": {
      const rows = g.rows; const tot = g.total;
      let rem = g.start;
      const seg = rows.map((r: any) => { const st = fr(r.t); return {...r, st, on: f >= st}; });
      seg.forEach((r: any) => { if (r.on) rem += r.v; });
      const colors = [C.sky, C.lilac, C.bubble, C.mandarin];
      return (
        <div style={box}>
          <Appear f={f} s={s + 6} mode="up"><Title size={52}>Бюджет часов на неделю</Title></Appear>
          <div style={{display: "flex", alignItems: "baseline", gap: 18, marginTop: 20}}>
            <div style={{...bignumStyle(150)}}>{f >= fr(tot.t) ? tot.v : rem}</div>
            <div style={{fontFamily: G, fontWeight: 700, fontSize: 40, color: C.ink}}>{f >= fr(tot.t) ? tot.label : "часов"}</div>
          </div>
          <div style={{display: "flex", height: 70, width: 820, border: `5px solid ${C.ink}`, borderRadius: 18, overflow: "hidden", marginTop: 26, background: C.mint}}>
            {seg.map((r: any, i: number) => (
              <div key={i} style={{width: r.on ? L(f, r.st, r.st + 12, 0, (-r.v / g.start) * 810) : 0, background: colors[i], borderRight: r.on ? `4px solid ${C.ink}` : "none"}} />
            ))}
          </div>
          <div style={{display: "flex", flexDirection: "column", gap: 14, marginTop: 30}}>
            {seg.map((r: any, i: number) => (
              <Appear key={i} f={f} s={r.st} mode="left">
                <div style={{display: "flex", alignItems: "center", gap: 18, fontFamily: G, fontWeight: 800, fontSize: 38, color: C.ink}}>
                  <span style={{width: 34, height: 34, borderRadius: 8, background: colors[i], border: `4px solid ${C.ink}`}} />
                  <span style={{width: 420}}>{r.label}</span><span style={{fontFamily: U}}>{r.v}</span>
                </div>
              </Appear>))}
          </div>
          {g.per_day && <Appear f={f} s={fr(g.per_day.t)} mode="slap" rot={-4} style={{marginTop: 30}}><div style={{fontFamily: CV, fontWeight: 700, fontSize: 78, color: C.bubble}}>63 ÷ 7 {g.per_day.txt}</div></Appear>}
        </div>);
    }
    case "matrix": {
      const cell = (q: string) => g.cells.find((c: any) => c.q === q);
      const colors: Record<string, string> = {iu: C.bubble, in: C.mint, nu: C.sky, nn: C.paper};
      const Q = ({q}: {q: string}) => {
        const c = cell(q); const cs = fr(c.t); const on = f >= cs;
        return (
          <div style={{width: 340, height: 300, border: `5px solid ${C.ink}`, borderRadius: 22, background: on ? colors[q] : "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 18, textAlign: "center",
            transform: `scale(${on ? 0.9 + 0.1 * SP(f, cs, 9, 220) : 1})`, boxShadow: on ? `7px 7px 0 ${C.ink}` : "none"}}>
            {on && <div style={{fontFamily: U, fontWeight: 800, fontSize: 38, color: C.ink, lineHeight: 1.1}}>{c.txt}</div>}
          </div>);
      };
      const ax: React.CSSProperties = {fontFamily: G, fontWeight: 800, fontSize: 30, color: C.ink, textAlign: "center"};
      return (
        <div style={box}>
          <Appear f={f} s={s + 6} mode="up"><Title size={54}>{g.title}</Title></Appear>
          <div style={{display: "grid", gridTemplateColumns: "130px 340px 340px", gridTemplateRows: "50px 300px 300px", gap: 20, marginTop: 30}}>
            <div /><div style={ax}>срочно</div><div style={ax}>не срочно</div>
            <div style={{...ax, alignSelf: "center"}}>важно</div><Q q="iu" /><Q q="in" />
            <div style={{...ax, alignSelf: "center"}}>не важно</div><Q q="nu" /><Q q="nn" />
          </div>
        </div>);
    }
    case "energy": {
      const W = 800, H = 420, pk = fr(g.peak);
      const d = "M0 330 C80 300 120 180 200 150 C280 120 330 230 380 260 C430 290 470 90 540 70 C610 50 660 200 720 300 C760 360 790 380 800 390";
      return (
        <div style={box}>
          <Appear f={f} s={s + 6} mode="up"><Title size={54}>{g.title}</Title></Appear>
          <Appear f={f} s={s + 10} mode="up"><Note>энергия в течение дня</Note></Appear>
          <div style={{position: "relative", width: W, height: H + 80, marginTop: 40}}>
            <div style={{position: "absolute", left: 0, top: H, width: W, height: 5, background: C.ink}} />
            {["9:00", "13:00", "17:00", "21:00"].map((t, i) => <div key={i} style={{position: "absolute", left: i * 250, top: H + 14, fontFamily: G, fontWeight: 700, fontSize: 26, color: C.ink, opacity: .7}}>{t}</div>)}
            <Draw f={f} s={s + 12} dur={40} w={W} h={H} d={d} color={C.lilac} sw={12} style={{left: 0, top: 0}} />
            {f >= pk && <Appear f={f} s={pk} mode="slap" style={{position: "absolute", left: 490, top: 10}}><div style={{width: 60, height: 60, borderRadius: 30, background: C.lemon, border: `5px solid ${C.ink}`}} /></Appear>}
          </div>
          {f >= pk && <Appear f={f} s={pk + 6} mode="slap" rot={-3}><Plate bg={C.lemon} size={36}>{g.peak_label}</Plate></Appear>}
        </div>);
    }
    case "rules": return (
      <div style={box}>
        <Appear f={f} s={s + 6} mode="up"><Title size={56}>{g.title}</Title></Appear>
        <div style={{display: "flex", flexDirection: "column", gap: 22, marginTop: 30}}>
          {g.items.map((it: any, i: number) => (
            <Appear key={i} f={f} s={fr(it.t)} mode="left">
              <div style={{display: "flex", gap: 20, alignItems: "flex-start"}}>
                <div style={{flex: "none", width: 70, height: 70, borderRadius: 18, background: [C.lemon, C.bubble, C.mint, C.sky][i], border: `5px solid ${C.ink}`, fontFamily: U, fontWeight: 800, fontSize: 40, color: C.ink, display: "flex", alignItems: "center", justifyContent: "center"}}>{i + 1}</div>
                <div>
                  <div style={{fontFamily: G, fontWeight: 800, fontSize: 38, color: C.ink, lineHeight: 1.15}}>{it.txt}</div>
                  {it.sub && <div style={{display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10}}>
                    {it.sub.map((q: any, j: number) => <Appear key={j} f={f} s={fr(q.t)} mode="slap" rot={[-2, 2, -1][j]}><Plate size={26} bg={C.bubble50}>{q.txt}</Plate></Appear>)}
                  </div>}
                </div>
              </div>
            </Appear>))}
        </div>
      </div>);
    default: return null;
  }
};
