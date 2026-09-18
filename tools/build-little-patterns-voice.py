"""Generate the shared voice assets offline; never read browser/player data.

Requires the pinned Piper Windows engine and Jenny model in .wrangler/voice-build.
See docs/little-patterns-voice.md for source URLs, licences and rebuild instructions.
Only Python's standard library and the existing Node runtime are required.
"""
import array
import hashlib
import json
import math
import pathlib
import subprocess
import sys
import wave

ROOT = pathlib.Path(__file__).resolve().parent.parent
BUILD = ROOT / '.wrangler' / 'voice-build'
PUBLIC = ROOT / 'public' / 'fireworks' / 'little-patterns'
OUTPUT = PUBLIC / 'assets' / 'voice'
MODEL_SHA256 = '469c630d209e139dd392a66bf4abde4ab86390a0269c1e47b4e5d7ce81526b01'
ENGINE_SHA256 = 'f3c58906402b24f3a96d92145f58acba6d86c9b5db896d207f78dc80811efcea'
CONFIG_SHA256 = 'a9a7a93a317c9a3cb6563e37eb057df9ef09c06188a8a4341b0fcb58cba54dd4'
PITCH_RATE = 24000  # A small fixed pitch lift from 22050 Hz, identical on every device.
PHONICS = json.loads((ROOT / 'tools' / 'little-patterns-phonics.json').read_text(encoding='utf-8'))


def bank():
    program = """
const L=require('./public/fireworks/little-patterns/learning.js');
console.log(JSON.stringify(L.spokenBank()));
"""
    result = subprocess.run(['node', '-e', program], cwd=ROOT, check=True, capture_output=True, text=True, encoding='utf-8')
    return json.loads(result.stdout)


def polish(source, target):
    with wave.open(str(source), 'rb') as wav:
        if wav.getnchannels() != 1 or wav.getsampwidth() != 2 or wav.getframerate() != 22050:
            raise ValueError('Unexpected generated audio format')
        samples = array.array('h', wav.readframes(wav.getnframes()))
    if sys.byteorder != 'little':
        samples.byteswap()
    audible = [i for i, value in enumerate(samples) if abs(value) > 140]
    if not audible:
        raise ValueError(f'Silent clip: {source}')
    samples = samples[max(0, audible[0] - 700):min(len(samples), audible[-1] + 2600)]
    active = [v for v in samples if abs(v) > 140]
    rms = math.sqrt(sum(v * v for v in active) / len(active))
    peak = max(abs(v) for v in samples)
    gain = min(4200 / rms, 24500 / peak, 3)
    samples = array.array('h', (round(v * gain) for v in samples))
    if sys.byteorder != 'little':
        samples.byteswap()
    with wave.open(str(target), 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(PITCH_RATE)
        wav.writeframes(samples.tobytes())
    return round(len(samples) / PITCH_RATE, 3)


def main():
    for name, expected in [('jenny.onnx', MODEL_SHA256), ('jenny.onnx.json', CONFIG_SHA256), ('piper_windows_amd64.zip', ENGINE_SHA256)]:
        actual = hashlib.sha256((BUILD / name).read_bytes()).hexdigest()
        if actual != expected:
            raise ValueError(f'Build input hash mismatch: {name}')
    OUTPUT.mkdir(parents=True, exist_ok=True)
    raw = BUILD / 'raw'
    raw.mkdir(exist_ok=True)
    entries = []
    for text in bank():
        phonics = PHONICS.get(text)
        recipe = 'phonics-v1:' + phonics['phonemes'] if phonics else text
        name = hashlib.sha256(recipe.encode()).hexdigest()[:16] + '.wav'
        # READ is the present-tense verb in this word bank, pronounced "reed". Openers keep their exclamation for a brighter delivery.
        spoken = phonics['phonemes'] + '.' if phonics else {'read': 'reed.', 'yes': 'Yes!', 'spot on': 'Spot on!', 'correct': 'Correct!', 'good matching': 'Good matching!', "that's right": "That's right!", 'well done': 'Well done!'}.get(text, text + '.')
        entries.append({'key': text, 'name': name, 'text': spoken, 'phonics': bool(phonics), 'output_file': str(raw / name)})
    pending = [e for e in entries if '--force' in sys.argv or not pathlib.Path(e['output_file']).exists()]
    command = [str(BUILD / 'piper' / 'piper.exe'), '--model', str(BUILD / 'jenny.onnx'),
               '--json-input', '--length_scale', '1.15', '--noise_scale', '0.4', '--noise_w', '0.65', '--quiet']
    # Text-phoneme mode passes explicit IPA codepoints through the pinned model's
    # existing phoneme map, bypassing eSpeak's spelling/letter-name interpretation.
    config = json.loads((BUILD / 'jenny.onnx.json').read_text(encoding='utf-8'))
    for spec in PHONICS.values():
        if any(c not in config['phoneme_id_map'] for c in spec['phonemes']):
            raise ValueError('Phoneme absent from pinned voice: ' + spec['letter'])
    config['phoneme_type'] = 'text'
    phonics_config = BUILD / 'phonics.config.json'
    phonics_config.write_text(json.dumps(config), encoding='utf-8')
    for is_phonics in (False, True):
        batch = [e for e in pending if e['phonics'] == is_phonics]
        if not batch:
            continue
        script = '\n'.join(json.dumps({'text': e['text'], 'output_file': e['output_file']}) for e in batch) + '\n'
        args = command + (['--config', str(phonics_config)] if is_phonics else [])
        subprocess.run(args, input=script, text=True, encoding='utf-8', cwd=BUILD / 'piper', stdout=subprocess.DEVNULL, check=True)
    clips = {}
    for entry in entries:
        target = OUTPUT / entry['name']
        duration = polish(pathlib.Path(entry['output_file']), target)
        clips[entry['key']] = {'file': 'assets/voice/' + entry['name'], 'seconds': duration}
    manifest = {'version': 1, 'voice': 'Jenny (Dioco), gentle pitch adjustment', 'lang': 'en-GB', 'clips': clips}
    data = json.dumps(manifest, ensure_ascii=False, indent=2)
    (OUTPUT / 'manifest.json').write_text(data + '\n', encoding='utf-8')
    (PUBLIC / 'voice-library.js').write_text('/* Generated by tools/build-little-patterns-voice.py. */\nwindow.LPVoiceLibrary=' + data + ';\n', encoding='utf-8')
    total = sum((PUBLIC / c['file']).stat().st_size for c in clips.values())
    print(f'Generated {len(clips)} clips, {total / 1024 / 1024:.2f} MiB, all local.')


if __name__ == '__main__':
    main()
