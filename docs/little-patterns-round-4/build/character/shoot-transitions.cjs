// Capture NookArt.change() transitions from sheet.html with CSS animations slowed 10x, and lay the frames out as
// one PNG (change-frames.png): each row is one change, read left to right.
// usage: node docs/little-patterns-round-4/build/character/shoot-transitions.cjs [outDir]
// The 90 ms face swap is a JS timer and is not slowed, so the new face shows from the second frame on.
const { spawn } = require('node:child_process');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9396;
const out = path.resolve(process.argv[2] || __dirname);
const SHEET = 'file:///' + path.join(__dirname, 'sheet.html').replace(/\\/g, '/');
const CHANGES = [['greet', 'excited'], ['calm', 'worried'], ['calm', 'sad'], ['happy', 'proud'], ['sad', 'calm']];
const AT = [0, 300, 900, 1500, 2200, 3000, 6000];        // wall-clock ms after the change, at 0.1x playback
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'nook-frames-'));
(async () => {
  const chrome = spawn(CHROME, ['--headless=new', '--hide-scrollbars', '--no-first-run', '--allow-file-access-from-files', '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
  const wait = ms => new Promise(r => setTimeout(r, ms));
  try {
    let tabs; for (let i = 0; i < 40; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (tabs.length) break; } catch (_) {} await wait(250); }
    const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
    let id = 0; const pending = new Map();
    ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
    const send = (method, params = {}) => new Promise(res => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
    const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result.result.value;
    await send('Page.enable'); await send('Animation.enable');
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 1400, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: SHEET });
    await wait(800);
    await ev(`(() => { document.querySelector('.stage').scrollIntoView(); document.querySelector('.stage svg.nook').style.animation = 'none'; return 1; })()`);
    const box = `JSON.stringify((() => { const b = document.querySelector('.stage').getBoundingClientRect(); return { x: b.x + scrollX, y: b.y + scrollY, width: b.width, height: b.height }; })())`;
    const rows = [];
    for (const [from, to] of CHANGES) {
      await ev(`(() => { NookArt.change(document.querySelector('.stage svg.nook'), '${from}'); return 1; })()`);
      await wait(1500);
      await send('Animation.setPlaybackRate', { playbackRate: 0.1 });
      await ev(`(() => { NookArt.change(document.querySelector('.stage svg.nook'), '${to}'); return 1; })()`);
      const t0 = Date.now(), row = [];
      for (const at of AT) {
        while (Date.now() - t0 < at) await wait(10);
        const r = JSON.parse(await ev(box));
        const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: r.x, y: r.y, width: r.width, height: r.height, scale: 0.5 } });
        row.push(shot.result.data);
      }
      rows.push([from + ' to ' + to, row]);
      await send('Animation.setPlaybackRate', { playbackRate: 1 });
      await wait(800);
    }
    // lay the frames out on one page and capture it
    const html = '<!doctype html><body style="margin:0;background:#fff;font:600 14px system-ui;color:#2b2f55">' + rows.map(([label, row]) =>
      '<div style="display:flex;align-items:center;gap:4px;padding:2px 6px"><div style="width:120px">' + label + '</div>' + row.map(b => '<img src="data:image/png;base64,' + b + '" style="width:165px;height:198px">').join('') + '</div>').join('') + '</body>';
    await send('Emulation.setDeviceMetricsOverride', { width: 1320, height: 1060, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: 'data:text/html;base64,' + Buffer.from(html).toString('base64') });
    await wait(600);
    const size = JSON.parse(await ev('JSON.stringify([document.body.scrollWidth, document.body.scrollHeight])'));
    const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: size[0], height: size[1], scale: 1 } });
    fs.writeFileSync(path.join(out, 'change-frames.png'), Buffer.from(shot.result.data, 'base64'));
    console.log('change-frames.png', size.join('x'), rows.length + ' changes x ' + AT.length + ' frames');
    ws.close();
  } finally {
    chrome.kill(); await wait(300);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (_) {}
  }
})();
