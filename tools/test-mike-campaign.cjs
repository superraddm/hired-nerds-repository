// The campaign rules in both pages (owner, 30 Sept): the last life restarts the level with a continue or the game without; a
// finished level awards one continue; Level 2 ends with Play again only. Also captures both boss strips. Isolated headless Chrome, port 9353.
// Needs node tools/serve-fireworks.cjs 8788.
const { spawn } = require('child_process'), path = require('path'), fs = require('fs'), assert = require('node:assert/strict');
const OUT = 'C:/hirednerds-portfolio/docs/mike-platformer/l2-look';
const PORT = 9353, chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${path.resolve('C:/hirednerds-portfolio/.wrangler/mike-url-check')}`, '--no-first-run', '--window-size=960,540', 'about:blank'], { stdio:'ignore', windowsHide:true });
const sleep = ms => new Promise(r => setTimeout(r, ms)); let ws;
(async () => {
  let tabs; for (let i = 0; i < 60; i++){ try { tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (tabs.length) break; } catch {} await sleep(150); }
  ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let next = 0; const pending = new Map(), errors = [];
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && pending.has(d.id)){ pending.get(d.id)(d); pending.delete(d.id); } if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text); if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push(d.params.args.map(x => x.value || x.description).join(' ')); };
  const send = (method, params = {}) => new Promise(r => { const id = ++next; pending.set(id, d => r(d.result)); ws.send(JSON.stringify({ id, method, params })); });
  const ev = async expression => { const r = await send('Runtime.evaluate', { expression, returnByValue:true, awaitPromise:true }); if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
  await send('Runtime.enable'); await send('Page.enable'); await send('Emulation.setDeviceMetricsOverride', { width:960, height:540, deviceScaleFactor:1, mobile:false });
  const open = async url => { await send('Page.navigate', { url }); for (let i = 0; i < 200; i++){ await sleep(100); if (await ev('document.body && document.body.dataset.ready') === '1') return; } throw Error('boot failed ' + url); };
  const shot = async name => { const d = await send('Page.captureScreenshot'); fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(d.data, 'base64')); };
  const out = {};
  // ---- Level 1
  await open('http://localhost:8788/mike-game/?test=1');
  await ev(`localStorage.setItem('mike-game.campaign.v1', JSON.stringify({ continues:1, cleared:[] })); __mike.clearSave(); __mike.reset('full'); __mike.G.lives = 1; __mike.place(46, 12); __mike.step(150)`);
  let s = await ev('JSON.stringify({ x:__mike.snapshot().x, lives:__mike.snapshot().lives, mode:__mike.snapshot().mode, cont:__mike.snapshot().continues, left:window.MIKE.campaign.continues, save:!!localStorage.getItem("mike-game.v3.save") })');
  out.l1Continue = JSON.parse(s); assert.equal(out.l1Continue.lives, 3); assert.ok(out.l1Continue.x < 3, 'Level 1 starts again from the beginning'); assert.equal(out.l1Continue.left, 0);
  await ev(`__mike.G.lives = 1; __mike.place(46, 12); __mike.step(150)`);
  s = await ev('JSON.stringify({ mode:__mike.G.mode, save:!!localStorage.getItem("mike-game.v3.save"), camp:JSON.parse(localStorage.getItem("mike-game.campaign.v1")) })');
  out.l1GameOver = JSON.parse(s); assert.equal(out.l1GameOver.mode, 'title'); assert.equal(out.l1GameOver.save, false);
  // the boss strip, Level 1
  await ev(`__mike.reset('full'); __mike.G.lives = 3; __mike.place(938, 12); __mike.step(120)`); await shot('l1-boss-strip');
  // finishing Level 1 awards a continue
  await ev(`localStorage.removeItem('mike-game.campaign.v1')`); const w = await ev('(() => { __mike.reset("full"); const r = __mike.runDemo(); return JSON.stringify({ won:r.won, camp:JSON.parse(localStorage.getItem("mike-game.campaign.v1")), continueButton:getComputedStyle(document.getElementById("res-continue")).display }); })()');
  out.l1Win = JSON.parse(w); assert.ok(out.l1Win.won); assert.equal(out.l1Win.camp.continues, 1); assert.ok(out.l1Win.camp.cleared.includes('level-1')); assert.ok(out.l1Win.camp.scores['level-1'] > 0, 'Level 1\'s score is kept for the campaign total');
  // ---- Level 2
  await open('http://localhost:8788/mike-game/level-2.html?test=1');
  await ev(`localStorage.setItem('mike-game.campaign.v1', JSON.stringify({ continues:1, cleared:['level-1'] })); __l2.clearSave(); __l2.reset(); __l2.place(250, 12); __l2.step(2, {}); __l2.S.lives = 0; __l2.S.dead = .01; __l2.step(5, {})`);
  s = await ev('JSON.stringify({ x:__l2.snapshot().x, lives:__l2.snapshot().lives, mode:__l2.snapshot().mode, left:window.MIKE.campaign.continues, save:!!localStorage.getItem("mike-game.l2.v1.save") })');
  out.l2Continue = JSON.parse(s); assert.equal(out.l2Continue.lives, 3); assert.ok(out.l2Continue.x < 4, 'Level 2 starts again from the beginning'); assert.equal(out.l2Continue.left, 0);
  await ev(`__l2.S.lives = 0; __l2.S.dead = .01; __l2.step(5, {})`); await sleep(1500);
  out.l2GameOver = { url:await ev('location.pathname'), camp:JSON.parse(await ev('localStorage.getItem("mike-game.campaign.v1")')) };
  assert.ok(!/level-2/.test(out.l2GameOver.url), 'no continues: back to Level 1'); assert.equal(out.l2GameOver.camp.continues, 0);
  assert.deepEqual(out.l2GameOver.camp.cleared, [], 'restart means restart: Level 1 is no longer cleared, so Level 2 is locked again'); assert.deepEqual(out.l2GameOver.camp.scores, {});
  // the boss strip, Level 2, and the results buttons
  await open('http://localhost:8788/mike-game/level-2.html?scene=boss-flush&test=1'); await sleep(150); await shot('boss-flush');
  await open('http://localhost:8788/mike-game/level-2.html?scene=results&test=1'); await sleep(150);
  out.l2Results = await ev(`Array.from(document.querySelectorAll('#menu button')).filter(b => getComputedStyle(b).display !== 'none').map(b => b.textContent)`);
  assert.deepEqual(out.l2Results, ['Play again']); await shot('results');
  out.errors = errors; assert.deepEqual(errors, []);
  console.log(JSON.stringify(out, null, 1));
  await send('Browser.close'); ws.close(); chrome.kill();
})().catch(e => { console.error(e); if (ws) ws.close(); chrome.kill(); process.exitCode = 1; });
