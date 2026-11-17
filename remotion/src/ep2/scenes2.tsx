import React from "react";
import {Img, interpolate, Easing} from "remotion";
import {L, SP, fr, U, G} from "../episode/kit";
import {Cut, Label, Ransom, Digits, Hourglass, Clicker, Tape, P, HAND, AMATIC, MONO, PF, OSW, lib, shadow, pop} from "./collage";
import {loadFont as loadPTMono} from "@remotion/google-fonts/PTMono";
const TYPE = loadPTMono("normal", {weights: ["400"], subsets: ["cyrillic", "latin"]}).fontFamily;

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
    case "photo": { // фото в белой рамке, как полароид
      const pp = pop(f, s, ee, it.src + it.t); if (!pp) return null;
      return <div style={{position: "absolute", left: it.x, top: it.y + pp.dy, transform: `translate(-50%,-50%) rotate(${(it.rot ?? 0) + pp.wob * 0.5}deg) scale(${pp.sc})`, opacity: pp.o, background: "#fff", padding: "14px 14px 44px", filter: shadow}}>
        <Img src={lib(it.src)} style={{width: it.w, height: it.h ?? it.w, objectFit: "cover", display: "block"}} /></div>;
    }
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
    return <div key={i} style={{position: "absolute", left: x, top: g.y ?? 540, transform: `translate(-50%,-50%) rotate(${[-3, 2, -2][i]}deg) scale(${pp.sc * (g.sc ?? 1)})`, opacity: pp.o}}>
      <Card style={{width: 520, height: 520, display: "flex", flexDirection: "column", alignItems: "center", gap: 10}}>
        <div style={{fontFamily: MONO, fontSize: 40, color: P.red}}>{c.title}</div>
        <div style={{display: "flex", alignItems: "center", gap: 10}}>
          {i !== 0 && <Img src={lib("bulb.png")} style={{height: 150}} />}
          {i !== 2 && <><span style={{fontFamily: MONO, fontSize: 40, color: P.ink, display: i === 1 ? "inline" : "none"}}>+</span><Img src={lib("juice.png")} style={{height: 170}} /></>}
          {i === 2 && <span style={{fontFamily: MONO, fontSize: 40, color: P.red}}>+ ✗</span>}
        </div>
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
    return <div key={i} style={{position: "absolute", left: (g.x0 ?? 380) + i * (g.step ?? 580), top: g.y ?? 520, transform: `translate(-50%,-50%) rotate(${[-3, 2, -1][i]}deg) scale(${pp.sc * (win ? 1.08 : 1) * (g.sc ?? 1)})`, opacity: pp.o}}>
      <Card bg={win ? P.yellow : P.paper} style={{width: 440, padding: "30px 24px", textAlign: "center"}}>
        <div style={{fontFamily: MONO, fontSize: 110, color: P.ink}}>{c.v}</div>
        <div style={{fontFamily: HAND, fontSize: 44, color: P.ink}}>{c.l}</div>
        {win && <div style={{fontFamily: AMATIC, fontSize: 70, color: P.red, marginTop: 6}}>максимум дофамина</div>}
      </Card>
    </div>;
  })}{f >= fr(g.t2) && f <= e && (() => { // монетка подлетает и крутится
    const k = L(f, fr(g.t2), fr(g.t2) + 22, 0, 1, Easing.out(Easing.cubic));
    const cx = (g.coinX ?? 1530) + (1 - k) * 700, cy = (g.coinY ?? 880) - (1 - k) * 500 - Math.sin(k * Math.PI) * 120;
    const spin = Math.cos((f - fr(g.t2)) * 0.45);
    return <Img src={lib("coin.png")} style={{position: "absolute", left: cx, top: cy, width: 190, transform: `translate(-50%,-50%) scaleX(${spin}) rotate(${(1 - k) * 200}deg)`, filter: shadow, opacity: L(f, e - 7, e, 1, 0)}} />;
  })()}</>;
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
    <Img src={lib(g.img ?? "sticky_lined.png")} style={{width: g.w ?? 760, filter: shadow}} />
    <div style={{position: "absolute", left: (g.pad ?? [120, 150, 60])[0], top: (g.pad ?? [120, 150, 60])[1], right: (g.pad ?? [120, 150, 60])[2], display: "flex", flexDirection: "column", gap: 10}}>
      {g.head && <div style={{fontFamily: AMATIC, fontSize: 64, color: P.red, marginBottom: 4}}>{g.head}</div>}
      {(g.rows as any[]).map((r, i) => {
        const at = fr(r.t); if (f < at) return null;
        const ck = r.ck !== undefined && f >= fr(r.ck);
        return <div key={i} style={{fontFamily: g.font === "amatic" ? AMATIC : HAND, fontWeight: g.font === "amatic" ? 700 : 400, lineHeight: 1.0, fontSize: g.fs ?? 44, color: P.ink, display: "flex", alignItems: "center", gap: 14, opacity: Math.min(1, (f - at) / 4)}}>
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


const HeadNotif: React.FC<{f: number; g: G}> = ({f, g}) => { // голова открывается, из неё вылетают уведомления; потом телефон с пачками
  const s = fr(g.s), e = fr(g.e), t2 = fr(g.t2);
  const W = 560, k = W / 1080, X = g.x ?? 1440, Y = g.hy ?? g.y ?? 560; // лицо: 1080×1049 исходника
  const headOut = L(f, t2 - 8, t2, 1, 0);
  if (f < s || f > e) return null;
  const lift = L(f, s + 8, s + 26, 0, 1, Easing.out(Easing.back(1.4)));
  const names = ["TikTok · новое видео", "Instagram · лайк", "Telegram · 5 сообщений", "YouTube · новое видео", "TikTok · тебе понравится", "Instagram · сторис", "VK · отметка", "Telegram · канал", "TikTok · LIVE", "WhatsApp · 12 сообщений", "Instagram · reels", "TikTok · 99+"];
  const n0 = s + 26, step = Math.max(4, Math.floor((t2 - n0) / names.length));
  const shown = names.filter((_, i) => f >= n0 + i * step).length;
  const raise = Math.max(0, shown - 9) * 10; // крышку подпирает растущая куча
  return <>
    {headOut > 0 && <div style={{position: "absolute", left: X - W / 2, top: Y - 1049 * k / 2 + 80, width: W, opacity: headOut}}>
      {names.map((nm, i) => { // уведомления набиваются кучей внутрь головы; лицо лежит поверх
        const at = n0 + i * step; if (f < at) return null;
        const sp = SP(f, at, 11, 200);
        const tx = ((i * 37) % 7 - 3) * 22, ty = 34 - i * 18;
        return <div key={i} style={{position: "absolute", left: W / 2 - 165 + tx, top: 140 + (ty - 140) * sp, width: 330, background: "rgba(255,255,255,.97)", borderRadius: 16, padding: "10px 16px", fontFamily: G, fontSize: 22, color: "#111", boxShadow: "0 6px 18px rgba(0,0,0,.25)", transform: `rotate(${((i * 13) % 11 - 5) * 1.6}deg)`, opacity: Math.min(1, sp * 2), zIndex: 1}}>{nm}</div>;
      })}
      <Img src={lib("head_top.png")} style={{position: "absolute", left: 233 * k, top: (418 - 969) * k - lift * 140 - raise, width: 733 * k, transform: `rotate(${-lift * 7}deg)`, transformOrigin: "10% 90%", filter: shadow, zIndex: 3}} />
      <Img src={lib("head_face.png")} style={{position: "relative", width: W, display: "block", filter: shadow, zIndex: 2}} />
    </div>}
    {f >= t2 - 2 && <Notif f={f} g={{...g, s: g.t2, t2: g.t3 ?? g.t2 + 1}} />}
  </>;
};

const Typewriter: React.FC<{f: number; g: G}> = ({f, g}) => { // машинка печатает дела, потом галочки
  const s = fr(g.s), e = fr(g.e);
  const pp = pop(f, s, e, "tw"); if (!pp) return null;
  const H = g.h ?? 1000, W = H * 1060 / 1600, FS = g.fs ?? H * 0.036;
  return <div style={{position: "absolute", left: (g.x ?? 480) - W / 2, top: (g.y ?? 540) - H / 2, width: W, height: H, opacity: pp.o, transform: `scale(${pp.sc})`}}>
    <Img src={lib("typewriter.jpg")} style={{width: W, height: H, filter: shadow}} />
    <div style={{position: "absolute", left: W * 0.27, top: H * 0.085, width: W * 0.46, display: "flex", flexDirection: "column", gap: H * 0.012}}>
      {g.head && <div style={{fontFamily: TYPE, fontSize: H * 0.03, color: P.red, marginBottom: H * 0.01}}>{g.head}</div>}
      {(g.rows as any[]).map((r, i) => {
        const at = fr(r.t); if (f < at) return null;
        const n = Math.min(r.text.length, Math.floor((f - at) * 0.8));
        const ck = r.ck !== undefined && f >= fr(r.ck);
        return <div key={i} style={{fontFamily: TYPE, fontSize: FS, letterSpacing: "-0.06em", color: P.ink, lineHeight: 1.08, display: "flex", gap: 6}}>
          <span style={{color: P.red, width: H * 0.03, display: "inline-block", transform: `scale(${ck ? SP(f, fr(r.ck), 9, 260) : 0})`}}>✓</span>
          <span>{r.text.slice(0, n)}{n < r.text.length && (f % 10 < 5) ? "▌" : ""}</span>
        </div>;
      })}
    </div>
  </div>;
};

const Notebook: React.FC<{f: number; g: G}> = ({f, g}) => { // блокнот: советы под красивыми цифрами
  const s = fr(g.s), e = fr(g.e);
  const pp = pop(f, s, e, "nb"); if (!pp) return null;
  const W = g.w ?? 900;
  return <div style={{position: "absolute", left: (g.x ?? 480) - W / 2, top: (g.y ?? 540) - W / 2, width: W, height: W, opacity: pp.o, transform: `scale(${pp.sc}) rotate(-2deg)`}}>
    <Img src={lib("notebook.jpg")} style={{width: W, height: W, filter: shadow}} />
    <div style={{position: "absolute", left: W * 0.4, top: W * 0.09, width: W * 0.5, display: "flex", flexDirection: "column", gap: W * 0.02}}>
      {g.head && <div style={{fontFamily: AMATIC, fontSize: W * 0.075, color: P.red, lineHeight: 1}}>{g.head}</div>}
      {(g.rows as any[]).map((r, i) => {
        const at = fr(r.t); if (f < at) return null;
        const d = ["00", "04", "01"][i] ?? "00";
        const w = L(f, at + 6, at + 26, 0, 100);
        return <div key={i} style={{display: "flex", gap: W * 0.02, alignItems: "flex-start"}}>
          <Img src={lib(`digits_${d}.png`)} style={{height: W * 0.11, transform: `scale(${SP(f, at, 9, 240)}) rotate(-6deg)`}} />
          <div style={{fontFamily: HAND, fontSize: W * 0.045, color: P.ink, lineHeight: 1.15, clipPath: `inset(0 ${100 - w}% 0 0)`, paddingTop: W * 0.015}}>{r.text}</div>
        </div>;
      })}
    </div>
  </div>;
};

const Boxes: React.FC<{f: number; g: G}> = ({f, g}) => { // коробки вокруг по очереди открываются и показывают героев
  const s = fr(g.s), e = fr(g.e);
  if (f < s || f > e) return null;
  const out = L(f, e - 7, e, 1, 0);
  return <>{(g.boxes as any[]).map((b, i) => {
    const at = s + i * 4, op = fr(b.t);
    const sp = SP(f, at, 11, 200); const opened = f >= op;
    const hero = opened ? SP(f, op + 2, 9, 180) : 0;
    const shake = !opened && f > op - 12 ? Math.sin(f * 1.6) * 4 : 0;
    return <div key={i} style={{position: "absolute", left: b.x, top: b.y, transform: `translate(-50%,-50%) scale(${sp}) rotate(${shake}deg)`, opacity: out}}>
      {opened && <Img src={lib(b.src)} style={{position: "absolute", left: "50%", bottom: 120 + hero * 70, width: b.w ?? 220, transform: `translateX(-50%) scale(${hero}) rotate(${b.rot ?? 0}deg)`, transformOrigin: "50% 100%", filter: shadow}} />}
      <Img src={lib(opened ? "box_open.png" : "box_closed.png")} style={{width: 300, display: "block", position: "relative", filter: shadow}} />
    </div>;
  })}</>;
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
      case "headnotif": return <HeadNotif f={f} g={g} />;
      case "typewriter": return <Typewriter f={f} g={g} />;
      case "notebook": return <Notebook f={f} g={g} />;
      case "boxes": return <Boxes f={f} g={g} />;
      default: return null;
    }
  })();
  return <>{body}{(g.items || []).map((it: any, i: number) => <Item key={i} f={f} it={it} e={e} />)}</>;
};
