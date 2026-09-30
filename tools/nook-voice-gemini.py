"""Nook's voice from Gemini text-to-speech: audition candidate voices, then render the whole script.

Two jobs, both run on this PC and both produce ordinary WAV files; the game itself never calls any service.

  python tools/nook-voice-gemini.py audition            ten telling lines x every candidate voice -> a local listening page
  python tools/nook-voice-gemini.py library <voice>     the full built-in script (spokenBank) with one chosen voice -> assets/voice
  python tools/nook-voice-gemini.py script               write docs/nook-voice-gemini-script.csv: exactly what the library run will send
  add --dry-run to audition or library to see the plan and the cost estimate without spending anything

Keys live in .wrangler/voice-build/.env (gitignored), one per line:
  GEMINI_API_KEY=...        Google AI Studio key (https://aistudio.google.com/apikey). Needed: only Google's own API offers
                            Voice Design, which is how we get a kind English grandfather rather than a stock narrator.
  OPENROUTER_API_KEY=...    optional; adds the same preset voices through OpenRouter plus a cheap Kokoro baseline, for comparison.

Money: Gemini 3.8 Flash TTS costs $0.00225 per 10 s of audio (to 31 Dec 2026). The audition is a few pence; the library is
about 5 minutes of speech, roughly 10p. SPEND_CAP_USD below is a hard stop the tool will not cross in one run.

Phonics sounds (the 26 rows the recording sheet marks as phonics) stay on the existing Piper clips unless --phonics is given: asking a text model for "the
short a sound" is the least reliable thing here, and the Piper clips are rendered from explicit phonemes.

Standard library only. Nothing here reads player data.
"""
import array
import base64
import hashlib
import html
import importlib.util
import json
import math
import os
import pathlib
import re
import shutil
import sys
import time
import urllib.error
import urllib.request
import wave

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
ROOT = pathlib.Path(__file__).resolve().parent.parent
BUILD = ROOT / '.wrangler' / 'voice-build'
AUD = ROOT / '.wrangler' / 'voice-audition'
PUBLIC = ROOT / 'public' / 'fireworks' / 'little-patterns'
OUTPUT = PUBLIC / 'assets' / 'voice'
GOOGLE = 'https://generativelanguage.googleapis.com/v1beta'
OPENROUTER = 'https://openrouter.ai/api/v1/audio/speech'
MODEL = 'gemini-3.8-flash-tts'
SPEND_CAP_USD = 1.30                 # about one pound
USD_PER_AUDIO_SECOND = 0.00225 / 10  # Google's published equivalence for this model
USD_PER_VOICE_DESIGN = 0.02          # generous guess: a design call returns a short sample clip
SECONDS_PER_WORD = 0.42              # for the estimate only; a kind grandfather is not quick

# The voices we audition. Designed voices are created once from a description and cached by id; presets are Google's names.
# Jof (25 Sept 2026): a kind grandfather from NORTHAMPTON, England. It is not a famous accent, so the description spells out
# what it is made of; the East Midlands one is the fallback if the model cannot place Northampton; grandad-warm is the control.
DESIGNS = {
    'northampton': "A kind grandfather in his late sixties from Northampton, England, speaking warmly and unhurriedly to a small "
                   "child. A genuine Northamptonshire accent: East Midlands, sitting between southern and northern English. A short "
                   "flat 'a' in bath, grass and laugh, as in the Midlands; the vowel in bus, cup and butter a little rounded, not "
                   "fully northern; a touch of London in the vowels of day and go and an occasional glottal stop, as in water and "
                   "butter; dropped g's on -ing words like an old countryman; h's mostly kept. Not RP, not Cockney, not Yorkshire, "
                   "not Brummie. Soft, slow, twinkly, with a smile in the voice.",
    'east-midlands': "A kind English grandfather in his late sixties with a gentle East Midlands accent, from around Northampton "
                     "and Leicester: short flat 'a' in bath and grass, a slightly rounded 'u' in bus and cup, dropped g's, warm "
                     "and unhurried, reading softly to a small child with a smile in his voice.",
    'grandad-warm': "A kind English grandfather in his late sixties with a warm, gentle, lightly regional English accent, "
                    "unhurried and clear, reading softly to a small child with a smile in his voice.",
}
PRESETS = ['Gacrux', 'Sulafat']
STYLE = "warm, gentle and unhurried, like a kind grandfather reading to a small child"
# (text, style) pairs that exercise the things a voice can get wrong: warmth, gentle correction, delight, numbers, a story, the READ verb.
AUDITION = [
    ("Hello! I'm Nook. Let's play.", "warm and welcoming, gently pleased to see the child"),
    ("Whoops! Try again.", "kind and reassuring, not disappointed"),
    ("Lovely counting.", "quietly delighted"),
    ("Yes! Three apples.", "pleased and encouraging"),
    ("Seventeen.", STYLE),
    ("Twenty. Thirty. One hundred.", STYLE),
    ("Nook eats an apple.", STYLE),
    ("A wet blank can swim.", STYLE + "; say the word blank plainly, it marks a gap in the sentence"),
    ("Ali sees a flower in the garden. Ali says, I feel happy.", "a gentle storytelling voice, with a small pause before Ali speaks"),
    ("Read.", STYLE + "; the present-tense verb, rhyming with seed"),
    ("Time for a bath. Then a cup of water and butter on your toast.", STYLE + "; keep the accent natural on bath, cup, water and butter"),
]
# Lines in the library that need more than the one gentle style.
LINE_STYLE = {
    'read': STYLE + "; the present-tense verb, rhyming with seed",
    'yes': "pleased and encouraging", 'spot on': "pleased and encouraging", 'correct': "pleased and encouraging",
    'good matching': "pleased and encouraging", "that's right": "pleased and encouraging", 'well done': "pleased and encouraging",
    'you found it': "pleased and encouraging", "that's the one": "pleased and encouraging", 'lovely counting': "quietly delighted",
    # 28 Sept: the listening check heard his name as "Nok" in these two; the other five Nook lines were right
    "hello! i'm nook. let's play": "warm and welcoming, gently pleased to see the child; his name Nook rhymes with book and look, never with sock",
    'nook eats an apple': STYLE + "; the name Nook rhymes with book and look, never with sock",
}
# 29 Sept: where a real word fits the gap, the model said it instead ("blanket", "plank", "blanking", "blanketed in snow").
BLANK_NOTE = (STYLE + "; the word blank is a placeholder for a missing word: say exactly the one-syllable word blank, "
              "never blanket, plank or blanking, and add no other words")
# 30 Sept (Jof): "Whoops! Try again" was friendly, then neutral. Now five wrong-answer lines, picked at random by the game, all warm to the last word.
RETRY_STYLE = ("soft, warm and reassuring, a kind grandfather gently encouraging a small child after a wrong answer, with a smile in "
               "the voice; keep the whole line positive and bright right to the last word; never disappointed, flat, sorry or sing-song")
LINE_STYLE.update({k: RETRY_STYLE for k in ('whoops! have another go', 'not quite. you can do it', "good try! let's look again",
                                            "that's ok. have another go", 'oops-a-daisy! one more go')})
# The first takes added "Ho-ho," and "Oh,": a chuckle after a wrong answer can sound like laughing at the child, and the bubble must match.
LINE_STYLE.update({k: RETRY_STYLE + "; say only these words, starting on the first word: no laugh, chuckle, ho-ho or oh before it"
                   for k in ("good try! let's look again", 'oops-a-daisy! one more go')})
LINE_STYLE.update({k: BLANK_NOTE for k in ('nook has a soft blank', 'the blank is dry', 'the blank is wet',
                                           'the cat is blank now', 'the tall blank is dry', 'the tree is blank')})
PHONICS_STYLE = ("this is a phonics sound for a child learning to read: say only the short letter sound, as a teacher does when "
                 "sounding out a word, never the letter's name, one short sound and nothing else")
# 28 Sept: sounds the first render got wrong, each with its own extra note (the voice is unchanged).
PHONICS_NOTES = {
    'phonics-l': "only the consonant l, a held 'lll' as at the start of lamp, with no oo or other vowel before it",
    'phonics-o': "the short British o of on, off and dog, lips rounded; not the uh of up and not ah",
}
SHEET = ROOT / 'docs' / 'nook-voice-recordings.csv'     # the recording sheet Jof knows: it says which rows are phonics sounds


def sheet():
    import csv
    with open(SHEET, encoding='utf-8-sig', newline='') as f:
        return {r['lookup_key']: r for r in csv.DictReader(f)}


def env():
    values = {k: v for k, v in os.environ.items() if k in ('GEMINI_API_KEY', 'OPENROUTER_API_KEY', 'OPEN_ROUTER_API_KEY')}
    path = BUILD / '.env'
    if path.exists():
        for line in path.read_text(encoding='utf-8').splitlines():
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                values.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    if 'OPEN_ROUTER_API_KEY' in values:                       # either spelling will do
        values.setdefault('OPENROUTER_API_KEY', values['OPEN_ROUTER_API_KEY'])
    return values


class Spend:
    """Every request goes through here. The estimate is checked BEFORE the call, the real audio length is counted after."""
    def __init__(self, dry):
        self.dry, self.estimated, self.actual, self.calls = dry, 0.0, 0.0, 0

    def reserve(self, usd, what):
        if self.estimated + usd > SPEND_CAP_USD:
            raise SystemExit(f'Stopping before "{what}": estimated spend ${self.estimated + usd:.3f} would pass the cap of ${SPEND_CAP_USD:.2f}.')
        self.estimated += usd
        self.calls += 1

    def report(self):
        mode = 'would cost about' if self.dry else 'cost about'
        print(f'{self.calls} requests, {mode} ${self.estimated:.3f} by estimate' + ('' if self.dry else f', ${self.actual:.3f} by audio produced') + '.')


def post(url, body, headers, tries=5):
    data = json.dumps(body).encode('utf-8')
    for attempt in range(tries):
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json', **headers}, method='POST')
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read(), r.headers.get('Content-Type', '')
        except urllib.error.HTTPError as e:
            detail = e.read().decode('utf-8', 'replace')[:600]
            if e.code in (429, 500, 502, 503) and attempt < tries - 1:
                wait = 6 * (attempt + 1)
                print(f'  HTTP {e.code}, waiting {wait}s and retrying...')
                time.sleep(wait)
                continue
            raise SystemExit(f'HTTP {e.code} from {url}\n{detail}')


def find_audio(node):
    """Google's response nests the clip in steps[].content[]; walk it rather than trust one exact shape."""
    if isinstance(node, dict):
        if node.get('type') == 'audio' and isinstance(node.get('data'), str):
            return node['data'], node.get('mime_type') or node.get('mimeType') or ''
        for v in node.values():
            found = find_audio(v)
            if found:
                return found
    elif isinstance(node, list):
        for v in node:
            found = find_audio(v)
            if found:
                return found
    return None


def wav_from_google(data_b64, mime):
    raw = base64.b64decode(data_b64)
    if raw[:4] == b'RIFF':
        return raw
    # a headerless 24 kHz mono 16-bit stream: give it a header
    out = io_wav(raw, 24000)
    return out


def io_wav(pcm, rate):
    import io
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(pcm)
    return buf.getvalue()


def gemini_speak(key, text, voice, style, spend):
    words = max(1, len(text.split()))
    spend.reserve((words * SECONDS_PER_WORD + 0.8) * USD_PER_AUDIO_SECOND, text)
    if spend.dry:
        return None
    body = {'model': MODEL,
            'input': [{'type': 'user_input', 'content': [{'type': 'text', 'text': text,
                                                          'annotations': [{'type': 'speech_metadata', 'style': style}]}]}],
            'response_format': {'type': 'audio'},
            'generation_config': {'speech_config': [{'voice': voice}]}}
    raw, _ = post(f'{GOOGLE}/interactions', body, {'x-goog-api-key': key})
    found = find_audio(json.loads(raw))
    if not found:
        raise SystemExit('No audio in the response: ' + raw[:400].decode('utf-8', 'replace'))
    wav = wav_from_google(*found)
    spend.actual += seconds_of(wav) * USD_PER_AUDIO_SECOND
    time.sleep(0.4)
    return wav


def gemini_design(key, name, prompt, spend):
    cache = AUD / 'voices.json'
    known = json.loads(cache.read_text(encoding='utf-8')) if cache.exists() else {}
    if name in known and known[name].get('prompt') == prompt:
        return known[name]['id']
    spend.reserve(USD_PER_VOICE_DESIGN, 'voice design ' + name)
    if spend.dry:
        return 'voice_DRY_RUN'
    body = {'store': True, 'voice': {'model': MODEL, 'type': 'prompted', 'display_name': 'Nook ' + name, 'gender': 'male',
                                     'language_code': 'en-GB', 'prompted': {'input': prompt}}}
    raw, _ = post(f'{GOOGLE}/voices', body, {'x-goog-api-key': key})
    res = json.loads(raw)
    vid = res.get('id') or res.get('name')
    if not vid:
        raise SystemExit('Voice design returned no id: ' + raw[:400].decode('utf-8', 'replace'))
    sample = (res.get('sample_audio') or res.get('sampleAudio') or {}).get('data')
    AUD.mkdir(parents=True, exist_ok=True)
    if sample:
        (AUD / f'design-{name}-sample.wav').write_bytes(wav_from_google(sample, 'audio/wav'))
    known[name] = {'id': vid, 'prompt': prompt, 'created': time.strftime('%Y-%m-%d')}
    cache.write_text(json.dumps(known, indent=2), encoding='utf-8')
    print(f'  designed voice {name}: {vid}')
    return vid


def openrouter_speak(key, model, text, voice, spend):
    # OpenRouter bills per character; both models here are cheap. Its endpoint takes preset voice names only, no design.
    per_char = 16 / 1e6 if 'kokoro' not in model else 0.62 / 1e6
    spend.reserve(len(text) * per_char, text)
    if spend.dry:
        return None
    raw, ctype = post(OPENROUTER, {'model': model, 'input': text, 'voice': voice, 'response_format': 'mp3'},
                      {'Authorization': 'Bearer ' + key, 'HTTP-Referer': 'https://kpopboom.party', 'X-Title': 'Nook voice audition'})
    time.sleep(0.4)
    return raw


def seconds_of(wav_bytes):
    import io
    with wave.open(io.BytesIO(wav_bytes), 'rb') as w:
        return w.getnframes() / w.getframerate()


def polish(wav_bytes, target):
    """Same treatment the Piper clips get: trim to the speech with a little air either side, normalise, write 24 kHz mono 16-bit."""
    import io
    with wave.open(io.BytesIO(wav_bytes), 'rb') as w:
        if w.getnchannels() != 1 or w.getsampwidth() != 2:
            raise ValueError('Expected mono 16-bit audio')
        rate = w.getframerate()
        samples = array.array('h', w.readframes(w.getnframes()))
    if sys.byteorder != 'little':
        samples.byteswap()
    if rate != 24000:                                  # nearest-sample resample; Gemini gives 24 kHz so this is a safety net
        ratio = 24000 / rate
        samples = array.array('h', (samples[min(len(samples) - 1, int(i / ratio))] for i in range(int(len(samples) * ratio))))
    audible = [i for i, v in enumerate(samples) if abs(v) > 140]
    if not audible:
        raise ValueError(f'Silent clip: {target.name}')
    samples = samples[max(0, audible[0] - 760):min(len(samples), audible[-1] + 2800)]
    active = [v for v in samples if abs(v) > 140]
    rms = math.sqrt(sum(v * v for v in active) / len(active))
    peak = max(abs(v) for v in samples)
    gain = min(4200 / rms, 24500 / peak, 3)
    samples = array.array('h', (round(v * gain) for v in samples))
    if sys.byteorder != 'little':
        samples.byteswap()
    target.write_bytes(io_wav(samples.tobytes(), 24000))
    return round(len(samples) / 24000, 3)


def piper_module():
    spec = importlib.util.spec_from_file_location('piper_build', ROOT / 'tools' / 'build-little-patterns-voice.py')
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def spoken_form(text):
    # the same spellings the Piper build uses (bar READ, which gets a style note instead of a respelling), so both libraries say the same things
    fixed = {'read': 'Read.', 'yes': 'Yes!', 'spot on': 'Spot on!', 'correct': 'Correct!', 'good matching': 'Good matching!',
             "that's right": "That's right!", 'well done': 'Well done!'}
    if text in fixed:
        return fixed[text]
    out = text if text[-1] in '.!?' else text + '.'
    out = re.sub(r'(^|[.!?]\s+)([a-z])', lambda m: m.group(1) + m.group(2).upper(), out)   # sentence case, so the model reads sentences not lists
    out = re.sub(r'\bnook\b', 'Nook', out)                                                  # his name, capitalised mid-sentence too
    out = re.sub(r'\bok\b', 'OK', out)                                                      # OK is two letters, not ock
    return re.sub('(?<![A-Za-z])i(?![A-Za-z])', 'I', out)                                   # a lone lowercase i is a word, not a letter


def script_plan(phonics_too):
    """Exactly what the library run will send, in bank order: (key, spoken text or None, style, sheet row)."""
    piper = piper_module()
    rows = sheet()
    plan = []
    for text in piper.bank():
        row = rows.get(text, {})
        if row.get('recording_type') == 'phonics':
            if not phonics_too:
                plan.append((text, None, 'kept from the Piper library', row))
                continue
            spec = piper.PHONICS.get(text)
            spoken = (spec['letter'].lower() if spec else text) + '.'
            note = '; ' + PHONICS_NOTES[text] if text in PHONICS_NOTES else ''
            plan.append((text, spoken, PHONICS_STYLE + ' (' + row.get('script_or_sound', '') + ')' + note, row))
            continue
        plan.append((text, spoken_form(text), LINE_STYLE.get(text, STYLE), row))
    return plan


def write_script(phonics_too):
    """A review sheet for Jof: one row per line with the exact text and style note that will be sent. Excel-friendly like the recording sheet."""
    import csv
    target = ROOT / 'docs' / 'nook-voice-gemini-script.csv'
    with open(target, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f, lineterminator='\r\n')
        w.writerow(['order', 'lookup_key', 'text_sent_to_gemini', 'style_note', 'source', 'recording_sheet_script', 'current_clip'])
        for i, (key, spoken, style, row) in enumerate(script_plan(phonics_too), 1):
            w.writerow([i, key, spoken or '', style, 'Gemini' if spoken else 'kept from Piper', row.get('script_or_sound', ''), row.get('current_recording_location_and_filename', '')])
    print(f'Review sheet: {target}')


def candidates(keys, spend):
    """name -> (function(text, style) -> bytes, extension)"""
    out = {}
    g = keys.get('GEMINI_API_KEY')
    if g:
        for name, prompt in DESIGNS.items():
            vid = gemini_design(g, name, prompt, spend)
            out['google ' + name] = ((lambda t, s, v=vid: gemini_speak(g, t, v, s, spend)), 'wav')
        for p in PRESETS:
            out['google preset ' + p] = ((lambda t, s, v=p: gemini_speak(g, t, v, s, spend)), 'wav')
    o = keys.get('OPENROUTER_API_KEY')
    if o:
        for p in PRESETS:
            out['openrouter gemini ' + p] = ((lambda t, s, v=p: openrouter_speak(o, 'google/gemini-3.8-flash-tts', t, v, spend)), 'mp3')
        out['openrouter kokoro bm_george'] = ((lambda t, s: openrouter_speak(o, 'hexgrad/kokoro-82m', t, 'bm_george', spend)), 'mp3')
    return out


def audition(keys, dry):
    spend = Spend(dry)
    cands = candidates(keys, spend)
    if not cands:
        raise SystemExit('No keys found. Put GEMINI_API_KEY=... in .wrangler/voice-build/.env (see the top of this file).')
    AUD.mkdir(parents=True, exist_ok=True)
    grid = {}
    stopped = None
    try:
        for cname, (speak, ext) in cands.items():
            folder = AUD / cname.replace(' ', '-')
            folder.mkdir(exist_ok=True)
            for i, (text, style) in enumerate(AUDITION, 1):
                target = folder / f'{i:02d}.{ext}'
                if target.exists():
                    grid[(cname, i)] = target
                    continue
                print(f'{cname}: {text}')
                data = speak(text, style)
                if data is None:
                    continue
                if ext == 'wav':
                    polish(data, target)
                else:
                    target.write_bytes(data)
                grid[(cname, i)] = target
    except SystemExit as e:                        # a rate limit or the spend cap: keep what we have and still write the page
        stopped = str(e)
        print(stopped)
    spend.report()
    if dry:
        return
    if stopped:
        print('Stopped early; the page below shows what exists. Run again later and only the gaps are rendered.')
    rows = []
    for i, (text, style) in enumerate(AUDITION, 1):
        cells = ''.join(f'<td>{audio(grid.get((c, i)))}</td>' for c in cands)
        rows.append(f'<tr><th>{i}. {html.escape(text)}<br><small>{html.escape(style)}</small></th>{cells}</tr>')
    heads = ''.join(f'<th>{html.escape(c)}</th>' for c in cands)
    page = f"""<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nook voice audition</title>
<style>body{{font:16px/1.4 system-ui,sans-serif;margin:20px;background:#fffbe7;color:#3b2f4a}}table{{border-collapse:collapse}}th,td{{border:1px solid #e6d9a8;padding:8px;vertical-align:top;text-align:left}}
thead th{{background:#fff6d8;position:sticky;top:0}}tbody th{{font-weight:600;max-width:320px}}small{{color:#6a5f7a;font-weight:400}}audio{{width:220px}}p{{max-width:70ch}}</style>
<h1>Nook voice audition</h1>
<p>Same ten lines, every candidate. Listen on the iPad if you can: from this folder run <code>python -m http.server 8790</code> and open
<code>http://&lt;this PC&gt;:8790/</code> on the iPad. Nothing here is deployed. Generated {time.strftime('%d %B %Y %H:%M')}.</p>
<p>Missing cells were not rendered yet (the free tier allows 10 requests a day); running the audition again fills only the gaps.</p>
<p>Listen for: warmth without slowness, the vowels in <em>apple</em>, <em>bath</em> and <em>twenty</em> staying British, whether <em>Whoops</em> sounds kind rather than sorry, and whether <em>Read</em> rhymes with seed.</p>
<table><thead><tr><th>Line</th>{heads}</tr></thead><tbody>{''.join(rows)}</tbody></table>
{''.join(f'<p>Design sample for <b>{html.escape(n)}</b>: {audio(AUD / f"design-{n}-sample.wav")}</p>' for n in DESIGNS if (AUD / f"design-{n}-sample.wav").exists())}
</html>"""
    (AUD / 'index.html').write_text(page, encoding='utf-8')
    print(f'Listening page: {AUD / "index.html"}')


def audio(path):
    if not path or not pathlib.Path(path).exists():
        return '<em>missing</em>'
    rel = pathlib.Path(path).relative_to(AUD).as_posix()
    return f'<audio controls preload="none" src="{html.escape(rel)}"></audio>'


def library(keys, voice_arg, label, dry, phonics_too):
    """Render every line of the built-in script with one voice into assets/voice, writing the manifest the game already reads."""
    g = keys.get('GEMINI_API_KEY')
    if not g:
        raise SystemExit('The library needs GEMINI_API_KEY in .wrangler/voice-build/.env.')
    spend = Spend(dry)
    voice = voice_arg
    if voice_arg in DESIGNS:
        voice = gemini_design(g, voice_arg, DESIGNS[voice_arg], spend)
    old_manifest = json.loads((OUTPUT / 'manifest.json').read_text(encoding='utf-8')) if (OUTPUT / 'manifest.json').exists() else {'clips': {}}
    raw_dir = BUILD / 'gemini-raw' / voice_arg.replace('/', '_')
    raw_dir.mkdir(parents=True, exist_ok=True)
    plan = []
    for text, spoken, style, row in script_plan(phonics_too):
        if spoken is None:
            old = old_manifest['clips'].get(text)
            if not old:
                raise SystemExit(f'No existing phonics clip to keep for {text}; run with --phonics or rebuild Piper first.')
            plan.append((text, 'keep', old))
        else:
            plan.append((text, 'make', (spoken, style, hashlib.sha256(f'gemini:{voice}:{spoken}:{style}'.encode()).hexdigest()[:16] + '.wav')))
    if not dry:
        backup = BUILD / ('backup-' + time.strftime('%Y%m%d-%H%M%S'))
        shutil.copytree(OUTPUT, backup)
        print(f'Previous library backed up to {backup}')
    clips = {}
    for text, action, info in plan:
        if action == 'keep':
            clips[text] = info
            continue
        spoken, style, name = info
        raw = raw_dir / name
        if not raw.exists():
            data = gemini_speak(g, spoken, voice, style, spend)
            if data is None:
                continue
            raw.write_bytes(data)
        if not dry:
            seconds = polish(raw.read_bytes(), OUTPUT / name)
            clips[text] = {'file': 'assets/voice/' + name, 'seconds': seconds}
    spend.report()
    if dry:
        print(f'{sum(1 for p in plan if p[1] == "make")} lines to render, {sum(1 for p in plan if p[1] == "keep")} phonics clips kept.')
        return
    keep = {pathlib.Path(c['file']).name for c in clips.values()} | {'manifest.json', 'NOTICE.txt'}
    for stale in OUTPUT.iterdir():
        if stale.name not in keep and stale.suffix == '.wav':
            stale.unlink()
    manifest = {'version': 1, 'voice': label, 'lang': 'en-GB', 'clips': clips}
    data = json.dumps(manifest, ensure_ascii=False, indent=2)
    (OUTPUT / 'manifest.json').write_text(data + '\n', encoding='utf-8')
    (PUBLIC / 'voice-library.js').write_text('/* Generated by tools/nook-voice-gemini.py. */\nwindow.LPVoiceLibrary=' + data + ';\n', encoding='utf-8')
    total = sum((PUBLIC / c['file']).stat().st_size for c in clips.values())
    print(f'Library: {len(clips)} clips, {total / 1024 / 1024:.2f} MiB. Now run the voice tests and update NOTICE.txt before deploying.')


def main(argv):
    dry = '--dry-run' in argv
    args = [a for a in argv if not a.startswith('--')]
    keys = env()
    if args and args[0] == 'script':
        write_script('--phonics' in argv)
        return 0
    if not args or args[0] not in ('audition', 'library'):
        print(__doc__)
        return 2
    if args[0] == 'audition':
        audition(keys, dry)
    else:
        if len(args) < 2:
            raise SystemExit('library needs a voice: a design name (' + ', '.join(DESIGNS) + '), a Google preset such as Gacrux, or a voice_... id')
        voice = args[1]
        label = f'Gemini 3.8 Flash TTS, {voice}' if voice in DESIGNS or voice in PRESETS else f'Gemini 3.8 Flash TTS, designed voice {voice}'
        library(keys, voice, label, dry, '--phonics' in argv)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
