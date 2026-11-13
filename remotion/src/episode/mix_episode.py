"""Сведение звука эпизода: голос + интро + lo-fi подложка под графикой + звуковые эффекты.
python3 remotion/src/episode/mix_episode.py <voice.wav> <intro_audio.wav> <data.json> <out.wav>
Голос всегда громче: подложка ≈ на 18 дБ тише голоса, эффекты ≈ на 14 дБ тише."""
import json, sys, numpy as np, soundfile as sf, pyloudnorm as pyln
sys.path.insert(0, "remotion/src/intro")
import mix_audio as SFX  # синтез эффектов из интро

SR = 48000
rng = np.random.default_rng(3)

def ep_tone(freq, dur, amp=1.0):
    t = np.arange(int(SR * dur)) / SR
    env = np.exp(-t * 1.6) * np.minimum(t / 0.01, 1)
    x = sum(a * np.sin(2 * np.pi * freq * k * t + 0.3 * k) for k, a in [(1, 1), (2, .35), (3, .12), (4, .05)])
    x *= 1 + 0.15 * np.sin(2 * np.pi * 4.5 * t)
    return x * env * amp

def make_bed(seconds, bpm=78):
    beat = 60 / bpm; bar = beat * 4
    n = int(SR * seconds); out = np.zeros(n)
    chords = [[53, 57, 60, 64, 67], [52, 55, 59, 62], [50, 53, 57, 60, 64], [48, 52, 55, 59]]  # Fmaj9 Em7 Dm9 Cmaj7
    m2f = lambda m: 440 * 2 ** ((m - 69) / 12)
    b = 0
    while b * bar < seconds:
        ch = chords[b % 4]; t0 = int(b * bar * SR)
        for hit in (0, 2.5):
            st = t0 + int(hit * beat * SR)
            for i, m in enumerate(ch):
                x = ep_tone(m2f(m), bar * 0.9, 0.16)
                o = st + int(i * 0.012 * SR)
                if o < n: out[o:o + len(x)] += x[:n - o]
        bass = ep_tone(m2f(ch[0] - 12), bar, 0.35)
        out[t0:t0 + len(bass)] += bass[:n - t0]
        for q in range(4):  # бочка на 1 и 3, хэты восьмыми
            st = t0 + int(q * beat * SR)
            if q in (0, 2):
                k = SFX.thud(0.25) * 0.35
                out[st:st + len(k)] += k[:max(0, n - st)]
            for h in (0, 0.5):
                hs = st + int(h * beat * SR)
                hh = SFX.hp(SFX.noise(0.05), 7000) * np.exp(-np.arange(int(0.05 * SR)) / SR * 90) * 0.05
                out[hs:hs + len(hh)] += hh[:max(0, n - hs)]
        b += 1
    out = SFX.lp(out, 5000)
    crackle = (rng.random(n) > 0.9993) * rng.standard_normal(n) * 0.08
    out += SFX.lp(crackle, 3000)
    return out / np.max(np.abs(out)) * 0.8

def place(dst, x, t, gain):
    i = int(t * SR)
    if i >= len(dst) or i + len(x) <= 0: return
    if i < 0: x, i = x[-i:], 0
    n = min(len(x), len(dst) - i); dst[i:i + n] += x[:n] * gain

def times(g):
    ts = []
    for key in ("items", "lines", "rows", "cells", "bars", "good"):
        for it in g.get(key, []) or []:
            if isinstance(it, dict) and "t" in it: ts.append(it["t"])
            for sub in (it.get("sub", []) if isinstance(it, dict) else []): ts.append(sub["t"])
    return ts

def main(voice_p, intro_p, data_p, out_p):
    D = json.load(open(data_p)); total = D["total"]; N = int(total * SR)
    meter = pyln.Meter(SR)
    v, sr = sf.read(voice_p, dtype="float64"); assert sr == SR
    if v.ndim > 1: v = v.mean(1)
    v = np.pad(v, (0, max(0, N - len(v))))[:N]
    v *= 10 ** ((-16 - meter.integrated_loudness(v)) / 20)
    intro, _ = sf.read(intro_p, dtype="float64")
    if intro.ndim > 1: intro = intro.mean(1)
    intro *= 10 ** ((-16.5 - meter.integrated_loudness(intro)) / 20)
    music = np.zeros(N); sfx = np.zeros(N)
    FULL = {"chapter", "weeks", "loop", "attention", "recap3", "endcard", "bars", "budget", "matrix", "energy", "rules"}
    bed = make_bed(90)
    bed *= 10 ** ((-34 - meter.integrated_loudness(bed)) / 20)   # подложка ~18 дБ под голосом
    pos = 0.0
    for g in D["graphics"]:
        s, e = g["s"], g["e"]
        if g["kind"] in FULL:
            dur = e - s + 1.0; seg = bed[int(pos * SR) % len(bed):][:int(dur * SR)]
            if len(seg) < int(dur * SR): seg = np.concatenate([seg, bed[:int(dur * SR) - len(seg)]])
            fade = np.minimum(1, np.arange(len(seg)) / (0.6 * SR)) * np.minimum(1, (len(seg) - np.arange(len(seg))) / (0.8 * SR))
            place(music, seg * fade, s - 0.3, 1.0); pos += dur
            place(sfx, SFX.whoosh(0.45), s - 0.2, 0.10)
            if g["kind"] == "chapter": place(sfx, SFX.shimmer(), s + 0.2, 0.05)
        else:
            place(sfx, SFX.pop(), s, 0.07)
        for t in times(g): place(sfx, SFX.pop(), t, 0.045)
        if g["kind"] in ("bignum",): place(sfx, SFX.ding(), g.get("at", s) + 0.45, 0.04)
        if g["kind"] == "budget": place(sfx, SFX.ding(), g["total"]["t"] + 0.1, 0.05)
        if g.get("strike"): place(sfx, SFX.scribble(0.4), g["strike"], 0.06)
        if g["kind"] in ("compare",): place(sfx, SFX.scribble(0.3), g["bt"], 0.05)
    mix = v + music + sfx
    i0 = int(D["intro_out"] * SR); mix[i0:i0 + len(intro)] += intro[:N - i0]
    mix *= 10 ** ((-14 - meter.integrated_loudness(mix)) / 20)
    peak = np.max(np.abs(mix))
    if peak > 0.89: mix = np.tanh(mix / 0.89) * 0.89  # мягкий лимитер
    sf.write(out_p, np.stack([mix, mix], 1).astype(np.float32), SR)
    print("ok", out_p, round(meter.integrated_loudness(mix), 1), "LUFS")

if __name__ == "__main__":
    main(*sys.argv[1:5])
