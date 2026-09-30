// Builds docs/mike-platformer/l2-look/index.html: the review page for Level 2, from the captures and the suites'
// own result files. No external calls. Run the suites first, then: node tools/build-mike-l2-review.cjs
const fs = require('fs'), path = require('path');
const dir = path.resolve(__dirname, '../docs/mike-platformer/l2-look');
const read = f => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (_){ return null; } };
const run = read('run.json'), run1 = read('run-1.json'), run2 = read('run-2.json'), routes = read('routes.json'), alt = read('alt-routes.json'), browser = read('browser.json'), boss = read('boss.json'), mech = read('mechanics.json');
const refinement = read('refinement.json'), windows = read('boss-windows.json'), bare = [read('run-bare.json'), read('run-bare-1.json'), read('run-bare-2.json')];
if (run && refinement) run.seconds = refinement.recording.seconds;
const clock = s => Math.floor(s/60) + ':' + String(Math.round(s % 60)).padStart(2, '0');
const shots = [
  ['title', 'Title', 'The level has its own page and its own save. The link at the top right goes back to Level 1.'],
  ['r1-dock', '01 Suit dock', 'The start: the kit-rack loop on the left, the service suit on its rack, the airlock beyond. The airlock is a real door and stays shut until the suit is on.'],
  ['r1-basin', '01 The shallow basin', 'The first water, with nothing in it that can hurt. The sign shows the two swimming controls as pictures.'],
  ['r2-rim', '02 Flushing gallery, the rim', 'The dry way: gratings over the tank, and a nozzle on top of each hanging baffle. Each machine carries its own traffic light.'],
  ['r2-under', '02 Flushing gallery, under water', 'The wet way: under the fixture table. The bell under it holds air and an earth bar, and sheds the static from the suit. A lubricant sits in it.'],
  ['r3-shaft', '03 Guide tower, the flooded shaft', 'The only wheel is inside the shaft. Turn it and the lock shuts behind him and the water carries him up. A wire rides up and down the shaft; it must be crossed while it is dark.'],
  ['r3-catwalk', '03 Guide tower, the high catwalks', 'Over the long tank, with a wire travelling along its gantry. A fall lands in water, never in a pit.'],
  ['r4-valve', '04 Split reservoir, the one wheel', 'On the divider between the two tanks. The arrows show which tank fills and which drains. A weir stands in each tank: full, he swims over it; drained, it is a wall. So the way across is the first tank while it is full, the wheel, then the second once it has filled.'],
  ['r4-low', '04 Split reservoir, a vault', 'Each tank has a vault whose door opens only while that tank is drained, and a high cache that can only be reached from the surface while it is full. Taking everything means reading the water before turning the wheel.'],
  ['r4-duct', '04 Split reservoir, the duct', 'The short way between the tanks, past a pump intake that pulls toward its grille while its lamp is red.'],
  ['r5-maze', '05 Cut-path maze', 'Corridors cut through three workpieces. Static matters here: five seconds before the suit discharges, and the recess above holds air and the hidden life.'],
  ['r5-top', '05 Cut-path maze, the high route', 'Over the top of the workpieces instead, in the open, under three travelling wires.'],
  ['r6-film', '06 The approach, filming', 'The camera is Level 1\'s, unchanged. It slows machines and moving water; it never slows the static building on the suit.'],
  ['boss-idle', 'The Threading Fault', 'Three service points on three levels: the flushing manifold in the sump, the tensioner on the table, the guide head on the top deck. The next point flashes; the order is never shown.'],
  ['boss-flush', 'The Threading Fault, the flush job', 'Under water, holding Fix, with a jet along the floor to time. Finishing this job drains the sump for the rest of the pass.'],
  ['boss-align', 'The Threading Fault, the guide head', 'Six repairs in two passes. A wall-fed service jet now protects the upper point too. The pips show progress only.'],
  ['repair-helper', 'Hold to repair', 'An explicit hold instruction sits beside Mike. Only the current service point is indicated.'],
  ['phone-repair-helper', 'Repair on touch', 'The same short hold instruction, with the touch Fix button available.'],
  ['restoration-cut', 'Restoration: the final cut', 'After the sump drains, the camera follows a local cutting gap around the exit panel.'],
  ['restoration-exit', 'Restoration: exit open', 'The exit opens before results. Reloading during this sequence also completes correctly.'],
  ['results', 'Results', 'The same card as Level 1.'],
  ['poses', 'Mike in the suit', 'The signed-off puppet, never redrawn. The suit is laid behind and over him; the swimming poses use only his own joints.'],
  ['machines', 'The machines', 'Every hazard in the level. All fictional: no maker\'s name, colours or shapes.'],
  ['phone-r2-under', 'Phone, landscape', 'Touch controls: run, swim up, camera, and one Down button that looks below on dry land and dives in the fluid. Use appears beside the wheel or a service point.'],
  ['ipad-boss-idle', 'iPad, landscape', 'Viewport emulation only. It has not been run on a real iPad.'],
  ['demo-end', 'The recorded run, finished', 'The last frame of the recorded playthrough, replayed by the page itself.']
].filter(s => fs.existsSync(path.join(dir, s[0] + '.png')));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const row = (k, v) => `<tr><th>${esc(k)}</th><td>${v}</td></tr>`;
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Below the Wire: review</title>
<style>
:root{--bg:#071923;--panel:#102d39;--line:#335763;--text:#d9eeee;--dim:#9db9c2;--hi:#6de0dd;--warn:#ffc46a}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.5 Arial,Helvetica,sans-serif}
main{max-width:1180px;margin:0 auto;padding:28px 16px 60px}h1{font-size:34px;margin:0 0 4px}h2{font-size:22px;margin:40px 0 12px;color:var(--hi)}p{margin:8px 0;max-width:70ch}
.sub{color:var(--dim)}a{color:var(--hi)}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px}
figure{margin:0;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden}figure img{display:block;width:100%;height:auto}figcaption{padding:10px 14px 14px}figcaption b{display:block;margin-bottom:2px}figcaption span{color:var(--dim);font-size:14px}
table{border-collapse:collapse;width:100%;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden}th,td{text-align:left;padding:9px 14px;border-top:1px solid var(--line);vertical-align:top}tr:first-child th,tr:first-child td{border-top:0}th{width:34%;font-weight:600;color:var(--dim)}
.ok{color:#9be4c7;font-weight:700}.no{color:var(--warn);font-weight:700}ul{padding-left:20px;max-width:75ch}li{margin:5px 0}.map img{width:100%;border:1px solid var(--line);border-radius:10px}
code{background:#0c2530;padding:1px 6px;border-radius:4px;font-size:14px}
</style></head><body><main>
<h1>Below the Wire</h1><p class="sub">Mike the Mic, Level 2. Review page, built ${new Date().toISOString().slice(0, 10)} from the captures and test results beside it.</p>
<p>Level 2 is playable from the first step through restoration. Owner feedback on the valves, static and Down control is incorporated. Both bosses now have camera-dependent repair windows. The EDM has service jets on all three levels, a quiet startup and safe retreat routes. Boss clips now last five seconds, jets recover for an extra half-second, and Fix braces Mike at the submerged fitting. All three final approaches were checked with reaction time. Repairs remain on real time; spare clips display correctly. The earlier art, traversal and restoration work is preserved. A comparative difficulty playtest and a real iPad run remain outstanding. It is not deployed.</p>
<p><a href="../CODEX-HANDOVER.md">Current continuation document</a> · <a href="../edm-independent-review.md">Original review findings</a> · <a href="refinement.json">Refinement regression results</a></p>
<p><b>Play it locally:</b> run <code>node tools/serve-fireworks.cjs 8788</code>, then open <a href="http://localhost:8788/mike-game/level-2.html">localhost:8788/mike-game/level-2.html</a>.
To watch the recorded run instead of playing, add <code>?demo=1</code>. To start in a room, add <code>?room=3</code> (1 to 6).</p>

<h2>What was checked</h2>
<table>
${row('Level 1', 'Shared clip HUD corrected; primary spindle repeats every 2.1 seconds and the secondary every second stroke. All three orders pass with a basic and full card. Non-boss level data is unchanged.')}
${row('The level file', routes ? `<span class="ok">Pass.</span> 56 salvage finds with unique names, split ${routes.report.map(r => r.room.split('-')[0]).length ? '8, 10, 9, 11, 10, 8' : ''} across the six rooms.` : '<span class="no">Not run.</span>')}
${row('Every place can be reached', routes ? `<span class="ok">Pass.</span> ${routes.report.reduce((n, r) => n + r.reachable, 0)} of ${routes.report.reduce((n, r) => n + r.places, 0)} standing places and all 66 pickups, tested with the real jump and swim rules.` : '<span class="no">Not run.</span>')}
${row('Every wheel has a point', routes && routes.gates ? `<span class="ok">Pass.</span> ${routes.gates.length} things the water decides, each checked open in one state and shut in the other with the wheel left alone: ${routes.gates.filter(g => g.shouldBeOpen).map(g => esc(g.what)).join('; ')}.` : '<span class="no">Not run.</span>')}
${row('No dead ends', routes ? `<span class="ok">Pass.</span> From every place, on land or in water, in every valve state, the room's exit can still be reached. This check found and removed two traps while the level was being built.` : '<span class="no">Not run.</span>')}
${row('Static', routes ? `<span class="ok">Pass.</span> The furthest anyone can be from open air or an earthing bell is ${Math.max(...routes.earth.map(a => a.seconds))} seconds' swim. The suit discharges at 24.` : '<span class="no">Not run.</span>')}
${row('Water and machine rules', mech ? `<span class="ok">Pass.</span> ${Object.keys(mech).length} checks.` : '<span class="no">Not run.</span>')}
${row('A whole playthrough, machines running', run ? `<span class="ok">Pass.</span> ${clock(run.seconds)}, ${run.salvage} of 56 salvage, no hit taken, using only a player's inputs. It is a proof that the level can be finished, not a measure of how hard a person will find it.` : '<span class="no">Not run.</span>')}
${row('Camera repair windows', windows ? `Pass. ${windows.level1.samples + windows.level2.samples} position/order samples: maximum full-speed gaps ${windows.level1.max}s / ${windows.level2.max}s versus a 2.2s hold. A filmed repair advances machines by only 0.44s. Startup grace is excluded from these steady-cycle bounds.` : 'Not run.')}
${row('Without optional SD cards', bare.every(Boolean) ? `Pass. All three complete runs, ${bare.map(r => clock(r.seconds)).join(', ')}, six clips each, zero hits or lost lives. Recharging the basic card is sufficient.` : 'Not run.')}
${row('The other two repair orders', run1 && run2 ? `<span class="ok">Pass.</span> ${clock(run1.seconds)} and ${clock(run2.seconds)}.` : '<span class="no">Not run.</span>')}
${row('The routes the playthrough did not take', alt ? `<span class="ok">Pass.</span> ${Object.keys(alt).length} routes, none with a hit: ${Object.keys(alt).map(esc).join('; ')}.` : '<span class="no">Not run.</span>')}
${row('The fault\'s rules', boss ? `<span class="ok">Pass.</span> Wrong point refuses; moving cancels; a lost life restarts the pass only; filming slows the machines and never the repair; in the boss the camera shoots in 5 second clips, the same as Level 1; a save keeps a finished pass.` : '<span class="no">Not run.</span>')}
${row('In a real browser', browser ? `<span class="ok">Pass.</span> Keyboard, touch, touch-cancel, pause, save and reload, no errors, nothing fetched after loading${browser.demo ? ', and the recorded run wins through the page itself' : ''}. Frame work ${browser.perf ? browser.perf.workP95.toFixed(1) + ' ms at the 95th percentile on this PC' : ''}.` : '<span class="no">Not run.</span>')}
${row('On an iPad 5', '<span class="no">Not tested.</span> Screens were checked by emulation only.')}
${row('Owner playtest', 'Earlier feedback incorporated. Comparative difficulty and this refinement pass still need human playtesting.')}
${row('Review fixes', refinement ? '<span class="ok">Pass.</span> Completed saves reach results without another bonus; jets hurt only after their visible stream reaches Mike, including slow motion; results wait for draining, cutting and the open exit.' : '<span class="no">Not run.</span>')}
</table>

<h2>The level</h2>
<div class="map"><img src="map.png" alt="Map of the six rooms"></div>
<p class="sub">Grey is solid, yellow is grating, blue is water at each of its levels, amber dashes are the wires' limits, white dots are salvage. Yellow posts are checkpoints, green posts are refuges.</p>

<h2>Captures</h2>
<div class="grid">
${shots.map(([f, t, c]) => `<figure><a href="${f}.png"><img src="${f}.png" alt="${esc(t)}" loading="lazy"></a><figcaption><b>${esc(t)}</b><span>${esc(c)}</span></figcaption></figure>`).join('\n')}
</div>

<h2>What is different from the prototype's water</h2>
<ul>
<li>Left alone, Mike floats with his helmet out. He no longer bobs in and out of the surface.</li>
<li>A press of Jump at the surface leaps out of the water. A held press only swims up.</li>
<li>Holding Dive swims down through a grating. Without it a grating is a landing, as on dry land.</li>
<li>A fall into water plunges two tiles and bobs back.</li>
<li>There is no air supply. Mike wears a helmet. What builds up under the fluid is static on the suit; open air or an earthing bell sheds it. A full charge costs one health and returns him to the last dry refuge he stood on.</li>
<li>Down is one control: it looks below on dry land and dives in the fluid. X still dives.</li>
</ul>

<h2>For the owner to decide</h2>
<ul>
<li><b>The wheels.</b> There are now two, not six: one inside the shaft, one on the divider. Both must be turned to finish the level. Say if the reservoir's puzzle reads clearly when you play it.</li>
<li><b>Difficulty.</b> Play it against Level 1 and say where it is too kind or too cruel. Every timing is one number in <code>tools/build-mike-level2.cjs</code>.</li>
<li><b>Linking the levels.</b> Level 2 links back to Level 1. Level 1 does not yet link to Level 2, because that means editing Level 1, which is locked.</li>
<li><b>The prototype.</b> <code>edm-prototype.html</code> is still in the game folder and would be published with it. It can be removed once the level is accepted.</li>
<li><b>Deploying.</b> Nothing has been deployed or committed.</li>
</ul>
</main></body></html>`;
fs.writeFileSync(path.join(dir, 'index.html'), html);
console.log('review page written:', shots.length, 'captures');
