"""Measure how closely the rig's greet pose matches the identity master, part by part.

Run after shoot-character.cjs: python docs/little-patterns-round-4/build/character/compare-overlay.py
Reads rig-hello-560.png (the rig rendered at 560x672 on a transparent background) and assets/nook.png, classifies
both to the profile's palette and reports, per part, the overlap (intersection over union) and how far the rig's
outline lies from the original's (median and 95th percentile, in pixels of the 560x672 master). Writes
overlay-hello-diff.png: grey where both agree, magenta where only the original has the part, green where only the
rig has it.
"""
import json, os
import numpy as np, cv2
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', '..', '..', '..', 'public', 'fireworks', 'little-patterns', 'assets', 'nook.png')
PAL = dict(body=(0x97, 0x76, 0xCD), cream=(0xF7, 0xEC, 0xD8), navy=(0x2A, 0x29, 0x64), coral=(0xEF, 0x86, 0x68),
           mitten=(0x46, 0xCA, 0xD3), leaf=(0x95, 0xDC, 0xA0), stem=(0x30, 0x95, 0x58), feet=(0x61, 0x45, 0x91),
           glint=(0xFF, 0xFF, 0xFF))
NAMES = list(PAL)
P = np.array([PAL[n] for n in NAMES], float)


def labels(path):
    a = np.array(Image.open(path).convert('RGBA')).astype(float)
    lab = ((a[..., None, :3] - P[None, None]) ** 2).sum(-1).argmin(-1)
    lab[a[..., 3] < 128] = -1
    return lab


orig, rig = labels(SRC), labels(os.path.join(HERE, 'rig-hello-560.png'))
assert orig.shape == rig.shape, (orig.shape, rig.shape)
PARTS = {'silhouette': NAMES, 'body': ['body'], 'patch (cream and features)': ['cream', 'navy', 'coral', 'glint'],
         'eyes and mouth': ['navy'], 'freckles': ['coral'], 'mittens': ['mitten'], 'leaves': ['leaf', 'stem'],
         'feet': ['feet']}


def solid(m, min_area=30):
    """drop specks: anti-aliased edge pixels that classify as another colour, and the original's soft shadow
    under the front mitten (it samples as the feet colour)"""
    k, cc, st, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8), connectivity=8)
    keep = np.zeros(k, bool)
    keep[1:] = st[1:, 4] >= min_area
    return keep[cc]


def edge_dist(a, b):
    """distances from the outline of mask a to the outline of mask b"""
    ea = a & ~cv2.erode(a.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
    eb = b & ~cv2.erode(b.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
    dt = cv2.distanceTransform((~eb).astype(np.uint8), cv2.DIST_L2, 5)
    return dt[ea]


out = {}
for name, cls in PARTS.items():
    idx = [NAMES.index(c) for c in cls]
    a, b = np.isin(orig, idx), np.isin(rig, idx)
    a, b = solid(a, 300 if name == 'feet' else 30), solid(b, 300 if name == 'feet' else 30)
    if name == 'body':          # the body is partly behind the mittens in both pictures: compare where both are visible
        both_free = ~np.isin(orig, [NAMES.index('mitten')]) & ~np.isin(rig, [NAMES.index('mitten')])
        a, b = a & both_free, b & both_free
    iou = (a & b).sum() / max(1, (a | b).sum())
    d = np.concatenate([edge_dist(a, b), edge_dist(b, a)])
    out[name] = {'iou': round(float(iou), 4), 'edge_median_px': round(float(np.median(d)), 2),
                 'edge_p95_px': round(float(np.percentile(d, 95)), 2), 'edge_max_px': round(float(d.max()), 1)}
    print('%-28s IoU %.3f  outline distance median %.2f px, 95th %.2f px, max %.1f px' %
          (name, iou, np.median(d), np.percentile(d, 95), d.max()))

fo, fr = orig >= 0, rig >= 0
img = np.full(orig.shape + (3,), 255, np.uint8)
img[fo & fr] = (200, 200, 200)
same = (orig == rig) & fo
img[same] = (225, 225, 225)
img[fo & ~fr] = (214, 0, 120)
img[fr & ~fo] = (0, 160, 90)
diffpart = fo & fr & (orig != rig)
img[diffpart] = (120, 120, 120)
Image.fromarray(img).save(os.path.join(HERE, 'overlay-hello-diff.png'))
with open(os.path.join(HERE, 'overlay-hello-metrics.json'), 'w') as f:
    json.dump(out, f, indent=1)
