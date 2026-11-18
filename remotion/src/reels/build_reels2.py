"""Рилсы 2-го выпуска: дубли хуков из конца записи + куски смонтированного эпизода.
python3 remotion/src/reels/build_reels2.py <ep2_scratch_dir> [--media]
  <ep2_scratch_dir>: words_flat.json (слова в сыром таймлайне), qa_words.jsonl (слова финала), edl.json, raw/*.MOV, raw/audio48k.wav
  --media: заново нарезать видео public/ep2r/<id>.mp4 и голос <scratch>/reels/<id>_voice.wav
Пишет remotion/src/reels/data/reels2.json. Каждый рилс — свой исходник: куски сырого видео подряд, без интро."""
import json, os, re, subprocess, sys
import numpy as np, soundfile as sf

D = sys.argv[1]; MEDIA = "--media" in sys.argv
OUTV = "public/ep2r"; OUTA = os.path.join(D, "reels"); os.makedirs(OUTV, exist_ok=True); os.makedirs(OUTA, exist_ok=True)
RAW = json.load(open(os.path.join(D, "words_flat.json")))
EP = [json.loads(l) for l in open(os.path.join(D, "qa_words.jsonl"))]
EDL = json.load(open(os.path.join(D, "edl.json")))["segs"]
A, SR = sf.read(os.path.join(D, "raw/audio48k.wav"), dtype="float32")
if A.ndim > 1: A = A.mean(1)
OFF7034 = 1498.4093333333333
TM = ("zscale=tin=arib-std-b67:min=bt2020nc:pin=bt2020:rin=tv:t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,"
      "tonemap=mobius:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p")
VOICE_AF = "highpass=f=75,lowpass=f=15000,afftdn=nr=8:nf=-40,acompressor=threshold=-22dB:ratio=3:attack=8:release=120:makeup=4,alimiter=limit=0.9"
norm = lambda s: re.sub(r"[^\w%]+", "", s.lower().replace("ё", "е"))

def find(words, phrase, after=0.0, key="w"):
    toks = [norm(x) for x in phrase.split()]
    for i in range(len(words)):
        if words[i]["s"] < after: continue
        if all(i + j < len(words) and norm(words[i + j][key]).startswith(toks[j]) for j in range(len(toks))):
            return words[i]["s"], words[i + len(toks) - 1]["e"]
    raise SystemExit(f"не нашла: {phrase} (после {after})")

def db(t, w=0.02):
    a = A[max(0, int(t * SR)):int((t + w) * SR)]
    return 20 * np.log10(np.sqrt(np.mean(a ** 2)) + 1e-9) if len(a) else -120
def quiet(a, b):
    ts = np.arange(a, max(a + 0.011, b), 0.01)
    return float(ts[int(np.argmin([db(t) for t in ts]))])

def squeeze(a, b, keep=0.16, min_gap=0.5):
    """Длинные паузы внутри дубля (запинки, выравнивание «растягивает» слово) вырезаем, оставляя по keep с каждой стороны."""
    ts = np.arange(a, b, 0.02); d = np.array([db(t) for t in ts]); thr = np.percentile(d, 90) - 28
    out, cur, run = [], a, None
    for t, x in zip(ts, d):
        if x < thr:
            if run is None: run = t
        else:
            if run is not None and t - run >= min_gap: out.append([cur, run + keep]); cur = t - keep
            run = None
    out.append([cur, b])
    return [r for r in out if r[1] - r[0] > 0.1]

def fin2raw(a, b):
    """Кусок финала [a,b] → куски сырого таймлайна (с теми же вырезанными паразитами, что в эпизоде)."""
    out = []
    for g in EDL:
        o0, o1 = g["out_s"], g["out_s"] + g["src_e"] - g["src_s"]
        x0, x1 = max(a, o0), min(b, o1)
        if x1 - x0 > 0.05: out.append([g["src_s"] + x0 - o0, g["src_s"] + x1 - o0])
    return out

EPW = []  # слова финала для ep-кусков (берём их, а не сырые: в сыром выравнивании бывают дубли)
def f2r(t):
    for g in EDL:
        if g["out_s"] - 0.001 <= t < g["out_s"] + g["src_e"] - g["src_s"]: return g["src_s"] + t - g["out_s"]
    return None

INTRO_OUT, INTRO_LEN = json.load(open(os.path.join(D, "edl.json")))["intro_out"], json.load(open(os.path.join(D, "edl.json")))["intro_len"]
def r2aroll(t):
    """Сырое время → время в public/ep2/aroll.mp4 (уже с тонмаппингом; интро в нём нет)."""
    for g in EDL:
        if g["src_s"] - 0.03 <= t < g["src_e"]:
            o = g["out_s"] + max(0.0, t - g["src_s"])
            return round(o - (INTRO_LEN if o >= INTRO_OUT else 0), 4)
    return None

def piece(p):
    """('raw', 'от фразы', 'до фразы', после_сек) или ('ep', 'от', 'до', после_сек) → список сырых диапазонов."""
    kind, a_ph, b_ph = p[0], p[1], p[2]; after = p[3] if len(p) > 3 else 0.0
    if kind == "rawt": return squeeze(a_ph, b_ph)  # явные времена сырого таймлайна (когда в дубле фальстарт)
    if kind == "raw":
        s, _ = find(RAW, a_ph, after, "orig"); _, e = find(RAW, b_ph, s, "orig")
        prev = max([w["e"] for w in RAW if w["e"] <= s + 0.02 and w["s"] < s - 0.01] or [s - 0.5]); nxt = min([w["s"] for w in RAW if w["s"] >= e - 0.02 and w["e"] > e + 0.01] or [e + 0.5])
        return squeeze(quiet(max(prev, s - 0.4), s - 0.02), quiet(e + 0.03, min(nxt, e + 0.4)))
    s, _ = find(EP, a_ph, after); _, e = find(EP, b_ph, s)
    EPW.append([w for w in EP if s - 0.01 <= w["s"] < e - 0.05])
    rr = fin2raw(s - 0.02, e + 0.04)
    # крошечные обрывки по краям (хвост соседнего слова из-за неточного whisper) выкидываем
    while len(rr) > 1 and rr[0][1] - rr[0][0] < 0.3: rr.pop(0)
    while len(rr) > 1 and rr[-1][1] - rr[-1][0] < 0.3: rr.pop()
    # края уточняем по сырому принудительному выравниванию (точнее, чем whisper финала)
    a0, b0 = rr[0][0], rr[-1][1]; keep0, keep1 = list(rr[0]), list(rr[-1])
    t0, t1 = norm(a_ph.split()[0]), norm(b_ph.split()[-1])
    cand = [w for w in RAW if abs(w["s"] - a0) < 1.6 and norm(w["orig"]).startswith(t0[:5])]  # то же слово, что начинает фразу
    fw = min(cand, key=lambda w: abs(w["s"] - a0)) if cand else min((w for w in RAW if w["e"] > a0 + 0.06 and w["s"] > a0 - 0.5), key=lambda w: w["s"])
    pv = max([w["e"] for w in RAW if w["e"] <= fw["s"] + 0.01 and w["s"] < fw["s"] - 0.02] or [fw["s"] - 0.3])
    cand = [w for w in RAW if abs(w["e"] - b0) < 1.6 and norm(w["orig"]).startswith(t1[:5])]
    lw = min(cand, key=lambda w: abs(w["e"] - b0)) if cand else max((w for w in RAW if w["s"] < b0 - 0.06 and w["e"] < b0 + 0.5), key=lambda w: w["e"])
    nx = min([w["s"] for w in RAW if w["s"] >= lw["e"] - 0.01 and w["s"] > lw["s"] + 0.02] or [lw["e"] + 0.3])
    rr[0][0] = quiet(max(pv, fw["s"] - 0.3), fw["s"] - 0.01); rr[-1][1] = quiet(lw["e"] + 0.02, min(nx, lw["e"] + 0.3))
    if rr[0][1] - rr[0][0] < 0.15: rr[0] = keep0
    if rr[-1][1] - rr[-1][0] < 0.15: rr[-1] = keep1
    assert all(b - a > 0.05 for a, b in rr), rr
    return rr

FIX = {"Пилментера,": "Палмитера,", "Пилментера": "Палмитера", "Бериджитт": "Берридж", "мисс": "миф", "ватой,": "водой,", "ватой": "водой",
       "эндоконбинеоиды.": "эндоканнабиноиды.", "премиака": "Премака", "юты": "Юты", "уильямса": "Уильяма", "сеппа,": "Сепа,", "тикток,": "TikTok,",
       "тикток": "TikTok", "инстаграм": "Instagram", "glow": "glow-up", "-up": None, "нарушу": "разрушу", "джеймса": "Джеймса"}

def build(cfg):
    LEAD = 0.4
    segs, words, at = [], [], LEAD
    for p in cfg["pieces"]:
        EPW.clear(); rr = piece(p); seg0 = len(segs); used = set()
        for a, b in rr:
            n = int(round((b - a) * 30)); b = a + n / 30
            if n < 2: continue
            segs.append({"rs": round(a, 3), "re": round(b, 3), "at": round(at, 4), "n": n, "ar": r2aroll(a) if p[0] == "ep" else None})
            if p[0] in ("raw", "rawt"):
                for w in RAW:
                    if (w["s"] >= a - 0.03 or w["e"] > a + 0.15) and w["s"] < b - 0.02 and w["e"] > a and id(w) not in used:
                        used.add(id(w))
                        words.append({"w": w["orig"], "s": round(max(w["s"], a) - a + at, 3), "e": round(min(w["e"], b) - a + at, 3)})
            at += n / 30
        for w in (EPW[0] if p[0] == "ep" else []):
            rs, re_ = f2r(w["s"] + 0.01), f2r(max(w["s"] + 0.02, w["e"] - 0.01))
            sg = next((x for x in segs[seg0:] if rs is not None and x["rs"] - (1.2 if x is segs[seg0] else 0.05) <= rs < x["re"] + (0.3 if x is segs[-1] else 0)), None)
            if not sg: continue
            st = sg["at"] + max(0, rs - sg["rs"]); en = sg["at"] + min(sg["n"] / 30, (re_ or rs) - sg["rs"]) if re_ and sg["rs"] <= re_ <= sg["re"] else st + (w["e"] - w["s"])
            words.append({"w": w["w"].strip(), "s": round(st, 3), "e": round(max(en, st + 0.05), 3)})
    for w in words:
        if w["w"] in FIX: w["w"] = FIX[w["w"]]
    words = [w for w in words if w["w"]]
    merged = []
    for w in words:
        if merged and re.match(r"^[-,%?!.»…]", w["w"]) and w["s"] - merged[-1]["e"] < 0.25: merged[-1]["w"] += w["w"]; merged[-1]["e"] = w["e"]
        else: merged.append(dict(w))
    words = merged
    for sg in segs:
        w = next((x for x in words if x["s"] >= sg["at"] - 0.05), None)
        if w and sg is segs[0]: w["w"] = w["w"][:1].upper() + w["w"][1:]
    for src, dst in cfg.get("fix", []):
        toks = src.split(); i = 0
        while i <= len(words) - len(toks):
            if [x["w"] for x in words[i:i + len(toks)]] == toks:
                words[i]["w"] = dst; words[i]["e"] = words[i + len(toks) - 1]["e"]; del words[i + 1:i + len(toks)]
            i += 1
    dur = at

    def at_(phrase, after=0.0, end=False):
        toks = [norm(x) for x in phrase.split()]
        for i in range(len(words)):
            if words[i]["s"] < after: continue
            if all(i + j < len(words) and norm(words[i + j]["w"]).startswith(toks[j]) for j in range(len(toks))):
                return round(words[i + len(toks) - 1]["e"] if end else words[i]["s"], 3)
        raise SystemExit(f"[{cfg['id']}] не нашла фразу: {phrase}")

    chunks, cur = [], []
    for w in words:
        cur.append(w); n = sum(len(x["w"]) for x in cur)
        if re.match(r"^[\d,%−]+$", w["w"]) and len(cur) < 4: continue
        if w["w"][-1:] in ".,?!:;»" or len(cur) >= 3 or n > 15: chunks.append(cur); cur = []
    if cur: chunks.append(cur)
    caps = [{"s": c[0]["s"], "e": c[-1]["e"], "w": [{"w": x["w"], "s": x["s"]} for x in c]} for c in chunks]
    for i in range(len(caps) - 1): caps[i]["e"] = round(min(caps[i + 1]["s"], caps[i]["e"] + 0.5), 3)

    he = cfg["hook_end"]; hook_end = round(at_(he, end=True) + 0.15, 3) if isinstance(he, str) else he
    gfx = cfg["gfx"](at_)
    zoom = [[sg["at"], 1.22 if i % 2 == 0 else 1.4] for i, sg in enumerate(segs)]
    matte = [[0.0, hook_end + 0.1]] + [[max(0, g["s"] - 0.15), g["e"] + 0.15] for g in gfx if g["kind"] == "bt"]
    if MEDIA: media(cfg["id"], segs)
    return {"id": cfg["id"], "dur": round(dur, 3), "lead": LEAD, "speed": 1.0, "src": f"ep2r/{cfg['id']}.mp4",
            "segs": [{"s": round(sg["at"] - LEAD, 4), "e": round(sg["at"] - LEAD + sg["n"] / 30, 4), "at": sg["at"]} for sg in segs],
            "matte": [[round(a, 2), round(min(b, dur), 2)] for a, b in matte], "hook_end": hook_end, "title": cfg["title"], "hook": cfg["hook"],
            "cta": cfg["cta"], "timer": False, "caps": caps, "gfx": gfx, "zoom": zoom, "punch": [], "words": words}

def media(rid, segs):
    """Видео: куски сырого MOV (тонмаппинг HLG→SDR) подряд; голос: те же куски из audio48k + обработка как в эпизоде."""
    tmp = os.path.join(OUTA, rid); os.makedirs(tmp, exist_ok=True); lst = []
    for k, sg in enumerate(segs):
        a = sg["rs"]; src, loc = ("IMG_7034.MOV", a - OFF7034) if a >= OFF7034 else ("IMG_7033.MOV", a)
        out = os.path.join(tmp, f"p{k:02d}.mp4"); lst.append(out)
        if sg.get("ar") is not None:  # кусок эпизода — из готового aroll (быстро и тот же цвет)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{sg['ar']:.4f}", "-i", "public/ep2/aroll.mp4", "-frames:v", str(sg["n"]),
                            "-an", "-c:v", "libx264", "-crf", "15", "-preset", "fast", "-pix_fmt", "yuv420p", "-r", "30", out], check=True)
            continue
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{loc:.4f}", "-i", os.path.join(D, "raw", src), "-frames:v", str(sg["n"]),
                        "-vf", "fps=30," + TM, "-an", "-c:v", "libx264", "-crf", "15", "-preset", "fast", "-pix_fmt", "yuv420p", out], check=True)
    with open(os.path.join(tmp, "list.txt"), "w") as fh: fh.writelines(f"file '{p}'\n" for p in lst)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", os.path.join(tmp, "list.txt"), "-c", "copy", "-movflags", "+faststart",
                    os.path.join(OUTV, f"{rid}.mp4")], check=True)
    fade = int(0.008 * SR); parts = []
    for sg in segs:
        x = A[int(round(sg["rs"] * SR)):int(round(sg["rs"] * SR)) + int(round(sg["n"] / 30 * SR))].copy()
        x[:fade] *= np.linspace(0, 1, fade); x[-fade:] *= np.linspace(1, 0, fade); parts.append(x)
    raw = os.path.join(tmp, "voice_raw.wav"); sf.write(raw, np.concatenate(parts), SR)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", VOICE_AF, "-ar", "48000", os.path.join(OUTA, f"{rid}_voice.wav")], check=True)
    print(rid, "media ok", flush=True)

YT = ["Полный выпуск", "на YouTube"]
sys.path.insert(0, os.path.dirname(__file__))
from reels2_spec import REELS  # noqa: E402

if __name__ == "__main__":
    only = [a for a in sys.argv[2:] if not a.startswith("--")]
    res = [build(c) for c in REELS if not only or c["id"] in only]
    if only and os.path.exists("remotion/src/reels/data/reels2.json"):
        old = {r["id"]: r for r in json.load(open("remotion/src/reels/data/reels2.json"))}
        old.update({r["id"]: r for r in res}); res = [old[c["id"]] for c in REELS if c["id"] in old]
    json.dump(res, open("remotion/src/reels/data/reels2.json", "w"), ensure_ascii=False)
    for r in res: print(r["id"], r["dur"], "s", len(r["segs"]), "кусков", " ".join(w["w"] for w in r["words"])[:2000], "\n")
