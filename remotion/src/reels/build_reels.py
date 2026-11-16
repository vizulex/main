"""Сборка таймлайна рилсов из смонтированного эпизода.
python3 remotion/src/reels/build_reels.py <qa_words.jsonl> <voice.wav> > remotion/src/reels/data/reels.json
Времена фрагментов — в таймлайне смонтированного голоса (voice.wav, с паузой под интро).
Графика привязывается к словам: at("фраза") → время начала первого слова фразы в рилсе."""
import json, re, sys

W = [json.loads(l) for l in open(sys.argv[1])]
import numpy as np, soundfile as sf
V, VSR = sf.read(sys.argv[2], dtype="float32")  # смонтированный голос: по нему ищем настоящую тишину вокруг фразы
def _db(t, w=0.02):
    a = V[max(0, int(t * VSR)):int((t + w) * VSR)]
    return 20 * np.log10(np.sqrt(np.mean(a ** 2)) + 1e-9) if len(a) else -120
def widen(s, e):
    """Режем в самой тихой точке паузы: между концом предыдущего слова и началом фразы (и так же в конце).
    Распознавание ставит начало слова с опозданием, поэтому без этого первый слог обрезается."""
    prev = max([w["e"] for w in W if w["e"] <= s + 0.05] or [s - 0.4])
    nxt = min([w["s"] for w in W if w["s"] >= e - 0.05] or [e + 0.4])
    def quiet(a, b):
        ts = np.arange(a, max(a + 0.011, b), 0.01)
        return float(ts[int(np.argmin([_db(t) for t in ts]))])
    s0 = quiet(max(prev, s - 0.45), s - 0.02)
    e0 = quiet(e + 0.02, min(nxt, e + 0.4))
    return round(s0, 3), round(e0, 3)

norm = lambda s: re.sub(r"[^\w%]+", "", s.lower().replace("ё", "е"))
FIX = {"Даблин.": "«да… блин».", "Баумастер": "Баумайстер", "Масикампа.": "Масикампо.", "Северс": "Сиверс",
       "задачи,": None, "приоритетацию,": "приоритизацию,"}

def build(cfg):
    LEAD = 0.4  # первые 0,4 с — стоп-кадр без голоса: плееры съедают начало звука, а первое слово должно быть слышно целиком
    segs, words, at0 = [], [], LEAD
    for s, e in [widen(a, b) for a, b in cfg["segs"]]:
        segs.append({"s": s, "e": e, "at": round(at0, 3)})
        for w in W:
            if w["s"] >= s - 0.02 and w["e"] <= e + 0.06 and w["s"] < e:
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
    dur = at0
    for src_txt, dst in cfg.get("fix", []):  # замены текста субтитров: «исходная фраза» → «новая» (склеивает слова)
        toks = src_txt.split()
        i = 0
        while i <= len(words) - len(toks):
            if [w["w"] for w in words[i:i + len(toks)]] == toks:
                words[i]["w"] = dst; words[i]["e"] = words[i + len(toks) - 1]["e"]; del words[i + 1:i + len(toks)]
            i += 1
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
    punch = []  # без резких толчков: спокойный стиль
    speed = round(dur / cfg["fit_to"], 4) if cfg.get("fit_to") else 1.0  # рилс «47 секунд» потом ускоряется ровно до 47 с
    matte = [[0.0, cfg["hook_end"] + 0.1]] + [[max(0, g["s"] - 0.15), g["e"] + 0.15] for g in gfx if g["kind"] == "bt"]
    return {"id": cfg["id"], "dur": round(dur, 3), "lead": LEAD, "speed": speed, "matte": [[round(a, 2), round(min(b, dur), 2)] for a, b in matte], "hook_end": cfg["hook_end"], "title": cfg["title"], "hook": cfg["hook"],
            "cta": cfg["cta"], "timer": cfg.get("timer", False), "segs": segs, "caps": caps, "gfx": gfx, "zoom": zoom, "punch": punch}

YT = ["Полный выпуск", "на YouTube"]
# bt — крупное слово ЗА мной (я вырезана по маске и стою поверх текста); small — строка курсивом над ним
# сцены с графикой: mode "split" — я внизу на половине экрана, "circle" — я в кружке в углу

R1 = dict(id="r1", title="Почему ты всегда не успеваешь", hook_end=2.4,
  hook={"small": "Студенты ошиблись на", "big": "3 недели"},
  cta=YT, segs=[[216.22, 234.36], [241.64, 252.0], [254.44, 264.16]],
  gfx=lambda at: [
    {"kind": "chips", "s": at("1994"), "e": at("сколько примерно"), "items": [{"t": at("1994"), "text": "1994"}, {"t": at("37"), "text": "37 студентов"}]},
    {"kind": "bt", "s": at("написать им"), "e": at("диплом", end=True) + 0.5, "big": "диплом", "small": "сколько займёт"},
    {"kind": "planreal", "mode": "split", "s": at("в среднем они"), "e": at("56 дней", end=True) + 0.9, "plan": 34, "real": 56, "tp": at("34"), "tr": at("56")},
    {"kind": "bt", "s": at("25") - 0.1, "e": at("людей", end=True) + 0.6, "big": "25%", "small": "успели в срок"},
    {"kind": "bt", "s": at("идеальный"), "e": at("прошлый раз", end=True) + 0.3, "big": "идеал", "small": "мозг рисует"},
    {"kind": "bt", "s": at("за два дня"), "e": at("один вечер", end=True) + 0.3, "big": "2 дня", "small": "до дедлайна"},
    {"kind": "bt", "s": at("три вечера"), "e": at("сижу", end=True) + 0.8, "big": "3 вечера", "small": "на самом деле", "color": "lemon"},
  ])

R2 = dict(id="r2", title="Эффект «да… блин»", hook_end=2.5,
  hook={"small": "Почему ты соглашаешься на всё «через месяц»", "big": "…блин"},
  cta=YT, segs=[[265.42, 291.26], [438.38, 442.3], [445.98, 456.66]],
  fix=[("задачи,", "задаче,"), ("будущее у себя,", "будущего себя,"), ("которые не существуют.", "которого не существует."), ("какую-то", "какого-то"), ("до", "«да»")],
  gfx=lambda at: [
    {"kind": "dablin", "mode": "split", "s": at("это эффект"), "e": at("больше времени", end=True) + 0.2, "t2": at("через месяц")},
    {"kind": "list", "s": at("у них будет больше сил") - 0.1, "e": at("это неправда", end=True) + 0.7, "items": [{"t": at("больше сил"), "text": "больше сил"}, {"t": at("больше денег"), "text": "больше денег"}], "strike": at("неправда")},
    {"kind": "bt", "s": at("будущего"), "e": at("есть ты", end=True) + 0.6, "big": "это ты", "small": "«будущая я» —"},
    {"kind": "bt", "s": at("общая нагрузка"), "e": at("одинаковая", end=True) + 0.4, "big": "столько же", "small": "через месяц дел будет"},
    {"kind": "tradeoff", "mode": "split", "s": at("если ты говоришь"), "e": at("другой", end=True) + 0.6, "t2": at("автоматически")},
    {"kind": "quote", "s": at("вместо вопроса"), "e": at("бросить", end=True) + 1.0, "a": "Хочу ли я?", "b": "Что я ради этого\nготова бросить?", "ta": at("хочу ли"), "tb": at("а что я")},
  ])

R3 = dict(id="r3", title="Твоё внимание", hook_end=2.4, timer=True, fit_to=47.0,
  hook={"small": "Столько ты держишь внимание на одном экране", "big": "47 сек"},
  cta=["Досмотрела до конца?", "Ты уже лучше среднего"],
  segs=[[649.48, 671.88], [674.9, 681.42], [694.42, 698.58], [698.7, 704.18], [707.94, 716.08]],
  gfx=lambda at: [
    {"kind": "chips", "s": at("reels"), "e": at("меньше и меньше", end=True) + 0.3, "items": [{"t": at("reels"), "text": "Reels"}, {"t": at("tiktok"), "text": "TikTok"}]},
    {"kind": "attn", "mode": "split", "s": at("раньше это было"), "e": at("47 секунд", end=True) + 0.9, "bars": [{"t": at("было где"), "year": "2004", "label": "2,5 мин", "v": 150}, {"t": at("75"), "year": "2012", "label": "75 сек", "v": 75}, {"t": at("47"), "year": "2020", "label": "47 сек", "v": 47}]},
    {"kind": "bt", "s": at("сразу начать"), "e": at("сработает", end=True) + 0.3, "big": "фокус", "small": "сразу включать"},
    {"kind": "bt", "s": at("мультитаскинг"), "e": at("переключения", end=True) + 0.4, "big": "мульти-\nтаскинг", "small": "это просто переключения"},
    {"kind": "pingpong", "s": at("не одновременно"), "e": at("на задачу", after=at("не одновременно") + 2, end=True) + 0.3},
    {"kind": "bt", "s": at("40") - 0.1, "e": at("времени", after=at("съедать"), end=True) + 1.2, "big": "−40%", "small": "продуктивного времени", "color": "lemon"},
  ])

R4 = dict(id="r4", title="Не 100% «да» — значит «нет»", hook_end=2.4,
  hook={"small": "Сомневаешься, браться ли за проект?", "big": "Откажись"},
  cta=YT, segs=[[477.1, 492.14], [499.5, 505.42], [604.52, 622.76], [622.76, 632.64]],
  gfx=lambda at: [
    {"kind": "chips", "s": at("правило"), "e": at("новая задача", end=True) + 0.4, "items": [{"t": at("дерека"), "text": "правило Дерека Сиверса"}]},
    {"kind": "hellyes", "mode": "split", "s": at("твоя первая мысль"), "e": at("откажись", end=True) + 1.0, "tn": at("сомнения"), "tx": at("откажись")},
    {"kind": "bt", "s": at("делаешь много"), "e": at("приходишь", end=True) + 0.4, "big": "много", "small": "но плохо"},
    {"kind": "checklist", "mode": "split", "s": at("половина задач"), "e": at("трата времени", end=True) + 0.6, "tg": at("ради галочки")},
    {"kind": "bt", "s": at("как я очистила"), "e": at("работать", end=True) + 0.2, "big": "фокус", "small": "убрала лишнее —"},
    {"kind": "bt", "s": at("реально начали"), "e": at("результаты", end=True) + 0.9, "big": "результат", "color": "lemon"},
  ])

R5 = dict(id="r5", title="Голова гудит от задач?", hook_end=2.5,
  hook={"small": "Не делай всё сразу. Нужна", "big": "одна вещь"},
  fix=[("Например,", "например,")],
  cta=YT, segs=[[775.92, 799.68], [825.34, 842.26]],
  gfx=lambda at: [
    {"kind": "loops", "mode": "split", "s": at("открытые петли"), "e": at("лезут в голову", end=True) + 0.5},
    {"kind": "chips", "s": at("это доказали"), "e": at("через исследование", end=True), "items": [{"t": at("баумайстер"), "text": "Баумайстер"}, {"t": at("масикампо"), "text": "Масикампо, 2011"}]},
    {"kind": "bt", "s": at("любая незаконченная"), "e": at("другим задачам", end=True) + 0.4, "big": "мешает", "small": "незаконченная задача"},
    {"kind": "bt", "s": at("конкретный план"), "e": at("исчезал", end=True) + 0.8, "big": "план", "small": "эффект выключает", "color": "lemon"},
    {"kind": "plan", "mode": "split", "s": at("не просто"), "e": at("так далее", end=True) + 0.3, "t1": at("а сегодня"), "t2": at("завтра"), "t3": at("пункт 2", end=True)},
  ])

print(json.dumps([build(c) for c in (R1, R2, R3, R4, R5)], ensure_ascii=False))
