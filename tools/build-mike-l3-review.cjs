// Builds docs/mike-platformer/l3-look/index.html (the review page for Level 3) and two maps beside it:
//   plan.svg   the finished level as designed: five layers, three zones, three hubs, the Teach Cell
//   slice.svg  the slice as built, drawn from level-3.json itself: every surface, ride, hook, hazard and key
// From the captures and the suites' own result files. No external calls. Run the suites first, then:
//   node tools/build-mike-l3-review.cjs
const fs = require('fs'), path = require('path');
const dir = path.resolve(__dirname, '../docs/mike-platformer/l3-look');
const level = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/fireworks/mike-game/level-3.json'), 'utf8'));
const read = f => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (_){ return null; } };
const mech = read('mechanics.json'), routes = read('routes.json'), run = read('run.json'), browser = read('browser.json');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const LAYER = [['Gantry roof', '#E7EDF2', -12], ['High line', '#7FC4F0', -4], ['Mezzanine', '#3FB8A8', 4], ['Shop floor', '#B8AFA2', 12], ['Undercroft', '#4A5C6A', 20]];

// ---------- plan.svg: the sections and which layers each one opens ----------
{
  const s = 2.6, x0 = 110, lane = 40, W = level.size[0]*s + x0 + 20, H = 5*lane + 110, bx = t => x0 + t*s, ORD = ['g', 'h', 'm', 'f', 'u'];
  let g = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Arial,Helvetica,sans-serif"><rect width="${W}" height="${H}" fill="#0b2029"/>`;
  g += `<text x="16" y="24" fill="#d9eeee" font-size="16" font-weight="700">Cobot Mania: eleven sections. Each opens only some of the five layers; the rest are walled off as robot cells.</text>`;
  LAYER.forEach(([name, col], i) => { g += `<text x="12" y="${54 + i*lane + 22}" fill="${col}" font-size="13" font-weight="700">${name}</text>`; });
  for (const r of level.rooms){
    ORD.forEach((l, i) => { const y = 54 + i*lane, open = r.open.includes(l);
      g += `<rect x="${bx(r.x) + 1.5}" y="${y + 4}" width="${r.width*s - 3}" height="${lane - 8}" rx="4" fill="${open ? LAYER[i][1] : '#26323C'}" opacity="${open ? .85 : 1}"${open ? '' : ' stroke="#3d4c58"'}/>`; });
    g += `<text x="${bx(r.x + r.width/2)}" y="${54 + 5*lane + 16}" fill="#9db9c2" font-size="10.5" text-anchor="middle">${esc(r.title.replace('The Teach Cell', 'Boss').replace('Marshalling', 'Marsh.'))}</text>`;
  }
  for (const c of level.carriers.filter(c => c.home[0] < level.boss.bounds[0])) for (const d of c.drops){ const ya = 54 + ORD.indexOf(Object.keys({ g:-12, h:-4, m:4, f:12, u:20 }).find(k => ({ g:-12, h:-4, m:4, f:12, u:20 })[k] === c.home[1]) || 'f')*lane + lane/2, yb = 54 + ORD.indexOf(Object.keys({ g:-12, h:-4, m:4, f:12, u:20 }).find(k => ({ g:-12, h:-4, m:4, f:12, u:20 })[k] === d[1]) || 'f')*lane + lane/2;
    if (ya === undefined || isNaN(ya) || isNaN(yb)) continue;
    g += `<path d="M${bx(c.home[0])} ${ya} Q${bx((c.home[0] + d[0])/2)} ${Math.min(ya, yb) - 16} ${bx(d[0])} ${yb}" fill="none" stroke="#0b2029" stroke-width="4" opacity=".7"/><path d="M${bx(c.home[0])} ${ya} Q${bx((c.home[0] + d[0])/2)} ${Math.min(ya, yb) - 16} ${bx(d[0])} ${yb}" fill="none" stroke="#fff" stroke-width="1.6" marker-end="url(#up)"/><circle cx="${bx(c.home[0])}" cy="${ya}" r="3.5" fill="#2FD6A8" stroke="#0b2029"/>`; }
  g += `<text x="${x0}" y="${H - 12}" fill="#2FD6A8" font-size="12">Mint dots: carrier cobots. White arrows: where each one can send him (it takes the next on its list each time it grabs).</text>`;
  g += `<defs><marker id="up" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="#fff"/></marker></defs></svg>`;
  fs.writeFileSync(path.join(dir, 'plan.svg'), g);
}

// ---------- level.svg: the level as built ----------
{
  const s = 8, top = -18, bot = 24, W = level.size[0]*s, H = (bot - top)*s + 30, X = x => x*s, Y = y => (y - top)*s;
  let g = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Arial,Helvetica,sans-serif"><rect width="${W}" height="${H}" fill="#0b2029"/>`;
  for (const [x, y, w, h, st] of level.solids) if (st === 'cell') g += `<rect x="${X(x)}" y="${Y(Math.max(y, top))}" width="${w*s}" height="${(Math.min(y + h, bot) - Math.max(y, top))*s}" fill="#26323C"/>`;
  for (const ln of level.lanes){ const [x, y, w, h] = ln.rect; g += `<rect x="${X(x)}" y="${Y(y - 5.5)}" width="${w*s}" height="${8*s}" fill="${LAYER[ln.layer][1]}" opacity=".1"/><text x="${X(x) + 6}" y="${Y(y - 2.2)}" fill="${LAYER[ln.layer][1]}" font-size="11" font-weight="700">${esc(ln.title)}</text>`; }
  for (const r of level.rooms) g += `<text x="${X(r.x) + 4}" y="${H - 8}" fill="#9db9c2" font-size="11">${esc(r.title)}</text><line x1="${X(r.x)}" y1="0" x2="${X(r.x)}" y2="${H}" stroke="#335763" stroke-dasharray="2 4"/>`;
  for (const [x, y, w, h, st] of level.solids) if (st !== 'cell') g += `<rect x="${X(x)}" y="${Y(y)}" width="${w*s}" height="${Math.min(h, 6)*s}" fill="${st === 'floor' ? '#6b645c' : st === 'wall' ? '#56616c' : '#c7ccd1'}" opacity="${st === 'floor' ? .7 : .95}"/>`;
  for (const [x, y, w] of level.platforms) g += `<rect x="${X(x)}" y="${Y(y)}" width="${w*s}" height="3" fill="#e6e8e9"/>`;
  for (const b of level.belts) g += `<rect x="${X(b.at[0])}" y="${Y(b.y) - 3}" width="${(b.at[1] - b.at[0])*s}" height="3" fill="#F4CA46"/><text x="${X((b.at[0] + b.at[1])/2)}" y="${Y(b.y) - 5}" fill="#F4CA46" font-size="9" text-anchor="middle">${b.reverse ? '⇄' : b.dir > 0 ? '→' : '←'}</text>`;
  for (const r of level.rovers){ const h = r.tall ? 3.2 : .9; g += `<rect x="${X(r.span[0] - .8)}" y="${Y(r.y - h)}" width="${(r.span[1] - r.span[0] + 1.6)*s}" height="${h*s}" fill="#F4CA46" opacity=".18" stroke="#F4CA46" stroke-dasharray="3 2"/>`; }
  for (const a of level.arms){ const pts = []; for (let k = 0; k <= 16; k++){ const ang = (a.a0 + (a.a1 - a.a0)*k/16)*Math.PI/180; pts.push(`${X(a.base[0] + Math.cos(ang)*a.r).toFixed(1)},${Y(a.base[1] + Math.sin(ang)*a.r).toFixed(1)}`); }
    g += `<polyline points="${pts.join(' ')}" fill="none" stroke="#F4CA46" stroke-width="${.55*2*s}" stroke-linecap="round" opacity="${a.boss ? .35 : .55}"/><circle cx="${X(a.base[0])}" cy="${Y(a.base[1])}" r="4" fill="#17191C" stroke="#F4CA46" stroke-width="2"/>`; }
  for (const d of level.drops) g += `<line x1="${X(d.x)}" y1="${Y(d.top)}" x2="${X(d.x)}" y2="${Y(d.top + 3)}" stroke="#C99D60" stroke-width="5" opacity="${d.boss ? .5 : .9}"/>`;
  const cubic = (c, d, i) => { const [x0, y0] = c.home, [x3, y3] = d, top = c.tops ? c.tops[i] : c.top === undefined ? 2.5 : c.top, peak = Math.min(y0, y3) - top, t1 = (peak - (y0 + y3)/8)/.75; return `M${X(x0)} ${Y(y0 - .9)} C${X(x0)} ${Y(t1 - .9)} ${X(x3)} ${Y(t1 - .9)} ${X(x3)} ${Y(y3 - .9)}`; };
  for (const c of level.carriers){ c.drops.forEach((d, i) => { g += `<path d="${cubic(c, d, i)}" fill="none" stroke="#2FD6A8" stroke-width="2" stroke-dasharray="${i ? '5 4' : '0'}" marker-end="url(#arr)"/>`; });
    g += `<rect x="${X(c.home[0] - (c.sway || .5) - .6)}" y="${Y(c.home[1]) - 4}" width="${(2*(c.sway || .5) + 1.2)*s}" height="4" fill="#2FD6A8"/>`; }
  for (const h of level.hooks) g += `<line x1="${X(h.rail[0])}" y1="${Y(h.y)}" x2="${X(h.rail[1])}" y2="${Y(h.y)}" stroke="#7f8b95" stroke-width="3"/><line x1="${X(h.rail[0])}" y1="${Y(h.y + h.len)}" x2="${X(h.rail[1])}" y2="${Y(h.y + h.len)}" stroke="#2FD6A8" stroke-width="2" stroke-dasharray="2 3"/>`;
  for (const [x, y] of level.checkpoints) g += `<circle cx="${X(x)}" cy="${Y(y) - 10}" r="4" fill="#F4CA46"/>`;
  for (const p of level.pickups) g += `<circle cx="${X(p.at[0])}" cy="${Y(p.at[1])}" r="2.4" fill="${p.type === 'sdCard' ? '#FFB84D' : p.type === 'lubricant' ? '#4FE08A' : p.type === 'miniMike' ? '#ff5a4a' : '#a4e8d5'}"/>`;
  if (level.boss){ const b = level.boss, np = id => b.chutes[id] ? b.chutes[id].at : b.pallets[id] ? b.pallets[id].rail : [b.nodes[id].stand[0], b.nodes[id].stand[1] - 1.15];
    for (const [id, n] of Object.entries(b.nodes)) for (const e of n.exits){ const [x0, y0] = np(id), [x1, y1] = np(e); g += `<line x1="${X(x0)}" y1="${Y(y0)}" x2="${X(x1)}" y2="${Y(y1)}" stroke="#7FE7FF" stroke-width="1.5" opacity=".6"/>`; }
    for (const [id] of Object.entries(b.nodes)){ const [x, y] = np(id); g += `<circle cx="${X(x)}" cy="${Y(y)}" r="5" fill="#2F353B" stroke="#FFE27A" stroke-width="2"/><text x="${X(x)}" y="${Y(y) - 7}" fill="#FFE27A" font-size="9" text-anchor="middle">${id}</text>`; }
    for (const pl of Object.values(b.pallets)) g += `<rect x="${X(pl.at[0]) - 8}" y="${Y(pl.at[1]) - 5}" width="16" height="5" fill="${pl.colour === 'blue' ? '#3D8BFF' : '#FF8A1F'}"/>`;
    for (const ch of Object.values(b.chutes)) g += `<rect x="${X(ch.at[0]) - 7}" y="${Y(ch.at[1]) - 5}" width="14" height="9" fill="#3A4148" stroke="#FF8A1F"/>`; }
  g += `<defs><marker id="arr" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10" fill="#2FD6A8"/></marker></defs></svg>`;
  fs.writeFileSync(path.join(dir, 'level.svg'), g);
}

// ---------- the page ----------
const shots = [
  ['title', 'Title', 'The two bands explained in one line each: the only teaching the level does in words, apart from the Teach Cell telling you the job.'],
  ['bands', 'The redesigned cobots', 'Generic cobots: round base flange, joint housings with light rings, white tubes, an offset three-joint wrist, a tool flange. Carriers (mint) hang from overhead tracks; hazards (stripes) show red, amber or green on their light rings. In greyscale they still tell apart.'],
  ['induction', '01 Induction bay', 'The first cobot hovers over the walkway, swaying, the floor under it marked with mint chevrons. Walk into it and it takes you; jump it and you stay.'],
  ['first-grab', 'Grabbed', 'No choice in the matter: it lifts him to its next destination. Nothing can hurt him while he is held.'],
  ['jump-it', 'Or jump it', 'The only way past a carrier is over its gripper.'],
  ['floor-arm', 'The first hazard arm', 'A welding cobot on a pedestal in the walkway. Its light rings are the traffic light: green safe, amber about to strike, red live.'],
  ['hook', 'Hooks', 'Jump into the mint handle; Jump again to let go, or Down to drop.'],
  ['switchyard', '02 The Switchyard', 'Three cobots, each with two destinations, sending him up to the high line, back across the mezzanine, or back into the induction bay.'],
  ['cell-row', '03 Assembly line: Cell row', 'Three arms sweep the walkway in turn. The undercroft and roof are walled off here.'],
  ['the-line', '03 Assembly line: The line', 'Past the tall rover only by cobot, and it may take him on, or all the way back to the belt.'],
  ['hook-relay', '03 Assembly line: Hook relay', 'Hook to hook over the cell row, past a crate feeder.'],
  ['tower', '04 Transfer tower', 'The only way up to the roof.'],
  ['roof', '05 Roof and return: the roof', 'Pendulum arms on the roof beam, a crate feeder, a roof rover, and a cobot at the end that may take him on along the roof or down into the Loop.'],
  ['return-belts', '05 Roof and return: the return belts', 'The other way across: conveyors against him and with him, crates through the cell roof, a rover.'],
  ['weld-alley', '07 Weld row: spot-weld alley', 'Arms in opposed pairs strike the same span from each side, in turn.'],
  ['rover-yard', '07 Weld row: rover yard', 'A rack to stand on while low rovers pass under; a tall rover only a cobot gets him past.'],
  ['crossing', '08 The Crossing', 'A cobot from the undercroft, up through the hatches to the high line.'],
  ['sorting-line', '09 Pack-out: sorting line', 'A moving walkway, arms on drop-rods from the cell roof, crate feeders.'],
  ['wrap-station', '09 Pack-out: wrap station', 'Two tall rovers, a belt against him, and the cobots that are the only way past.'],
  ['sorter', '09 Pack-out: sorter', 'Reversing belts and a crate feeder below, and the cobot up to Marshalling at the end.'],
  ['marshalling', '10 Marshalling', 'The switchback down to the Teach Cell\'s door.'],
  ["boss-idle", "The Teach Cell: the arm’s route", "The Big Arm takes a crate from its chute (top left) and follows the waypoint dials on the wall. The route it will follow now is lit in the crate’s colour. Three round lamps hang in the middle of the cell."],
  ["boss-break", "Where the route breaks, the crate falls", "Dial F points back the way the arm came: a red cross, the arm warns (amber, a shadow below), and the crate drops there. The bug in the program is the hazard."],
  ["boss-reteach", "Re-teaching a waypoint", "Hold E at a dial (2.2 s, the fix) and it turns to its next exit. The route redraws and the next crate goes further, here right under the arm, which is where the work always is."],
  ["boss-deliver", "Delivered", "Route complete: the crate goes onto the pallet and a round lamp turns green."],
  ["boss-sweep-warn", "Then it sweeps", "After every trip the empty arm crosses to the far wall, lowers its striped sweeper head to one level of the cell (the floor, the side decks or the top ledges, a different one each trip) and warns: amber dashes while it lowers, flashing red as it aims. Then it sweeps the whole width. Jump it, or be on another level."],
  ["boss-sweep", "The sweep", "Here along the side decks: the floor and the middle grating are clear this time. The camera slows the arm, never Mike, so filming buys time for a 2.2 s re-teach."],
  ["boss-two", "Round 2: two arms", "The right-hand chute opens and a second arm works from it, each with its own lit route through the same dials, and each sweeping after its trips. Both crates must reach the pallet."],
  ["boss-colours", "Round 3: two colours", "The right-hand arm takes blue crates; the blue pallet opens bottom left. One set of dials, two routes, each to the pallet of its own colour."],
  ["play-boss-route", "In play", "The live page: the HUD is two small pills, and one short line says the job."],
  ["ipad-boss-break", "iPad, landscape", "Viewport emulation only."],
  ['results', 'Results and the route log', 'The campaign card, and every lane of the level lit once ever travelled on this device.'],
  ['poses', 'Mike on the cobots', 'The signed-off puppet, never redrawn.'],
  ['phone-cell-row', 'Phone, landscape', 'Touch controls: run, jump, look, camera; Use appears only at a key or the console.'],
].filter(s => fs.existsSync(path.join(dir, s[0] + '.png')));
const row = (k, v) => `<tr><th>${esc(k)}</th><td>${v}</td></tr>`;
const ok = b => b ? '<span class="ok">Pass.</span>' : '<span class="no">Not passing.</span>';
const mechN = mech ? mech.results.filter(r => r.pass).length + ' of ' + mech.results.length : null;
const bossRuns = run && run.results.boss ? run.results.boss.runs : [];
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cobot Mania: review</title>
<style>
:root{--bg:#071923;--panel:#102d39;--line:#335763;--text:#d9eeee;--dim:#9db9c2;--hi:#2FD6A8;--warn:#ffc46a}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.5 Arial,Helvetica,sans-serif}
main{max-width:1180px;margin:0 auto;padding:28px 16px 60px}h1{font-size:34px;margin:0 0 4px}h2{font-size:22px;margin:40px 0 12px;color:var(--hi)}p{margin:8px 0;max-width:75ch}
.sub{color:var(--dim)}a{color:var(--hi)}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px}
figure{margin:0;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden}figure img{display:block;width:100%;height:auto}figcaption{padding:10px 14px 14px}figcaption b{display:block;margin-bottom:2px}figcaption span{color:var(--dim);font-size:14px}
table{border-collapse:collapse;width:100%;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden}th,td{text-align:left;padding:9px 14px;border-top:1px solid var(--line);vertical-align:top}tr:first-child th,tr:first-child td{border-top:0}th{width:32%;font-weight:600;color:var(--dim)}
.ok{color:#9be4c7;font-weight:700}.no{color:var(--warn);font-weight:700}ul{padding-left:20px;max-width:80ch}li{margin:5px 0}.map{overflow-x:auto;border:1px solid var(--line);border-radius:10px;background:#0b2029}.map img{display:block;max-width:none}
code{background:#0c2530;padding:1px 6px;border-radius:4px;font-size:14px}
</style></head><body><main>
<h1>Cobot Mania</h1><p class="sub">Mike the Mic, Level 3. Revision 4 review, built ${new Date().toISOString().slice(0, 10)} from the captures and test results beside it.</p>
<p>The design is in <a href="../level-3-design.md">level-3-design.md</a>; the state of the work is in <a href="../L3-CONTINUATION.md">L3-CONTINUATION.md</a>. <b>Revision 4</b> (2 Oct, after the owner found it too easy): the whole level is harder (eleven more hazards, faster machines with shorter warnings, two checkpoints and a lubricant taken out); in the Teach Cell, rounds 2 and 3 have two arms from two chutes, round 3 adds a blue crate for a blue pallet, and after every trip each arm sweeps one level of the cell, so no spot is safe from all three and a 2.2 s re-teach usually wants the camera; the end screen is tidied. <b>Revision 3 boss</b> (2 Oct): the Teach Cell is now a route puzzle in the room itself, and every level's HUD is two small pills. <b>Revision 2</b>, after the owner's first play: three times the length to the boss (eleven sections, each opening only some of the five layers); carriers that grab whoever touches them and send him on to the next of their destinations; redrawn cobots; and a Teach Cell that says what the job is and shows each move on its screen. It is not deployed, not committed, and not linked from Level 2.</p>
<p><b>Play it locally:</b> <code>node tools/serve-fireworks.cjs 8788</code>, then <a href="http://localhost:8788/mike-game/level-3.html">localhost:8788/mike-game/level-3.html</a>. Straight to the boss: <a href="http://localhost:8788/mike-game/level-3.html?room=boss">?room=boss</a>. A section: <code>?room=5</code> (1 to 11). On the live site the page would open only for a campaign that has cleared Level 2.</p>

<h2>The sections</h2>
<p>Which layers each section opens, and where each carrier can send him. Closed layers are robot cells: walls, not pits, so every drop is between open layers and inside the view.</p>
<div class="map"><img src="plan.svg" alt="Plan of the level: eleven sections, open and closed layers, carrier destinations" width="1100"></div>
<h2>The level as built</h2>
<p>Drawn from <code>level-3.json</code>. Mint bars: a carrier's reach (jump it or be taken); mint curves: its destinations, in order (solid first, dashed after). Yellow: hazard sweeps and rover tracks. Brown: crate drops. Dark: robot cells. Scroll sideways.</p>
<div class="map"><img src="level.svg" alt="Map of the whole level: surfaces, carrier rides, hooks, hazards, keys" width="3016"></div>

<h2>What was checked</h2>
<table>
${row('Mechanics', mech ? `${ok(mech.results.every(r => r.pass))} ${mechN} checks: touching a carrier's gripper always takes him, controls do nothing while held, each grab sends him to the next destination in turn, jumping over gets past; rides and destinations clear of scenery and of every hazard; nothing hurts while held; arms hurt only while red; crates only while falling; the camera slows machines, never Mike; in the Teach Cell, the arm drops its crate where the route breaks, the 2.2 s re-teach on real time (filming or not), each sweep warns and hurts only on its own level (and no level is clear of all three), two arms in round 2, a blue crate at the orange pallet is not delivered, lost-life rules, saves; all three rounds won. <a href="mechanics.json">mechanics.json</a>` : 'Not run.')}
${row('Routes, machines off', routes ? `${ok(!routes.problems.length)} ${routes.surfaces} surfaces, all reachable from the start and all with a way on to the Teach Cell (no dead ends); every hook reachable; ${routes.pickups.collected} of ${routes.pickups.total} pickups collectable; every key in the Teach Cell reachable. Found by simulation with the real physics. <a href="routes.json">routes.json</a>` : 'Not run.')}
${row('Long falls', routes ? (routes.blindDrops.length ? routes.blindDrops.join('<br>') : 'None: no walk-off anywhere falls further than the view shows.') : '')}
${row('Whole runs, machines live', run ? Object.entries(run.results).filter(([k]) => k !== 'boss').map(([k, r]) => `${k}: at the door after ${r.seconds} s, health ${r.health}, lives lost ${r.livesLost}`).join('<br>') + (bossRuns.length ? `<br>Teach Cell (route boss): won without and with SD cards in ${bossRuns.map(r => r.seconds + ' s').join(' and ')}, ${bossRuns[0].turns} dial turns (the fewest possible), health left ${bossRuns.map(r => r.health).join(' and ')}, lives lost ${bossRuns.reduce((a, r) => a + r.livesLost, 0)}; re-teaches that needed a filmed clip: ${run.results.boss.filmed}` : '') + ` <a href="run.json">run.json</a>` : 'Not run.')}
${row('Browser', browser ? `${ok(!browser.errors.length)} Keyboard, a real Space press on a hook, Down looks below, save and reload, a dial re-taught in the Teach Cell, touch controls and Use at a key, pause, no errors, nothing fetched after load (${browser.requestsAfterLoad}). Frame work p95 ${browser.perf ? browser.perf.workP95.toFixed(1) : '?'} ms on the desktop test machine. <a href="browser.json">browser.json</a>` : 'Not run.')}
${row('Not verified', 'A human playtest of the harder level and the new boss. A real iPad 5. Difficulty against Levels 1 and 2 (the test player waits for machines with perfect foresight, so its times are proofs that it can be done, not measures of how hard it is).')}
</table>

<h2>Captures</h2>
<div class="grid">${shots.map(([f, t, c]) => `<figure><a href="${f}.png"><img src="${f}.png" alt="${esc(t)}" loading="lazy"></a><figcaption><b>${esc(t)}</b><span>${esc(c)}</span></figcaption></figure>`).join('')}</div>

<h2>For the owner to decide</h2>
<ul>
<li><b>Play it.</b> Is the level now hard without being unfair? Are there spots where a hit feels unavoidable?</li>
<li><b>The Teach Cell.</b> Two arms, a sweep after every trip, and a blue crate in round 3. Is it challenging enough now, and does it make you reach for the camera?</li>
<li><b>No safe spot.</b> The middle grating used to be clear of every sweep; now the deck sweep catches it too. Too mean, or right?</li>
<li><b>Linking Level 2 to Level 3</b> is a one-line change once Level 3 is ready.</li>
</ul>
</main></body></html>`;
fs.writeFileSync(path.join(dir, 'index.html'), html);
console.log('Wrote l3-look/index.html, plan.svg and level.svg with ' + shots.length + ' captures');
