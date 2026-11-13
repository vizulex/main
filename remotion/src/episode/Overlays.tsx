import React from "react";
import {AbsoluteFill, Img, staticFile, Easing} from "remotion";
import {C, U, G, CV, L, SP, fr, St, Appear, Plate, Card, Draw, bignumStyle, jitter} from "./kit";

export type Gfx = {kind: string; s: number; e: number; [k: string]: any};

const sidePos = (side: string): React.CSSProperties =>
  side === "left" ? {position: "absolute", left: 80, top: 150} : {position: "absolute", right: 80, top: 150};

/* Карточка-обёртка: входит «шлёпом», выходит за 8 кадров */
const Side: React.FC<{f: number; g: Gfx; w?: number; rot?: number; children: React.ReactNode; pos?: React.CSSProperties}> = ({f, g, w = 600, rot = -2, children, pos}) => (
  <Appear f={f} s={fr(g.s)} e={fr(g.e)} mode="slap" rot={rot + jitter(f, g.kind + g.s, 0.4)} style={{...(pos ?? sidePos(g.side ?? "right")), width: w}}>
    {children}
  </Appear>
);

const Item: React.FC<{f: number; t: number; children: React.ReactNode; mode?: "pop" | "slap" | "up" | "left"}> = ({f, t, children, mode = "up"}) => (
  <Appear f={f} s={fr(t)} mode={mode}>{children}</Appear>
);

const countUp = (f: number, s: number, txt: string) => {
  const m = txt.match(/^(\d+)(.*)$/);
  if (!m) return txt;
  const p = L(f, s, s + 14, 0, 1, Easing.out(Easing.cubic));
  return String(Math.round(parseInt(m[1]) * p)) + m[2];
};

export const Overlay: React.FC<{f: number; g: Gfx}> = ({f, g}) => {
  switch (g.kind) {
    case "icons": return (
      <Side f={f} g={g} w={640}>
        <div style={{display: "flex", gap: 22}}>
          {g.items.map((it: any, i: number) => (
            <Item key={i} f={f} t={it.t} mode="slap">
              <Card style={{padding: "18px 16px", width: 190, textAlign: "center", transform: `rotate(${[-4, 3, -2][i]}deg)`}}>
                <div style={{display: "flex", justifyContent: "center"}}><St k={it.st} w={110} /></div>
                <div style={{fontFamily: G, fontWeight: 700, fontSize: 28, color: C.ink, marginTop: 8}}>{it.label}</div>
              </Card>
            </Item>
          ))}
        </div>
      </Side>);
    case "bignum": {
      const at = fr(g.at ?? g.s);
      return (
        <Side f={f} g={g} w={620}>
          <Card style={{background: "#fff"}}>
            <Plate size={24} bg={C.lilac50}>{g.top}</Plate>
            {f >= at && <div style={{...bignumStyle(150), margin: "16px 0 10px", transform: `scale(${0.6 + 0.4 * SP(f, at, 9, 220)})`, transformOrigin: "left center"}}>{countUp(f, at, g.num)}</div>}
            <div style={{fontFamily: G, fontWeight: 700, fontSize: 32, color: C.ink, lineHeight: 1.2}}>{g.sub}</div>
          </Card>
        </Side>);
    }
    case "phones": return (
      <Side f={f} g={g} w={420} rot={4}>
        <div style={{width: 400, height: 640, borderRadius: 56, background: C.ink, padding: 16, boxShadow: "0 24px 50px rgba(34,28,70,.4)"}}>
          <div style={{width: "100%", height: "100%", borderRadius: 42, ...{backgroundColor: C.lilac50}, padding: "60px 18px", display: "flex", flexDirection: "column", gap: 18, overflow: "hidden"}}>
            <div style={{fontFamily: G, fontWeight: 700, fontSize: 22, color: C.ink, opacity: .6, textAlign: "center"}}>рекомендации</div>
            {g.items.map((it: any, i: number) => (
              <Item key={i} f={f} t={it.t} mode="slap">
                <div style={{background: "#fff", borderRadius: 22, padding: "16px 18px", border: `3px solid ${C.ink}`, display: "flex", gap: 12, alignItems: "center"}}>
                  <St k={["bolt", "fire", "sparkle"][i % 3]} w={52} />
                  <div style={{fontFamily: G, fontWeight: 800, fontSize: 26, color: C.ink, lineHeight: 1.15}}>{it.label}</div>
                </div>
              </Item>
            ))}
          </div>
        </div>
      </Side>);
    case "nameplate": return (
      <Appear f={f} s={fr(g.s)} e={fr(g.e)} mode="left" style={{position: "absolute", left: 90, bottom: 110}}>
        <div style={{display: "flex", alignItems: "stretch", gap: 0}}>
          <div style={{width: 18, background: C.lilac, borderRadius: "10px 0 0 10px", border: `4px solid ${C.ink}`, borderRight: "none"}} />
          <div style={{background: C.milk, border: `4px solid ${C.ink}`, borderRadius: "0 18px 18px 0", padding: "14px 30px", boxShadow: `8px 8px 0 ${C.ink}`}}>
            <div style={{fontFamily: U, fontWeight: 800, fontSize: 58, color: C.ink, lineHeight: 1}}>{g.name}</div>
            <div style={{fontFamily: G, fontWeight: 500, fontSize: 28, color: C.ink, marginTop: 6}}>{g.role}</div>
          </div>
        </div>
      </Appear>);
    case "list": {
      const st = g.strike ? fr(g.strike) : null;
      return (
        <Side f={f} g={g} w={620}>
          <Card>
            <div style={{fontFamily: U, fontWeight: 800, fontSize: 34, color: C.ink, lineHeight: 1.15, marginBottom: 16}}>{g.title}</div>
            <div style={{display: "flex", flexDirection: "column", gap: 14, position: "relative"}}>
              {g.items.map((it: any, i: number) => (
                <Item key={i} f={f} t={it.t} mode="left">
                  <div style={{display: "flex", gap: 14, alignItems: "center", fontFamily: G, fontWeight: 700, fontSize: 32, color: C.ink}}>
                    <span style={{width: 34, height: 34, borderRadius: 9, border: `4px solid ${C.ink}`, background: [C.lilac, C.mint, C.lemon, C.bubble, C.sky][i % 5], flex: "none"}} />
                    {it.label}
                  </div>
                </Item>
              ))}
              {st !== null && f >= st && <Draw f={f} s={st} dur={8} w={520} h={60} d="M0 40 L520 10" color={C.bubble} sw={9} style={{left: 0, top: g.items.length * 22 - 30}} />}
            </div>
            {st !== null && f >= st + 6 && <Appear f={f} s={st + 6} mode="slap" rot={-8} style={{position: "absolute", right: -30, bottom: -40}}><Plate bg={C.bubble} size={36}>не будет</Plate></Appear>}
          </Card>
        </Side>);
    }
    case "kinetic": return (
      <Appear f={f} s={fr(g.s)} e={fr(g.e)} mode="up" style={{...sidePos(g.side ?? "right"), top: 190, width: 680, textAlign: g.side === "left" ? "left" : "right"}}>
        <div style={{display: "flex", flexDirection: "column", alignItems: g.side === "left" ? "flex-start" : "flex-end", gap: 4}}>
          {g.lines.map((ln: any, i: number) => (
            <Item key={i} f={f} t={ln.t} mode="up">
              <span style={{
                fontFamily: ln.st === "hand" ? CV : ln.st === "bold" ? U : G,
                fontWeight: ln.st === "thin" ? 500 : 800,
                fontSize: ln.st === "hand" ? 108 : ln.st === "bold" ? 76 : 54,
                color: ln.st === "hand" ? C.bubble : C.milk, lineHeight: 1.02,
                textShadow: "0 3px 18px rgba(34,28,70,.55), 0 0 2px rgba(34,28,70,.6)",
                WebkitTextStroke: ln.st === "bold" ? `2px ${C.ink}` : undefined, paintOrder: "stroke fill",
              }}>{ln.txt}</span>
            </Item>
          ))}
        </div>
      </Appear>);
    case "label": return (
      <Appear f={f} s={fr(g.s)} e={fr(g.e)} mode="slap" rot={-3} style={{...sidePos(g.side ?? "left"), top: 120}}>
        <div style={{display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10}}>
          <Plate bg={C.lemon} size={26}>{g.kicker}</Plate>
          <div style={{background: C.ink, color: C.milk, fontFamily: U, fontWeight: 800, fontSize: 52, padding: "10px 24px 16px", borderRadius: 18, boxShadow: `8px 8px 0 ${C.lilac}`}}>{g.txt}</div>
        </div>
      </Appear>);
    case "compare": {
      const bt = fr(g.bt);
      return (
        <Side f={f} g={g} w={560}>
          <Card style={{display: "flex", flexDirection: "column", gap: 18}}>
            <div style={{position: "relative", fontFamily: CV, fontWeight: 700, fontSize: 64, color: C.ink}}>{g.a}
              {f >= bt && <Draw f={f} s={bt} dur={6} w={380} h={30} d="M0 20 L380 8" color={C.bubble} sw={8} style={{left: 0, top: 28}} />}
            </div>
            <Item f={f} t={g.bt} mode="slap"><div style={{fontFamily: U, fontWeight: 800, fontSize: 56, color: C.ink, background: C.lemon, borderRadius: 14, padding: "6px 18px", display: "inline-block"}}>{g.b}</div></Item>
          </Card>
        </Side>);
    }
    case "versus": return (
      <Side f={f} g={g} w={640}>
        <div style={{display: "flex", flexDirection: "column", gap: 20}}>
          <Card style={{background: C.bubble50}}><Plate bg={C.bubble} size={24}>{g.a.tag}</Plate><div style={{fontFamily: G, fontWeight: 800, fontSize: 40, color: C.ink, marginTop: 10}}>{g.a.txt}</div></Card>
          <Item f={f} t={g.bt} mode="slap"><div style={{fontFamily: U, fontWeight: 800, fontSize: 44, color: C.ink, textAlign: "center"}}>vs</div></Item>
          <Item f={f} t={g.bt} mode="slap"><Card style={{background: C.mint50}}><Plate bg={C.mint} size={24}>{g.b.tag}</Plate><div style={{fontFamily: G, fontWeight: 800, fontSize: 40, color: C.ink, marginTop: 10}}>{g.b.txt}</div></Card></Item>
        </div>
      </Side>);
    case "quote": return (
      <Side f={f} g={g} w={640} rot={2}>
        <Card style={{background: "#fff", borderRadius: 40}}>
          <div style={{fontFamily: CV, fontWeight: 700, fontSize: 64, color: C.ink, lineHeight: 1.05}}>{g.txt}</div>
          <div style={{position: "absolute", left: 60, bottom: -40, width: 50, height: 50, background: "#fff", borderRight: `4px solid ${C.ink}`, borderBottom: `4px solid ${C.ink}`, transform: "rotate(45deg)"}} />
        </Card>
      </Side>);
    case "stack": {
      const st = fr(g.strike);
      return (
        <Side f={f} g={g} w={560}>
          <div style={{display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-end"}}>
            {g.items.map((it: any, i: number) => (
              <Item key={i} f={f} t={it.t} mode="slap">
                <div style={{position: "relative", background: [C.lilac, C.mint, C.lemon, C.sky, C.bubble][i % 5], border: `4px solid ${C.ink}`, borderRadius: 16, padding: "10px 22px", fontFamily: U, fontWeight: 800, fontSize: 38, color: C.ink,
                  transform: `rotate(${[-3, 2, -1, 3, -2][i % 5]}deg)`, opacity: f >= st && i < g.strike_n ? 0.55 : 1, boxShadow: `6px 6px 0 ${C.ink}`}}>
                  {it.label}
                  {f >= st && i < g.strike_n && <Draw f={f} s={st + i * 3} dur={6} w={360} h={20} d="M0 14 L360 6" color={C.ink} sw={7} style={{left: 10, top: 22}} />}
                </div>
              </Item>
            ))}
            {f >= st + 10 && <Appear f={f} s={st + 10} mode="slap" rot={-4}><div style={{fontFamily: CV, fontWeight: 700, fontSize: 62, color: C.bubble, textShadow: "0 3px 14px rgba(34,28,70,.5)"}}>{g.strike_label}</div></Appear>}
          </div>
        </Side>);
    }
    case "tail": {
      const s = fr(g.s);
      return (
        <Side f={f} g={g} w={640}>
          <Card>
            <div style={{fontFamily: U, fontWeight: 800, fontSize: 42, color: C.ink}}>{g.title}</div>
            <div style={{fontFamily: G, fontWeight: 500, fontSize: 24, color: C.ink, opacity: .7, marginBottom: 20}}>{g.note}</div>
            <div style={{position: "relative", height: 210}}>
              <div style={{position: "absolute", left: 0, top: 30, width: 210, padding: "20px 0", textAlign: "center", background: C.lilac50, border: `4px dashed ${C.ink}`, borderRadius: 18, fontFamily: G, fontWeight: 800, fontSize: 30, color: C.ink, opacity: .75}}>задача А<br /><span style={{fontSize: 20, fontWeight: 500}}>не доделана</span></div>
              <Draw f={f} s={s + 18} dur={20} w={150} h={80} d="M0 40 C40 0 90 80 150 40" color={C.bubble} sw={7} dash="2 14" style={{left: 215, top: 50}} />
              <Appear f={f} s={s + 30} mode="slap" style={{position: "absolute", left: 370, top: 30, width: 210, padding: "20px 0", textAlign: "center", background: C.mint, border: `4px solid ${C.ink}`, borderRadius: 18, fontFamily: G, fontWeight: 800, fontSize: 30, color: C.ink}}>задача Б<br /><span style={{fontSize: 20, fontWeight: 500}}>внимание не 100%</span></Appear>
            </div>
          </Card>
        </Side>);
    }
    case "plan": {
      const s = fr(g.s);
      return (
        <Side f={f} g={g} w={620}>
          <Card style={{...{backgroundColor: C.milk}, backgroundImage: "repeating-linear-gradient(transparent 0 46px, rgba(143,211,255,.7) 46px 48px)"}}>
            <div style={{position: "relative", fontFamily: CV, fontWeight: 700, fontSize: 56, color: C.ink, opacity: .7, display: "inline-block"}}>{g.bad}
              <Draw f={f} s={s + 12} dur={7} w={360} h={20} d="M0 14 L360 4" color={C.bubble} sw={8} style={{left: 0, top: 26}} />
            </div>
            <div style={{display: "flex", flexDirection: "column", gap: 12, marginTop: 14}}>
              {g.good.map((it: any, i: number) => (
                <Item key={i} f={f} t={it.t} mode="left"><div style={{fontFamily: G, fontWeight: 800, fontSize: 32, color: C.ink, display: "flex", gap: 12, alignItems: "center"}}><St k="check" w={46} />{it.txt}</div></Item>
              ))}
            </div>
          </Card>
        </Side>);
    }
    case "phoneflip": {
      const s = fr(g.s); const r = L(f, s + 10, s + 26, 0, 180, Easing.inOut(Easing.cubic));
      return (
        <Side f={f} g={g} w={360} rot={3}>
          <div style={{perspective: 1200, display: "flex", flexDirection: "column", alignItems: "center", gap: 18}}>
            <div style={{width: 230, height: 420, transform: `rotateY(${r}deg)`, transformStyle: "preserve-3d", position: "relative"}}>
              <div style={{position: "absolute", inset: 0, borderRadius: 40, background: C.ink, padding: 12, backfaceVisibility: "hidden"}}><div style={{width: "100%", height: "100%", borderRadius: 30, background: C.bubble50, display: "flex", alignItems: "center", justifyContent: "center"}}><St k="bubble" w={120} /></div></div>
              <div style={{position: "absolute", inset: 0, borderRadius: 40, background: C.lilac, border: `6px solid ${C.ink}`, transform: "rotateY(180deg)", backfaceVisibility: "hidden", display: "flex", alignItems: "center", justifyContent: "center"}}><St k="star" w={90} /></div>
            </div>
            <Plate size={30} bg={C.lemon}>{g.label}</Plate>
          </div>
        </Side>);
    }
    case "outro_plate": return (
      <Appear f={f} s={fr(g.s)} e={fr(g.e)} mode="up" style={{position: "absolute", left: 0, right: 0, bottom: 90, display: "flex", justifyContent: "center"}}>
        <div style={{background: C.milk, border: `4px solid ${C.ink}`, borderRadius: 22, boxShadow: `10px 10px 0 ${C.ink}`, padding: "16px 34px", textAlign: "center"}}>
          <div style={{fontFamily: U, fontWeight: 800, fontSize: 50, color: C.ink}}><span style={{background: C.bubble, color: C.milk, padding: "0 12px", borderRadius: 10}}>АНТИ</span> брейнрот подкаст</div>
          <div style={{fontFamily: G, fontWeight: 600, fontSize: 28, color: C.ink, marginTop: 6}}>{g.sub}</div>
        </div>
      </Appear>);
    default: return null;
  }
};
