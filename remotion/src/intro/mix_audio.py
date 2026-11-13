"""Синтез звуковых эффектов и сведение с музыкой для интро подкаста.

Запуск из корня репозитория:
    python3 remotion/src/intro/mix_audio.py out/intro_audio.wav
Таймкоды берутся из remotion/src/intro/sfx.json (кадры при 30 fps).
Все эффекты синтезируются кодом, без сторонних сэмплов (нет вопросов с правами).
"""
import json, subprocess, sys
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
rng = np.random.default_rng(7)


def t(d):
    return np.arange(int(SR * d)) / SR


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)


def norm(x, peak=1.0):
    m = np.max(np.abs(x)) or 1
    return x / m * peak


def noise(d):
    return rng.standard_normal(int(SR * d))


def whoosh(d=0.45):
    n = noise(d)
    out = np.zeros_like(n)
    hop = 256
    for i in range(0, len(n), hop):
        p = i / len(n)
        c = 300 + 3500 * np.sin(np.pi * p) ** 2
        seg = n[max(0, i - 2048): i + hop]
        out[i:i + hop] = bp(seg, c * 0.6, min(c * 1.6, 20000))[-len(out[i:i + hop]):]
    env = np.sin(np.pi * np.linspace(0, 1, len(n))) ** 1.5
    return norm(out * env)


def thud(d=0.35):
    tt = t(d)
    f = 110 * np.exp(-tt * 9) + 45
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-tt * 11)
    click = lp(noise(d), 1800) * np.exp(-tt * 70) * 0.6
    return norm(body + click)


def cover():
    a = whoosh(0.3) * 0.6
    b = thud(0.3) * 0.5
    x = np.zeros(int(SR * 0.45))
    x[:len(a)] += a
    x[int(SR * 0.12):int(SR * 0.12) + len(b)] += b
    return norm(x)


def flip(d=0.16):
    tt = t(d)
    n = hp(noise(d), 1200)
    flutter = 0.6 + 0.4 * np.abs(np.sin(2 * np.pi * rng.uniform(28, 40) * tt))
    env = np.minimum(tt / 0.006, 1) * np.exp(-tt * 22)
    return norm(bp(n, 1500, 9000) * flutter * env)


def pop(d=0.12):
    tt = t(d)
    f0 = rng.uniform(380, 520)
    f = f0 + 900 * (1 - np.exp(-tt * 60))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-tt * 38) * np.minimum(tt / 0.002, 1)
    click = hp(noise(d), 3000) * np.exp(-tt * 300) * 0.3
    return norm(x + click)


def shutter():
    x = np.zeros(int(SR * 0.22))
    for off in (0.0, 0.07):
        c = bp(noise(0.03), 2000, 7000) * np.exp(-t(0.03) * 120)
        i = int(SR * off)
        x[i:i + len(c)] += c
    x += np.pad(thud(0.12) * 0.3, (0, len(x) - int(SR * 0.12)))
    return norm(x)


def scribble(d=0.5):
    tt = t(d)
    rate = rng.uniform(9, 13)
    am = np.abs(np.sin(2 * np.pi * rate * tt + rng.uniform(0, 3))) ** 0.7
    am *= 0.7 + 0.3 * np.sin(2 * np.pi * 3.1 * tt) ** 2
    env = np.minimum(tt / 0.03, 1) * np.minimum((d - tt) / 0.05, 1)
    return norm(bp(noise(d), 2200, 7000) * am * env) * 0.7


def click():
    tt = t(0.025)
    return norm(hp(noise(0.025), 2500) * np.exp(-tt * 260) + np.sin(2 * np.pi * 1800 * tt) * np.exp(-tt * 400) * 0.4)


def typing(d=1.0):
    x = np.zeros(int(SR * (d + 0.05)))
    tpos = 0.0
    while tpos < d:
        c = click() * rng.uniform(0.5, 1.0)
        i = int(SR * tpos)
        x[i:i + len(c)] += c[:len(x) - i]
        tpos += rng.uniform(0.055, 0.085)
    return norm(x) * 0.6


def ticker(d=0.33):
    x = np.zeros(int(SR * (d + 0.05)))
    for k in range(10):
        c = click()
        i = int(SR * k * d / 10)
        x[i:i + len(c)] += c
    return norm(x) * 0.7


def stamp():
    tt = t(0.4)
    body = thud(0.4)
    slap = lp(noise(0.4), 2500) * np.exp(-tt * 45)
    return norm(body * 0.9 + slap * 0.8)


def ding(d=1.4):
    tt = t(d)
    x = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt * k) for f, a, k in [(1568, 1, 3.2), (2093, 0.45, 4.5), (3136, 0.25, 6), (4186, 0.12, 8)])
    return norm(x * np.minimum(tt / 0.003, 1))


def shimmer(d=0.8):
    x = np.zeros(int(SR * d))
    for _ in range(18):
        f = rng.uniform(3000, 8000)
        st = rng.uniform(0, d - 0.12)
        tt = t(0.12)
        s = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 40)
        i = int(SR * st)
        x[i:i + len(s)] += s * rng.uniform(0.3, 1)
    return norm(x)


def glitch(d=0.45):
    x = np.zeros(int(SR * d))
    pos = 0
    while pos < len(x):
        seg = int(SR * rng.uniform(0.02, 0.06))
        kind = rng.integers(3)
        tt = np.arange(seg) / SR
        if kind == 0:
            s = np.sign(np.sin(2 * np.pi * rng.uniform(80, 400) * tt))
        elif kind == 1:
            s = np.round(rng.standard_normal(seg) * 3) / 3
        else:
            s = np.zeros(seg)
        x[pos:pos + seg] = s[:len(x) - pos] * 0.6
        pos += seg
    return norm(lp(x, 6000))


GEN = {"whoosh": whoosh, "thud": thud, "cover": cover, "flip": flip, "pop": pop, "shutter": shutter,
       "scribble": scribble, "typing": typing, "ticker": ticker, "stamp": stamp, "ding": ding,
       "shimmer": shimmer, "glitch": glitch}
BASE = {"flip": 0.45, "pop": 0.55, "scribble": 0.5, "typing": 0.5, "shimmer": 0.35, "whoosh": 0.6}


def main(out):
    cfg = json.load(open("remotion/src/intro/sfx.json"))
    fps, m = cfg["fps"], cfg["music"]
    total = int(SR * m["duration"])
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(m["start"]), "-t", str(m["duration"]), "-i", m["file"],
                          "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    music = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()[:total]
    music = np.pad(music, ((0, total - len(music)), (0, 0)))
    tt = np.arange(total) / SR
    fade = np.minimum(1, tt / m["fade_in"]) * np.clip((m["duration"] - tt) / m["fade_out"], 0, 1)
    music *= (10 ** (m["gain_db"] / 20) * fade)[:, None]

    sfx = np.zeros((total, 2))
    for e in cfg["events"]:
        g = GEN[e["type"]]
        s = g(e["dur"]) if "dur" in e else g()
        s = s * e.get("gain", 1.0) * BASE.get(e["type"], 0.8) * 0.4
        i = int(e["f"] / fps * SR)
        if i >= total:
            continue
        n = min(len(s), total - i)
        pan = rng.uniform(-0.25, 0.25)
        sfx[i:i + n, 0] += s[:n] * (1 - pan)
        sfx[i:i + n, 1] += s[:n] * (1 + pan)

    mix = music + sfx
    mix /= max(1.0, np.max(np.abs(mix)) / 0.97)
    pcm = (mix * 32767).astype("<i2").tobytes()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", "-",
                    "-af", "loudnorm=I=-14:TP=-1.0:LRA=11", "-ar", str(SR), out], input=pcm, check=True)
    print("ok", out)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "out/intro_audio.wav")
