"""Trace the identity master (assets/nook.png, 560x672) into smooth Bezier paths for nook-art.js.

Run: python -I docs/little-patterns-round-4/build/character/trace-nook.py
Writes trace.json beside this file (path strings and measured anchors).

Method: every opaque pixel is classified to the nearest sampled palette colour; each part's mask is blurred,
upsampled 4x and contoured at the 50% level (sub-pixel boundary); parts hidden behind another part (the body
behind the front mitten, the raised arm and the feet behind the body) have their occluded boundary dropped and
bridged with a Hermite curve that continues the visible tangents; the result is fitted with cubic Beziers
(Schneider's algorithm) at a sub-pixel tolerance. Eyes are fitted ellipses, freckles and glints fitted circles,
the mouth and leaf veins are centre lines with a measured stroke width.
"""
import json, math, os
import numpy as np, cv2
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', '..', '..', '..', 'public', 'fireworks', 'little-patterns', 'assets', 'nook.png')
PAL = dict(body=(0x97, 0x76, 0xCD), cream=(0xF7, 0xEC, 0xD8), navy=(0x2A, 0x29, 0x64), coral=(0xEF, 0x86, 0x68),
           mitten=(0x46, 0xCA, 0xD3), leaf=(0x95, 0xDC, 0xA0), stem=(0x30, 0x95, 0x58), feet=(0x61, 0x45, 0x91),
           glint=(0xFF, 0xFF, 0xFF))
NAMES = list(PAL)
UP = 4

img = np.array(Image.open(SRC).convert('RGBA')).astype(float)
H, W = img.shape[:2]
P = np.array([PAL[n] for n in NAMES], float)
lab = ((img[..., None, :3] - P[None, None]) ** 2).sum(-1).argmin(-1)
lab[img[..., 3] < 128] = -1


def L(*names):
    return np.isin(lab, [NAMES.index(n) for n in names])


def comps(mask, min_area=200):
    k, cc, st, cen = cv2.connectedComponentsWithStats(mask.astype(np.uint8), connectivity=8)
    out = [(st[j, 4], j) for j in range(1, k) if st[j, 4] >= min_area]
    out.sort(reverse=True)
    return [(cc == j) for _, j in out], [tuple(cen[j]) for _, j in out]


def fill_holes(mask):
    m = mask.astype(np.uint8)
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    out = np.zeros_like(m)
    cv2.drawContours(out, cs, -1, 1, thickness=-1)
    return out.astype(bool)


ALPHA = img[..., 3] / 255.0
EDGE = cv2.dilate((img[..., 3] < 128).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)


def contour(mask, blur=0.8, smooth=6, free=None):
    """Sub-pixel outer contour: soft field (the PNG's own alpha where the part meets transparency, a blurred class
    mask where it meets another colour), upsampled 4x, thresholded at 0.5 and traced; Nx2 float points (closed)."""
    f = cv2.GaussianBlur(mask.astype(np.float32), (0, 0), blur)
    near_part = cv2.dilate(mask.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(np.float32)
    edge = EDGE if free is None else EDGE & ~free     # 'free' pixels are shapes added by hand (no alpha there)
    f = np.where(edge, np.minimum(near_part, ALPHA), f).astype(np.float32)
    big = cv2.resize(f, (W * UP, H * UP), interpolation=cv2.INTER_CUBIC)
    b = (big >= 0.5).astype(np.uint8)
    cs, _ = cv2.findContours(b, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cs, key=cv2.contourArea)[:, 0, :].astype(float)
    c = (c + 0.5) / UP          # upsampled pixel centre -> source coordinates (pixel i covers [i, i+1])
    k = smooth
    pad = np.concatenate([c[-k:], c, c[:k]])
    ker = np.ones(2 * k + 1) / (2 * k + 1)
    return np.stack([np.convolve(pad[:, 0], ker, 'valid'), np.convolve(pad[:, 1], ker, 'valid')], 1)


def resample(pts, step=1.0, closed=True):
    p = np.vstack([pts, pts[:1]]) if closed else pts
    seg = np.linalg.norm(np.diff(p, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    t = np.arange(0, s[-1], step)
    return np.stack([np.interp(t, s, p[:, 0]), np.interp(t, s, p[:, 1])], 1)


def bridge(pts, hidden, reach=10, scale=1.0):
    """Replace each hidden run of a closed contour by a Hermite curve between the visible ends."""
    n = len(pts)
    if hidden.all() or not hidden.any():
        return pts
    start = next(i for i in range(n) if not hidden[i] and not hidden[i - 1])
    pts = np.roll(pts, -start, 0)
    hidden = np.roll(hidden, -start)
    out = []
    i = 0
    while i < n:
        if not hidden[i]:
            out.append(pts[i])
            i += 1
            continue
        j = i
        while j < n and hidden[j]:
            j += 1
        a = pts[i - 1]
        b = pts[j % n]
        ta = unit(pts[i - 1] - pts[max(i - reach, 0)])
        tb = unit(pts[(j + reach) % n] - pts[j % n])
        d = np.linalg.norm(b - a) * scale
        m = max(2, int(d))
        for k in range(1, m):
            t = k / m
            h00 = 2 * t ** 3 - 3 * t ** 2 + 1
            h10 = t ** 3 - 2 * t ** 2 + t
            h01 = -2 * t ** 3 + 3 * t ** 2
            h11 = t ** 3 - t ** 2
            out.append(h00 * a + h10 * d * ta + h01 * b + h11 * d * tb)
        i = j
    return np.array(out)


# ---------------- Schneider cubic fitting ----------------
def bez(c, t):
    t = np.asarray(t)[:, None]
    mt = 1 - t
    return mt ** 3 * c[0] + 3 * mt ** 2 * t * c[1] + 3 * mt * t ** 2 * c[2] + t ** 3 * c[3]


def bez_d(c, t):
    t = np.asarray(t)[:, None]
    mt = 1 - t
    return 3 * mt ** 2 * (c[1] - c[0]) + 6 * mt * t * (c[2] - c[1]) + 3 * t ** 2 * (c[3] - c[2])


def bez_dd(c, t):
    t = np.asarray(t)[:, None]
    return 6 * (1 - t) * (c[2] - 2 * c[1] + c[0]) + 6 * t * (c[3] - 2 * c[2] + c[1])


def unit(v):
    return v / (np.linalg.norm(v) + 1e-12)


def chord_params(p):
    d = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(p, axis=0), axis=1))])
    return d / d[-1]


def gen_bezier(p, u, t1, t2):
    A1 = np.outer(3 * (1 - u) ** 2 * u, t1)
    A2 = np.outer(3 * (1 - u) * u ** 2, t2)
    C = np.array([[np.sum(A1 * A1), np.sum(A1 * A2)], [np.sum(A1 * A2), np.sum(A2 * A2)]])
    tmp = p - (np.outer((1 - u) ** 3 + 3 * (1 - u) ** 2 * u, p[0]) + np.outer(3 * (1 - u) * u ** 2 + u ** 3, p[-1]))
    X = np.array([np.sum(A1 * tmp), np.sum(A2 * tmp)])
    det = C[0, 0] * C[1, 1] - C[0, 1] * C[1, 0]
    seg = np.linalg.norm(p[-1] - p[0])
    if abs(det) > 1e-12:
        a1 = (X[0] * C[1, 1] - X[1] * C[0, 1]) / det
        a2 = (C[0, 0] * X[1] - C[1, 0] * X[0]) / det
    else:
        a1 = a2 = seg / 3
    if a1 < 1e-6 * seg or a2 < 1e-6 * seg:
        a1 = a2 = seg / 3
    return np.array([p[0], p[0] + t1 * a1, p[-1] + t2 * a2, p[-1]])


def reparam(c, p, u):
    d = bez(c, u) - p
    d1 = bez_d(c, u)
    d2 = bez_dd(c, u)
    num = np.sum(d * d1, 1)
    den = np.sum(d1 * d1, 1) + np.sum(d * d2, 1)
    with np.errstate(divide='ignore', invalid='ignore'):
        nu = np.where(np.abs(den) > 1e-12, u - num / den, u)
    return np.clip(nu, 0, 1)


def max_err(c, p, u):
    e = np.linalg.norm(bez(c, u) - p, axis=1)
    i = int(np.argmax(e))
    return e[i], i


def fit_cubic(p, t1, t2, err, out):
    if len(p) == 2:
        dist = np.linalg.norm(p[1] - p[0]) / 3
        out.append(np.array([p[0], p[0] + t1 * dist, p[1] + t2 * dist, p[1]]))
        return
    u = chord_params(p)
    c = gen_bezier(p, u, t1, t2)
    e, split = max_err(c, p, u)
    if e < err:
        out.append(c)
        return
    if e < err * 4:
        for _ in range(20):
            u = reparam(c, p, u)
            c = gen_bezier(p, u, t1, t2)
            e, split = max_err(c, p, u)
            if e < err:
                out.append(c)
                return
    split = min(max(split, 1), len(p) - 2)
    tc = unit(p[split - 1] - p[split + 1])
    fit_cubic(p[:split + 1], t1, tc, err, out)
    fit_cubic(p[split:], -tc, t2, err, out)


def fit_closed(pts, err=0.6, step=2.0):
    p = resample(pts, step)
    i0 = int(np.argmin(p[:, 1]))
    p = np.roll(p, -i0, 0)
    p = np.vstack([p, p[:1]])
    t = unit(p[1] - p[-2])
    segs = []
    fit_cubic(p, t, -t, err, segs)
    return segs


def fit_open(pts, err=0.6, step=2.0):
    p = resample(pts, step, closed=False)
    segs = []
    fit_cubic(p, unit(p[1] - p[0]), unit(p[-2] - p[-1]), err, segs)
    return segs


def fmt(v):
    s = ('%.1f' % v).rstrip('0').rstrip('.')
    return '0' if s == '-0' else s


def to_path(segs, closed=True):
    d = 'M' + fmt(segs[0][0][0]) + ' ' + fmt(segs[0][0][1])
    for c in segs:
        d += 'C' + ' '.join(fmt(c[k][0]) + ' ' + fmt(c[k][1]) for k in (1, 2, 3))
    return d + ('Z' if closed else '')


def near(mask, pts, r):
    dil = cv2.dilate(mask.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1)))
    xi = np.clip(np.floor(pts[:, 0]).astype(int), 0, W - 1)
    yi = np.clip(np.floor(pts[:, 1]).astype(int), 0, H - 1)
    return dil[yi, xi] > 0


def box(m):
    ys, xs = np.where(m)
    return [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]


# ---------------- parts ----------------
mit, mit_c = comps(L('mitten'))
mitL, mitR = (mit[0], mit[1]) if mit_c[0][0] < mit_c[1][0] else (mit[1], mit[0])
leaves, leaf_c = comps(L('leaf'))
leafL, leafR = (leaves[0], leaves[1]) if leaf_c[0][0] < leaf_c[1][0] else (leaves[1], leaves[0])
stem = comps(L('stem'), 100)[0][0]
feet, feet_c = comps(L('feet'), 1000)
footL, footR = (feet[0], feet[1]) if feet_c[0][0] < feet_c[1][0] else (feet[1], feet[0])
shadow = L('feet') & ~footL & ~footR
body = comps(fill_holes(L('body', 'cream', 'navy', 'coral', 'glint') | shadow), 1000)[0][0]
patch = fill_holes(comps(L('cream', 'navy', 'coral', 'glint'), 1000)[0][0])
navy, navy_c = comps(L('navy'), 100)
coral, coral_c = comps(L('coral'), 20)
glint, glint_c = comps(L('glint'), 20)

res = {'source': 'public/fireworks/little-patterns/assets/nook.png', 'size': [W, H], 'paths': {}, 'anchors': {}}

# body: the front mitten and the stem base cover parts of its outline
bc = contour(body)
# The left side behind the front mitten is hidden in the original and turns concave just above it (y 400-430),
# which shows as a dent once the arm moves. Redraw it convex from y 392 to 548 with a Hermite curve continuing the
# visible edge (tangents from the 16 points either side); this moves the visible edge at most 3 px inwards just
# above the mitten.
hid_front = (bc[:, 0] < 185) & (bc[:, 1] > 392) & (bc[:, 1] < 548)
bc = bridge(bc, hid_front, reach=16, scale=1.0)
res['paths']['body'] = to_path(fit_closed(bridge(bc, near(stem, bc, 2) | near(mitR, bc, 2) | near(footL | footR, bc, 3),
                                                reach=12, scale=0.9), 0.7))
res['paths']['patch'] = to_path(fit_closed(contour(patch, smooth=10), 0.6))
res['paths']['mittenFront'] = to_path(fit_closed(contour(mitL), 0.5))
rc = contour(mitR)
hidR = near(body, rc, 2)
res['paths']['mittenRaisedVisible'] = to_path(fit_closed(bridge(rc, hidR), 0.5))
ends = rc[hidR]
res['anchors']['raisedHiddenEnds'] = [[float(v) for v in ends[np.argmin(ends[:, 1])]], [float(v) for v in ends[np.argmax(ends[:, 1])]]]
SR = (420, 415)                      # right shoulder pivot, 22 px inside the body edge
res['anchors']['shoulderR'] = list(SR)
root = np.zeros((H, W), np.uint8)
a_, b_ = res['anchors']['raisedHiddenEnds']
hull = np.array([[a_[0] + 2, a_[1] - 2], [b_[0] + 2, b_[1]], [SR[0], SR[1] + 18], [SR[0] - 16, SR[1]], [SR[0], SR[1] - 18]], np.int32)
cv2.fillConvexPoly(root, cv2.convexHull(hull), 1)
cv2.circle(root, SR, 18, 1, -1)
raised = mitR | root.astype(bool)
# round off the joins between the traced hand and the hidden root, and the small step where the wrist meets the
# body edge; only near the root, so the thumb notch keeps its traced shape
yy, xx = np.mgrid[0:H, 0:W]
near_root = cv2.dilate(root, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))).astype(bool) |     ((xx - a_[0]) ** 2 + (yy - a_[1]) ** 2 < 18 ** 2)
wide = cv2.morphologyEx(raised.astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31))).astype(bool)
raised |= wide & near_root
res['paths']['mittenRaised'] = to_path(fit_closed(contour(raised, smooth=6, free=near_root), 0.6))
ys, xs = np.where(mitR & (np.arange(W)[None, :] > 452))
res['anchors']['raisedHandCentre'] = [float(xs.mean()), float(ys.mean())]
ys, xs = np.where(mitL)
res['anchors']['frontHandCentre'] = [float(xs.mean()), float(ys.mean())]
# hand only (for hands held in front): the raised mitten above a cut across the wrist, bottom rounded
hand = mitR.copy()
yy, xx = np.mgrid[0:H, 0:W]
cut = (yy - 404) > -0.42 * (xx - 470)          # below a line rising to the right across the wrist
hand &= ~cut
hand = cv2.morphologyEx(hand.astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21))).astype(bool)
res['paths']['mittenHand'] = to_path(fit_closed(contour(hand, blur=1.5, smooth=8), 0.6))
ys, xs = np.where(hand)
res['anchors']['handOnlyCentre'] = [float(xs.mean()), float(ys.mean())]
res['anchors']['handOnlyBox'] = box(hand)


def foot_path(fm):
    """The visible foot, its top (hidden under the body) redrawn as a dome that continues both side edges."""
    fc = contour(fm, smooth=4)
    return to_path(fit_closed(bridge(fc, near(body, fc, 2), reach=10, scale=1.7), 0.6))


res['paths']['footL'] = foot_path(footL)
res['paths']['footR'] = foot_path(footR)
res['anchors']['ground'] = float(np.where(footL | footR)[0].max() + 1)


def blade(lm):
    hull = cv2.convexHull(np.argwhere(lm)[:, ::-1].astype(np.int32))
    hm = np.zeros(lm.shape, np.uint8)
    cv2.fillConvexPoly(hm, hull, 1)
    m = fill_holes(lm | (stem & hm.astype(bool)))
    m = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_OPEN,
                         cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))).astype(bool)
    return to_path(fit_closed(contour(m), 0.6))


res['paths']['leafL'] = blade(leafL)
res['paths']['leafR'] = blade(leafR)
dist = cv2.distanceTransform(stem.astype(np.uint8), cv2.DIST_L2, 5)
res['anchors']['stemHalfWidth'] = float(dist.max())
res['anchors']['stemBox'] = box(stem)
# stem centre points: ridge of the distance transform
ys, xs = np.where((dist >= dist.max() * 0.6) & (dist == cv2.dilate(dist, np.ones((3, 3), np.uint8))))
res['anchors']['stemRidge'] = sorted([[int(x), int(y)] for x, y in zip(xs, ys)], key=lambda p: p[1])

main, right = [], []
for y in range(66, 140):
    xs = np.where(stem[y])[0]
    if len(xs):
        k = int(np.argmax(np.diff(np.append(xs, 10 ** 6)) > 1))
        main.append([(xs[0] + xs[k]) / 2 + .5, y + .5])
for x in range(272, 324):
    ys = np.where(stem[:136, x])[0] if x < 280 else np.where(stem[:, x])[0]
    if len(ys):
        right.append([x + .5, (ys.min() + ys.max()) / 2 + .5])
res['anchors']['veinMainPoints'] = main[::4]
res['anchors']['veinRightPoints'] = right[::4]
res['paths']['veinMain'] = to_path(fit_open(np.array(main[3:]), 0.6), closed=False)
res['paths']['veinRight'] = to_path(fit_open(np.array(right[:-3]), 0.6), closed=False)

eyes = sorted(range(2), key=lambda n: navy_c[n][0])
res['anchors']['eyes'] = []
for n in eyes:
    c = contour(navy[n], smooth=2)
    (cx, cy), (a, b), ang = cv2.fitEllipse(c.astype(np.float32))
    res['anchors']['eyes'].append({'cx': cx, 'cy': cy, 'w': a, 'h': b, 'angle': ang, 'box': box(navy[n])})
res['anchors']['glints'] = []
for g in glint:
    ys, xs = np.where(g)
    res['anchors']['glints'].append({'cx': float(xs.mean()) + .5, 'cy': float(ys.mean()) + .5, 'r': math.sqrt(g.sum() / math.pi)})
res['anchors']['freckles'] = []
for m in coral:
    ys, xs = np.where(m)
    res['anchors']['freckles'].append({'cx': float(xs.mean()) + .5, 'cy': float(ys.mean()) + .5, 'r': math.sqrt(m.sum() / math.pi)})
mm = navy[2]
md = cv2.distanceTransform(mm.astype(np.uint8), cv2.DIST_L2, 5)
res['anchors']['mouthHalfWidth'] = float(md.max())
res['anchors']['mouthBox'] = box(mm)
res['paths']['mouthGreetFill'] = to_path(fit_closed(contour(mm, blur=0.6, smooth=2), 0.4))
ys, xs = np.where(md >= md.max() * 0.7)
cols = sorted(set(xs.tolist()))
res['anchors']['mouthRidge'] = [[x + .5, float(ys[xs == x].mean()) + .5] for x in cols[::2]]
for name, m in dict(body=body, patch=patch, mittenFront=mitL, mittenRaised=mitR, leafL=leafL, leafR=leafR,
                    footL=footL, footR=footR).items():
    res['anchors'][name + 'Box'] = box(m)
res['anchors']['bodyEdges'] = {int(y): [int(np.where(body[y])[0].min()), int(np.where(body[y])[0].max()) + 1]
                               for y in range(150, 610, 10) if body[y].any()}
res['anchors']['patchEdges'] = {int(y): [int(np.where(patch[y])[0].min()), int(np.where(patch[y])[0].max()) + 1]
                                for y in range(230, 420, 10) if patch[y].any()}

with open(os.path.join(HERE, 'trace.json'), 'w') as f:
    json.dump(res, f, indent=1)
for k, v in res['paths'].items():
    print(k, len(v), 'chars', v.count('C'), 'segments')
