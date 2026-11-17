import React from "react";
import {Img, interpolate, Easing} from "remotion";
import {L, SP, fr, U, G} from "../episode/kit";
import {Cut, Label, Ransom, Digits, Hourglass, Clicker, Tape, P, HAND, AMATIC, MONO, PF, OSW, lib, shadow, pop} from "./collage";

/* Сцены 2-го выпуска. Сцена — набор деталей коллажа (items) и/или анимированная схема (kind).
   Времена в секундах выходного таймлайна; t у детали — когда она появляется. */
type G = {kind: string; s: number; e: number; items?: any[]; [k: string]: any};
export const FULLSCREEN = new Set<string>();

const Item: React.FC<{f: number; it: any; e: number}> = ({f, it, e}) => {
  const s = fr(it.t), ee = fr(it.e ?? e);
  switch (it.k) {
    case "cut": return <Cut f={f} s={s} e={ee} src={it.src} x={it.x} y={it.y} w={it.w} rot={it.rot ?? 0} />;
    case "label": return <Label f={f} s={s} e={ee} text={it.text} x={it.x} y={it.y} size={it.size ?? 54} rot={it.rot ?? -3} bg={it.bg ? (P as any)[it.bg] ?? it.bg : P.paper}
      color={it.color ? (P as any)[it.color] ?? it.color : P.ink} font={({hand: HAND, amatic: AMATIC, mono: MONO, pf: PF, osw: OSW} as any)[it.font ?? "hand"]} tape={it.tape ?? true} maxW={it.maxW ?? 760} />;
    case "ransom": return <Ransom f={f} s={s} e={ee} text={it.text} x={it.x} y={it.y} size={it.size ?? 110} rot={it.rot ?? -2} />;
    case "digits": return <Digits f={f} s={s} e={ee} value={it.value} x={it.x} y={it.y} h={it.h ?? 220} rot={it.rot ?? -3} />;
    case "hourglass": return <Hourglass f={f} s={s} e={ee} x={it.x} y={it.y} w={it.w ?? 200} />;
    case "clicker": return <Clicker f={f} s={s} e={ee} x={it.x} y={it.y} />;
    case "tape": return f >= s && f <= ee ? <Tape x={it.x} y={it.y} w={it.w ?? 160} rot={it.rot ?? -10} /> : null;
    case "strike": { // перечёркивание маркером
      if (f < s || f > ee) return null;
      const p = L(f, s, s + 8, 0, 1, Easing.out(Easing.quad));
      return <div style={{position: "absolute", left: it.x, top: it.y, width: it.w * p, height: 14, background: P.red, borderRadius: 7, transform: `rotate(${it.rot ?? -4}deg)`, transformOrigin: "0 50%", opacity: 0.92}} />;
    }
    case "text": { // крупный цветной текст (хук)
      const pp = pop(f, s, ee, it.text); if (!pp) return null;
      return <div style={{position: "absolute", left: it.x, top: it.y, transform: `translate(-50%,-50%) rotate(${it.rot ?? -2}deg) scale(${pp.sc})`, opacity: pp.o, fontFamily: ({u: U, pf: PF, osw: OSW, mono: MONO, amatic: AMATIC, hand: HAND} as any)[it.font ?? "u"],
        fontWeight: 800, fontSize: it.size ?? 120, lineHeight: 1, color: it.color ? (P as any)[it.color] ?? it.color : P.ink, textAlign: "center", whiteSpace: "pre-line", fontStyle: it.font === "pf" ? "italic" : "normal",
        textShadow: it.shadow === false ? "none" : "4px 6px 0 rgba(30,26,46,.18)"}}>{it.text}</div>;
    }
    default: return null;
  }
};

/* ---------- анимированные схемы ---------- */
const Card: React.FC<{children: React.ReactNode; style?: React.CSSProperties; bg?: string}> = ({children, style, bg = P.paper}) => (
  <div style={{background: bg, padding: "18px 24px", filter: shadow, clipPath: "polygon(0 2%,6% 0,30% 2%,55% 0,80% 2%,100% 0,99% 50%,100% 100%,70% 98%,40% 100%,12% 98%,0 100%,1% 50%)", ...style}}>{children}</div>
);

const Chat: React.FC<{f: number; g: G}> = ({f, g}) => { // нейромедиатор = личка, гормон = рассылка
  const s = fr(g.s), t2 = fr(g.t2);
  const bubble = (txt: string, mine: boolean) => <div style={{alignSelf: mine ? "flex-end" : "flex-start", background: mine ? "#3B82F6" : "#E9E9EE", color: mine ? "#fff" : "#111", borderRadius: 22, padding: "10px 18px", fontFamily: G, fontSize: 30, maxWidth: 420}}>{txt}</div>;
  const phone = (title: string, sub: string, msgs: React.ReactNode, at: number, x: number, rot: number) => {
    const pp = pop(f, at, fr(g.e), title); if (!pp) return null;
    return <div style={{position: "absolute", left: x, top: 560, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${pp.sc})`, opacity: pp.o, width: 520, height: 760, background: "#fff", borderRadius: 48, border: `14px solid ${P.ink}`, filter: shadow, overflow: "hidden", display: "flex", flexDirection: "column"}}>
      <div style={{padding: "22px 24px 12px", borderBottom: "1px solid #ddd", fontFamily: G, fontWeight: 700, fontSize: 30}}>{title}<div style={{fontWeight: 400, fontSize: 22, color: "#888"}}>{sub}</div></div>
      <div style={{flex: 1, display: "flex", flexDirection: "column", gap: 12, padding: 22, justifyContent: "flex-end"}}>{msgs}</div>
    </div>;
  };
  return <>
    {phone("Нейрон-сосед", "личка · доли секунды", <>{bubble("лови сигнал", true)}{bubble("принял, передаю дальше", false)}</>, s, g.x1 ?? 560, -4)}
    {phone("Всё тело 👥 248", "общий чат · медленно, но все в курсе", <>{bubble("Внимание всем органам!", true)}{bubble("сердце: ок", false)}{bubble("желудок: понял", false)}</>, t2, g.x2 ?? 1360, 3)}
    <Label f={f} s={s + 6} e={fr(g.e)} text="нейромедиатор" x={g.x1 ?? 560} y={150} size={58} rot={-4} />
    <Label f={f} s={t2 + 6} e={fr(g.e)} text="гормон" x={g.x2 ?? 1360} y={150} size={58} rot={3} bg={P.yellow} />
  </>;
};

const Gauge: React.FC<{f: number; g: G}> = ({f, g}) => { // «хочу» на полную, «нравится» почти ноль
  const s = fr(g.s), e = fr(g.e);
  const bar = (label: string, val: number, at: number, y: number, col: string) => {
    const pp = pop(f, at, e, label); if (!pp) return null;
    const w = L(f, at + 4, at + 22, 0, val, Easing.out(Easing.cubic));
    return <div style={{position: "absolute", left: 1060, top: y, opacity: pp.o, transform: `rotate(-1.5deg) scale(${pp.sc})`, transformOrigin: "0 50%"}}>
      <div style={{fontFamily: HAND, fontSize: 64, color: P.ink, marginBottom: 8}}>{label}</div>
      <div style={{width: 700, height: 70, background: "#fff", border: `5px solid ${P.ink}`, borderRadius: 12, overflow: "hidden", filter: shadow}}>
        <div style={{width: `${w}%`, height: "100%", background: col}} />
      </div>
    </div>;
  };
  return <>{bar("хочу", 100, s, 300, P.red)}{bar("нравится", 8, fr(g.t2 ?? g.s + 1.2), 560, P.pink)}</>;
};

const Series: React.FC<{f: number; g: G}> = ({f, g}) => { // опыт Шульца: три серии
  const e = fr(g.e);
  const cards = [
    {t: g.t1, title: "серия 1", line: "сок без предупреждения", spike: "сок"},
    {t: g.t2, title: "серия 2", line: "лампочка → сок", spike: "лампочка"},
    {t: g.t3, title: "серия 3", line: "лампочка → сока нет", spike: "провал"},
  ];
  return <>{cards.map((c, i) => {
    const at = fr(c.t); const pp = pop(f, at, e, c.title); if (!pp) return null;
    const x = (g.x0 ?? 330) + i * (g.step ?? 630);
    const path = i === 0 ? "M10 120 L120 120 L160 30 L200 120 L320 120" : i === 1 ? "M10 120 L60 120 L100 30 L140 120 L320 120" : "M10 120 L60 120 L100 30 L140 120 L200 120 L230 175 L260 120 L320 120";
    const dl = L(f, at + 6, at + 26, 0, 1);
    return <div key={i} style={{position: "absolute", left: x, top: 540, transform: `translate(-50%,-50%) rotate(${[-3, 2, -2][i]}deg) scale(${pp.sc * (g.sc ?? 1)})`, opacity: pp.o}}>
      <Card style={{width: 520, height: 520, display: "flex", flexDirection: "column", alignItems: "center", gap: 10}}>
        <div style={{fontFamily: MONO, fontSize: 40, color: P.red}}>{c.title}</div>
        <Img src={lib(i === 0 ? "juice.png" : "bulb.png")} style={{height: 170}} />
        <div style={{fontFamily: HAND, fontSize: 40, color: P.ink, textAlign: "center"}}>{c.line}</div>
        <svg width={330} height={190} viewBox="0 0 330 190"><line x1={0} y1={120} x2={330} y2={120} stroke="#bbb" strokeDasharray="6 6" strokeWidth={3} />
          <path d={path} fill="none" stroke={P.red} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - dl} /></svg>
      </Card>
    </div>;
  })}<Cut f={f} s={fr(g.t1) + 4} e={e} src="monkey.png" x={g.monkeyX ?? 1760} y={g.monkeyY ?? 900} w={200} rot={6} /></>;
};

const Odds: React.FC<{f: number; g: G}> = ({f, g}) => {
  const e = fr(g.e);
  const cs = [{v: "100%", l: "сок всегда"}, {v: "0%", l: "сока никогда"}, {v: "50%", l: "то ли будет, то ли нет", win: true}];
  return <>{cs.map((c, i) => {
    const at = fr(g.s) + i * 8; const pp = pop(f, at, e, c.v); if (!pp) return null;
    const win = c.win && f >= fr(g.t2);
    return <div key={i} style={{position: "absolute", left: (g.x0 ?? 380) + i * (g.step ?? 580), top: 520, transform: `translate(-50%,-50%) rotate(${[-3, 2, -1][i]}deg) scale(${pp.sc * (win ? 1.08 : 1) * (g.sc ?? 1)})`, opacity: pp.o}}>
      <Card bg={win ? P.yellow : P.paper} style={{width: 440, padding: "30px 24px", textAlign: "center"}}>
        <div style={{fontFamily: MONO, fontSize: 110, color: P.ink}}>{c.v}</div>
        <div style={{fontFamily: HAND, fontSize: 44, color: P.ink}}>{c.l}</div>
        {win && <div style={{fontFamily: AMATIC, fontSize: 70, color: P.red, marginTop: 6}}>максимум дофамина</div>}
      </Card>
    </div>;
  })}<Cut f={f} s={fr(g.t2)} e={e} src="coin.png" x={g.coinX ?? 1530} y={g.coinY ?? 880} w={170} rot={12} /></>;
};

const Notif: React.FC<{f: number; g: G}> = ({f, g}) => { // уведомления: по одному vs пачкой 3 раза в день
  const s = fr(g.s), e = fr(g.e), t2 = fr(g.t2);
  const items = Array.from({length: 9}, (_, i) => i);
  const batch = f >= t2;
  return <div style={{position: "absolute", left: 1350, top: 540, transform: "translate(-50%,-50%) rotate(2deg)", width: 560, height: 900, background: "#111", borderRadius: 60, border: "14px solid #222", filter: shadow, overflow: "hidden", opacity: L(f, s, s + 6, 0, 1) * L(f, e - 6, e, 1, 0)}}>
    <div style={{fontFamily: G, color: "#fff", fontSize: 92, fontWeight: 300, textAlign: "center", marginTop: 60}}>9:41</div>
    {items.map((i) => {
      const at = s + 6 + i * 5; if (f < at) return null;
      const y = batch ? 300 + Math.min(i, 2) * 16 : 260 + i * 66;
      const sc = batch ? 1 - Math.min(i, 2) * 0.04 : 1;
      return <div key={i} style={{position: "absolute", left: 30, right: 30, top: y, height: 58, background: "rgba(255,255,255,.88)", borderRadius: 18, transform: `scale(${sc * SP(f, at, 12, 220)})`, opacity: batch && i > 2 ? 0 : 1,
        fontFamily: G, fontSize: 24, padding: "14px 18px", color: "#111"}}>{["TikTok · новое видео", "Instagram · лайк", "Telegram · 3 сообщения", "YouTube · вышло видео", "TikTok · тебе понравится", "Instagram · сторис", "Telegram · канал", "VK · отметка", "TikTok · LIVE"][i]}</div>;
    })}
    {batch && <div style={{position: "absolute", left: 30, right: 30, top: 390, fontFamily: HAND, fontSize: 44, color: P.yellow, textAlign: "center"}}>9 уведомлений · пачкой в 13:00</div>}
  </div>;
};

const Corridor: React.FC<{f: number; g: G}> = ({f, g}) => { // эффект градиента цели: крыса ускоряется к еде
  const s = fr(g.s), e = fr(g.e);
  const T = Math.max(1, fr(g.run ?? 4));
  const x = 200 + 1300 * Math.pow(L(f, s + 8, s + 8 + T, 0, 1, Easing.linear), 2.4);
  return <>
    <div style={{position: "absolute", left: 120, right: 120, top: 640, height: 160, background: P.kraft, border: `6px solid ${P.ink}`, filter: shadow, opacity: L(f, s, s + 6, 0, 1) * L(f, e - 6, e, 1, 0)}} />
    <Cut f={f} s={s + 4} e={e} src="milk.png" x={1650} y={640} w={210} rot={4} />
    {f >= s + 6 && f <= e && <Img src={lib("rat.png")} style={{position: "absolute", left: x, top: 560, width: 200, transform: "translate(-50%,-50%) scaleX(-1)", filter: shadow}} />}
    <Label f={f} s={s + 8} e={e} text="шагом" x={420} y={900} size={48} rot={-3} />
    <Label f={f} s={s + 8 + T * 0.6} e={e} text="бегом" x={950} y={900} size={48} rot={2} />
    <Label f={f} s={s + 8 + T * 0.9} e={e} text="летит!" x={1420} y={900} size={56} rot={-2} bg={P.yellow} />
  </>;
};

const Loading: React.FC<{f: number; g: G}> = ({f, g}) => { // дофамин растёт по пути к цели
  const s = fr(g.s), e = fr(g.e);
  const v = L(f, s + 6, e - 10, 0, 100, Easing.in(Easing.quad));
  const pp = pop(f, s, e, "load"); if (!pp) return null;
  return <div style={{position: "absolute", left: 1350, top: 470, transform: `translate(-50%,-50%) rotate(-2deg) scale(${pp.sc})`, opacity: pp.o}}>
    <Card style={{width: 760, padding: "28px 34px"}}>
      <div style={{fontFamily: HAND, fontSize: 56, color: P.ink, marginBottom: 14}}>дофамин по пути к цели</div>
      <div style={{height: 70, background: "#fff", border: `5px solid ${P.ink}`, borderRadius: 12, overflow: "hidden"}}><div style={{width: `${v}%`, height: "100%", background: `repeating-linear-gradient(45deg, ${P.yellow} 0 24px, #F2B705 24px 48px)`}} /></div>
      <div style={{fontFamily: MONO, fontSize: 44, color: P.ink, marginTop: 12, textAlign: "right"}}>{Math.round(v)}%</div>
    </Card>
  </div>;
};

const Stamps: React.FC<{f: number; g: G}> = ({f, g}) => { // кофейные карточки 10 vs 12 с двумя штампами
  const s = fr(g.s), e = fr(g.e), t2 = fr(g.t2);
  const card = (n: number, pre: number, at: number, y: number, rot: number, label: string) => {
    const pp = pop(f, at, e, label); if (!pp) return null;
    return <div style={{position: "absolute", left: 1330, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${pp.sc})`, opacity: pp.o}}>
      <Card style={{width: 820, padding: "20px 26px"}}>
        <div style={{fontFamily: HAND, fontSize: 40, color: P.ink, marginBottom: 10}}>{label}</div>
        <div style={{display: "flex", flexWrap: "wrap", gap: 12}}>{Array.from({length: n}, (_, i) => (
          <div key={i} style={{width: 52, height: 52, borderRadius: 26, border: `4px solid ${P.ink}`, background: i < pre ? P.red : "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: MONO, fontSize: 26}}>{i < pre ? "✓" : ""}</div>))}</div>
      </Card>
    </div>;
  };
  return <>{card(10, 0, s, 340, -2, "карточка А: 10 штампов, пустая")}{card(12, 2, t2, 700, 2, "карточка Б: 12 штампов, 2 уже стоят")}<Cut f={f} s={s + 6} e={e} src="coffee.png" x={600} y={860} w={260} rot={-8} /></>;
};

const Checklist: React.FC<{f: number; g: G}> = ({f, g}) => { // список с галочками на стикере
  const s = fr(g.s), e = fr(g.e);
  const pp = pop(f, s, e, "list"); if (!pp) return null;
  return <div style={{position: "absolute", left: g.x ?? 620, top: g.y ?? 520, transform: `translate(-50%,-50%) rotate(${g.rot ?? -3}deg) scale(${pp.sc})`, opacity: pp.o}}>
    <Img src={lib("sticky_lined.png")} style={{width: 760, filter: shadow}} />
    <div style={{position: "absolute", left: 120, top: 150, right: 60, display: "flex", flexDirection: "column", gap: 10}}>
      {g.head && <div style={{fontFamily: AMATIC, fontSize: 64, color: P.red, marginBottom: 4}}>{g.head}</div>}
      {(g.rows as any[]).map((r, i) => {
        const at = fr(r.t); if (f < at) return null;
        const ck = r.ck !== undefined && f >= fr(r.ck);
        return <div key={i} style={{fontFamily: HAND, fontSize: 44, color: P.ink, display: "flex", alignItems: "center", gap: 14, opacity: Math.min(1, (f - at) / 4)}}>
          <span style={{width: 40, height: 40, border: `4px solid ${P.ink}`, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", color: P.red, fontSize: 40}}>{ck ? "✓" : ""}</span>
          <span style={{textDecoration: ck && r.strike ? "line-through" : "none"}}>{r.text}</span>
        </div>;
      })}
    </div>
  </div>;
};

const BrainMap: React.FC<{f: number; g: G}> = ({f, g}) => { // карта мозга по долям (старинный профиль головы)
  const s = fr(g.s), e = fr(g.e);
  const pp = pop(f, s, e, "map"); if (!pp) return null;
  return <div style={{position: "absolute", left: g.x ?? 1350, top: 540, transform: `translate(-50%,-50%) rotate(2deg) scale(${pp.sc})`, opacity: pp.o}}>
    <Img src={lib("lobes_head.jpg")} style={{width: 640, filter: shadow, border: "12px solid #fff"}} />
    {(g.zones as any[] || []).map((z, i) => <Label key={i} f={f} s={fr(z.t)} e={e} text={z.text} x={z.x} y={z.y} size={40} rot={z.rot ?? -3} bg={z.bg ? (P as any)[z.bg] : P.yellow} tape={false} />)}
  </div>;
};

export const Scene: React.FC<{f: number; g: G}> = ({f, g}) => {
  const e = fr(g.e);
  const body = (() => {
    switch (g.kind) {
      case "chat": return <Chat f={f} g={g} />;
      case "gauge": return <Gauge f={f} g={g} />;
      case "series": return <Series f={f} g={g} />;
      case "odds": return <Odds f={f} g={g} />;
      case "notif": return <Notif f={f} g={g} />;
      case "corridor": return <Corridor f={f} g={g} />;
      case "loading": return <Loading f={f} g={g} />;
      case "stamps": return <Stamps f={f} g={g} />;
      case "checklist": return <Checklist f={f} g={g} />;
      case "map": return <BrainMap f={f} g={g} />;
      default: return null;
    }
  })();
  return <>{body}{(g.items || []).map((it: any, i: number) => <Item key={i} f={f} it={it} e={e} />)}</>;
};
