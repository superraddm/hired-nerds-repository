"""Build the local review gallery, route overview and voice audition sheet."""
import html
import json
from pathlib import Path
import wave

ROOT=Path(__file__).resolve().parent.parent
GAME=ROOT/'public/fireworks/mike-game'
OUT=ROOT/'docs/mike-platformer/nightshift-look'
d=json.loads((GAME/'level-1.json').read_text())
v=json.loads((GAME/'assets/voice/manifest.json').read_text(encoding='utf-8'))
checks=json.loads((OUT/'measurements.json').read_text())
stats=checks['structure']
seconds=checks['demo']['seconds']
for clip in v['clips'].values():
    with wave.open(str(GAME/clip['file']),'rb') as w:
        assert (w.getframerate(),w.getnchannels(),w.getsampwidth())==(24000,1,2)
        assert w.getnframes()>5000

svg=['<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1020" viewBox="0 0 1200 1020">',
     '<rect width="1200" height="1020" fill="#071520"/>',
     '<g font-family="Arial,sans-serif"><text x="32" y="34" fill="#e1eff1" font-size="20">THE NIGHT SHIFT / ROUTE OVERVIEW</text>',
     '<text x="32" y="59" fill="#8faab7" font-size="13">Floor: steel · maintenance platforms: cyan · machines: amber · checkpoints: white</text>']
for row in range(5):
    start=row*192;top=100+row*178
    svg.append(f'<text x="32" y="{top}" fill="#90b4c2" font-size="12">{start}—{start+192} tiles</text>')
    def rect(x,y,w,h,fill):
        left=max(x,start);right=min(x+w,start+192)
        if right>left:svg.append(f'<rect x="{32+(left-start)*5.9:.1f}" y="{top+14+(y+10)*4.6:.1f}" width="{(right-left)*5.9:.1f}" height="{max(2,h*4.6):.1f}" fill="{fill}"/>')
    for s in d['sections']:
        if s['x']+s['width']<start or s['x']>start+192:continue
        for r in s.get('solids',[]):rect(s['x']+r[0],r[1],r[2],r[3],'#3b535f')
        for r in s.get('platforms',[]):rect(s['x']+r[0],r[1],r[2],r[3],'#86d9d2')
        for lift in s.get('lifts',[]):
            rect(s['x']+lift['at'][0],lift['to'][1],lift['w'],lift['at'][1]-lift['to'][1],'#496e74')
        for h in s.get('hazards',[]):
            r=h.get('rect',h.get('base'));rect(s['x']+r[0],r[1],r[2],r[3],'#b8894d')
        if start<=s['x']<start+192:
            sx=32+(s['x']-start)*5.9
            svg.append(f'<text x="{sx:.1f}" y="{top+158}" fill="#728e9c" font-size="10">{html.escape(s["title"])}</text>')
    for x,y in d['checkpoints']:
        if start<=x<start+192:svg.append(f'<circle cx="{32+(x-start)*5.9:.1f}" cy="{top+14+(y+10)*4.6-8:.1f}" r="3" fill="#fff"/>')
svg.append('</g></svg>')
(OUT/'route-overview.svg').write_text('\n'.join(svg))

scenes=[('title','The Night Shift'),('broken-bridge','The broken bridge'),('gantry','Switchback tower'),
        ('cross-feed','Cross-feed climb'),('reservoirs','Coolant reservoirs'),('service-lift','The moving service lift'),
        ('chip-tunnel','The chip tunnel'),('opposed-traverses','Opposed traverses'),('mill-spine','The mill spine'),
        ('look-down','Hold Down / S to inspect the landing'),('boss-refuge','Three service points and the centre refuge'),
        ('phone-boss','Phone controls'),('ipad-boss','iPad framing'),('demo-end','Actual full traversal result')]
cards=''.join(f'<figure><img src="{name}.png" loading="lazy" alt="{label}"><figcaption>{label}</figcaption></figure>' for name,label in scenes)
voices=''.join(f'<div class="clip"><p>{html.escape(clip["text"])}</p><audio controls preload="none" src="../../../public/fireworks/mike-game/{clip["file"]}"></audio><small>{name} · {clip["seconds"]:.1f}s</small></div>' for name,clip in v['clips'].items())
page=f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Night Shift — review</title><style>
*{{box-sizing:border-box}}body{{margin:0;background:#07141e;color:#e7f0f2;font:16px/1.6 Arial,sans-serif}}main{{max-width:1280px;margin:auto;padding:44px 28px}}
header{{border-bottom:1px solid #28404b;padding-bottom:36px}}.eyebrow,small{{color:#91b1bf;font-size:12px}}h1{{font-size:clamp(44px,7vw,86px);line-height:1;margin:20px 0;color:#a9e6df}}h2{{margin-top:54px;font-size:24px}}
p{{max-width:800px}}a{{color:#a2e7dc}}.actions{{display:flex;flex-wrap:wrap;gap:12px;margin:26px 0}}.actions a{{padding:10px 20px;border:1px solid #4b707d;border-radius:8px;text-decoration:none}}.actions a:first-child{{background:#eb0000;color:white;border:0}}
.stats{{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:32px 0}}.stats div{{background:#112b38;padding:18px;border-radius:8px}}b{{font-size:32px;display:block}}.grid{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}}figure{{margin:0}}img{{max-width:100%;height:auto;display:block;border:1px solid #2a4652;border-radius:6px}}figcaption{{font-size:14px;color:#91b1bf;margin:8px 0}}
.clips{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}}.clip{{background:#102936;border:1px solid #264653;border-radius:8px;padding:18px}}audio{{width:100%;height:40px}}small{{display:block}}.note{{padding:22px;background:#102936;border-left:3px solid #8adacf}}@media(max-width:720px){{.grid,.clips{{grid-template-columns:1fr}}.stats{{grid-template-columns:repeat(2,1fr)}}}}
</style><main><header><span class="eyebrow">MIKE THE MIC / VERSION 03 / 27 SEPTEMBER 2026</span><h1>THE NIGHT SHIFT</h1><p>Ten distinct encounters replace the repeated bays. Climb, ride the service lift, time the presses and find all 56 salvage items.</p>
<div class="actions"><a href="http://localhost:8788/mike-game/">Play local preview</a><a href="http://localhost:8788/mike-game/?demo=1">Watch playthrough</a><a href="../nightshift-v3-review.md">Design review + next levels</a></div>
<div class="stats"><div><b>56</b>salvage finds</div><div><b>10</b>different new bays</div><div><b>3</b>tool-based repairs</div><div><b>7</b>short voice clips</div></div>
<p class="note">The ordinary-input test completes the level in {int(seconds)//60}:{int(seconds)%60:02d}, using authored route knowledge and predicted jumps. This proves completion, not human difficulty. All {stats['platforms']} platforms pass geometry checks. The boss is repairable with zero salvage. Hold Down/S (or the touch down button) to look below. Local desktop frame-work p95: {checks['performance']['workP95']:.1f} ms.</p></header>
<h2>The new version</h2><div class="grid">{cards}</div>
<h2>Boss: before / after</h2><div class="grid"><figure><img src="../look/scene-s10-boss-idle.png" alt="Original chuck and robot-arm boss"><figcaption>Original</figcaption></figure><figure><img src="s10-boss-idle.png" alt="New rail-mounted five-axis service cell"><figcaption>Night Shift</figcaption></figure></div>
<h2>The routes</h2><p>Five strips cover all 960 tiles. Long floor gaps and solid beds require height changes; upper branches add collection routes. The overview deliberately omits pickup and secret locations.</p><img src="route-overview.svg" alt="Five strips showing floor paths, overhead platforms and machine positions across the level">
<h2>Mike's voice</h2><p>The exact saved Gemini voice used in the explainer video: <code>{html.escape(v['voice'])}</code>, directed with urgency and energy. Only the seven approved lines, with no in-game subtitles. Audition the delivery here.</p><div class="clips">{voices}</div>
<h2>Next: Below the Wire</h2><p>A proposed wire EDM level: a sealed service suit, flooded cutting chamber, dry overhead route, pump-controlled fluid levels and moving wire guides. The design review includes the playable prototype scope and two further level candidates.</p>
<p class="eyebrow">LOCAL REVIEW BUILD · NOT DEPLOYED · SUPPLIED MIKE ARTWORK PRESERVED</p></main></html>'''
(OUT/'index.html').write_text(page,encoding='utf-8')
print('Review gallery, route overview and seven validated 24 kHz mono WAV auditions written.')
