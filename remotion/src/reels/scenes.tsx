import React from "react";
import {Easing, interpolate} from "remotion";
import {C, U, G, CV, L, SP, fr, St, Appear} from "../episode/kit";

/* Сцены с графикой для рилсов (рисуются в верхней части экрана, пока я внизу или в кружке). */
export type Gx = {kind: string; s: number; e: number; [k: string]: any};

export const stroke = (w: number): React.CSSProperties => ({WebkitTextStroke: `${w}px ${C.ink}`, paintOrder: "stroke fill"});
export const shake = (f: number, s: number, amp = 14, len = 10) => {
  if (f < s || f > s + len) return {x: 0, y: 0};
  const k = 1 - (f - s) / len;
  return {x: Math.sin((f - s) * 2.7) * amp * k, y: Math.cos((f - s) * 3.3) * amp * 0.7 * k};
};

export const Pill: React.FC<{bg?: string; color?: string; size?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({bg = "#fff", color = C.ink, size = 50, children, style}) => (
  <div style={{display: "inline-block", background: bg, color, fontFamily: U, fontWeight: 800, fontSize: size, padding: "10px 26px", borderRadius: 18, border: `6px solid ${C.ink}`, boxShadow: `7px 7px 0 ${C.ink}`, whiteSpace: "pre-line", textAlign: "center", lineHeight: 1.1, ...style}}>{children}</div>
);

export const countUp = (f: number, s: number, txt: string) => {
  const m = txt.match(/^([^\d]*)(\d+)(.*)$/);
  if (!m) return txt;
  return m[1] + Math.round(parseInt(m[2]) * L(f, s, s + 12, 0, 1, Easing.out(Easing.cubic))) + m[3];
};

export const Label: React.FC<{children: React.ReactNode; bg?: string; size?: number; rot?: number}> = ({children, bg = C.ink, size = 40, rot = -3}) => (
  <div style={{display: "inline-block", background: bg, color: bg === C.ink ? "#fff" : C.ink, fontFamily: G, fontWeight: 800, fontSize: size, padding: "6px 20px", borderRadius: 12, transform: `rotate(${rot}deg)`, border: `4px solid ${C.ink}`}}>{children}</div>
);

const Bubble: React.FC<{children: React.ReactNode; bg?: string; size?: number}> = ({children, bg = "#fff", size = 60}) => (
  <div style={{position: "relative", background: bg, border: `6px solid ${C.ink}`, borderRadius: 30, padding: "16px 30px", fontFamily: U, fontWeight: 800, fontSize: size, color: C.ink, boxShadow: `8px 8px 0 ${C.ink}`, whiteSpace: "nowrap"}}>{children}</div>
);

export const SceneBody: React.FC<{g: Gx; f: number; s: number; e: number}> = ({g, f, s, e}) => {
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
