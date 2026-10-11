"""Build Jof's listening page for round 4's voice work (J6): docs/little-patterns-round-4/build/phase-5/listen/.

  python tools/build-little-patterns-listen.py

For each success line: today's chain (the clips as they were before trimming, one after another through one player, as the
live game plays them), the new joined clip at rate 1.0 and at 1.05, and the whole-sentence recording where one was rendered.
The page joins in the browser with a copy of the game's own shared.js (its joiner; the game part stays asleep without
learning.js), from the trimmed clips, exactly as the game does: so on the iPad it also tries the real Blob playback. Then the ten "Nook feels" performances, the
composed prompts, and the audition words before and after trimming.

The page is a local docs page, never deployed: it copies the WAVs it needs beside itself, so serve that folder alone:
  python -m http.server 8790 --directory docs/little-patterns-round-4/build/phase-5/listen
Nothing here calls any service; it reads the bundled clips and the raw takes cached by tools/nook-voice-gemini.py.
"""
import importlib.util
import json
import pathlib
import re
import shutil
import subprocess
import sys
import wave

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
ROOT = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = ROOT / 'public' / 'fireworks' / 'little-patterns'
LISTEN = ROOT / 'docs' / 'little-patterns-round-4' / 'build' / 'phase-5' / 'listen'
RAW = ROOT / '.wrangler' / 'voice-build' / 'gemini-raw' / 'northampton'


def load(name, file):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'tools' / file)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


GEMINI = load('gemini_tool', 'nook-voice-gemini.py')
STATS = json.loads((ROOT / 'docs' / 'little-patterns-round-4' / 'build' / 'phase-5' / 'trim-stats.json').read_text(encoding='utf-8'))
MANIFEST = json.loads((PUBLIC / 'assets' / 'voice' / 'manifest.json').read_text(encoding='utf-8'))
key = lambda t: re.sub(r'[.!?,]+$', '', ' '.join(t.strip().lower().split()))

# (id, what the bubble shows, the parts the game speaks, the whole-sentence recording if there is one)
SUCCESS = [
    ('add-3-2', 'Yes! 3 + 2 = 5.', ['Yes!', 'THREE', 'plus', 'TWO', 'equals', 'FIVE'], 'add-3-2'),
    ('count-4', 'Spot on! 4 apples.', ['Spot on!', 'FOUR', 'apples'], 'count-4'),
    ('take-6-2', 'That’s the one. 6 − 2 = 4.', ['That’s the one.', 'SIX', 'take away', 'TWO', 'equals', 'FOUR'], 'take-6-2'),
    ('add-4-5', 'You found it. 4 + 5 = 9.', ['You found it.', 'FOUR', 'plus', 'FIVE', 'equals', 'NINE'], None),
    ('count-7', '7 apples. Lovely counting.', ['SEVEN', 'apples', 'Lovely counting.'], None),
    ('pentagon', 'Spot on! A pentagon has five sides.', ['Spot on!', 'A pentagon has five sides.'], None),
    ('oval', 'It’s an oval! Yes!', ["It's an oval!", 'Yes!'], None),
    ('pattern', 'That’s the one. The pattern fits.', ['That’s the one.', 'The pattern fits.'], None),
    ('which', 'Well done! Proud.', ['Well done!', 'Proud'], None),
]
PROMPTS = [
    ('prompt-add', 'Three, then two more. How many?', ['three,', 'then', 'two', 'more.', 'How many?']),
    ('prompt-take', 'Nook eats two. How many are left?', ['Nook eats', 'two.', 'How many are left?']),
    ('prompt-take-all', 'Nook eats them all. How many are left?', ['Nook eats them all. How many are left?']),
    ('prompt-count', 'How many apples?', ['How many apples?']),
    ('prompt-board', 'Nook feels… Tap one.', ['Nook feels… Tap one.']),
]
BOARD = ['happy', 'calm', 'proud', 'excited', 'surprised', 'sad', 'worried', 'disappointed', 'angry', 'frustrated']
AUDITION = ['five', 'six', 'seven', 'apples', 'equals', 'plus', 'the pattern fits', 'a hexagon has six sides', 'how many sides',
            'nook takes a breath', 'it turns around', 'count on', "hello! i'm nook. let's play", "good try! let's look again",
            'a fish can swim', 'ali sees a flower in the garden. ali says, i feel happy', 'more', 'then', 'drag the words, first to last']


def clip(k):
    return MANIFEST['clips'][key(k)]


def after(k):
    """The trimmed game clip, copied beside the page."""
    name = pathlib.Path(clip(k)['file']).name
    target = LISTEN / 'clips' / name
    if not target.exists():
        shutil.copyfile(PUBLIC / clip(k)['file'], target)
    return 'clips/' + name, clip(k)['seconds']


def before(k):
    """The clip as it was before trimming: the library polish of the same cached raw take (what the live game plays today)."""
    name = pathlib.Path(clip(k)['file']).name
    target = LISTEN / 'before' / name
    if not target.exists():
        GEMINI.polish((RAW / name).read_bytes(), target)
    with wave.open(str(target), 'rb') as w:
        return 'before/' + name, round(w.getnframes() / w.getframerate(), 3)


def parts_of(parts):
    """The trimmed clips for a joined line, with what each part says (the joiner's gaps follow the text)."""
    return [{'text': t, 'file': after(t)[0]} for t in parts]


def main():
    for sub in ('clips', 'before', 'joined'):
        shutil.rmtree(LISTEN / sub, ignore_errors=True)
    for sub in ('clips', 'before'):
        (LISTEN / sub).mkdir(parents=True, exist_ok=True)
    shutil.copyfile(PUBLIC / 'shared.js', LISTEN / 'shared.js')
    def info(parts):
        """The joiner's gaps and the joined length, worked out by shared.js itself from the trimmed clips."""
        program = ("const J=require(process.argv[1]),fs=require('fs');const [parts,files]=JSON.parse(process.argv[2]);"
                   "const pcms=files.map(f=>{const b=fs.readFileSync(f);return J.parseWav(b.buffer.slice(b.byteOffset,b.byteOffset+b.length));});"
                   "console.log(JSON.stringify({gaps:J.phraseGaps(parts),total:J.join(parts,pcms).total}));")
        files = [str(PUBLIC / clip(t)['file']) for t in parts]
        out = subprocess.run(['node', '-e', program, str(PUBLIC / 'shared.js'), json.dumps([parts, files])], check=True, capture_output=True,
                             text=True, encoding='utf-8').stdout
        d = json.loads(out)
        return {'gaps': d['gaps'], 'joined_s': round(d['total'], 2)}
    data = {'success': [], 'prompts': [], 'feelings': [], 'audition': []}
    for ident, shown, parts, compare in SUCCESS:
        today = [before(p) for p in parts]
        row = {'id': ident, 'shown': shown, 'parts': parts_of(parts), **info(parts),
               'today': [f for f, _ in today], 'today_s': round(sum(s for _, s in today), 2)}
        if compare:
            with wave.open(str(LISTEN / 'compare' / (compare + '.wav')), 'rb') as w:
                row['whole'], row['whole_s'] = 'compare/' + compare + '.wav', round(w.getnframes() / w.getframerate(), 2)
        data['success'].append(row)
    for ident, shown, parts in PROMPTS:
        data['prompts'].append({'id': ident, 'shown': shown, 'parts': parts_of(parts), **info(parts)})
    for f in BOARD:
        parts = [f.capitalize(), f'Nook feels {f}.']
        data['feelings'].append({'feeling': f, 'parts': parts_of(parts), **info(parts), 'line_s': clip(parts[1])['seconds']})
    for k in AUDITION:
        b, bs = before(k)
        a, as_ = after(k)
        st = STATS.get(k, {})
        data['audition'].append({'text': k, 'before': b, 'before_s': bs, 'after': a, 'after_s': as_,
                                 'pauses': st.get('pauses_ms', []), 'lowered': st.get('lowered_at', []), 'clicks': st.get('clicks_left_out_ms', [])})
    (LISTEN / 'index.html').write_text(TEMPLATE.replace('/*DATA*/null', json.dumps(data, ensure_ascii=False)), encoding='utf-8')
    size = sum(p.stat().st_size for p in LISTEN.rglob('*') if p.is_file())
    print(f'Listening page: {LISTEN / "index.html"} ({size / 1024 / 1024:.1f} MiB with its clips)')


TEMPLATE = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nook's voice: listen</title>
<style>
:root{--bg:#fbf8ef;--ink:#2f2a3a;--soft:#6b6478;--card:#fff;--line:#e4dccb;--accent:#2f7d6d;--accent-ink:#fff;--warm:#b4561f;--chip:#efe8d8}
@media (prefers-color-scheme:dark){:root{--bg:#1d1b22;--ink:#ece8f2;--soft:#a9a2b6;--card:#272430;--line:#3a3646;--accent:#5fc0a9;--accent-ink:#10251f;--warm:#f0a46e;--chip:#332f3d}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:960px;margin:0 auto;padding:20px 16px 60px}
h1{font-size:1.6rem;margin:.2em 0 .3em}h2{font-size:1.2rem;margin:2em 0 .4em}
p{max-width:72ch}.soft{color:var(--soft)}
.row{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin:10px 0}
.row h3{font-size:1.05rem;margin:0 0 6px;font-weight:600}
.parts{font-size:.85rem;color:var(--soft);margin:0 0 8px}
.buttons{display:flex;flex-wrap:wrap;gap:8px}
button{font:inherit;font-size:.95rem;min-height:44px;padding:8px 14px;border-radius:999px;border:1px solid var(--line);background:var(--chip);color:var(--ink);cursor:pointer}
button.main{background:var(--accent);color:var(--accent-ink);border-color:transparent}
button.whole{border-color:var(--warm)}
button[aria-pressed="true"]{outline:3px solid var(--warm);outline-offset:2px}
button small{opacity:.8;margin-left:4px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:10px}
.note{border-left:4px solid var(--warm);padding:4px 12px;margin:12px 0}
code{background:var(--chip);padding:1px 6px;border-radius:6px;font-size:.9em}
.stop{position:sticky;top:8px;float:right;z-index:2}
</style>
</head>
<body>
<main>
<button class="stop" type="button" id="stop">Stop</button>
<h1>Nook's voice: listen and choose</h1>
<p class="soft">Serve this folder on its own, then open it on this PC or the iPad (same Wi-Fi):
<code>python -m http.server 8790 --directory docs/little-patterns-round-4/build/phase-5/listen</code>, then
<code>http://localhost:8790/</code> (or <code>http://&lt;this PC&gt;:8790/</code>). Opened as a plain file, the joined buttons cannot load their clips.</p>
<p>Round 4, phase 5. Every clip was trimmed (the quiet rumble before and after each word is gone, long pauses inside a clip
are shorter), and a line made of several clips can now play as one joined clip with short gaps instead of clip after clip.
Nothing on this page is deployed. Listen on the iPad if you can.</p>
<div class="note"><p><b>Start here:</b> the first three lines each have four buttons. <b>Today</b> is the live game (the
old clips one after another). <b>Joined</b> is the new build. <b>Joined 1.05</b> is the same, five per cent quicker, pitch
kept. <b>Whole sentence</b> is one recording of the whole line. The question (J6): are the joined lines good enough, or
should the most-played success lines (Add and Take away within ten, Count, the shapes) get whole-sentence recordings?</p></div>
<section id="success"><h2>Success lines</h2></section>
<section id="prompts"><h2>Prompts (new clips; the first two are joined from phrases and number clips)</h2></section>
<section><h2>Nook feels &hellip; (the performance: the word, then the line)</h2><div class="grid" id="feelings"></div></section>
<section id="audition"><h2>Before and after trimming</h2>
<p class="soft">Listen for the ends of words: the <i>f</i> and <i>v</i> of FIVE, the <i>s</i> and <i>x</i> of SIX, the <i>s</i> of APPLES and
SIDES, the <i>ts</i> of FITS. Long pauses inside a clip became 150 ms (300 ms between sentences). "more" and "then" breathe out
at the end of the take, which is why they are long.</p></section>
<p class="soft" style="margin-top:3em">Built by <code>tools/build-little-patterns-listen.py</code>. The joined lines are joined here in
the browser by a copy of the game's own <code>shared.js</code>, from the trimmed clips, exactly as the game does.</p>
<p class="soft" id="joiner"></p>
</main>
<script src="shared.js"></script>
<script>
const DATA = /*DATA*/null;
const J = window.LPVoiceJoin;
const audio = new Audio(); audio.preload = 'auto';
let queue = [], pressed = null, url = '', unlocked = false;
const SILENT = 'data:audio/wav;base64,UklGRgQCAABXQVZFZm10IBAAAAABAAEAwF0AAIC7AAACABAAZGF0YeABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
const pcm = new Map();
function rate(r){ audio.defaultPlaybackRate = r; audio.playbackRate = r; audio.preservesPitch = true; audio.webkitPreservesPitch = true; audio.mozPreservesPitch = true; }
function stop(){ queue = []; audio.pause(); audio.onended = null; if (pressed) pressed.setAttribute('aria-pressed', 'false'); pressed = null; }
function play(files, r, button){
  stop(); queue = files.slice(); pressed = button; if (button) button.setAttribute('aria-pressed', 'true');
  const next = () => { if (!queue.length) { if (pressed) pressed.setAttribute('aria-pressed', 'false'); pressed = null; return; } audio.src = queue.shift(); rate(r); audio.onended = next; audio.play().catch(() => {}); };
  next();
}
// The game's join, in the browser: fetch each trimmed part, parse it, join with the phrase gaps, play the one Blob.
async function joined(parts){
  const pcms = await Promise.all(parts.map(async p => { if (!pcm.has(p.file)) { const r = await fetch(p.file); pcm.set(p.file, J.parseWav(await r.arrayBuffer())); } return pcm.get(p.file); }));
  const j = J.join(parts.map(p => p.text), pcms);
  if (url) URL.revokeObjectURL(url);
  url = URL.createObjectURL(new Blob([j.wav], { type: 'audio/wav' }));
  return { url, total: j.total };
}
const el = (tag, attrs, text) => { const e = document.createElement(tag); Object.assign(e, attrs || {}); if (text != null) e.textContent = text; return e; };
function button(label, seconds, action, r, cls){
  const b = el('button', { type: 'button', className: cls || '' }), small = el('small', {}, seconds ? '(' + seconds.toFixed(1) + ' s)' : '');
  b.append(label); b.append(small); b.setAttribute('aria-pressed', 'false');
  b.onclick = async () => {
    if (pressed === b) return stop();
    // iPad Safari lets a page start sound only from a tap: a joined line is built after a fetch, so the first tap plays a
    // 10 ms silence at once, which unlocks this one player for the rest of the visit (the game does the same with its first clip).
    if (!unlocked) { audio.src = SILENT; audio.play().then(() => { unlocked = true; }).catch(() => {}); }
    if (typeof action === 'function') { const j = await action(); small.textContent = '(' + (j.total / r).toFixed(1) + ' s)'; play([j.url], r, b); }
    else play(action, r, b);
  };
  return b;
}
const gapsText = (parts, gaps) => parts.map((p, i) => p.text + (i < gaps.length ? '  →' + gaps[i] + ' ms→  ' : '')).join('');
function line(row, host, extra){
  const r = el('div', { className: 'row' }); r.append(el('h3', {}, row.shown || row.feeling.toUpperCase()));
  if (row.parts.length > 1) r.append(el('p', { className: 'parts' }, 'Parts and gaps: ' + gapsText(row.parts, row.gaps)));
  const bs = el('div', { className: 'buttons' });
  if (row.today) bs.append(button('Today', row.today_s, row.today, 1));
  const one = row.parts.length === 1;
  bs.append(button(one ? 'Clip' : 'Joined', row.joined_s, one ? [row.parts[0].file] : () => joined(row.parts), 1, 'main'));
  bs.append(button((one ? 'Clip' : 'Joined') + ' 1.05', row.joined_s / 1.05, one ? [row.parts[0].file] : () => joined(row.parts), 1.05, 'main'));
  if (row.whole) bs.append(button('Whole sentence', row.whole_s, [row.whole], 1, 'whole'));
  if (extra) extra(bs);
  r.append(bs); host.append(r);
}
if (!J) document.getElementById('joiner').textContent = 'shared.js did not load, so the joined buttons cannot work: serve this folder as the top of the page explains.';
for (const s of DATA.success) line(s, document.getElementById('success'));
for (const s of DATA.prompts) line(s, document.getElementById('prompts'));
for (const f of DATA.feelings) line(f, document.getElementById('feelings'), bs => bs.append(button('"Nook feels ' + f.feeling + '." alone', f.line_s, [f.parts[1].file], 1)));
for (const a of DATA.audition) {
  const row = el('div', { className: 'row' }); row.append(el('h3', {}, a.text));
  const notes = [];
  if (a.pauses.length) notes.push('pauses ' + a.pauses.map(p => p[0] + '→' + p[1] + ' ms').join(', '));
  if (a.lowered.length) notes.push('kept a fading sound at the ' + a.lowered.join(' and '));
  if (a.clicks.length) notes.push('left out a click');
  if (notes.length) row.append(el('p', { className: 'parts' }, notes.join('; ')));
  const bs = el('div', { className: 'buttons' });
  bs.append(button('Before', a.before_s, [a.before], 1));
  bs.append(button('After', a.after_s, [a.after], 1, 'main'));
  row.append(bs); document.getElementById('audition').append(row);
}
document.getElementById('stop').onclick = stop;
</script>
</body>
</html>
"""

if __name__ == '__main__':
    main()
