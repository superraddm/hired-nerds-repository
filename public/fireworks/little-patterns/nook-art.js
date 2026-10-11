/* Nook, the Little Patterns sprout: one SVG rig for every feeling (round 4).

   Geometry is traced from the identity master assets/nook.png (560x672) by
   docs/little-patterns-round-4/build/character/trace-nook.py and drawn in the same 560x672 coordinate system,
   so the original can be laid over any render. Colours are the profile's samples. Nothing here animates by
   itself: nook.css animates, NookArt.change() swaps a feeling in place, NookArt.idle() schedules blinks.

   Transform tree (nook-design-profile.md):
     position wrapper          the caller's element: placement, grow, hop (keyframes in nook.css)
       svg.nook                breathing only
         .nook-feet            on the ground line; never posed
         pivot 285,602         translate wrapper at the base of the body
           .nook-pose          tilt / squash per feeling (inline CSS transform, transitions in nook.css)
             .nook-squash      the short squash when the expression changes
               stem, two leaves (pivot 266,143 at the stem joint: .nook-leaf pose, .nook-follow follow-through)
               back arms       the raised mitten, behind the body
               body, patch, six freckles (fixed)
               .nook-features  brows, eyes (each in an eye-centred .nook-lid for blinks), mouth
               front arms      the resting mitten and the held-up hand, in front of the body
   One pivot convention: each pivot is a translate() wrapper and the animated group inside it has no transform
   attribute, only a CSS transform; nothing sets a centred rotate(a cx cy) or a transform-origin in the markup.
   Arms: shoulder pivots 161,415 and 420,415. An arm group carries rotate(shoulder) translate(0,reach)
   rotate(wrist) and its mitten shapes are drawn about the hand centre, so a pose can put the hand anywhere and
   CSS interpolates a swing. Three mitten shapes: rest (the traced front mitten), raised (the traced waving mitten,
   its wrist hidden behind the body) and hand (the waving mitten without the wrist, held in front of the body). */
(function (root) {
  'use strict';
  const C = { body: '#9776CD', face: '#F7ECD8', ink: '#2A2964', freckle: '#EF8668', mitten: '#46CAD3', leaf: '#95DCA0', vein: '#309558', feet: '#614591', glint: '#FFFFFF', ring: '#8C8A99' };
  const FEELINGS = ['calm', 'happy', 'sad', 'angry', 'worried', 'excited', 'proud', 'surprised', 'frustrated', 'disappointed'];
  // greet waves hello (the shelf); rest is the same hello face with both arms down, Nook's resting look on the play
  // screens (round 4, phase 3). calm, with its closed eyes, stays a Feelings word.
  const STATES = FEELINGS.concat(['greet', 'rest']);
  const AXIS = 581;                 // the arms mirror about x = 290.5 (the body's middle at shoulder height)
  const SHOULDER = { l: [161, 415], r: [420, 415] };
  const STEM = [266, 143];          // where the two leaf veins meet the stem
  const BASE = [285, 602];          // the bottom of the body: tilt and squash pivot

  // ---- traced geometry (trace-nook.py, 0.5-0.7 px tolerance) ----
  const T = {
    body: 'M275.9 149.4C255.4 150.2 256.1 174.7 249.6 188.8C241.9 205.4 227.2 216.7 214.6 229.4C207.1 237 200.2 245.2 193.6 253.6C171.4 282.3 154.7 316.6 147.6 352.4C144.6 367.6 144.7 382.8 143.5 398.1C142.5 410.8 139.8 423.2 136.9 435.5C129.4 467.7 115 507.6 132 539.1C137 548.4 144.6 556.4 152.2 563.7C187.7 598.1 235.4 603.1 282.5 601.6C314.2 600.6 347.1 595.5 375.3 580.5C397.6 568.7 416.8 550.1 427.9 527.3C456.1 469.4 443.5 369 421.2 310.3C414.6 292.7 406.3 276.1 396.6 260.1C376.3 226.8 349.5 196.3 319.6 171.3C307.5 161.2 292.7 148.7 275.9 149.4Z',
    patch: 'M327 230.1C290.3 229.9 273.5 255.6 244.4 272.8C223.4 285.2 201.9 290.5 190.3 314.8C164.2 368.9 209 403.8 257.8 413.7C264.8 415.2 272.2 416.8 279.5 416.9C288 417 297 417.7 305.5 416.8C332.9 414.1 363.7 405.8 384.6 386.8C391.4 380.6 396.4 371.9 400 363.6C416.7 325.5 398.2 279.9 370.6 252.2C359.3 240.9 343.7 230.2 327 230.1Z',
    footL: 'M220.3 578.6C206.6 579 198.3 588.9 188 596.1C180.3 601.5 171.6 605.1 165.1 612.1C159.9 617.9 156.2 626.5 160.1 634.1C167 647.7 199.7 645.4 212.8 644.9C222.6 644.5 242.5 644.9 248.3 635.5C255.8 623.4 245.1 577.9 220.3 578.6Z',
    footR: 'M329.8 579.6C307.1 579.4 297.8 624.4 304.8 635.4C312.2 647 349.4 645.3 362.3 644.9C366.9 644.7 371.7 644.3 376.2 643.3C392.3 639.7 397.7 627.1 387.3 613.8C380.6 605.1 370.4 601 361.4 595.4C351.3 589 342.6 579.7 329.8 579.6Z',
    leafL: 'M178.7 29.4C171 29.1 143.7 31.7 139.9 38.7C137.3 43.4 139.1 55.3 140 60.5C143.8 80.6 151.5 101 166.9 115.1C192.7 138.8 210.7 129.6 240.5 131.9C248.5 132.6 251.3 135.6 255.7 136.5C256.3 136.6 257 136.6 257.5 136.3C259 135.5 259.9 132.8 261.1 131.6C262 130.7 263.7 130.7 264.5 129.7C265.4 128.5 265 125.2 265.1 123.7C266.2 109.9 263.7 95.5 258.7 82.6C245.7 49.5 213.5 30.5 178.7 29.4Z',
    leafR: 'M334.8 73.1C309.6 72.5 286.9 88.1 276.3 110.5C273.7 116 269.8 127.7 271 133.7C271.5 136.4 274.8 136.9 276 139.5C276.5 140.3 276.1 142.3 277.4 142.8C278.1 143.1 280.7 142.1 281.3 142C284.6 141.2 287.9 141.5 291.3 141.7C314.1 143.1 335.2 136 349 117C353.7 110.5 364.7 87 359.5 79.6C356 74.7 340.4 73.3 334.8 73.1Z',
    rest: 'M154 426.1C146.4 426.5 142.1 431.3 135.7 434C135.7 434 131.9 434.8 131.9 434.8C129.8 436.1 128.7 439.4 127 441.1C108.4 459.4 91.1 482.5 88.4 509.3C86.4 528.7 94.8 553.6 118.4 552.2C124.2 551.8 128.4 549.6 132.4 545.5C133.3 544.5 134.7 543.9 135.2 542.7C135.8 541.3 134.6 538 137.2 537.5C139.5 537 143.6 541.3 150.6 538.8C156.1 536.9 158.7 532.4 160.1 527C164 511.5 154.9 504.6 153 492.5C152.7 490.6 152.8 488.4 153.2 486.5C156.2 473.3 170.1 455.7 170.9 444.3C171.5 434.7 163.9 425.7 154 426.1Z',
    raised: 'M470.1 308.5C452.1 310.2 445.6 331.9 445.9 347.1C446 353 447.8 359.3 447.1 365.1C446.9 367 446 369 445.2 370.8C443.1 375.6 426.8 391.9 422.1 395.4C416.4 399.6 409.7 399.3 405.6 405.9C397.3 418.9 408.2 433.4 422.3 433.9C424.3 433.9 426.1 433 428.2 432.9C433.4 432.7 441 432.5 445.8 430.3C460.1 423.7 473.7 413.8 484.6 402.4C489.1 397.7 492.7 391.5 497.7 387.4C502.3 383.6 507.7 380.8 512.3 376.9C522.1 368.3 531.2 353 526.4 339.7C522.5 328.8 510.8 324.8 500.2 327.1C496.3 327.9 488 332.3 487.2 331.5C487 331.4 487.3 324.6 487.1 323.6C485.9 315.3 479.3 307.6 470.1 308.5Z',
    hand: 'M471.1 308.5C466.1 308.3 461.2 311 457.6 314.2C447 323.8 445.3 339.7 446.2 353.2C446.5 357.1 447.4 361.1 447 365.1C445.9 375.2 442.4 373.8 439.9 379C439 380.9 440.1 384.8 440.1 386.9C440.1 396.2 440.9 409.5 452.8 410.4C459.1 410.9 469.3 404.9 475.2 402.4C477.5 401.4 480.2 399.8 482.6 399.4C484.5 399.2 484.8 399.8 486.6 399.1C491.3 397.2 493.7 390.7 497.5 387.5C502.1 383.7 507.5 381 512.1 377C522.6 367.8 533.1 350.1 524.8 336.3C519.8 327.8 509.6 325.1 500.4 327C498.3 327.4 487.7 331.7 487.3 331.3C486.3 330.4 487.3 324.9 487.1 323.4C485.8 314.9 479.8 309 471.1 308.5Z'
  };
  const VEIN = { base: 'M267.5 165L267 147', l: 'M266 143C254.2 115.3 236.5 89.5 212 71.5', r: 'M267 143C285.5 124.3 293.5 107.2 319 97.5' };
  // where each traced mitten's hand centre sits, and the side it was traced on
  const HAND = { rest: [128.7, 491.9, 'l'], raised: [481.7, 360.1, 'r'], hand: [478.4, 358.7, 'r'] };
  const EYE = {
    l: { x: 250.3, y: 335.3, rx: 12.8, ry: 19.2, tilt: -12, glint: [2.7, -8.8, 4.4] },
    r: { x: 355.7, y: 301, rx: 12.1, ry: 20, tilt: -22.4, glint: [0.9, -9.5, 4.3] }
  };
  const FRECKLES = [[229.1, 362], [247.5, 366.5], [236.6, 376.8], [387.5, 318.5], [373, 331.3], [386.4, 337.6]];
  const MOUTH = [310, 341];         // the middle of the original smile
  const TILT = -12;                 // the face's own slant (the original smile rises to the viewer's right)
  const GREET_MOUTH = 'M289.3 341.8C298.6 356.3 327.1 347.1 331.2 331';

  // ---- small geometry helpers ----
  function r1(v) { const n = Math.round(v * 10) / 10; return String(Object.is(n, -0) ? 0 : n); }
  function rot(x, y, deg) { const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [x * c - y * s, x * s + y * c]; }
  function pt(p) { return r1(p[0]) + ' ' + r1(p[1]); }
  // maps every coordinate pair of a path written with M, L, Q and C only
  function mapPath(d, f) { return d.replace(/(-?\d*\.?\d+)[ ,](-?\d*\.?\d+)/g, function (m, x, y) { return pt(f(+x, +y)); }); }
  // a path drawn in a local frame (origin ox,oy, x along the face's slant) mapped to the 560x672 frame
  function place(d, ox, oy, deg) { return mapPath(d, function (x, y) { const p = rot(x, y, deg); return [ox + p[0], oy + p[1]]; }); }
  function mirrorX(d) { return mapPath(d, function (x, y) { return [-x, y]; }); }

  // mitten shapes about their hand centre, for each side
  const MITTEN = {};
  for (const k of ['rest', 'raised', 'hand']) {
    const h = HAND[k], here = mapPath(T[k], function (x, y) { return [x - h[0], y - h[1]]; });
    MITTEN[k] = h[2] === 'l' ? { l: here, r: mirrorX(here) } : { l: mirrorX(here), r: here };
  }

  // ---- poses ----
  // Arms are written for the viewer-left arm; the right arm mirrors it unless given. shape: rest | raised | hand.
  // swing: degrees about the shoulder from where the shape was traced (positive turns the hand outward and up);
  // at: the hand centre in viewer-left coordinates instead of a swing; turn: extra hand rotation, positive outward.
  // body: [tilt in degrees, vertical scale] about the base. leaves: lift in degrees (negative droops).
  const POSES = {
    greet: { arms: { l: { shape: 'rest' }, r: { shape: 'raised' } }, body: [0, 1], leaves: 0 },
    rest: { arms: { shape: 'rest' }, body: [0, 1], leaves: 0 },
    calm: { arms: { shape: 'rest', swing: -4 }, body: [0, 1], leaves: 0 },
    happy: { arms: { shape: 'rest', swing: 33 }, body: [0, 1.01], leaves: 4 },
    excited: { arms: { shape: 'raised', swing: -4 }, body: [0, 1.02], leaves: 5 },
    proud: { arms: { shape: 'hand', at: [140, 505], turn: 25 }, body: [0, 1.02], leaves: 6 },
    surprised: { arms: { shape: 'hand', at: [147, 394], turn: -8 }, body: [0, 1.02], leaves: 4 },
    sad: { arms: { shape: 'rest', swing: -9 }, body: [1.5, 0.965], leaves: -12 },
    worried: { arms: { shape: 'hand', at: [244, 478], turn: -14 }, body: [0, 0.985], leaves: -7 },
    angry: { arms: { shape: 'rest', swing: 9 }, body: [0, 0.99], leaves: -2 },
    frustrated: { arms: { shape: 'raised', swing: 30, turn: 10 }, body: [0, 1], leaves: -4 },
    disappointed: { arms: { shape: 'rest', swing: -2 }, body: [2, 0.955], leaves: -10 }
  };
  function armSpec(pose, side) { return pose.arms.shape ? pose.arms : pose.arms[side]; }
  // rotate(shoulder) translate(0, reach) rotate(wrist) for one arm group, plus the shape it shows
  function armTransform(side, spec) {
    const s = SHOULDER[side], sign = side === 'l' ? 1 : -1, h = HAND[spec.shape];
    let hx = h[2] === side ? h[0] : AXIS - h[0], hy = h[1], turn = spec.turn || 0;
    if (spec.at) { hx = side === 'l' ? spec.at[0] : AXIS - spec.at[0]; hy = spec.at[1]; }
    else if (spec.swing) {
      const p = rot(hx - s[0], hy - s[1], sign * spec.swing);
      hx = s[0] + p[0]; hy = s[1] + p[1]; turn += spec.swing;
    }
    const vx = hx - s[0], vy = hy - s[1];
    const shoulder = Math.atan2(-vx, vy) * 180 / Math.PI;
    return 'rotate(' + r1(shoulder) + 'deg) translate(0px,' + r1(Math.hypot(vx, vy)) + 'px) rotate(' + r1(sign * turn - shoulder) + 'deg)';
  }
  function poseStyle(pose) { return 'rotate(' + r1(pose.body[0]) + 'deg) scale(1,' + pose.body[1] + ')'; }
  function leafStyle(pose, side) { return 'rotate(' + r1(side === 'l' ? pose.leaves : -pose.leaves) + 'deg)'; }

  // ---- face features ----
  function ellipse(rx, ry, tilt, dx, dy) {
    const a = rot(0, -ry, tilt), arc = 'A' + r1(rx) + ' ' + r1(ry) + ' ' + r1(tilt) + ' 0 1 ';
    return 'M' + pt([dx + a[0], dy + a[1]]) + arc + pt([dx - a[0], dy - a[1]]) + arc + pt([dx + a[0], dy + a[1]]) + 'Z';
  }
  // an eye with its upper lid lowered: the part of the ellipse below the line from (-rx, a) to (rx, b) in the eye's
  // frame; bow curves the lid into the eye (a heavy lid, or a smiling lower lid when drawn upside down)
  function lidded(rx, ry, tilt, a, b, dx, dy, bow) {
    const m = (b - a) / (2 * rx), c = (a + b) / 2, R = Math.hypot(ry, m * rx), phi = Math.atan2(m * rx, ry);
    const s = Math.asin(Math.max(-1, Math.min(1, c / R))), t1 = phi + s, t2 = phi + Math.PI - s;
    const p = function (t) { const q = rot(rx * Math.cos(t), ry * Math.sin(t), tilt); return [q[0] + (dx || 0), q[1] + (dy || 0)]; };
    const q1 = [rx * Math.cos(t1), ry * Math.sin(t1)], q2 = [rx * Math.cos(t2), ry * Math.sin(t2)];
    const ctl = rot((q1[0] + q2[0]) / 2, (q1[1] + q2[1]) / 2 + 2 * (bow || 0), tilt);
    return 'M' + pt(p(t1)) + 'A' + r1(rx) + ' ' + r1(ry) + ' ' + r1(tilt) + ' ' + (s < 0 ? 1 : 0) + ' 1 ' + pt(p(t2)) +
      'Q' + pt([ctl[0] + (dx || 0), ctl[1] + (dy || 0)]) + ' ' + pt(p(t1)) + 'Z';
  }
  const stroke = function (d, w) { return '<path d="' + d + '" fill="none" stroke="' + C.ink + '" stroke-width="' + (w || 8.5) + '" stroke-linecap="round" stroke-linejoin="round"/>'; };
  const fill = function (d) { return '<path d="' + d + '" fill="' + C.ink + '" stroke="' + C.ink + '" stroke-width="3" stroke-linejoin="round"/>'; };
  // eye looks, in each eye's own frame (origin at the eye anchor)
  const LOOKS = {
    open: { }, wide: { scale: 1.12 }, up: { dy: -2, glintUp: 1, under: { l: [12, 12], r: [12, 12] }, bow: 5 }, glance: { dx: -3, glintSide: -3 },
    calm: { closed: 'M-15 1Q0 10 15 1' }, joy: { closed: 'M-15 5Q0 -13 15 5' },
    narrow: { lid: { l: [-12, -2], r: [-2, -12] } }, tense: { lid: { l: [-12, -9], r: [-9, -12] } },
    heavy: { lid: { l: [-6, -9], r: [-9, -6] }, bow: 3 }
  };
  function eye(side, look) {
    const e = EYE[side], L = LOOKS[look] || LOOKS.open;
    let inner;
    if (L.closed) inner = stroke(place(L.closed, 0, 0, TILT), 7.5);
    else {
      const k = L.scale || 1, rx = e.rx * k, ry = e.ry * k, dx = L.dx || 0, dy = L.dy || 0;
      let gx = e.glint[0] * k + dx + (L.glintSide || 0), gy = e.glint[1] * k + dy - (L.glintUp || 0);
      let shape;
      if (L.under) {
        const ab = L.under[side];
        shape = lidded(rx, ry, e.tilt + 180, -ab[1], -ab[0], dx, dy, L.bow);
      } else if (L.lid) {
        const ab = L.lid[side];
        shape = lidded(rx, ry, e.tilt, ab[0], ab[1], 0, 0, L.bow);
        const lidAt = rot(gx, gy, -e.tilt), lineY = (ab[0] + ab[1]) / 2 + (ab[1] - ab[0]) / (2 * rx) * lidAt[0];
        if (lidAt[1] - e.glint[2] < lineY + 1.5) { const g = rot(lidAt[0], lineY + e.glint[2] + 2, e.tilt); gx = g[0]; gy = g[1]; }
      } else shape = ellipse(rx, ry, e.tilt, dx, dy);
      inner = '<path d="' + shape + '" fill="' + C.ink + '"/><circle cx="' + r1(gx) + '" cy="' + r1(gy) + '" r="' + r1(e.glint[2] * k) + '" fill="' + C.glint + '"/>';
    }
    return '<g transform="translate(' + e.x + ' ' + e.y + ')"><g class="nook-lid">' + inner + '</g></g>';
  }
  // brows: [left eye path, right eye path] about each eye anchor, in the face's slant
  const BROWS = {
    proud: ['M-13 -33Q0 -42 13 -33', 'M-13 -35Q0 -44 13 -35'],
    sad: ['M-14 -30Q-1 -32 11 -40', 'M-12 -42Q0 -33 14 -30'],
    worried: ['M-14 -29Q-6 -40 10 -39', 'M-10 -40Q6 -41 14 -30'],
    angry: ['M-13 -40L12 -31', 'M-12 -32L13 -41'],
    frustrated: ['M-13 -38L11 -31', 'M-12 -30Q0 -41 14 -39']
  };
  function brows(f) {
    const b = BROWS[f];
    if (!b) return '';
    return '<g class="nook-brows">' + stroke(place(b[0], EYE.l.x, EYE.l.y, TILT), 6.5) + stroke(place(b[1], EYE.r.x, EYE.r.y, TILT), 6.5) + '</g>';
  }
  // mouths in the mouth frame (origin MOUTH, x along the face's slant)
  const MOUTHS = {
    calm: function () { return stroke(place('M-15 -2Q0 8 15 -2', MOUTH[0], MOUTH[1], TILT), 8); },
    happy: function () { return fill(place('M-23 -5Q0 -9 23 -5C22 12 11 19 0 19C-11 19 -22 12 -23 -5Z', MOUTH[0], MOUTH[1], TILT * 0.6)); },
    excited: function () { return fill(place('M-17 -9Q0 -13 17 -9C18 10 10 25 0 25C-10 25 -18 10 -17 -9Z', MOUTH[0], MOUTH[1], TILT * 0.6)); },
    proud: function () { return stroke(place('M-25 -1Q-23 4 -19 3C-8 11 9 8 21 -9', MOUTH[0], MOUTH[1], TILT), 8); },
    surprised: function () { return '<path d="' + ellipse(9, 13, TILT * 0.5, MOUTH[0], MOUTH[1] + 4) + '" fill="' + C.ink + '"/>'; },
    sad: function () { return stroke(place('M-17 9C-9 -4 9 -4 17 9', MOUTH[0], MOUTH[1], TILT), 8); },
    worried: function () { return stroke(place('M-17 4C-13 -3 -8 -3 -4 2C0 7 5 7 9 2C12 -1 15 -1 17 2', MOUTH[0], MOUTH[1], TILT), 7); },
    angry: function () { return stroke(place('M-14 3L14 -1', MOUTH[0], MOUTH[1], TILT), 8.5); },
    frustrated: function () { return stroke(place('M-17 4L-9 -3L-1 4L7 -3L15 3', MOUTH[0], MOUTH[1], TILT), 7); },
    disappointed: function () { return stroke(place('M-14 7Q0 -3 14 7', MOUTH[0], MOUTH[1], TILT), 8); },
    greet: function () { return stroke(GREET_MOUTH, 8.5); },
    rest: function () { return stroke(GREET_MOUTH, 8.5); }
  };
  const FACE = {
    greet: 'open', rest: 'open', calm: 'calm', happy: 'joy', excited: 'wide', proud: 'up', surprised: 'wide',
    sad: 'open', worried: 'glance', angry: 'narrow', frustrated: 'tense', disappointed: 'heavy'
  };
  function features(f) {
    return brows(f) + eye('l', FACE[f]) + eye('r', FACE[f]) + '<g class="nook-mouth">' + MOUTHS[f]() + '</g>';
  }
  function freckles() {
    return '<g class="nook-freckles" fill="' + C.freckle + '">' + FRECKLES.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4.7"/>'; }).join('') + '</g>';
  }

  // ---- rendering ----
  function state(feeling) { return STATES.indexOf(feeling) >= 0 ? feeling : 'calm'; }
  function labelFor(f) { return f === 'greet' ? 'Nook waves hello' : f === 'rest' ? 'Nook smiles' : 'Nook feels ' + f; }
  function a11y(options, f) {
    return options.decorative ? 'aria-hidden="true" focusable="false"' : 'role="img" aria-label="' + String(options.label || labelFor(f)).replace(/[&<>"]/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }) + '"';
  }
  function pivot(x, y, cls, style, inner) {
    return '<g transform="translate(' + x + ' ' + y + ')"><g class="' + cls + '" style="transform:' + style + '">' + inner + '</g></g>';
  }
  // Optional paper grain (options.grain): a small tiled pattern of faint light and dark flecks laid over each
  // coloured part. Static inside the character (it moves with its part). Off by default until it is measured on
  // the iPad 5 (BUILD-BRIEF item 54); no SVG filters.
  let grainCount = 0;
  function grainDefs(id) {
    let seed = 11, flecks = '';
    const rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 44; i++) {
      flecks += '<circle cx="' + r1(rnd() * 48) + '" cy="' + r1(rnd() * 48) + '" r="' + r1(1.5 + rnd() * 3) + '" fill="' + (i % 3 ? '#FFFFFF' : C.ink) + '"/>';
    }
    return '<defs><pattern id="' + id + '" width="48" height="48" patternUnits="userSpaceOnUse"><g opacity=".045">' + flecks + '</g></pattern></defs>';
  }
  function paint(d, colour, grain, cls) {
    return '<path' + (cls ? ' class="' + cls + '"' : '') + ' d="' + d + '" fill="' + colour + '"/>' + (grain ? '<path d="' + d + '" fill="url(#' + grain + ')"/>' : '');
  }
  function arm(side, layer, pose, grain) {
    const spec = armSpec(pose, side), shapes = layer === 'back' ? ['raised'] : ['rest', 'hand'];
    const inner = shapes.map(function (k) {
      return '<g class="nook-mitten" data-shape="' + k + '" style="opacity:' + (spec.shape === k ? 1 : 0) + '">' + paint(MITTEN[k][side], C.mitten, grain) + '</g>';
    }).join('');
    return pivot(SHOULDER[side][0], SHOULDER[side][1], 'nook-arm nook-arm-' + side + ' nook-arm-' + layer, armTransform(side, spec), inner);
  }
  function leaf(side, pose, grain) {
    const inner = '<g class="nook-follow nook-follow-' + side + '"><g transform="translate(' + -STEM[0] + ' ' + -STEM[1] + ')">' +
      paint(T[side === 'l' ? 'leafL' : 'leafR'], C.leaf, grain) +
      '<path d="' + VEIN[side] + '" fill="none" stroke="' + C.vein + '" stroke-width="' + (side === 'l' ? 10.5 : 8.5) + '" stroke-linecap="round"/></g></g>';
    return pivot(STEM[0], STEM[1], 'nook-leaf nook-leaf-' + side, leafStyle(pose, side), inner);
  }
  function svg(feeling, options) {
    options = options || {};
    const f = state(feeling), pose = POSES[f], grain = options.grain ? 'nook-grain-' + (++grainCount) : '';
    return '<svg class="nook' + (options.className ? ' ' + options.className : '') + '" viewBox="0 0 560 672" data-feeling="' + f + '" ' + a11y(options, f) + ' xmlns="http://www.w3.org/2000/svg">' +
      (grain ? grainDefs(grain) : '') +
      '<g class="nook-feet">' + paint(T.footL, C.feet, grain) + paint(T.footR, C.feet, grain) + '</g>' +
      pivot(BASE[0], BASE[1], 'nook-pose', poseStyle(pose), '<g class="nook-squash"><g transform="translate(' + -BASE[0] + ' ' + -BASE[1] + ')">' +
        '<path d="' + VEIN.base + '" stroke="' + C.vein + '" stroke-width="13.5" stroke-linecap="round"/>' +
        leaf('l', pose, grain) + leaf('r', pose, grain) +
        arm('l', 'back', pose, grain) + arm('r', 'back', pose, grain) +
        paint(T.body, C.body, grain, 'nook-body') + paint(T.patch, C.face, grain, 'nook-patch') + freckles() +
        '<g class="nook-features">' + features(f) + '</g>' +
        arm('l', 'front', pose, grain) + arm('r', 'front', pose, grain) +
      '</g></g>') +
    '</svg>';
  }
  // The card face: the actual patch with a narrow lavender (or neutral ring) perimeter, the same features.
  const FACE_BOX = '168.5 197.5 252 252';
  function face(feeling, options) {
    options = options || {};
    const f = state(feeling), ring = options.ring ? (typeof options.ring === 'string' ? options.ring : C.ring) : C.body;
    return '<svg class="nook-face' + (options.className ? ' ' + options.className : '') + '" viewBox="' + FACE_BOX + '" data-feeling="' + f + '" ' + a11y(options, f) + ' xmlns="http://www.w3.org/2000/svg">' +
      '<path class="nook-rim" d="' + T.patch + '" fill="' + ring + '" stroke="' + ring + '" stroke-width="22" stroke-linejoin="round"/>' +
      '<path class="nook-patch" d="' + T.patch + '" fill="' + C.face + '"/>' + freckles() +
      '<g class="nook-features">' + features(f) + '</g></svg>';
  }

  // ---- live changes (browser only) ----
  function quiet(el) {
    const w = el.ownerDocument && el.ownerDocument.defaultView;
    return !!((w && w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches) || (el.closest && el.closest('.softer')));
  }
  function restart(el, cls) { el.classList.remove(cls); void el.getBoundingClientRect(); el.classList.add(cls); }
  // Change the feeling of a rendered svg.nook in place: eyes close (80 ms), the features swap behind the blink,
  // eyes open (120 ms); arms, leaves and posture settle through their CSS transitions; a small squash and leaf
  // follow-through. With Softer or reduced motion the swap is instant. Returns the feeling shown.
  function change(el, feeling) {
    const f = state(feeling), pose = POSES[f], w = el.ownerDocument.defaultView;
    if (el._nookTimer) { w.clearTimeout(el._nookTimer); el._nookTimer = 0; }
    if (el.getAttribute('data-feeling') === f && !el.classList.contains('nook-swap')) return f;
    const swapFace = function () {
      el.querySelector('.nook-features').innerHTML = features(f);
      el.setAttribute('data-feeling', f);
      if (el.getAttribute('role') === 'img' && !el.hasAttribute('data-label')) el.setAttribute('aria-label', labelFor(f));
    };
    el.querySelector('.nook-pose').style.transform = poseStyle(pose);
    for (const side of ['l', 'r']) {
      el.querySelector('.nook-leaf-' + side).style.transform = leafStyle(pose, side);
      const spec = armSpec(pose, side), t = armTransform(side, spec);
      for (const g of el.querySelectorAll('.nook-arm-' + side)) g.style.transform = t;
      for (const m of el.querySelectorAll('.nook-arm-' + side + ' .nook-mitten')) m.style.opacity = m.getAttribute('data-shape') === spec.shape ? '1' : '0';
    }
    if (quiet(el)) { el.classList.remove('nook-swap', 'nook-opening', 'nook-changing'); swapFace(); return f; }
    restart(el, 'nook-changing');
    el.classList.remove('nook-opening');
    el.classList.add('nook-swap');
    el._nookTimer = w.setTimeout(function () {
      swapFace();
      el.classList.remove('nook-swap');
      el.classList.add('nook-opening');
      el._nookTimer = w.setTimeout(function () { el.classList.remove('nook-opening', 'nook-changing'); el._nookTimer = 0; }, 640);
    }, 90);
    return f;
  }
  // Idle: a blink at a random 3.5 to 7 s (close 70 ms, hold 50 ms, open 90 ms); breathing is CSS. Idle stops
  // after 45 s without input and while the page is hidden (.nook-still pauses the breath too). No rAF loop.
  function idle(el, options) {
    options = options || {};
    const doc = el.ownerDocument, w = doc.defaultView, rest = options.restAfter || 45000;
    let timer = 0, last = Date.now(), stopped = false;
    const schedule = function () { w.clearTimeout(timer); if (!stopped && !doc.hidden) timer = w.setTimeout(blink, 3500 + Math.random() * 3500); };
    const blink = function () {
      if (Date.now() - last >= rest) { el.classList.add('nook-still'); return; }
      const f = el.getAttribute('data-feeling');
      if (f !== 'calm' && f !== 'happy' && !el._nookTimer && !quiet(el)) {
        el.classList.add('nook-blink');
        w.setTimeout(function () { el.classList.remove('nook-blink'); }, 120);
      }
      schedule();
    };
    const input = function () { last = Date.now(); if (el.classList.contains('nook-still') && !doc.hidden) { el.classList.remove('nook-still'); schedule(); } };
    const visibility = function () { if (doc.hidden) { w.clearTimeout(timer); el.classList.add('nook-still'); } else input(); };
    doc.addEventListener('pointerdown', input, true);
    doc.addEventListener('keydown', input, true);
    doc.addEventListener('visibilitychange', visibility);
    if (doc.hidden) el.classList.add('nook-still'); else schedule();
    return {
      poke: input,
      stop: function () {
        stopped = true; w.clearTimeout(timer);
        doc.removeEventListener('pointerdown', input, true);
        doc.removeEventListener('keydown', input, true);
        doc.removeEventListener('visibilitychange', visibility);
        el.classList.remove('nook-blink', 'nook-still');
      }
    };
  }

  const api = { svg: svg, face: face, change: change, idle: idle, FEELINGS: FEELINGS.slice(), STATES: STATES.slice(), POSES: POSES, COLOURS: C, SHOULDER: SHOULDER, STEM: STEM, BASE: BASE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.NookArt = api;
})(typeof window !== 'undefined' ? window : globalThis);
