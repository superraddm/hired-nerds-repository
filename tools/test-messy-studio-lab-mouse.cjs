// Desktop (mouse): click-and-drag moves and flicks a marble; choosing another tool freezes them; tools are never locked.
// Needs the preview server on 8788 (node tools/serve-fireworks.cjs 8788). Screenshot goes to LAB_OUT or the system temp folder.
const { spawn } = require('child_process'), path = require('path'), fs = require('fs'), OUT = process.env.LAB_OUT || require('os').tmpdir();
const assert = require('node:assert/strict');
const PORT = 9335, chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${path.join(OUT, 'prof-mouse')}`, '--no-first-run', '--window-size=1100,760', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  let l; for (let i = 0; i < 40; i++){ try { l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (l.length) break; } catch(e){} await sleep(250); }
  const ws = new WebSocket(l.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const wait = new Map(), errors = [];
  ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && wait.has(d.id)){ wait.get(d.id)(d); wait.delete(d.id); } if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text); };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async x => (await send('Runtime.evaluate', { expression: x, returnByValue: true })).result?.result?.value;
  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.navigate', { url: 'http://localhost:8788/little-patterns/studio-lab.html?lab=1&seed=5' }); await sleep(800);
  const mouse = (type, x, y, buttons = 0) => send('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' ? 'none' : 'left', buttons, clickCount: 1, pointerType: 'mouse' });
  const clickSel = async sel => { const p = await ev(`(()=>{const r=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()`); await mouse('mousePressed', p.x, p.y, 1); await mouse('mouseReleased', p.x, p.y, 0); await sleep(100); };
  const where = () => ev('JSON.stringify(window.__lab.M.list.map(m=>[Math.round(m.x),Math.round(m.y)]))');
  await clickSel('#test'); await clickSel('[data-tool="marbles"]'); await clickSel('[data-tool="marbles"]');
  const out = {}; out.start = await where();
  const m0 = JSON.parse(out.start)[0], at = JSON.parse(await ev(`JSON.stringify({p:window.__lab.toScreen(${m0[0]},${m0[1]}),g:window.__lab.GEO})`));
  const sx = at.p.x, sy = at.p.y, dx = sx > at.g.cx ? -1 : 1, dy = sy > at.g.cy ? -1 : 1;
  await mouse('mouseMoved', sx, sy); await sleep(50); out.cursorOverMarble = await ev('document.querySelector("#paint").style.cursor');
  await mouse('mousePressed', sx, sy, 1); await sleep(30); out.cursorWhileHeld = await ev('document.querySelector("#paint").style.cursor');
  for (let i = 1; i <= 20; i++){ await mouse('mouseMoved', sx + dx * i * 12, sy + dy * i * 6, 1); await sleep(16); }
  await mouse('mouseReleased', sx + dx * 240, sy + dy * 120, 0); await sleep(300); out.afterDrag = await where();
  await clickSel('[data-tool="brush"]'); out.toolsNeverLocked = await ev(`[...document.querySelectorAll('[data-tool]')].every(b=>!b.disabled)`); out.toolAfterClickingBrush = await ev('window.__lab.S.tool');
  const f0 = await where(); await sleep(500); out.frozenByBrush = f0 === await where();
  fs.writeFileSync(path.join(OUT, 'lab-mouse.png'), Buffer.from((await send('Page.captureScreenshot')).result.data, 'base64'));
  await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: at.g.cx, y: at.g.cy, deltaX: 0, deltaY: -300 }); await sleep(100); out.zoomAfterWheel = await ev('window.__lab.VIEW.z');
  out.errors = errors; console.log(JSON.stringify(out, null, 1));
  assert.deepEqual(errors,[]);assert.equal(out.cursorOverMarble,'grab');assert.equal(out.cursorWhileHeld,'grabbing');assert.notEqual(out.start,out.afterDrag);assert.equal(out.toolsNeverLocked,true);assert.equal(out.toolAfterClickingBrush,'brush');assert.equal(out.frozenByBrush,true);assert.ok(out.zoomAfterWheel>1);
  ws.close(); chrome.kill(); process.exit(0);
})().catch(e=>{console.error(e);chrome.kill();process.exit(1);});
