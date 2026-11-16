"""Маска «я поверх текста»: вырезает меня из кадров aroll там, где за мной стоит крупное слово.
python3 remotion/src/reels/matte_reels.py <aroll.mp4> <reels.json> <out_dir=public/ep1/matte> <tmp_dir> [r1,r2]
На выходе webm с прозрачностью: <id>_<k>.webm для каждого интервала r.matte[k] (кадры рилса).
Область кадра aroll: x 660..1260 (600×1080) — всё, что попадает в вертикаль."""
import json, os, subprocess, sys, shutil
import numpy as np
from PIL import Image, ImageFilter
from rembg import remove, new_session

CROP = (660, 0, 600, 1080)
INTRO_LEN = 15
fr = lambda t: int(round(t * 30))

def src_index(r, f):
    sg0 = r["segs"][0]
    if f < fr(sg0["at"]): return fr(sg0["s"] - INTRO_LEN)
    for sg in r["segs"]:
        a = fr(sg["at"]); n = fr(sg["e"] - sg["s"])
        if a <= f < a + n: return fr(sg["s"] - INTRO_LEN) + (f - a)
    sg = r["segs"][-1]
    return fr(sg["s"] - INTRO_LEN) + fr(sg["e"] - sg["s"]) - 1

def extract(aroll, idxs, d):
    """Достаёт кадры по индексам (подряд идущие — одним вызовом ffmpeg)."""
    runs, cur = [], [idxs[0]]
    for i in idxs[1:]:
        if i == cur[-1] + 1: cur.append(i)
        else: runs.append(cur); cur = [i]
    runs.append(cur)
    got = {}
    for run in runs:
        tmp = os.path.join(d, "run"); shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp)
        x, y, w, h = CROP
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{(run[0] - 0.25) / 30:.4f}", "-i", aroll, "-frames:v", str(len(run)),
                        "-vf", f"crop={w}:{h}:{x}:{y}", os.path.join(tmp, "%05d.png")], check=True)
        for k, i in enumerate(run): got[i] = Image.open(os.path.join(tmp, f"{k + 1:05d}.png")).convert("RGB").copy()
    return got

def main(aroll, data_p, out_dir, tmp, only=""):
    os.makedirs(out_dir, exist_ok=True); os.makedirs(tmp, exist_ok=True)
    sess = new_session("u2net_human_seg")
    cache = {}
    for r in json.load(open(data_p)):
        if only and r["id"] not in only.split(","): continue
        for k, (a, b) in enumerate(r["matte"]):
            f0, f1 = fr(a), fr(b)
            out = os.path.join(out_dir, f"{r['id']}_{k}.webm")
            if os.path.exists(out) and os.path.getsize(out) > 0 and os.environ.get("KEEP"): continue
            cache = {}  # кадры держим в памяти только в пределах интервала
            idx = [src_index(r, f) for f in range(f0, f1)]
            need = sorted(set(i for i in idx if i not in cache))
            if need:
                for i, im in extract(aroll, need, tmp).items():
                    m = remove(im, session=sess, only_mask=True).convert("L")
                    m = m.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.6))
                    rgba = im.copy(); rgba.putalpha(m); cache[i] = rgba
            fd = os.path.join(tmp, f"{r['id']}_{k}"); shutil.rmtree(fd, ignore_errors=True); os.makedirs(fd)
            for j, i in enumerate(idx): cache[i].save(os.path.join(fd, f"{j:05d}.png"))
            out = os.path.join(out_dir, f"{r['id']}_{k}.webm")
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "30", "-i", os.path.join(fd, "%05d.png"), "-c:v", "libvpx-vp9",
                            "-pix_fmt", "yuva420p", "-b:v", "6M", "-auto-alt-ref", "0", out], check=True)
            shutil.rmtree(fd)
            print(r["id"], k, f1 - f0, "кадров →", out, flush=True)

if __name__ == "__main__":
    main(*sys.argv[1:6])
