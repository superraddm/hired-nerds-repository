// CDP harness for the home-made stamps in little-patterns/studio-lab.html: draw with touch in the maker, save, print, reload, and the four-stamp limit.
// Needs the preview server on 8788 (node tools/serve-fireworks.cjs 8788). Usage: node tools/test-studio-my-stamps.cjs [768x954]
const { spawn } = require('child_process'), fs = require('fs'), path = require('path'), assert = require('node:assert/strict');
const SP = process.env.LAB_OUT || require('os').tmpdir(), PORT = 9347, [W, H] = (process.argv[2] || '768x954').split('x').map(Number);
const profile = path.join(SP, 'prof-my-stamps-' + Date.now());
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, '--no-first-run', '--window-size=' + W + ',' + H, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  let failed = null; const errors = [];
  try {
    let list; for (let i = 0; i < 40; i++){ try { list = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json(); if (list.length) break; } catch (e) {} await sleep(250); }
    const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
    let id = 0; const wait = new Map();
    ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && wait.has(d.id)){ wait.get(d.id)(d); wait.delete(d.id); }
      if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
      if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push(d.params.args.map(a => a.value).join(' ')); };
    const send = (method, params = {}) => new Promise(r => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const ev = async x => { const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); if (r.result?.exceptionDetails) throw Error(JSON.stringify(r.result.exceptionDetails).slice(0, 500)); return r.result.result.value; };
    const box = async sel => JSON.parse(await ev('(()=>{const r=document.querySelector(' + JSON.stringify(sel) + ').getBoundingClientRect();return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2,w:r.width})})()'));
    const touch = (type, pts) => send('Input.dispatchTouchEvent', { type, touchPoints: pts });
    const tap = async sel => { const p = await box(sel); await touch('touchStart', [{ x: p.x, y: p.y }]); await touch('touchEnd', []); await sleep(200); };
    const draw = async pts => { await touch('touchStart', [pts[0]]); for (const p of pts.slice(1)){ await touch('touchMove', [p]); await sleep(5); } await touch('touchEnd', []); await sleep(90); };
    const url = 'http://localhost:8788/little-patterns/studio-lab.html?lab=1&seed=5';
    await send('Runtime.enable'); await send('Page.enable'); await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }); await send('Page.navigate', { url }); await sleep(1200);
    await tap('[data-tool="stamp"]');
    assert.equal(await ev('document.getElementById("mine-ui").hidden'), true, 'the drawer starts shut'); await tap('#mine-open');
    assert.equal(await ev('document.getElementById("stamp-ui").hidden && !document.getElementById("mine-ui").hidden'), true, 'the drawer replaces the library row');
    assert.equal(await ev('document.querySelectorAll("#mine-ui [data-stamp]").length'), 0); await tap('#mine-new');
    assert.equal(await ev('document.getElementById("maker").hidden'), false, 'Create opens the full-size sheet');
    assert.equal(await ev('document.getElementById("maker-save").disabled'), true, 'nothing to save yet');
    const c = await box('#maker-canvas'), ring = (ox, oy, rad, part = 1) => Array.from({ length: 41 }, (_, i) => ({ x: c.x + ox * c.w + Math.cos(i / 40 * 2 * Math.PI * part) * rad * c.w, y: c.y + oy * c.w + Math.sin(i / 40 * 2 * Math.PI * part) * rad * c.w }));
    const ops = async () => JSON.parse(await ev('JSON.stringify(__lab.MINE.ops.map(o=>(o.cut?"-":"+")+o.t))'));
    // Two pens. Draw: a line that comes back to its start becomes a solid; any other line prints as the line it is; a tap is a dot.
    assert.equal(await ev('document.querySelectorAll("[data-pen]").length'), 2, 'two pens only');
    // Two fingers zoom and carry the sheet and leave no mark; the pen keeps its size under the finger, so a line drawn at 2x is half as thick at 1x.
    const P2 = (id, x, y) => ({ id, x, y }); await touch('touchStart', [P2(1, c.x - 30, c.y)]); await sleep(40); await touch('touchStart', [P2(1, c.x - 30, c.y), P2(2, c.x + 30, c.y)]);
    for (let i = 1; i <= 12; i++){ await touch('touchMove', [P2(1, c.x - 30 - i * 6, c.y), P2(2, c.x + 30 + i * 6, c.y)]); await sleep(12); } await touch('touchEnd', []); await sleep(150);
    const zoom = await ev('__lab.MV.z'); assert.ok(zoom > 2 && zoom <= 6, 'a pinch zooms in (' + zoom + ')'); assert.deepEqual(await ops(), [], 'and draws nothing');
    assert.equal(await ev('document.getElementById("maker-fit").hidden'), false, 'the show-everything button appears while zoomed');
    await draw([{ x: c.x - c.w * .2, y: c.y }, { x: c.x, y: c.y + 4 }, { x: c.x + c.w * .2, y: c.y }]);
    const fine = JSON.parse(await ev('JSON.stringify(__lab.MINE.ops[0])')); assert.ok(Math.abs(fine.w - 1 / zoom) < .01, 'the mark is thinner by the zoom it was drawn at');
    assert.ok(Math.abs(fine.pts[fine.pts.length - 1][0] - fine.pts[0][0] - 40 / zoom) < 1.5, 'and lands where the finger was on the zoomed sheet');
    await tap('#maker-fit'); assert.equal(await ev('__lab.MV.z'), 1); await tap('#maker-clear');
    await draw(ring(0, 0, .25, .6));                                   // an open arc: the ends do not meet, so it stays a line
    await draw([{ x: c.x, y: c.y + c.w * .4 }, { x: c.x + 1, y: c.y + c.w * .4 }]);   // a tap: a dot
    assert.deepEqual(await ops(), ['+line', '+line']); assert.equal(await ev('__lab.MINE.ops[1].pts.length'), 1, 'a tap is kept as a dot');
    assert.equal(await ev('(()=>{const k=document.getElementById(\"maker-canvas\"),x=k.getContext(\"2d\");return x.getImageData(k.width/2,k.height/2,1,1).data[3]})()'), 0, 'an open line is never joined up or filled');
    await tap('#maker-clear'); assert.deepEqual(await ops(), []); assert.equal(await ev('document.getElementById("maker-save").disabled'), true);
    await draw(ring(0, 0, .3, .97));                                   // ends within reach of each other: a solid
    assert.ok(await ev('(()=>{const k=document.getElementById(\"maker-canvas\"),x=k.getContext(\"2d\");return x.getImageData(k.width/2,k.height/2,1,1).data[3]})()') > 200, 'a line that comes back to its start fills');
    // Remove works by the same rule: a loop cuts a hole, a line rubs a line out.
    await tap('[data-pen="cut"]'); await draw(ring(0, 0, .08));
    assert.equal(await ev('(()=>{const k=document.getElementById(\"maker-canvas\"),x=k.getContext(\"2d\");return x.getImageData(k.width/2,k.height/2,1,1).data[3]})()'), 0, 'a removed loop shows the paper through the solid');
    await draw([{ x: c.x - c.w * .2, y: c.y + c.w * .15 }, { x: c.x + c.w * .2, y: c.y + c.w * .15 }]);
    await tap('[data-pen="draw"]'); await draw(ring(.4, .4, .05));   // a separate small solid: several pieces make one stamp
    assert.deepEqual(await ops(), ['+shape', '-shape', '-line', '+shape']);
    await tap('#maker-undo'); assert.equal((await ops()).length, 3, 'the undo button takes back the last mark'); await draw(ring(.4, .4, .05));
    await tap('#maker-save');
    const saved = JSON.parse(await ev('JSON.stringify({maker:document.getElementById("maker").hidden,tool:__lab.S.tool,stamp:__lab.S.stamp,pressed:document.querySelector("#mine-ui [aria-pressed=true]")?.dataset.stamp,drawer:!document.getElementById("mine-ui").hidden,stored:JSON.parse(localStorage.getItem("nook-studio-my-stamps"))})'));
    assert.equal(saved.maker, true, 'Save closes the maker'); assert.equal(saved.tool, 'stamp'); assert.equal(saved.pressed, saved.stamp, 'the new stamp is the chosen one'); assert.equal(saved.drawer, true); assert.equal(saved.stored.length, 1);
    assert.deepEqual(saved.stored[0].ops.map(o => o.t + (o.cut ? '-' : '+')), ['shape+', 'shape-', 'line-', 'shape+'], 'marks are stored in the order they were made, cuts included');
    const all = saved.stored[0].ops.filter(o => !o.cut).map(o => o.pts).flat(), xs = all.map(p => p[0]), ys = all.map(p => p[1]);
    assert.ok(Math.min(...xs, ...ys) >= 3.9 && Math.max(...xs, ...ys) <= 96.1 && Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) > 91, 'the drawing is scaled to fill the stamp box');
    const before = await ev('__lab.inked()'), paper = await box('#paint'); await touch('touchStart', [{ x: paper.x, y: paper.y }]); await touch('touchEnd', []); await sleep(250);
    assert.ok(await ev('__lab.inked()') > before, 'the home-made stamp prints');
    await send('Page.navigate', { url }); await sleep(1200); await tap('[data-tool="stamp"]'); await tap('#mine-open');
    assert.equal(await ev('document.querySelectorAll("#mine-ui [data-stamp]").length'), 1, 'the stamp is still there after a reload');
        // a stamp saved by the first version (closed polygons only) still loads, as a filled shape
    await ev('localStorage.setItem("nook-studio-my-stamps", JSON.stringify([{id:"my-old1",polys:[[[10,10],[90,10],[50,90]]]}].concat(JSON.parse(localStorage.getItem("nook-studio-my-stamps")))))'); await send('Page.navigate', { url }); await sleep(1200);
    assert.deepEqual(JSON.parse(await ev('JSON.stringify(__lab.MINE.list.map(s=>s.ops[0].t))')), ['shape', 'shape'], 'an old polygon stamp is read as a filled shape'); await ev('__lab.setTool("stamp")');
    for (let n = 0; n < 4; n++){ await ev('(()=>{__lab.makerOpen();__lab.makerMark([[20,20],[80,25+' + n + '*10],[50,80]],"shape");return __lab.makerSave()})()'); await sleep(30); }
    const five = JSON.parse(await ev('JSON.stringify({ids:__lab.MINE.list.map(s=>s.id),table:Object.keys(__lab.STAMPS).filter(k=>k.startsWith("my-")).length,buttons:document.querySelectorAll("#mine-ui [data-stamp]").length,stored:JSON.parse(localStorage.getItem("nook-studio-my-stamps")).length})'));
    assert.equal(five.ids.length, 4); assert.ok(!five.ids.includes(saved.stamp) && !five.ids.includes('my-old1'), 'new stamps replaced the oldest ones'); assert.equal(five.table, 4); assert.equal(five.buttons, 4); assert.equal(five.stored, 4);
    const requests = JSON.parse(await ev('JSON.stringify(performance.getEntriesByType("resource").map(r=>r.name).filter(n=>!n.startsWith(location.origin)))'));
    assert.deepEqual(requests, [], 'nothing leaves this origin');
    assert.deepEqual(errors, [], 'no page errors'); ws.close();
    console.log('my stamps: all checks passed at ' + W + 'x' + H);
  } catch (e) { failed = e; console.error('FAILED', e.message, errors); }
  chrome.kill(); await sleep(300); try { fs.rmSync(profile, { recursive: true, force: true }); } catch (_) {}
  process.exit(failed ? 1 : 0);
})();
