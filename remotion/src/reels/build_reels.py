"""Сборка таймлайна рилсов из смонтированного эпизода.
python3 remotion/src/reels/build_reels.py <qa_words.jsonl> > remotion/src/reels/data/reels.json
Времена фрагментов — в таймлайне смонтированного голоса (voice.wav, с паузой под интро).
Графика привязывается к словам: at("фраза") → время начала первого слова фразы в рилсе."""
import json, re, sys

W = [json.loads(l) for l in open(sys.argv[1])]
norm = lambda s: re.sub(r"[^\w%]+", "", s.lower().replace("ё", "е"))
FIX = {"Даблин.": "«да… блин».", "Баумастер": "Баумайстер", "Масикампа.": "Масикампо.", "Северс": "Сиверс",
       "задачи,": None, "приоритетацию,": "приоритизацию,"}

def build(cfg):
    segs, words, at0 = [], [], 0.0
    for s, e in cfg["segs"]:
        segs.append({"s": s, "e": e, "at": round(at0, 3)})
        for w in W:
            if w["s"] >= s - 0.02 and w["e"] <= e + 0.06:
                txt = w["w"].strip()
                words.append({"w": txt, "s": round(w["s"] - s + at0, 3), "e": round(min(w["e"], e) - s + at0, 3), "src": w["s"]})
        at0 += e - s
    merged = []
    for w in words:  # склейка «где -то», «2 ,5», «40 %», «я ?»
        if merged and re.match(r"^[-,%?!.»…]", w["w"]) and w["s"] - merged[-1]["e"] < 0.25:
            merged[-1]["w"] += w["w"]; merged[-1]["e"] = w["e"]
        else: merged.append(dict(w))
    words = merged
    starts = {sg["at"] for sg in segs}
    for a in starts:  # заглавная буква в начале фрагмента
        w = next((x for x in words if x["s"] >= a - 0.05), None)
        if w: w["w"] = w["w"][:1].upper() + w["w"][1:]
    dur = max(at0, cfg.get("min_dur", 0))
    for fx in cfg.get("fix", []):  # точечные замены текста субтитров: (исходное, новое)
        for w in words:
            if w["w"] == fx[0]: w["w"] = fx[1]
    for w in words:
        if w["w"] in FIX and FIX[w["w"]]: w["w"] = FIX[w["w"]]

    def at(phrase, after=0.0, end=False):
        toks = [norm(x) for x in phrase.split()]
        for i in range(len(words)):
            if words[i]["s"] < after: continue
            if all(i + j < len(words) and norm(words[i + j]["w"]).startswith(toks[j]) for j in range(len(toks))):
                return round(words[i + len(toks) - 1]["e"] if end else words[i]["s"], 3)
        raise SystemExit(f"[{cfg['id']}] не нашла фразу: {phrase}")

    # субтитры: куски по 1–3 слова, разрыв на знаках препинания
    chunks, cur = [], []
    for w in words:
        cur.append(w)
        n = sum(len(x["w"]) for x in cur)
        if re.match(r"^[\d,%−]+$", w["w"]) and len(cur) < 4: continue  # число не отрываем от слова после него
        if w["w"][-1:] in ".,?!:;»" or len(cur) >= 3 or n > 15:
            chunks.append(cur); cur = []
    if cur: chunks.append(cur)
    caps = [{"s": c[0]["s"], "e": c[-1]["e"], "w": [{"w": x["w"], "s": x["s"]} for x in c]} for c in chunks]
    for i in range(len(caps) - 1):
        caps[i]["e"] = round(min(caps[i + 1]["s"], caps[i]["e"] + 0.5), 3)

    gfx = cfg["gfx"](at)
    # зум: смена на каждой склейке + толчок на ключевых моментах
    zoom = [[sg["at"], 1.22 if i % 2 == 0 else 1.4] for i, sg in enumerate(segs)]
    punch = sorted({round(g["s"], 3) for g in gfx if g["kind"] in ("bignum", "stamp")})
    return {"id": cfg["id"], "dur": round(dur, 3), "hook_end": cfg["hook_end"], "title": cfg["title"], "hook": cfg["hook"],
            "cta": cfg["cta"], "timer": cfg.get("timer", False), "segs": segs, "caps": caps, "gfx": gfx, "zoom": zoom, "punch": punch}

YT = ["Полный выпуск", "на YouTube"]

R1 = dict(id="r1", title="Почему ты всегда\nне успеваешь", hook_end=2.4,
  hook={"small": "Студентов спросили, сколько займёт диплом", "big": "Они ошиблись\nна 3 недели", "st": "fire"},
  cta=YT, segs=[[216.80, 235.05], [242.22, 252.66], [255.04, 264.98]],
  gfx=lambda at: [
    {"kind": "chips", "s": at("1994"), "e": at("сколько примерно"), "items": [{"t": at("1994"), "text": "1994 год", "bg": "lemon"}, {"t": at("37"), "text": "37 студентов", "bg": "sky"}, {"t": at("диплом"), "text": "диплом", "bg": "bubble"}]},
    {"kind": "planreal", "s": at("в среднем они"), "e": at("56 дней", end=True) + 0.9, "plan": 34, "real": 56, "tp": at("34"), "tr": at("56")},
    {"kind": "bignum", "s": at("25") - 0.1, "e": at("25", end=True) + 1.6, "at": at("25"), "value": "25%", "label": "успели в срок"},
    {"kind": "kinetic", "s": at("идеальный"), "e": at("прошлый раз", end=True) + 0.5, "lines": [{"t": at("идеальный"), "text": "идеальный сценарий", "big": True, "color": "mint"}, {"t": at("а не вспоминаем"), "text": "вместо прошлого опыта", "strike": False}]},
    {"kind": "kinetic", "s": at("за два дня"), "e": at("один вечер", end=True) + 0.3, "lines": [{"t": at("за два дня"), "text": "2 дня до дедлайна", "big": True, "color": "lemon"}, {"t": at("реферат"), "text": "«реферат на 2 страницы»"}]},
    {"kind": "stamp", "s": at("три вечера"), "e": at("сижу", end=True) + 0.8, "text": "3 вечера\nподряд", "color": "mandarin", "st": "fire"},
  ])

R2 = dict(id="r2", title="Эффект\n«да… блин»", hook_end=2.5,
  hook={"small": "Почему ты соглашаешься на всё «через месяц»", "big": "…а потом\nненавидишь себя", "st": "bolt"},
  cta=YT, segs=[[266.16, 292.06], [442.44, 446.40], [449.98, 461.24]],
  fix=[("задачи,", "задаче,")],
  gfx=lambda at: [
    {"kind": "dablin", "s": at("это эффект"), "e": at("больше времени", end=True) + 0.2, "t2": at("через месяц")},
    {"kind": "list", "s": at("у них будет больше сил") - 0.1, "e": at("это неправда", end=True) + 0.7, "items": [{"t": at("больше сил"), "text": "больше сил"}, {"t": at("больше денег"), "text": "больше денег"}], "strike": at("неправда")},
    {"kind": "kinetic", "s": at("будущего себя"), "e": at("есть ты", end=True) + 0.6, "lines": [{"t": at("будущего себя"), "text": "«будущая я»", "big": True, "color": "sky"}, {"t": at("есть ты"), "text": "= это и есть ты", "big": True, "color": "lemon"}]},
    {"kind": "tradeoff", "s": at("если ты говоришь"), "e": at("другой", end=True) + 0.6, "t2": at("автоматически")},
    {"kind": "quote", "s": at("вместо вопроса"), "e": at("бросить", end=True) + 1.0, "a": "Хочу ли я?", "b": "Что я ради этого\nготова бросить?", "ta": at("хочу ли"), "tb": at("а что я")},
    {"kind": "sticker", "s": at("чаша"), "e": at("переполниться", end=True) + 0.4, "k": "bolt", "x": 760, "y": 380, "w": 200, "rot": 12},
  ])

R3 = dict(id="r3", title="Твоё внимание:\n47 секунд", hook_end=2.4, timer=True, min_dur=47.0,
  hook={"small": "Столько ты держишь внимание на одном экране", "big": "47 секунд", "st": "sparkle"},
  cta=["Досмотрела до конца?", "Ты уже лучше среднего"],
  segs=[[654.88, 676.98], [680.00, 686.50], [699.52, 703.68], [703.78, 709.26], [712.74, 721.20]],
  gfx=lambda at: [
    {"kind": "chips", "s": at("reels"), "e": at("меньше и меньше", end=True) + 0.3, "items": [{"t": at("reels"), "text": "Reels", "bg": "bubble"}, {"t": at("tiktok"), "text": "TikTok", "bg": "sky"}]},
    {"kind": "attn", "s": at("раньше это было"), "e": at("47 секунд", end=True) + 0.9, "bars": [{"t": at("было где"), "year": "2004", "label": "2,5 мин", "v": 150}, {"t": at("75"), "year": "2012", "label": "75 сек", "v": 75}, {"t": at("47"), "year": "2020", "label": "47 сек", "v": 47}]},
    {"kind": "kinetic", "s": at("мультитаскинг"), "e": at("переключения", end=True) + 0.5, "lines": [{"t": at("мультитаскинг"), "text": "мультитаскинг", "big": True, "color": "sky", "strikeAt": at("быстрые")}, {"t": at("быстрые"), "text": "= быстрые переключения", "big": False}]},
    {"kind": "pingpong", "s": at("не одновременно"), "e": at("на задачу", after=at("не одновременно") + 2, end=True) + 0.3},
    {"kind": "bignum", "s": at("40") - 0.1, "e": at("времени", after=at("съедать"), end=True) + 1.2, "at": at("40"), "value": "−40%", "label": "продуктивного времени"},
  ])

R4 = dict(id="r4", title="Не 100% «да» —\nзначит «нет»", hook_end=2.4,
  hook={"small": "Сомневаешься, браться ли за проект?", "big": "Откажись", "st": "bolt"},
  cta=YT, segs=[[481.74, 496.86], [504.18, 510.14], [609.52, 627.86], [628.08, 637.74]],
  fix=[("Сиверса,", "Сиверса,")],
  gfx=lambda at: [
    {"kind": "chips", "s": at("правило"), "e": at("новая задача", end=True) + 0.4, "items": [{"t": at("дерека"), "text": "Дерек Сиверс", "bg": "lemon"}, {"t": at("новый проект"), "text": "новый проект?", "bg": "sky"}]},
    {"kind": "hellyes", "s": at("твоя первая мысль"), "e": at("откажись", end=True) + 1.0, "tn": at("сомнения"), "tx": at("откажись")},
    {"kind": "kinetic", "s": at("делаешь много"), "e": at("приходишь", end=True) + 0.4, "lines": [{"t": at("делаешь много"), "text": "много", "big": True, "color": "lemon"}, {"t": at("но плохо"), "text": "но плохо", "big": True, "color": "bubble"}]},
    {"kind": "checklist", "s": at("половина задач"), "e": at("трата времени", end=True) + 0.6, "tg": at("ради галочки")},
    {"kind": "stamp", "s": at("реально начали"), "e": at("результаты", end=True) + 0.9, "text": "результаты", "color": "mint", "st": "rocket"},
  ])

R5 = dict(id="r5", title="Голова гудит\nот задач?", hook_end=2.5,
  hook={"small": "Не нужно делать всё сразу", "big": "Нужен план\nна одну вещь", "st": "bulb"},
  cta=YT, segs=[[781.40, 805.20], [831.68, 848.64]],
  gfx=lambda at: [
    {"kind": "loops", "s": at("открытые петли"), "e": at("лезут в голову", end=True) + 0.5},
    {"kind": "chips", "s": at("это доказали"), "e": at("через исследование", end=True), "items": [{"t": at("баумайстер"), "text": "Баумайстер", "bg": "lemon"}, {"t": at("масикампо"), "text": "Масикампо, 2011", "bg": "sky"}]},
    {"kind": "kinetic", "s": at("любая незаконченная"), "e": at("другим задачам", end=True) + 0.4, "lines": [{"t": at("любая незаконченная"), "text": "незаконченная задача", "big": True, "color": "bubble"}, {"t": at("мешает"), "text": "мешает всем остальным"}]},
    {"kind": "stamp", "s": at("конкретный план"), "e": at("исчезал", end=True) + 0.8, "text": "план\nвыключает", "color": "mint", "st": "check"},
    {"kind": "plan", "s": at("не просто"), "e": at("так далее", end=True) + 0.3, "t1": at("а сегодня"), "t2": at("завтра"), "t3": at("пункт 2", end=True)},
  ])

print(json.dumps([build(c) for c in (R1, R2, R3, R4, R5)], ensure_ascii=False))
