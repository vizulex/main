"""Звук 2-го выпуска: голос + интро + тихие эффекты под коллаж (без фоновой музыки, голос всегда громче).
python3 remotion/src/ep2/mix_ep2.py <voice.wav> <intro_audio.wav> <ep2.json> <out.wav>"""
import json, sys, numpy as np, soundfile as sf, pyloudnorm as pyln
sys.path.insert(0, "remotion/src/intro"); sys.path.insert(0, "remotion/src/episode")
import mix_audio as SFX
from mix_episode import place

SR = 48000

def main(voice_p, intro_p, data_p, out_p):
    D = json.load(open(data_p)); N = int(D["total"] * SR) + SR
    meter = pyln.Meter(SR)
    v, sr = sf.read(voice_p, dtype="float64"); assert sr == SR
    if v.ndim > 1: v = v.mean(1)
    v = np.pad(v, (0, max(0, N - len(v))))[:N]
    v *= 10 ** ((-19 - meter.integrated_loudness(v)) / 20)
    intro, _ = sf.read(intro_p, dtype="float64")
    if intro.ndim > 1: intro = intro.mean(1)
    intro *= 10 ** ((-19.5 - meter.integrated_loudness(intro)) / 20)
    fx = np.zeros(N); P = lambda x, t, g: place(fx, x, t, g)
    last_lay = None
    for g in D["graphics"]:
        s, e = g["s"], g["e"]
        if g.get("lay") != last_lay: P(SFX.whoosh(0.45), s - 0.15, 0.06); last_lay = g.get("lay")
        for it in g.get("items", []):
            k, t = it.get("k"), it.get("t", s)
            if k in ("cut", "label", "photo", "text"): P(SFX.pop(), t, 0.045)
            elif k == "ransom":
                for j in range(min(6, len(it.get("text", "")))): P(SFX.click(), t + j * 2 / 30, 0.03)
            elif k == "digits": P(SFX.ticker(0.33), t, 0.04)
            elif k == "strike": P(SFX.scribble(0.3), t, 0.05)
            elif k == "clicker": P(SFX.click(), t + 16 / 30, 0.08)
        kind = g["kind"]
        if kind == "typewriter":
            for r in g["rows"]:
                n = len(r["text"]); P(SFX.typing(min(2.5, n / 24)), r["t"], 0.06)
                if r.get("ck"): P(SFX.pop(), r["ck"], 0.05)
        if kind == "notebook":
            for r in g["rows"]: P(SFX.scribble(0.6), r["t"] + 0.2, 0.05)
        if kind == "checklist":
            for r in g["rows"]:
                P(SFX.scribble(0.3), r["t"], 0.04)
                if r.get("ck"): P(SFX.pop(), r["ck"], 0.045)
        if kind == "boxes":
            for b in g["boxes"]: P(SFX.flip(), b["t"], 0.07); P(SFX.ding(), b["t"] + 0.1, 0.035)
        if kind == "odds": P(SFX.whoosh(0.4), g["t2"], 0.06); P(SFX.ding(), g["t2"] + 0.6, 0.045)
        if kind == "series":
            for k in ("t1", "t2", "t3"): P(SFX.pop(), g[k], 0.05)
        if kind == "headnotif":
            P(SFX.flip(), s + 0.3, 0.06)
            n0 = s + 26 / 30; step = max(4, int((g["t2"] * 30 - n0 * 30) / 12)) / 30
            for j in range(12):
                if n0 + j * step < g["t2"]: P(SFX.pop(), n0 + j * step, 0.03)
            P(SFX.ding(), g["t3"], 0.045)
        if kind == "notif": P(SFX.ding(), g["t2"], 0.045)
        if kind == "corridor": P(SFX.whoosh(1.2), s + 0.4, 0.05)
        if kind in ("map", "chat", "gauge", "loading", "stamps"): P(SFX.pop(), s + 0.1, 0.045)
    mix = v + fx
    i0 = int(D["intro_out"] * SR); mix[i0:i0 + len(intro)] += intro[:N - i0]
    mix = mix[:int(D["total"] * SR)]
    mix *= 10 ** ((-17 - meter.integrated_loudness(mix)) / 20)  # моно −17 → стерео −14
    pk = np.max(np.abs(mix))
    if pk > 0.89: mix = np.tanh(mix / 0.89) * 0.89
    st = np.stack([mix, mix], 1)
    sf.write(out_p, st.astype(np.float32), SR)
    print("ok", round(len(mix) / SR, 2), "s", round(meter.integrated_loudness(st), 1), "LUFS")

if __name__ == "__main__":
    main(*sys.argv[1:5])
