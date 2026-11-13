import json
import soundfile as sf
from faster_whisper import WhisperModel
m = WhisperModel('large-v3-turbo', device='cpu', compute_type='int8', cpu_threads=4)
audio, _ = sf.read('raw/audio16k.wav', dtype='float32')
prompt = "Эм, ну, ээ, как бы, типа, вот. Я ничего не успеваю... Эм, то есть, ну короче, тайм-менеджмент."
segs, info = m.transcribe(audio, language='ru', word_timestamps=True, initial_prompt=prompt,
                          condition_on_previous_text=False, vad_filter=False, beam_size=5)
with open('transcript_words.jsonl', 'w') as f:
    for s in segs:
        d = {"start": s.start, "end": s.end, "text": s.text,
             "words": [{"w": w.word, "s": w.start, "e": w.end, "p": round(w.probability, 3)} for w in s.words]}
        f.write(json.dumps(d, ensure_ascii=False) + "\n"); f.flush()
print("done")
