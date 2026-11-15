"""Звук рилсов: голос из смонтированного эпизода + ритмичная подложка + эффекты под анимации.
python3 remotion/src/reels/mix_reels.py <voice.wav> <reels.json> <out_dir>
Голос всегда громче всего: подложка ≈ на 16 дБ тише, эффекты короткие и тихие. Итог −14 LUFS (стерео)."""
import json, os, sys, numpy as np, soundfile as sf, pyloudnorm as pyln
sys.path.insert(0, "remotion/src/intro"); sys.path.insert(0, "remotion/src/episode")
import mix_audio as SFX
from mix_episode import make_bed, place

SR = 48000
F = 1 / 30

def voice_track(v, r, N):
    out = np.zeros(N); fade = int(0.012 * SR)
    for sg in r["segs"]:
        x = v[int(sg["s"] * SR):int(sg["e"] * SR)].copy()
        x[:fade] *= np.linspace(0, 1, fade); x[-fade:] *= np.linspace(1, 0, fade)
        place(out, x, sg["at"], 1.0)
    return out

def sfx_track(r, N):
    o = np.zeros(N); P = lambda x, t, g: place(o, x, t, g)
    P(SFX.whoosh(0.4), 0.0, 0.10); P(SFX.thud(0.35), 2 * F, 0.30); P(SFX.pop(), 10 * F, 0.06)
    he = r["hook_end"]; P(SFX.whoosh(0.35), he - 0.25, 0.08); P(SFX.thud(0.25), he, 0.10)
    if r["timer"]:
        for s in range(1, int(r["dur"]) + 1): P(SFX.click(), s, 0.035)
    for g in r["gfx"]:
        k, s, e = g["kind"], g["s"], g["e"]
        if k in ("planreal", "dablin", "tradeoff", "attn", "hellyes", "checklist", "loops", "plan"):
            P(SFX.whoosh(0.4), s - 0.12, 0.12); P(SFX.whoosh(0.3), e - 0.25, 0.06)
        if k == "chips":
            for it in g["items"]: P(SFX.pop(), it["t"], 0.08)
        if k == "kinetic":
            for ln in g["lines"]:
                P(SFX.pop(), ln["t"], 0.08)
                if ln.get("strikeAt"): P(SFX.scribble(0.3), ln["strikeAt"], 0.06)
        if k == "bignum": P(SFX.pop(), s, 0.08); P(SFX.ticker(0.33), g["at"], 0.05); P(SFX.ding(), g["at"] + 0.45, 0.05)
        if k == "stamp": P(SFX.stamp(), s + 0.08, 0.20)
        if k == "sticker": P(SFX.pop(), s, 0.07)
        if k == "list":
            for it in g["items"]: P(SFX.pop(), it["t"], 0.08)
            P(SFX.scribble(0.3), g["strike"], 0.06); P(SFX.stamp(), g["strike"] + 0.25, 0.14)
        if k == "quote": P(SFX.pop(), g["ta"], 0.08); P(SFX.scribble(0.3), g["tb"] - 0.12, 0.06); P(SFX.pop(), g["tb"], 0.08)
        if k == "pingpong":
            t = s
            while t < e: P(SFX.click(), t, 0.05); t += np.pi / 0.42 * F
        if k == "planreal": P(SFX.ticker(0.33), g["tp"], 0.06); P(SFX.ticker(0.5), g["tr"], 0.06); P(SFX.stamp(), g["tr"] + 16 * F, 0.16)
        if k == "dablin": P(SFX.pop(), s + 2 * F, 0.08); P(SFX.thud(0.3), g["t2"], 0.16)
        if k == "tradeoff": P(SFX.pop(), s + 2 * F, 0.08); P(SFX.stamp(), g["t2"], 0.18)
        if k == "attn":
            for b in g["bars"]: P(SFX.ticker(0.33), b["t"], 0.06)
        if k == "hellyes": P(SFX.pop(), s + 2 * F, 0.08); P(SFX.pop(), g["tn"], 0.07); P(SFX.stamp(), g["tx"], 0.2)
        if k == "checklist":
            for i in range(6): P(SFX.click(), s + (8 + i * 4) * F, 0.06)
            P(SFX.scribble(0.5), g["tg"], 0.07)
        if k == "loops": P(SFX.shimmer(), s, 0.05)
        if k == "plan": P(SFX.scribble(0.3), g["t1"], 0.07); P(SFX.pop(), g["t2"], 0.07); P(SFX.ding(), g["t3"], 0.05)
    P(SFX.pop(), r["dur"] - 2.6, 0.07)
    return o

def main(voice_p, data_p, out_dir):
    v, sr = sf.read(voice_p, dtype="float64"); assert sr == SR
    meter = pyln.Meter(SR)
    for r in json.load(open(data_p)):
        N = int(np.ceil(r["dur"] * 30) / 30 * SR)
        vo = voice_track(v, r, N); vo *= 10 ** ((-17 - meter.integrated_loudness(vo)) / 20)
        bed = make_bed(r["dur"] + 2, bpm=96)[:N]
        bed *= 10 ** ((-33 - meter.integrated_loudness(bed)) / 20)
        env = np.minimum(1, np.arange(N) / (0.25 * SR)) * np.minimum(1, (N - np.arange(N)) / (1.0 * SR))
        mix = vo + bed * env + sfx_track(r, N)
        mix *= 10 ** ((-17 - meter.integrated_loudness(mix)) / 20)
        pk = np.max(np.abs(mix))
        if pk > 0.89: mix = np.tanh(mix / 0.89) * 0.89
        st = np.stack([mix, mix], 1)
        sf.write(os.path.join(out_dir, f"{r['id']}.wav"), st.astype(np.float32), SR)
        print(r["id"], round(r["dur"], 2), "s", round(meter.integrated_loudness(st), 1), "LUFS")

if __name__ == "__main__":
    main(*sys.argv[1:4])
