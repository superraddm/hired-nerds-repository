/* Nook as vector art: one function, ten feelings plus a greeting. Proposal for review round 4 (not game code yet).
   Revised after Opus pass 1: pose and idle motion live on separate nested groups; arms and leaves are fixed shapes
   rotated about a shoulder or stem pivot (so poses can transition on Safari 16, which cannot animate path data);
   no two feelings share a silhouette and face. ViewBox 0 0 240 280. */
(function (root) {
  'use strict';
  const C = { body: '#8f7acb', bodyDark: '#7a66b6', face: '#fbefd8', eye: '#2a3568', brow: '#4a3f82', freckle: '#f29a74', leaf: '#a8dcae', stem: '#4e9b60', arm: '#45c4cc', armDark: '#2fa6ae', foot: '#5c4b94', mouth: '#4a2a44', tongue: '#f28a8a', blush: '#f6b7a4' };
  const FEELINGS = ['calm', 'happy', 'sad', 'angry', 'worried', 'excited', 'proud', 'surprised', 'frustrated', 'disappointed'];
  // Each arm is one fixed shape hanging from a shoulder pivot; a pose is just a rotation (degrees, clockwise positive)
  // and an optional elbow bend. Left arm pivot (62,196), right arm pivot (178,196). At 0 the arm hangs straight down.
  // mitten: 'open' (thumb), 'fist', 'flat' (palm up)
  const POSES = {
    calm:         { l: 10,  r: -10,  bend: 0, mitten: 'open', tilt: 0,  face: 0,  leaves: 0,  squash: 1 },
    greet:        { l: 10,  r: -150, bend: 0, mitten: 'open', tilt: 0,  face: 0,  leaves: -6, squash: 1 },
    happy:        { l: 45,  r: -45,  bend: 0, mitten: 'open', tilt: 0,  face: -2, leaves: -10, squash: 1 },
    sad:          { l: 4,   r: -4,   bend: 0, mitten: 'open', tilt: 3,  face: 4,  leaves: 24, squash: .97 },
    angry:        { l: 24,  r: -24,  bend: 0, mitten: 'fist', tilt: 0,  face: 0,  leaves: -2, squash: .96 },
    worried:      { l: -60, r: 60,   bend: 0, mitten: 'open', tilt: 0,  face: 0,  leaves: 8,  squash: 1 },
    excited:      { l: 150, r: -150, bend: 0, mitten: 'open', tilt: -2, face: -3, leaves: -14, squash: 1.02 },
    proud:        { l: 0,   r: 0,    bend: 1, mitten: 'open', tilt: 0,  face: -5, leaves: -8, squash: 1.03 },
    surprised:    { l: 128, r: -128, bend: 0, mitten: 'open', tilt: 0,  face: -2, leaves: -4, squash: 1.01 },
    frustrated:   { l: 168, r: -168, bend: 1, mitten: 'fist', tilt: 0,  face: 0,  leaves: 2,  squash: .99 },
    disappointed: { l: 3,   r: -3,   bend: 0, mitten: 'open', tilt: 4,  face: 5,  leaves: 18, squash: .97 }
  };
  const BROWS = {
    calm: 'M94 126 Q102 122 110 125 M130 125 Q138 122 146 126',
    happy: 'M94 122 Q102 116 110 120 M130 120 Q138 116 146 122',
    sad: 'M94 128 L110 121 M130 121 L146 128',
    angry: 'M94 118 L110 128 M130 128 L146 118',
    worried: 'M94 128 Q100 117 110 121 M130 121 Q140 117 146 128',
    excited: 'M94 118 Q102 110 110 115 M130 115 Q138 110 146 118',
    proud: 'M94 120 Q102 114 110 119 M130 119 Q138 114 146 120',
    surprised: 'M94 112 Q102 104 110 109 M130 109 Q138 104 146 112',
    frustrated: 'M94 123 L110 128 M130 128 L146 123',
    disappointed: 'M94 127 Q102 123 110 125 M130 125 Q138 123 146 127'
  };
  const MOUTHS = {
    calm: '<path d="M108 170 Q120 179 132 170"/>',
    happy: '<path d="M102 166 Q120 189 138 166"/>',
    greet: '<path d="M104 166 Q120 186 136 166 Q120 178 104 166Z" fill="' + C.mouth + '" stroke-width="3"/>',
    sad: '<path d="M106 181 Q120 167 134 181"/>',
    angry: '<path d="M106 177 Q120 173 134 177"/>',
    worried: '<path d="M106 176 Q113 170 120 176 Q127 182 134 176"/>',
    excited: '<path d="M104 165 Q120 163 136 165 Q137 189 120 191 Q103 189 104 165Z" fill="' + C.mouth + '" stroke="none"/><ellipse cx="120" cy="184" rx="9" ry="5" fill="' + C.tongue + '"/><path d="M108 168 L132 168" stroke="#fff6ec" stroke-width="4"/>',
    proud: '<path d="M100 166 Q120 186 140 166" stroke-width="5"/>',
    surprised: '<ellipse cx="120" cy="177" rx="7" ry="10" fill="' + C.mouth + '" stroke="none"/>',
    frustrated: '<path d="M106 179 L134 172"/><path d="M138 176 q6 -2 8 -8" stroke-width="2.5"/>',
    disappointed: '<path d="M110 179 Q120 172 130 179"/>'
  };
  function eyes(f) {
    if (f === 'happy') return '<g class="nook-eyes" stroke="' + C.eye + '" stroke-width="4.5" fill="none" stroke-linecap="round"><path d="M94 144 Q102 134 110 144"/><path d="M130 144 Q138 134 146 144"/></g>';
    const r = f === 'surprised' ? [9, 11] : [7, 9];
    const cy = f === 'sad' || f === 'disappointed' ? 146 : 142;
    let g = '<g class="nook-eyes"><ellipse cx="102" cy="' + cy + '" rx="' + r[0] + '" ry="' + r[1] + '" fill="' + C.eye + '"/><ellipse cx="138" cy="' + cy + '" rx="' + r[0] + '" ry="' + r[1] + '" fill="' + C.eye + '"/><circle cx="105" cy="' + (cy - 3) + '" r="2.4" fill="#fff"/><circle cx="141" cy="' + (cy - 3) + '" r="2.4" fill="#fff"/>';
    if (f === 'disappointed') g += '<path d="M93 136 Q102 132 111 137 L111 143 Q102 139 93 143Z M129 137 Q138 132 147 136 L147 143 Q138 139 129 143Z" fill="' + C.face + '"/><path d="M93 140 Q102 136 111 141 M129 141 Q138 136 147 140" stroke="' + C.brow + '" stroke-width="2.5" fill="none"/>';
    return g + '</g>';
  }
  // One arm shape, drawn hanging from the shoulder (64,178)/(176,178): a rounded limb 42 units long, so hanging hands end at mid-belly, ending in a mitten.
  function arm(side, angle, mitten, bend) {
    const px = side === 'l' ? 64 : 176, py = 178, dir = side === 'l' ? -1 : 1;
    const hand = mitten === 'fist' ? '<circle cx="0" cy="44" r="13" fill="' + C.armDark + '"/>' : mitten === 'flat' ? '<ellipse cx="0" cy="46" rx="15" ry="9" fill="' + C.arm + '"/>' : '<circle cx="' + (dir * 9) + '" cy="38" r="6" fill="' + C.arm + '"/>';
    const limb = bend ? '<path d="M0 0 Q' + (dir * 24) + ' 20 ' + (dir * 2) + ' 42" stroke="' + C.arm + '" stroke-width="22" stroke-linecap="round" fill="none"/>' : '<path d="M0 0 L0 42" stroke="' + C.arm + '" stroke-width="22" stroke-linecap="round" fill="none"/>';
    return '<g class="nook-arm nook-arm-' + side + '" transform="translate(' + px + ' ' + py + ') rotate(' + angle + ')">' + limb + hand + '</g>';
  }
  // Leaves: the pose rotation sits on an outer group and the idle sway on an inner group, both about the stem top (120,58).
  function leaves(angle) {
    const leaf = (d, vein, a) => '<g class="nook-leaf-pose" transform="rotate(' + a + ' 120 58)"><g class="nook-leaf"><path d="' + d + '" fill="' + C.leaf + '"/><path d="' + vein + '" stroke="' + C.stem + '" stroke-width="2.5" fill="none" stroke-linecap="round"/></g></g>';
    return '<g class="nook-leaves"><path d="M120 60 C121 48 124 40 126 30" stroke="' + C.stem + '" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      leaf('M118 46 C100 20 76 26 84 48 C92 60 110 56 118 46Z', 'M116 45 C104 40 94 40 88 46', -angle) +
      leaf('M124 42 C136 14 164 20 158 42 C152 56 132 54 124 42Z', 'M126 42 C136 36 146 34 154 38', angle) + '</g>';
  }
  function svg(feeling, options) {
    options = options || {};
    const pose = POSES[feeling] ? feeling : FEELINGS.includes(feeling) ? feeling : 'calm';
    const f = pose === 'greet' ? 'calm' : pose;           // greet uses calm's open eyes and brows with its own smile
    const P = POSES[pose];
    const blush = pose === 'proud' || pose === 'happy' || pose === 'excited' || pose === 'greet';
    const label = options.label || ('Nook feeling ' + f);
    return '<svg class="nook' + (options.className ? ' ' + options.className : '') + '" viewBox="0 0 240 280" data-feeling="' + pose + '" ' + (options.decorative ? 'aria-hidden="true"' : 'role="img" aria-label="' + label + '"') + ' xmlns="http://www.w3.org/2000/svg">' +
      '<ellipse cx="88" cy="258" rx="24" ry="12" fill="' + C.foot + '"/><ellipse cx="152" cy="258" rx="24" ry="12" fill="' + C.foot + '"/>' +
      '<g class="nook-pose" transform="translate(120 250) rotate(' + P.tilt + ') scale(1 ' + P.squash + ') translate(-120 -250)">' +
      '<g class="nook-idle">' +
      leaves(P.leaves) +
      '<path d="M120 58 C150 58 178 100 192 150 C206 200 190 252 120 252 C50 252 34 200 48 150 C62 100 90 58 120 58Z" fill="' + C.body + '"/>' +
      '<path d="M150 70 C170 90 186 130 190 160 C184 120 166 90 150 70Z" fill="' + C.bodyDark + '" opacity=".35"/>' +
      '<g class="nook-face" transform="translate(0 ' + P.face + ')">' +
      '<path d="M120 92 C158 92 178 118 176 150 C174 184 150 198 120 198 C90 198 66 184 64 150 C62 118 82 92 120 92Z" fill="' + C.face + '"/>' +
      (blush ? '<circle cx="84" cy="164" r="9" fill="' + C.blush + '" opacity=".55"/><circle cx="156" cy="164" r="9" fill="' + C.blush + '" opacity=".55"/>' : '') +
      '<g fill="' + C.freckle + '"><circle cx="84" cy="160" r="2.2"/><circle cx="90" cy="167" r="2.2"/><circle cx="80" cy="169" r="2.2"/><circle cx="156" cy="160" r="2.2"/><circle cx="150" cy="167" r="2.2"/><circle cx="160" cy="169" r="2.2"/></g>' +
      '<path class="nook-brows" d="' + BROWS[f] + '" stroke="' + C.brow + '" stroke-width="3.5" fill="none" stroke-linecap="round"/>' +
      eyes(f) +
      '<g class="nook-mouth" stroke="' + C.mouth + '" stroke-width="4" fill="none" stroke-linecap="round">' + (MOUTHS[pose] || MOUTHS[f]) + '</g>' +
      '</g>' +
      arm('l', P.l, P.mitten, P.bend) +
      arm('r', P.r, P.mitten, P.bend) +
      '</g></g></svg>';
  }
  // A small round face for cards: the same brows, eyes and mouth on a cream circle. The viewBox holds the whole circle.
  function face(feeling, options) {
    options = options || {};
    const f = FEELINGS.includes(feeling) ? feeling : 'calm';
    return '<svg class="nook-face-icon" viewBox="56 82 128 128" ' + (options.decorative !== false ? 'aria-hidden="true"' : 'role="img" aria-label="Nook feeling ' + f + '"') + ' xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="120" cy="146" r="56" fill="' + C.face + '" stroke="' + (options.ring || C.body) + '" stroke-width="6"/>' +
      '<path d="' + BROWS[f] + '" stroke="' + C.brow + '" stroke-width="3.5" fill="none" stroke-linecap="round"/>' + eyes(f) +
      '<g stroke="' + C.mouth + '" stroke-width="4" fill="none" stroke-linecap="round">' + MOUTHS[f] + '</g></svg>';
  }
  root.NookArt = { svg, face, FEELINGS, POSES, COLOURS: C };
})(typeof window !== 'undefined' ? window : globalThis);
