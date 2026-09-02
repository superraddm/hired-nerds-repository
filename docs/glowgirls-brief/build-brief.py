"""Rebuild the Glow Girls garment brief from the live master.

Reads the fitted layers in public/fireworks/assets/glowgirls/sol/ and regenerates:
  sol-model-1024x1536.png   the clean model to upload to an image generator
  sol-registration-guide.png  the annotated guide, for checking returns

Run it again whenever the master changes (a new head for Hana or Jia will move
the landmarks). Measurements are read off the already-fitted layers, so they stay
ground truth rather than drifting into guesses.

    python docs/glowgirls-brief/build-brief.py
"""
from PIL import Image, ImageDraw, ImageFont
import numpy as np, os, json

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
SRC = os.path.join(ROOT, 'public', 'fireworks', 'assets', 'glowgirls', 'sol')
FINAL = os.path.join(SRC, 'final')
BG = (127, 127, 127)

ITEMS = {
    'top': ['moonmoto', 'petaljacket', 'neonmoto', 'tailcoat'],
    'bottom': ['moonshorts', 'petalskort', 'silvershorts', 'cargoshorts'],
    'shoes': ['moonboots', 'petalboots', 'neonboots'],
}


def alpha(path):
    return np.asarray(Image.open(path).convert('RGBA'))[..., 3]


def bbox(a, thr=16):
    ys, xs = np.nonzero(a > thr)
    return (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())) if len(ys) else None


def envelopes():
    """Merged bounds of every fitted layer in a category — the zone a new item must land in."""
    out = {}
    for cat, ids in ITEMS.items():
        boxes = []
        for i in ids:
            m = None
            for side in ('rear', 'front'):
                p = os.path.join(FINAL, f'{cat}-{i}-{side}.png')
                if os.path.exists(p):
                    a = alpha(p)
                    m = a if m is None else np.maximum(m, a)
            if m is not None and bbox(m):
                boxes.append(bbox(m))
        out[cat] = dict(
            per_item={i: b for i, b in zip(ids, boxes)},
            box=[min(b[0] for b in boxes), min(b[1] for b in boxes),
                 max(b[2] for b in boxes), max(b[3] for b in boxes)],
        )
    return out


def font(sz, bold=True):
    for n in (('segoeuib.ttf', 'arialbd.ttf') if bold else ('segoeui.ttf', 'arial.ttf')):
        p = os.path.join(r'C:\Windows\Fonts', n)
        if os.path.exists(p):
            return ImageFont.truetype(p, sz)
    return ImageFont.load_default()


master = Image.open(os.path.join(SRC, 'master.png')).convert('RGBA')
W, H = master.size
fig = bbox(np.asarray(master)[..., 3])

# 1. clean model. Identical background in and out means a pixel diff against this
#    file isolates whatever garment the generator added.
clean = Image.new('RGB', (W, H), BG)
clean.paste(master, (0, 0), master)
clean.save(os.path.join(HERE, 'sol-model-1024x1536.png'))

# 2. annotated guide
env = envelopes()
# The tailcoat is a floor-length outlier, so the drawn TOP zone shows where the
# cropped jackets land and its real extent goes in the caption instead.
_tops = [b for i, b in env['top']['per_item'].items() if i != 'tailcoat']
_topbox = [min(b[0] for b in _tops), min(b[1] for b in _tops), max(b[2] for b in _tops), max(b[3] for b in _tops)]
ZONES = [
    ('TOP', _topbox, (232, 30, 140), 'cropped jackets; tailcoat runs on to y=%d' % env['top']['per_item']['tailcoat'][3]),
    ('BOTTOM', env['bottom']['box'], (0, 130, 210), 'waistband top y=470-514, hem y=707-823'),
    ('SHOES', env['shoes']['box'], (60, 150, 20), 'knee boots from y=884, ankle boots from y=1084'),
]
LINES = [(63, 'HEAD CROWN  y=63'), (200, 'CHIN / NECK TOP  y=200'), (285, 'SHOULDER LINE  y=285'),
         (500, 'NATURAL WAIST  y=500'), (780, 'FINGERTIPS  y=780'), (1408, 'STANDING LINE  y=1408')]

g = Image.blend(clean.convert('RGB'), Image.new('RGB', (W, H), (255, 255, 255)), 0.18)
d = ImageDraw.Draw(g, 'RGBA')
f14, f16, f26 = font(14), font(16), font(26)


def chip(x, y, text, col, fnt):
    tw = d.textlength(text, font=fnt)
    d.rectangle([x, y, x + tw + 12, y + fnt.size + 8], fill=(24, 10, 44, 235))
    d.text((x + 6, y + 3), text, font=fnt, fill=col + (255,))


for name, (x0, y0, x1, y1), col, note in ZONES:
    d.rectangle([x0, y0, x1, y1], outline=col + (255,), width=3)
    d.rectangle([x0, y0, x1, y1], fill=col + (22,))
for y, label in LINES:
    d.line([28, y, W, y], fill=(255, 255, 255, 200), width=3)
    d.line([28, y, W, y], fill=(24, 10, 44, 130), width=1)
    chip(34, y - 26, label, (255, 255, 255), f16)

# captions live in the free margins so they never sit on the artwork
for (name, (x0, y0, x1, y1), col, note), (cx, cy) in zip(ZONES, [(760, 224), (690, 476), (672, 890)]):
    chip(cx, cy, f'{name}   x {x0}-{x1}   y {y0}-{y1}', (255, 255, 255), f16)
    chip(cx, cy + 34, note, (215, 205, 240), f14)

d.line([512, 0, 512, 1420], fill=(255, 255, 255, 160), width=2)
chip(516, 1424, 'CENTRE  x=512', (255, 255, 255), f16)
for y in range(0, H, 100):
    d.line([0, y, 24, y], fill=(24, 10, 44, 220), width=3)
    d.text((4, y + 4), str(y), font=f14, fill=(24, 10, 44, 230))
for x in range(0, W, 100):
    d.line([x, 0, x, 14], fill=(24, 10, 44, 200), width=2)
d.rectangle([0, 0, W - 1, H - 1], outline=(24, 10, 44, 255), width=5)
d.rectangle([0, 1462, W, H], fill=(24, 10, 44, 245))
d.text((22, 1468), 'SOL - REGISTRATION GUIDE', font=f26, fill=(255, 255, 255, 255))
d.text((22, 1504), f'canvas {W}x{H}  -  figure x {fig[0]}-{fig[2]}, y {fig[1]}-{fig[3]}  -  every layer composited at (0,0), scale 1',
       font=f16, fill=(200, 180, 235, 255))
g.save(os.path.join(HERE, 'sol-registration-guide.png'))

json.dump({'canvas': [W, H], 'figure': fig, 'zones': env}, open(os.path.join(HERE, 'registration.json'), 'w'), indent=1)
print('rebuilt model, guide and registration.json in', HERE)
