"""Little Patterns voice polish (round 4): trim each bundled clip against its own peak and shorten long pauses inside it.

  python tools/nook-voice-polish.py               polish assets/voice in place (backup first); update manifest.json and voice-library.js
  python tools/nook-voice-polish.py --dry-run     report what would change; write nothing
  python tools/nook-voice-polish.py --audition    before/after for the audition list (FIVE, SIX, APPLES, plurals, sentence endings)
  python tools/nook-voice-polish.py --compare     polish the whole-sentence comparison recordings beside the listening page

Run it after `python tools/nook-voice-gemini.py library ...`, which re-polishes every clip from the raw cache. A ledger
(.wrangler/voice-build/polish-ledger.json) remembers the bytes this step wrote, so a second run skips clips it already did.

The rules (BUILD-BRIEF section 7, items 21 and 66):
- What counts as speech, per 5 ms frame, relative to the clip's own peaks: the pre-emphasised (first difference) level within
  48 dB of its peak, or the plain level within 35 dB of the clip's peak. The voice model leaves a low rumble (and often a
  click and a breath) before and after the words; the rumble has almost no high frequencies, while quiet consonants such as
  the f of five, the s of six and a final t are mostly high frequencies, so this keeps the consonants and drops the rumble.
  Runs of 10 ms or less do not count; a burst under 50 ms more than 150 ms away from the words at either end is a click and
  is left out (listed in the statistics), except a burst after a line that ends on a stop consonant (asleep, wet), which is
  that consonant's release.
- Ends: keep 30 ms before the first speech frame and 50 ms after the last; 10 ms fades in and out.
- Audit at both ends: from the last (first) speech frame, quieter voice is followed down to 6 dB below both thresholds (and
  at least 4 dB above the floor measured at that end of the old clip). If it runs more than 20 ms past the cut, a fading
  final consonant or a soft onset would be lost, so that end is cut again at the lower level.
- Pauses: a gap between stretches of speech, below both thresholds for its whole length and longer than 250 ms, is
  shortened. Phrase pauses become 150 ms. A clip whose text has N sentence breaks ("Hello! I'm Nook. Let's play." has two)
  keeps its N longest pauses at 300 ms, because item 66 asks for phrase boundaries to be treated differently from the gaps
  inside a sentence. The cut is made in the middle of the pause with a 10 ms crossfade, so no word is ever cut.
- The 26 phonics clips (LETTER_SOUNDS values) are never touched.
- No gain change: loudness stays as the library polish set it.

Standard library only. Nothing here reads player data.
"""
import array
import datetime
import hashlib
import importlib.util
import io
import json
import math
import pathlib
import re
import shutil
import subprocess
import sys
import wave

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
ROOT = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = ROOT / 'public' / 'fireworks' / 'little-patterns'
OUTPUT = PUBLIC / 'assets' / 'voice'
BUILD = ROOT / '.wrangler' / 'voice-build'
LEDGER = BUILD / 'polish-ledger.json'
STATS = ROOT / 'docs' / 'little-patterns-round-4' / 'build' / 'phase-5' / 'trim-stats.json'
RATE = 24000
FRAME = 120                    # 5 ms at 24 kHz
HISS_DB = -48.0                # a frame is speech if its pre-emphasised level is within 48 dB of that signal's peak ...
LOUD_DB = -35.0                # ... or its plain level is within 35 dB of the clip's peak
AUDIT_DB = 6.0                 # the audit level sits this far below both thresholds ...
AUDIT_FLOOR_DB = 4.0           # ... but at least this far above the clip's own floor at that end
FLOOR_MS = 25                  # the floor: the quietest end of the old clip (the library polish left ~30 ms and ~117 ms of it)
SPIKE_MS = 10                  # speech runs this short (a click, a lip noise) do not count
JOIN_MS = 40                   # runs closer than this belong to one stretch of speech
EDGE_BURST_MS = 50             # a burst this short at either end ...
EDGE_GAP_MS = 150              # ... and this far from the words is a click, not a consonant
LEAD_MS, TAIL_MS, FADE_MS = 30, 50, 10
PAUSE_MIN_MS = 250
PHRASE_PAUSE_MS = 150
SENTENCE_PAUSE_MS = 300
XFADE_MS = 10
LOSS_LIMIT_MS = 20
AUDITION = ['five', 'six', 'apples', 'apple', 'seven', 'cats', 'birds', 'dogs', 'the pattern fits', 'a hexagon has six sides',
            'how many sides', 'how many apples', "that's the one", 'nook takes a breath', 'count on', 'it turns around',
            'equals', 'sixty', 'fifty', "it's an oval", "it's a rectangle"]


def ms(n):
    return round(n * 1000 / RATE)


def samples_of(ms_):
    return int(round(ms_ * RATE / 1000))


def read(path):
    with wave.open(str(path), 'rb') as w:
        if (w.getnchannels(), w.getsampwidth(), w.getframerate()) != (1, 2, RATE):
            raise ValueError(f'{path.name}: expected 24 kHz 16-bit mono')
        data = array.array('h', w.readframes(w.getnframes()))
    if sys.byteorder != 'little':
        data.byteswap()
    return data


def wav_bytes(data):
    out = array.array('h', data)
    if sys.byteorder != 'little':
        out.byteswap()
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(out.tobytes())
    return buf.getvalue()


def envelope(data):
    env = []
    for i in range(0, len(data), FRAME):
        seg = data[i:i + FRAME]
        env.append(math.sqrt(sum(v * v for v in seg) / len(seg)) if len(seg) else 0.0)
    return env


def measure(data):
    """Per 5 ms frame: the plain level and the pre-emphasised (first difference) level, with both peaks. The quiet low rumble
    the voice model leaves before and after the words has almost no high frequencies, while quiet consonants (f, s, th, a
    final t) are mostly high frequencies, so the pre-emphasised level tells them apart where a plain level cannot."""
    diff = array.array('i', [0])
    diff.extend(data[i] - data[i - 1] for i in range(1, len(data)))
    return {'plain': envelope(data), 'hiss': envelope(diff), 'peak': max(abs(v) for v in data), 'hiss_peak': max(abs(v) for v in diff)}


def speech_frames(m, lower_db=0.0):
    """Stretches of speech as [first frame, last frame + 1], thresholds relative to the clip's own peaks."""
    hiss = m['hiss_peak'] * 10 ** ((HISS_DB - lower_db) / 20)
    loud = m['peak'] * 10 ** ((LOUD_DB - lower_db) / 20)
    flags = [h > hiss or p > loud for h, p in zip(m['hiss'], m['plain'])]
    runs, start = [], None
    for i, f in enumerate(flags + [False]):
        if f and start is None:
            start = i
        elif not f and start is not None:
            if (i - start) * 5 > SPIKE_MS:
                runs.append([start, i])
            start = None
    segs = []
    for r in runs:
        if segs and (r[0] - segs[-1][1]) * 5 < JOIN_MS:
            segs[-1][1] = r[1]
        else:
            segs.append(r)
    return segs


def sentence_breaks(text):
    return len(re.findall(r'[.!?\u2026](?=\s)', text or ''))


def median(xs):
    xs = sorted(xs)
    return xs[len(xs) // 2] if xs else 0.0


def decay(m, frame, step, floor_frames):
    """From a speech frame, walk outwards (step +1 to the end, -1 to the start) while the voice is still above the audit
    level: 6 dB below the thresholds, but at least 4 dB above the floor measured at that end of the clip. Gaps of one frame
    are walked over. Returns the frame where the quieter signal ends."""
    hiss_floor, plain_floor = median([m['hiss'][i] for i in floor_frames]), median([m['plain'][i] for i in floor_frames])
    hiss = max(m['hiss_peak'] * 10 ** ((HISS_DB - AUDIT_DB) / 20), hiss_floor * 10 ** (AUDIT_FLOOR_DB / 20))
    plain = max(m['peak'] * 10 ** ((LOUD_DB - AUDIT_DB) / 20), plain_floor * 10 ** (AUDIT_FLOOR_DB / 20))
    above = lambda i: 0 <= i < len(m['hiss']) and (m['hiss'][i] > hiss or m['plain'][i] > plain)
    k = frame
    while above(k + step) or above(k + 2 * step):
        k += step
    return k


def plan(data, text, m):
    """Where to cut: the kept range and the pauses to shorten, in samples, plus what the audit found."""
    segs = speech_frames(m)
    if not segs:
        raise ValueError('no speech found')
    dropped = []
    while len(segs) > 1 and (segs[0][1] - segs[0][0]) * 5 < EDGE_BURST_MS and (segs[1][0] - segs[0][1]) * 5 > EDGE_GAP_MS:
        dropped.append(['start', segs[0][0] * 5, (segs[0][1] - segs[0][0]) * 5])
        segs = segs[1:]
    # a short burst after the last word is a click, unless the line ends on a stop consonant (asleep, wet, bead, out): then it
    # is that consonant's release and stays
    plosive = re.search(r'(?:[ptkbdg]e?|ck)$', re.sub(r'[^a-z]+$', '', (text or '').lower())) is not None
    while not plosive and len(segs) > 1 and (segs[-1][1] - segs[-1][0]) * 5 < EDGE_BURST_MS and (segs[-1][0] - segs[-2][1]) * 5 > EDGE_GAP_MS:
        dropped.append(['end', segs[-1][0] * 5, (segs[-1][1] - segs[-1][0]) * 5])
        segs = segs[:-1]
    first, last = segs[0][0] * FRAME, segs[-1][1] * FRAME
    start = max(0, first - samples_of(LEAD_MS))
    end = min(len(data), last + samples_of(TAIL_MS))
    # the audit: does quieter voice (a fading final consonant, a soft onset) run on past either cut?
    n, f = len(m['hiss']), FLOOR_MS // 5
    tail_signal = (decay(m, segs[-1][1] - 1, 1, range(n - f, n)) + 1) * FRAME
    lead_signal = decay(m, segs[0][0], -1, range(0, f)) * FRAME
    tail_loss, lead_loss = max(0, tail_signal - end), max(0, start - lead_signal)
    lowered = []
    if ms(tail_loss) > LOSS_LIMIT_MS:                    # trim that end again at the lower (audit) level
        end, lowered = min(len(data), tail_signal + samples_of(TAIL_MS)), lowered + ['end']
    if ms(lead_loss) > LOSS_LIMIT_MS:
        start, lowered = max(0, lead_signal - samples_of(LEAD_MS)), lowered + ['start']
    # pauses: the gaps between stretches of speech, each below both thresholds for its whole length
    runs = [(x[1] * FRAME, y[0] * FRAME) for x, y in zip(segs, segs[1:]) if (y[0] - x[1]) * FRAME > samples_of(PAUSE_MIN_MS)]
    longest = sorted(runs, key=lambda r: r[1] - r[0], reverse=True)[:sentence_breaks(text)]
    pauses = []
    for x, y in runs:
        target = samples_of(SENTENCE_PAUSE_MS if (x, y) in longest else PHRASE_PAUSE_MS)
        if y - x > target:
            pauses.append((x, y, target))
    return {'start': start, 'end': end, 'pauses': pauses, 'first': first, 'last': last, 'dropped': dropped,
            'tail_signal': tail_signal, 'lead_signal': lead_signal, 'tail_loss': tail_loss, 'lead_loss': lead_loss, 'lowered': lowered}


def render(data, cut):
    """Apply a plan: shorten each pause in its middle with a crossfade, keep the padded range, fade both ends."""
    x = samples_of(XFADE_MS)
    out, pos = array.array('h'), cut['start']
    for a, b, target in cut['pauses']:
        keep = (target + x) // 2                         # each side keeps this much; the overlap makes the target length
        left_end, right_start = a + keep, b - keep
        out.extend(data[pos:left_end - x])
        for i in range(x):                               # linear crossfade over the overlap (both sides are near silence)
            t = (i + .5) / x
            out.append(int(round(data[left_end - x + i] * (1 - t) + data[right_start + i] * t)))
        pos = right_start + x
    out.extend(data[pos:cut['end']])
    f = min(samples_of(FADE_MS), len(out) // 4)
    for i in range(f):
        g = (i + .5) / f
        out[i] = int(round(out[i] * g))
        out[-1 - i] = int(round(out[-1 - i] * g))
    return out


def polish_clip(data, text):
    """-> (new samples, report)."""
    m = measure(data)
    cut = plan(data, text, m)
    out = render(data, cut)
    report = {'before_s': round(len(data) / RATE, 3), 'after_s': round(len(out) / RATE, 3),
              'lead_cut_ms': ms(cut['start']), 'tail_cut_ms': ms(len(data) - cut['end']),
              'first_voiced_ms': ms(cut['first']), 'last_voiced_ms': ms(cut['last']),
              'quiet_tail_ends_ms': ms(cut['tail_signal']), 'cut_at_ms': ms(cut['end']),
              'tail_loss_first_try_ms': ms(cut['tail_loss']), 'lead_loss_first_try_ms': ms(cut['lead_loss']),
              'lowered_at': cut['lowered'],
              'pauses_ms': [[ms(y - x), ms(t)] for x, y, t in cut['pauses']],
              'pause_removed_ms': ms(sum((y - x) - t for x, y, t in cut['pauses'])),
              'clicks_left_out_ms': cut['dropped']}
    return out, report


def bank_info():
    program = ("const L=require('./public/fireworks/little-patterns/learning.js');"
               "console.log(JSON.stringify({phonics:Object.values(L.LETTER_SOUNDS)}));")
    out = subprocess.run(['node', '-e', program], cwd=ROOT, check=True, capture_output=True, text=True, encoding='utf-8').stdout
    return json.loads(out)


def sha(b):
    return hashlib.sha256(b).hexdigest()


def write_index(manifest):
    data = json.dumps(manifest, ensure_ascii=False, indent=2)
    (OUTPUT / 'manifest.json').write_text(data + '\n', encoding='utf-8')
    (PUBLIC / 'voice-library.js').write_text('/* Generated by tools/nook-voice-gemini.py. */\nwindow.LPVoiceLibrary=' + data + ';\n', encoding='utf-8')


def library(dry):
    manifest = json.loads((OUTPUT / 'manifest.json').read_text(encoding='utf-8'))
    phonics = set(bank_info()['phonics'])
    ledger = json.loads(LEDGER.read_text(encoding='utf-8')) if LEDGER.exists() else {}
    stats = json.loads(STATS.read_text(encoding='utf-8')) if STATS.exists() else {}
    todo = []
    for key, clip in sorted(manifest['clips'].items()):
        if key in phonics:
            continue
        path = PUBLIC / clip['file']
        raw = path.read_bytes()
        if ledger.get(path.name) == sha(raw):
            continue                                  # already polished by this step
        todo.append((key, clip, path))
    print(f'{len(todo)} clips to polish, {len(phonics)} phonics clips left as they are.')
    if not todo:
        return
    if not dry:
        backup = BUILD / ('backup-polish-' + datetime.datetime.now().strftime('%Y%m%d-%H%M%S'))
        shutil.copytree(OUTPUT, backup)
        print(f'Library backed up to {backup}')
    removed = 0.0
    for key, clip, path in todo:
        data = read(path)
        out, report = polish_clip(data, key)
        removed += report['before_s'] - report['after_s']
        report['file'] = path.name
        stats[key] = report
        if report['lowered_at']:
            print(f'  {key!r}: trimmed again at the lower level at the {" and ".join(report["lowered_at"])}: the first try would lose '
                  f'{report["tail_loss_first_try_ms"]} ms at the end, {report["lead_loss_first_try_ms"]} ms at the start')
        if report['clicks_left_out_ms']:
            print(f'  {key!r}: left out {report["clicks_left_out_ms"]} (where, at ms, length ms)')
        if dry:
            continue
        b = wav_bytes(out)
        path.write_bytes(b)
        ledger[path.name] = sha(b)
        clip['seconds'] = round(len(out) / RATE, 3)
    print(f'{"Would remove" if dry else "Removed"} {removed:.1f} s in all.')
    if dry:
        return
    write_index(manifest)
    LEDGER.write_text(json.dumps(ledger, indent=1, sort_keys=True), encoding='utf-8')
    STATS.parent.mkdir(parents=True, exist_ok=True)
    STATS.write_text(json.dumps(stats, ensure_ascii=False, indent=1, sort_keys=True) + '\n', encoding='utf-8')
    print(f'manifest.json and voice-library.js updated; statistics in {STATS.relative_to(ROOT)}')


def audition():
    """Before (the library backup made before the first polish) and after, with the tail figures, for the audition words."""
    manifest = json.loads((OUTPUT / 'manifest.json').read_text(encoding='utf-8'))
    stats = json.loads(STATS.read_text(encoding='utf-8')) if STATS.exists() else {}
    keys = [k for k in AUDITION if k in manifest['clips']]
    keys += [k for k in sorted(manifest['clips']) if re.fullmatch(r'[a-z]+s', k) and k not in keys][:8]   # more plurals
    print(f'{"clip":32} {"before":>7} {"after":>7} {"lead cut":>8} {"tail cut":>8} {"last voiced":>11} {"quiet end":>9} {"cut at":>7}')
    for k in keys:
        s = stats.get(k)
        if not s:
            data = read(PUBLIC / manifest['clips'][k]['file'])
            _, s = polish_clip(data, k)
        print(f'{k[:32]:32} {s["before_s"]:7.3f} {s["after_s"]:7.3f} {s["lead_cut_ms"]:6d}ms {s["tail_cut_ms"]:6d}ms {s["last_voiced_ms"]:9d}ms {s["quiet_tail_ends_ms"]:7d}ms {s["cut_at_ms"]:5d}ms'
              + (f'  (lower level at the {"/".join(s["lowered_at"])})' if s['lowered_at'] else '') + (f'  left out {s["clicks_left_out_ms"]}' if s['clicks_left_out_ms'] else ''))


def comparisons():
    spec = importlib.util.spec_from_file_location('gemini_tool', ROOT / 'tools' / 'nook-voice-gemini.py')
    tool = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(tool)
    ledger = json.loads(LEDGER.read_text(encoding='utf-8')) if LEDGER.exists() else {}
    for name, text, _ in tool.COMPARISONS:
        path = tool.COMPARE_DIR / (name + '.wav')
        if not path.exists():
            print(f'{name}: not rendered yet')
            continue
        tag = 'compare/' + path.name
        if ledger.get(tag) == sha(path.read_bytes()):
            continue
        out, report = polish_clip(read(path), text)
        b = wav_bytes(out)
        path.write_bytes(b)
        ledger[tag] = sha(b)
        print(f'{name}: {report["before_s"]:.2f} s -> {report["after_s"]:.2f} s, pauses {report["pauses_ms"]}')
    LEDGER.write_text(json.dumps(ledger, indent=1, sort_keys=True), encoding='utf-8')


def main(argv):
    if '--audition' in argv:
        audition()
    elif '--compare' in argv:
        comparisons()
    else:
        library('--dry-run' in argv)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
