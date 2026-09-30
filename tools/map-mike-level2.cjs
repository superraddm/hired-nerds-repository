// A plain map of level-2.json for checking geometry by eye: node tools/map-mike-level2.cjs [x0 x1]
// Writes docs/mike-platformer/l2-look/map.svg (and map-<x0>.png through headless Chrome when a range is given).
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { E, levelData } = require('./mike-l2-lib.cjs');
const L = E.load(levelData());
if (L.errors.length){ console.log('LEVEL ERRORS:\n ' + [...L.errors].join('\n ')); }
const x0 = +(process.argv[2] || 0), x1 = +(process.argv[3] || L.W), S = 1400/(x1 - x0), y0 = -11, y1 = 28.5;
const X = x => (x - x0)*S, Y = y => (y - y0)*S, R = (x, y, w, h, fill, extra) => `<rect x="${X(x).toFixed(1)}" y="${Y(y).toFixed(1)}" width="${(w*S).toFixed(1)}" height="${(h*S).toFixed(1)}" fill="${fill}" ${extra || ''}/>`;
const o = [];
o.push(`<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="${((y1 - y0)*S).toFixed(0)}" font-family="Arial" font-size="${Math.max(8, S*.7).toFixed(0)}">`, R(x0, y0, x1 - x0, y1 - y0, '#0b1d27'));
for (const t of L.tanks){ for (const [n, lv] of Object.entries(t.levels)) o.push(R(t.x0, lv, t.x1 - t.x0, t.floor - lv, 'rgba(40,170,180,.22)'), `<text x="${X(t.x0) + 3}" y="${Y(lv) - 2}" fill="#6de0dd">${t.id}:${n} ${lv}</text>`);
  for (const p of t.pockets) o.push(R(p.x, p.y, p.w, p.h, '#0b1d27', 'stroke="#9be4c7" stroke-dasharray="3 2"')); }
for (const s of L.solids) o.push(R(s.x, s.y, s.w, s.h, s.kind === 'shelf' ? '#e6d27a' : s.kind === 'fixture' ? (s.style === 'glass' ? '#5f98a8' : '#8a7f9c') : '#56707c', 'stroke="#0b1d27" stroke-width=".5"'));
for (const d of L.doors) o.push(R(d.x, d.top, d.w, d.h, '#c0563a'));
for (const w of L.wires) for (const t of [0, w.period/2]){ const p = E.wirePose(w, t - (w.lag || 0)); o.push(`<line x1="${X(p.x0)}" y1="${Y(p.y0)}" x2="${X(p.x1)}" y2="${Y(p.y1)}" stroke="${w.boss ? '#ff7adf' : '#ffc46a'}" stroke-width="1.5" stroke-dasharray="4 3"/>`); }
for (const n of L.nozzles){ const p = E.nozzlePose(n, 0); o.push(R(p.box[0], p.box[1], p.box[2], p.box[3], 'rgba(255,255,255,.35)'), `<circle cx="${X(n.at[0])}" cy="${Y(n.at[1])}" r="4" fill="#ffc46a"/>`); }
for (const i of L.intakes) o.push(R(i.zone[0], i.zone[1], i.zone[2], i.zone[3], 'none', 'stroke="#ff9c6a" stroke-dasharray="2 2"'), `<circle cx="${X(i.at[0])}" cy="${Y(i.at[1])}" r="4" fill="#ff9c6a"/>`);
for (const v of L.valves) for (const w of v.wheels) o.push(`<circle cx="${X(w[0])}" cy="${Y(w[1])}" r="${S*.45}" fill="none" stroke="#ffc46a" stroke-width="2"/><text x="${X(w[0]) - 3}" y="${Y(w[1]) + 3}" fill="#ffc46a">V</text>`);
for (const p of L.pickups) o.push(`<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${S*.3}" fill="${L.salvageTypes.includes(p.type) ? '#fff' : p.type === 'miniMike' ? '#ffe066' : p.type === 'sdCard' ? '#ffb84d' : '#4fe08a'}"/>`);
for (const c of L.checkpoints) o.push(`<rect x="${X(c.x) - 2}" y="${Y(c.y - 3)}" width="4" height="${3*S}" fill="#f4ca46"/>`);
for (const r of L.refuges) o.push(`<rect x="${X(r.x) - 2}" y="${Y(r.y - 1.5)}" width="4" height="${1.5*S}" fill="#9be4c7"/>`);
if (L.suit) o.push(`<text x="${X(L.suit.x) - 4}" y="${Y(L.suit.y) - 6}" fill="#e9b86e">SUIT</text>`);
if (L.boss) for (const [n, p] of Object.entries(L.boss.points)) o.push(`<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="${S*.5}" fill="none" stroke="#ff7adf" stroke-width="2"/><text x="${X(p[0]) + 8}" y="${Y(p[1]) - 4}" fill="#ff7adf">${n}</text>`);
for (let x = Math.ceil(x0/4)*4; x <= x1; x += 4) o.push(`<line x1="${X(x)}" y1="0" x2="${X(x)}" y2="${Y(y1)}" stroke="rgba(255,255,255,${x % 16 ? .05 : .14})"/>`, x % (x1 - x0 > 200 ? 32 : 8) ? '' : `<text x="${X(x) + 2}" y="${Y(y1) - 3}" fill="#9db">${x}</text>`);
for (let y = -8; y <= 28; y += 4) o.push(`<line x1="0" y1="${Y(y)}" x2="1400" y2="${Y(y)}" stroke="rgba(255,255,255,${y === 12 ? .3 : .07})"/><text x="2" y="${Y(y) - 2}" fill="#9db">y${y}</text>`);
for (const r of L.rooms) o.push(`<text x="${X(r.x) + 4}" y="14" fill="#b7eae0">${r.title} (${r.x})</text>`);
o.push('</svg>');
const dir = path.resolve(__dirname, '../docs/mike-platformer/l2-look'); fs.mkdirSync(dir, { recursive:true });
const name = process.argv[2] === undefined ? 'map' : 'map-' + x0, svg = path.join(dir, name + '.svg'); fs.writeFileSync(svg, o.join('\n'));
try { execFileSync('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', `--user-data-dir=${path.resolve(__dirname, '../.wrangler/mike-l2-map')}`, `--screenshot=${path.join(dir, name + '.png')}`, `--window-size=1400,${Math.ceil((y1 - y0)*S)}`, 'file:///' + svg.replace(/\\/g, '/')], { stdio:'ignore', timeout:60000 }); console.log('wrote', name + '.png'); }
catch (e){ console.log('wrote', name + '.svg (no screenshot: ' + e.message.split('\n')[0] + ')'); }
