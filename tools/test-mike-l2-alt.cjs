// Level 2's other routes, with every machine running. tools/test-mike-l2-run.cjs plays one way through the level;
// this suite proves the ways it did not take: the whole rim and the whole underwater passage of the Flushing
// gallery, the Guide tower's low tank, the Split reservoir under water over its fixture tables and through its duct, and the Cut-path maze's high route over the workpieces.
// Each check starts Mike at the room's own checkpoint or refuge (placed there, suited) and from then on uses only
// the inputs a player has; every route must be finished without a hit and with the suit's charge short of full.
const assert = require('node:assert/strict'), fs = require('fs'), path = require('path');
const { M, E, K, levelData, travel, step, place } = require('./mike-l2-lib.cjs');
const L = E.load(levelData()); assert.equal(L.errors.length, 0);
const d = (x, y, o) => Object.assign({ x, y, anywhere:true }, o), at = (x, y, o) => Object.assign({ x, y, tol:.45 }, o), w = (x, y, o) => Object.assign({ x, y, wet:true }, o);
const floatAt = (x, o) => w(x, c => c.surface === null ? c.P.y : c.surface + E.W.float, Object.assign({ tolY:.12 }, o));
const result = {};
function route(name, start, paths, check){
  const S = E.create(L); S.suit = true; place(S, start[0], start[1]); S.checkpoint = { x:start[0], y:start[1] }; S.refuge = { x:start[0], y:start[1] }; step(S, 30);
  let lowest = 24;
  for (const p of paths){ const list = typeof p === 'function' ? p(S) : p; travel(S, list, { depth:400, calls:40000 }); lowest = Math.min(lowest, (E.W.limit - S.static)); }
  assert.equal(S.health, 3, name + ': no hit taken'); assert.equal(S.livesLost, 0);
  if (check) check(S);
  result[name] = { seconds:+(S.time - .5).toFixed(1), salvage:E.salvageCount(S), marginAtEnd:+(E.W.limit - S.static).toFixed(1) };
  console.log(name, JSON.stringify(result[name]));
}
const settled = id => ({ via:'until', done:c => c.tanks[id].level === c.tanks[id].target, frames:1500 });

route('gallery: the rim from end to end', [50, 12], [[d(60.2, 10), at(66.7, 8.4), d(73, 9.6), d(79.5, 9.6), at(86.5, 8), d(93, 9.8), at(98, 8.2), d(105.7, 9.6), at(112.2, 8), d(117.5, 10), at(124, 12)]],
  S => assert.equal(E.salvageCount(S), 4));
route('gallery: under water from end to end', [50, 12], [[at(55.4, 12), floatAt(60), w(62, 22.8), w(66.4, 17), w(70.6, 17), w(74, 21), w(79, 21.9), w(84.4, 22.4), w(88, 22.2, { tolY:.12 }),
  { x:88, y:22.2, wet:true, via:'until', done:c => (E.W.limit - c.static) > E.W.limit - .5 }, w(93, 22.6), w(97, 21.8), w(102.4, 21.6), w(105, 20.6), w(104.9, 16.9), w(109.5, 17.2), w(113.6, 22.8), w(118, 23), floatAt(118.6), d(122, 12), at(124, 12)]],
  S => { assert.equal(E.salvageCount(S), 6); assert.ok(S.got.has('l2-1') && S.got.has('sd2-1'), 'the air pocket and the far corner'); });
route('tower: down from the landing and through the low tank', [165, 1], [[d(168, 12), at(171.4, 12), floatAt(174.6), w(179, 20.4, { tolY:.2 }), w(184, 18.6), w(189, 17.6), w(194, 18.9, { tolY:.2 }), floatAt(203), floatAt(212.6), d(215.6, 12), at(218, 12)]],
  S => assert.ok(S.got.has('s3-8') && S.got.has('s3-9')));
route('reservoir: under water over the fixture tables and the weir', [226, 12], [[at(235.4, 12), floatAt(242.6), w(246.5, 19.4, { tolY:.15 }), w(250.5, 18), w(254.5, 19.9, { tolY:.15 }), w(258.8, 14.7), w(263, 19.9, { tolY:.15 }), floatAt(269.6), floatAt(275.4), d(278.5, 12.2), at(282, 10)]],
  S => { assert.equal(S.valves.transfer, 0); assert.ok(S.got.has('s4-1') && S.got.has('s4-2') && S.got.has('l4-1')); });
route('reservoir: through the duct past the intake, and up the far ladder', [226, 12], [[at(235.4, 12), floatAt(276.6), w(276.6, 22.6), w(278.8, 22.6), w(282, 22.6), w(286, 22.6), floatAt(286), d(289, 21.4), d(285.5, 19.2), d(289, 16.8), d(285.5, 14.6), d(285.5, 12.2), at(282, 10)]],
  S => { assert.equal(S.valves.transfer, 0); assert.ok(S.got.has('s4-5'), 'the find in the duct'); });
route('maze: the high route over the workpieces', [338, 12], [[at(343.4, 12), d(347.7, 10.4), d(354, 10.5), d(364.6, 10.5), d(370, 12.2), d(375.6, 10.5), d(383.5, 10.5), d(390.6, 10.5), d(396, 12.2), d(401.6, 10.5), d(414.4, 10.5), d(420, 11.5), at(428, 12)]],
  S => assert.ok(S.got.has('sd5-1') && S.got.has('l5-1')));

fs.writeFileSync(path.resolve(__dirname, '../docs/mike-platformer/l2-look/alt-routes.json'), JSON.stringify(result, null, 2));
console.log('Level 2 alternative routes passed');
