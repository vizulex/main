import json, soundfile as sf
from faster_whisper import WhisperModel
m=WhisperModel('large-v3-turbo',device='cpu',compute_type='int8',cpu_threads=4)
a,_=sf.read('voice16k.wav',dtype='float32')
segs,_=m.transcribe(a,language='ru',word_timestamps=True,condition_on_previous_text=False,beam_size=5)
with open('qa_words.jsonl','w') as f:
    for s in segs:
        for w in s.words: f.write(json.dumps({"w":w.word,"s":w.start,"e":w.end,"p":w.probability},ensure_ascii=False)+"\n")
print('done')
