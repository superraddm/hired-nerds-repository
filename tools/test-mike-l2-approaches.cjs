// Human-margin regression: start beside each station, film BEFORE swimming/jumping,
// wait 0.25s to react, travel with ordinary inputs, settle 0.35s, then hold Fix.
// Initial placement isolates the last approach; all hazards remain live. No invulnerability.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { M, E, levelData, place, step, moveTo, play } = require('./mike-l2-lib.cjs');
const L = E.load(levelData()), rows = [];
const jobs = {
  flush: { start:[481,21.8], end:{x:481,y:23.9,via:'swim',tol:.15,tolY:.15} },
  tension: { start:[481,12.6], end:{x:487.5,y:13,tol:.15} },
  align: { start:[489,5], end:{x:495,y:5,tol:.15} }
};
for (const pass of [0,1]) for (const [name,job] of Object.entries(jobs)) {
  let successes = 0, streak = 0, longest = 0, maxSeconds = 0;
  for (let tick=0; tick<300; tick++) {
    const S = E.create(L, null, {variant:0}); S.suit=true;
    S.boss.on=true; S.boss.pass=pass; S.boss.step=E.sequence(S).findIndex((n,i)=>n===name && Math.floor(i/3)===pass);
    S.boss.t=L.boss.warmup+tick/10; S.cam.boss=true;
    place(S,...job.start); S.P.support=L.solids.find(p=>job.start[0]>=p.x && job.start[0]<=p.x+p.w && Math.abs(p.y-job.start[1])<.01);
    if(name==='flush'){ S.wet=true; S.P.ground=false; }
    const initialStep=S.boss.step;
    step(S,1,{camera:true}); step(S,14); // deliberately spend reaction time while filming
    const approach=moveTo(S,job.end);
    let ok=false;
    if(approach && S.health===3){
      play(S,approach.seq); step(S,21); // landing / reading the helper, without Fix
      for(let i=0;i<140 && S.boss.step===initialStep;i++) step(S,1,{fix:true});
      ok=S.boss.step===initialStep+1 && S.health===3 && !S.livesLost && S.cam.t < M.CLIP.length;
      if(ok) maxSeconds=Math.max(maxSeconds,S.cam.t);
    }
    if(ok){ successes++; streak++; longest=Math.max(longest,streak); } else streak=0;
  }
  const row={pass,point:name,successes,samples:300,startWindowSeconds:+(longest/10).toFixed(1),maxClipUsed:+maxSeconds.toFixed(2),reactionAndSettle:.6}; rows.push(row);
  console.log(row);
  assert.ok(longest>=5, name+' pass '+pass+': at least half a second of forgiving launch timing');
  assert.ok(maxSeconds<5, 'approach, hesitation and repair fit in one clip');
}
fs.writeFileSync(path.resolve(__dirname,'../docs/mike-platformer/l2-look/approaches.json'),JSON.stringify(rows,null,2));
