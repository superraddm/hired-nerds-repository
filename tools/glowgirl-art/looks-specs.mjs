// Print render specs (girl:layer,layer,...) for every look in the fixed deal, read from index.html.
import fs from 'node:fs';
const s = fs.readFileSync('C:/hirednerds-portfolio/public/fireworks/index.html', 'utf8');
const grab = name => { const m = s.match(new RegExp('const ' + name + '=(\\{[\\s\\S]*?\\});')); if (!m) throw new Error('no ' + name); return m[1]; };
const LOOK_PRESETS = eval('(' + grab('LOOK_PRESETS') + ')'), RANGE_PRESETS = eval('(' + grab('RANGE_PRESETS') + ')');
const RANGE_HAIR = eval('(' + grab('RANGE_HAIR') + ')'), RANGE_FACE = eval('(' + grab('RANGE_FACE') + ')');
const SCHEDULE = eval('(' + s.match(/const SCHEDULE = (\{[^;]*\});/)[1] + ')');
for (const g of Object.keys(SCHEDULE)) Object.entries(RANGE_PRESETS).forEach(([p, [t, b, sh]], i) => { LOOK_PRESETS[g][p] = { hair: { style: RANGE_HAIR[g][i] }, top: { style: t }, bottom: { style: b }, shoes: { style: sh }, face: [RANGE_FACE[g][i]] }; });
const girl = process.argv[2];
const out = [];
for (const g of girl ? [girl] : Object.keys(SCHEDULE)) for (const p of SCHEDULE[g]) { const l = LOOK_PRESETS[g][p];
  out.push(g + ':' + ['hair-' + l.hair.style, ...l.face.map(f => 'face-' + f), 'top-' + l.top.style, 'bottom-' + l.bottom.style, 'shoes-' + l.shoes.style].join(',')); }
console.log(out.join(' '));
