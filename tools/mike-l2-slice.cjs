// The bounded mechanics slice the Level 2 rules are measured on: two tanks joined by a duct, one transfer valve.
const slice = { id:'l2-slice', size:[96, 28], spawn:[3, 12], checkpoints:[[3, 12]], collection:{ total:2 }, sections:[{ id:'slice', title:'Transfer slice', x:0, width:96, salvage:2,
  solids:[[0, 12, 16, 16], [15, -10, .9, 16.5], [16, 24, 60, 4], [76, 12, 20, 16]],
  fixtures:[[44, 10, 4, 10, 'wall'], [24, 15, 8, 1.5, 'table']],
  platforms:[[41, 12, 3, .4], [48, 12, 3, .4], [16, 21.5, 3, .4], [19.5, 19, 3, .4], [16, 16.5, 3, .4], [19.5, 14, 3, .4],
    [73, 21.5, 3, .4], [69.5, 19, 3, .4], [73, 16.5, 3, .4], [69.5, 14, 3, .4], [37.5, 21.5, 3, .4], [41, 19, 3, .4], [37.5, 16.5, 3, .4], [41, 14.2, 3, .4],
    [51.5, 21.5, 3, .4], [48, 19, 3, .4], [51.5, 16.5, 3, .4], [48, 14.2, 3, .4]],
  tanks:[{ id:'A', at:[16, 46], floor:24, levels:{ low:21, high:13 }, start:'high', pockets:[[24.5, 16.5, 7, 1.2]] }, { id:'B', at:[46, 76], floor:24, levels:{ low:21, high:13 }, start:'low' }],
  valves:[{ id:'xfer', wheels:[[12, 10.5], [46, 8.5], [80, 10.5]], states:[{ A:'high', B:'low' }, { A:'low', B:'high' }] }],
  nozzles:[{ id:'n1', at:[32, 24], dir:[0, -1], reach:6, cycle:4, tell:.8, active:1.4 }],
  intakes:[{ id:'i1', at:[48.2, 22], zone:[48, 18, 9, 6], cycle:5, tell:.8, active:1.6, pull:3 }],
  wires:[{ id:'w1', axis:'v', from:[58, 0], to:[66, 0], span:[6, 23.5], period:12, cycle:8, tell:1, active:2.6 }],
  doors:[{ id:'airlock', at:[15, 6.5], h:5.5, opens:'suit' }],
  suit:[8, 12], refuges:[[80, 12]],
  pickups:[{ id:'s1', type:'bearing', at:[28, 22] }, { id:'s2', type:'seal', at:[60, 22] }] }] };
module.exports = slice;
