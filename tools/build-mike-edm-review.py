"""Build the EDM schematic and local design/prototype review. No external assets or API calls."""
from pathlib import Path
from html import escape
import json
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'docs/mike-platformer/edm-look'
OUT.mkdir(parents=True,exist_ok=True)
rooms=[('01','SUIT DOCK',48,'Suit, shallow water, inspection','Prepare → test → enter'),('02','FLUSHING GALLERY',80,'Rim or submerged fixture passage','Read the jets → choose a route'),('03','GUIDE TOWER',96,'Vertical guide travel and buoyancy','Climb → ride the water → cross'),('04','SPLIT RESERVOIR',112,'Transfer water between two tanks','One side rises as the other drains'),('05','CUT-PATH MAZE',96,'Three corridors through a workpiece','Budget air → reach a dry refuge'),('06','THREADING FAULT',80,'Three service elevations and drain exit','Flush → tension → guide alignment')]
s=['<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1010" viewBox="0 0 1400 1010">','<rect width="1400" height="1010" fill="#071923"/>','<style>text{font-family:Arial,sans-serif} .label{fill:#b0cbd2;font-size:12px}.title{fill:#b7eae0;font-size:20px;font-weight:bold}</style>', '<text x="30" y="42" class="title" font-size="30">BELOW THE WIRE / FULL-LEVEL LAYOUT</text>','<text x="30" y="69" class="label">512 tiles · six authored encounters · schematic, not final collision geometry · Level 1 remains the movement / visual baseline</text>']
start=0
for i,(num,title,width,desc,beat) in enumerate(rooms):
    ox=30+(i%3)*460;oy=100+(i//3)*400
    s+=[f'<g transform="translate({ox},{oy})"><rect width="440" height="375" rx="10" fill="#102d39" stroke="#335763"/>',f'<text x="18" y="31" class="title">{num}  {title}</text>',f'<text x="18" y="52" class="label">x {start}–{start+width} · {width} tiles</text>']
    s+=['<rect x="20" y="80" width="400" height="237" fill="#091e29"/>','<path d="M20 80V317H420V80" fill="none" stroke="#607e89" stroke-width="7"/>']
    def box(x,y,w,h,fill='#4f707c'):s.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}"/>')
    def line(x,y,xx,yy,col='#93e1d1',dash=''):s.append(f'<path d="M{x} {y}L{xx} {yy}" fill="none" stroke="{col}" stroke-width="3" {dash}/>')
    def dot(x,y,n):s.append(f'<circle cx="{x}" cy="{y}" r="11" fill="#ffc46a"/><text x="{x}" y="{y+4}" text-anchor="middle" fill="#09202b" font-family="Arial" font-weight="bold" font-size="12">{n}</text>')
    if i==0:
        box(20,209,170,108);box(190,256,136,61);box(326,209,94,108);box(190,236,136,20,'#247b85');line(190,236,326,236,'#79e5e0');box(68,154,36,55,'#d2ab6b');dot(86,138,'P');line(31,207,180,207);line(330,207,412,207);line(135,171,230,171)
    elif i==1:
        box(30,207,380,108,'#165561');line(30,207,410,207,'#79e5e0');box(173,234,95,83);box(55,132,70,8);box(153,113,64,8);box(248,132,72,8);box(350,160,50,8);line(57,273,147,273);line(285,273,388,273);dot(144,191,'J');dot(310,201,'J')
    elif i==2:
        box(30,185,380,132,'#165561');line(30,185,410,185,'#79e5e0');box(199,81,26,236);box(171,128,82,26,'#b3cbce');line(211,160,211,287,'#ffc46a');
        for x,y in [(45,254),(100,217),(50,181),(105,146),(276,136),(332,174),(282,219),(340,263)]:box(x,y,60,7)
        dot(358,158,'A')
    elif i==3:
        box(31,170,178,147,'#165561');box(231,238,178,79,'#165561');box(210,118,20,166);line(31,170,209,170,'#79e5e0');line(231,238,409,238,'#79e5e0');line(109,294,326,294,'#ffc46a');dot(220,103,'V');line(44,139,164,139);line(273,151,393,151);dot(320,133,'A')
    elif i==4:
        box(31,166,378,151,'#165561');line(31,166,409,166,'#79e5e0');
        for x,y,w,h in [(104,183,49,106),(183,151,62,100),(278,201,56,91)]:box(x,y,w,h)
        s.append('<path d="M42 252H84V171H164V271H258V179H348V251H405" stroke="#93e1d1" fill="none" stroke-width="3" stroke-dasharray="6 5"/>');line(60,122,161,122);line(259,122,389,122);dot(216,134,'A')
    else:
        box(31,239,378,78,'#165561');line(31,239,409,239,'#79e5e0');box(187,87,26,230);box(46,278,97,7);box(163,208,96,7);box(289,138,89,7);dot(92,261,'1');dot(211,192,'2');dot(333,122,'3');line(140,263,163,218);line(250,198,288,150);box(385,250,22,66,'#79ab9e')
    for x in [35,403]:line(x,90,x,313,'#294a57')
    s+=[f'<text x="18" y="342" class="label">{escape(desc)}</text>',f'<text x="18" y="362" class="label" style="fill:#7cb0b9">{escape(beat)}</text>','</g>'];start+=width
s+=['<text x="30" y="925" class="label">CYAN: water / mean level    MINT: routes    STEEL: solid fixtures / decks    AMBER: interaction or hazard</text>','<text x="30" y="953" class="label">P suit pickup · J flushing jet · V water-transfer valve · A dry air refuge · 1/2/3 service elevations</text>','<text x="30" y="980" class="label">Production rule: every machine has a visible anchor, every mandatory dive has an escape, every room has a different traversal problem.</text>','</svg>']
(OUT/'layout.svg').write_text('\n'.join(s),encoding='utf-8')
scenes=[('dock','Suit dock and pump control'),('tank-low','Low fluid: fixtures and lower route'),('tank-high','High fluid: buoyant traversal'),('guide','Anchored guide, wire and carriage'),('refuge','Dry refuge above the water'),('phone','Touch controls: Look and Dive are separate')]
cards=''.join(f'<figure><img src="{f}.png" alt="{escape(t)}"><figcaption>{escape(t)}</figcaption></figure>' for f,t in scenes)
checks=json.loads((OUT/'mechanics.json').read_text()) if (OUT/'mechanics.json').exists() else {}
page=f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Below the Wire — design and prototype</title><style>
*{{box-sizing:border-box}}body{{margin:0;background:#071923;color:#d6eceb;font:16px/1.6 Arial,sans-serif}}main{{max-width:1400px;margin:auto;padding:38px 28px}}h1{{font-size:clamp(44px,7vw,82px);line-height:1.1;color:#b5ece0;margin:18px 0}}h2{{margin-top:48px}}small,figcaption{{color:#91b5c0}}a{{color:#b5ece0}}nav{{display:flex;gap:12px;flex-wrap:wrap;margin:24px 0}}nav a{{padding:10px 18px;border:1px solid #56828d;border-radius:8px;text-decoration:none}}nav a:first-child{{background:#a74429;color:white}}.note{{background:#143b47;border-left:3px solid #ffc46a;padding:20px;max-width:1100px}}.grid{{display:grid;grid-template-columns:1fr 1fr;gap:22px}}figure{{margin:0}}img{{width:100%;display:block;border:1px solid #315762;border-radius:6px}}figcaption{{padding:9px 0}}p{{max-width:1080px}}table{{border-collapse:collapse;width:100%}}td,th{{padding:12px;border-bottom:1px solid #31515f;text-align:left}}@media(max-width:760px){{.grid{{grid-template-columns:1fr}}}}
</style><main><small>MIKE THE MIC / LEVEL 2 DESIGN / 29 SEPTEMBER 2026</small><h1>BELOW THE WIRE</h1><p>A flooded wire-EDM enclosure, six authored rooms and three intersecting route types. Preserve the current Level 1's art, movement, camera, challenge and variety. Add fluid-state choices, a service suit and readable underwater machinery.</p>
<nav><a href="http://localhost:8788/mike-game/edm-prototype.html">Play the tank prototype</a><a href="../edm-level-design.md">Full design</a><a href="../edm-asset-brief.md">Asset production brief</a><a href="../OPUS-5.5-CONTINUATION.md">Opus 5.5 handover</a></nav>
<p class="note">This is a 96-tile mechanics slice with ten sample collectibles. The six-room, 512-tile campaign level is a design. Final difficulty, the EDM boss, checkpoint integration and the full salvage collection remain to be built and playtested. Level 1 is preserved. No paid generation has been used.</p>
<h2>The level layout</h2><img src="layout.svg" alt="Six-room schematic showing suit dock, flushing gallery, guide tower, split reservoir, cut-path maze and threading fault"><p>The schematic defines encounter roles and route connections. It is not a final collision map. The design document specifies dimensions, mechanics, checkpoints, escape rules and test criteria.</p>
<h2>Working prototype</h2><div class="grid">{cards}</div>
<h2>Implementation state</h2><table><tr><th>Working now</th><th>Next production pass</th></tr><tr><td>Original puppet, Level 1 backdrop, terrain, scale, dry physics, camera resource, short voice library</td><td>Campaign transition, checkpoints, full score/milestone UI and target-device profiling</td></tr><tr><td>Suit pickup, swim/dive, buoyancy, interpolated water, dry air refill, independent inspection control</td><td>Two-tank water transfer, submerged route tuning and suit/swim pose polish</td></tr><tr><td>Anchored tank and travelling guide, live wire tell, collision fixtures, both routes, exit interaction</td><td>Flushing jets, intake pulses, varied workpieces and multi-stage EDM boss</td></tr></table>
<h2>Verification</h2><p>Pure mechanics checks cover dry-physics parity, suit gating, valve edge triggering, water interpolation, buoyancy, fixtures, breathing/refill, recovery, guide timing and repair cancellation. Ordinary-input tests complete both dry and wet routes without recovery resets. These are mechanics checks, not evidence of final human difficulty balance.</p>
<p><a href="mechanics.json">Mechanics results</a> · <a href="browser.json">Browser and touch results</a></p><small>LOCAL PROTOTYPE · NOT DEPLOYED · CURRENT LEVEL 1 PRESERVED</small></main></html>'''
(OUT/'index.html').write_text(page,encoding='utf-8')
print('EDM layout schematic and prototype review written.')
