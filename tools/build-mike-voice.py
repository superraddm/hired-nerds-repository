"""Build Mike's bundled Gemini clips using the existing local voice credentials.
Only the script and voice direction leave this PC. Never copy credentials to public/.
Resumable; generated WAVs and provenance manifest are shipped with the game.
"""
import importlib.util
import argparse
import hashlib
import json
import pathlib
import shutil
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('gemini', ROOT / 'tools/nook-voice-gemini.py')
g = importlib.util.module_from_spec(spec)
spec.loader.exec_module(g)
g.AUD = ROOT / '.wrangler/mike-voice'
g.SPEND_CAP_USD = 0.30
OUT = ROOT / 'public/fireworks/mike-game/assets/voice'
SOURCE = ROOT / 'docs/mike-platformer/voice-source.json'
LINES = {
    'power-1': ('Nice one!', 'a quick, punchy burst of delighted approval while running'),
    'power-2': ('Get in!', 'an excited, triumphant shout, short and energetic'),
    'power-3': ('Ey Up!', 'a lively, cheeky northern exclamation'),
    'pain-1': ('Ow! Pack it in!', 'sharp startled pain followed by forceful comic irritation'),
    'pain-2': ('Ooof!', 'one short, involuntary impact grunt, not a spoken explanation'),
    'pain-3': ('Flipping Heck', 'a brisk startled exclamation over workshop noise'),
    'boss': ("Right then. Let's get this lot sorted.", 'determined and animated; a brisk rallying call before tackling danger'),
}

def validate_clip(target):
    import wave
    with wave.open(str(target), 'rb') as w:
        if (w.getframerate(), w.getnchannels(), w.getsampwidth()) != (24000, 1, 2):
            raise ValueError('Expected 24 kHz mono 16-bit WAV: ' + str(target))
        if not 0.15 < w.getnframes() / w.getframerate() < 15:
            raise ValueError('Unexpected clip duration: ' + str(target))

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--only', choices=LINES, help='Generate one canary clip into the cache without changing the game.')
    args = parser.parse_args()
    dry = args.dry_run
    source = json.loads(SOURCE.read_text(encoding='utf-8'))
    voice, direction = source['voice'], source['direction']
    if voice != 'voice_h0dygekvdjzv':
        raise SystemExit('Mike must use the approved explainer voice voice_h0dygekvdjzv.')
    g.MODEL = source['model']
    keys = g.env()
    if not dry and not keys.get('GEMINI_API_KEY'):
        raise SystemExit('GEMINI_API_KEY is missing from the existing local voice setup.')
    spend = g.Spend(dry)
    cache = g.AUD / 'clips'
    if not dry:
        cache.mkdir(parents=True, exist_ok=True)
    clips = {}
    for name, (line, feeling) in LINES.items():
        if args.only and name != args.only:
            continue
        style = direction + ', ' + feeling
        fingerprint = hashlib.sha256(json.dumps([g.MODEL, voice, style, line], ensure_ascii=False).encode()).hexdigest()[:12]
        target = cache / (name + '-' + fingerprint + '.wav')
        if not target.exists():
            print('Rendering ' + name, flush=True)
            data = g.gemini_speak(keys.get('GEMINI_API_KEY'), line, voice, style, spend)
            if not dry:
                g.polish(data, target)
        if target.exists():
            validate_clip(target)
            clips[name] = {'file': 'assets/voice/' + target.name, 'text': line,
                           'style': style, 'seconds': g.seconds_of(target.read_bytes()),
                           'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}
    if not dry and not args.only:
        # Publish only a complete, validated set. Changed voice/settings always change the filename.
        if len(clips) != len(LINES):
            raise SystemExit('Incomplete set; existing game library has not been changed.')
        OUT.mkdir(parents=True, exist_ok=True)
        old_path = OUT / 'manifest.json'
        old = json.loads(old_path.read_text(encoding='utf-8')) if old_path.exists() else {}
        if old and old.get('clips') != clips:
            backup = g.AUD / 'superseded' / time.strftime('%Y%m%d-%H%M%S')
            shutil.copytree(OUT, backup)
            print('Previous library backed up to ' + str(backup))
        for clip in clips.values():
            filename = pathlib.Path(clip['file']).name
            shutil.copy2(cache / filename, OUT / filename)
        manifest = {'model': g.MODEL, 'voice': voice, 'direction': direction,
                    'source': source['reference'], 'clips': clips}
        temporary = OUT / 'manifest.next.json'
        temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
        temporary.replace(old_path)
        (OUT / 'NOTICE.txt').write_text('Original synthetic character voice generated with Google Gemini TTS. '
                                      'Reuses the Mike explainer voice voice_h0dygekvdjzv on gemini-3.8-flash-tts. '
                                      'Audio carries Google SynthID. No real person is impersonated.\n', encoding='utf-8')
        # Old files stay available for already-open tabs; the new manifest references only the corrected set.
        print(f'Published all {len(clips)} clips with the explainer voice ' + voice)
    elif args.only and not dry:
        print('Validated canary; the game library has not been changed.')
    spend.report()

if __name__ == '__main__':
    main()
