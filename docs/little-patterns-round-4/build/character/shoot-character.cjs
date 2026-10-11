// Render the Nook rig acceptance PNGs from sheet.html with headless Chrome over CDP (Node 22: fetch + WebSocket).
// usage: node docs/little-patterns-round-4/build/character/shoot-character.cjs [outDir]
const { spawn } = require('node:child_process');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9391;
const here = __dirname;
const out = path.resolve(process.argv[2] || here);
const SHEET = 'file:///' + path.join(here, 'sheet.html').replace(/\\/g, '/');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'nook-shoot-'));
// [file, section id, element to capture, viewport width, device pixel ratio]
const SHOTS = [
  ['overlay-hello.png', 'overlay', '#overlay-box', 600, 1],
  ['faces.png', 'faces', '#faces .shot', 1000, 2],
  ['faces-happy-side.png', 'happy-side', '#happy-side .shot', 600, 2],
  ['bodies-132.png', 'bodies-132', '#bodies-132 .shot', 1500, 2],
  ['bodies-large.png', 'bodies-large', '#bodies-large .shot', 3000, 1],
  ['rig-hello-560.png', 'solo', '#solo-box', 600, 1]          // transparent: compare-overlay.py measures it
];
fs.mkdirSync(out, { recursive: true });
(async () => {
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--allow-file-access-from-files', '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
  const wait = ms => new Promise(r => setTimeout(r, ms));
  try {
    let tabs; for (let i = 0; i < 40; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (tabs.length) break; } catch (_) {} await wait(250); }
    const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
    let id = 0; const pending = new Map();
    ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
    const send = (method, params = {}) => new Promise(res => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
    const evaluate = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result.result.value;
    await send('Page.enable');
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    for (const [file, section, selector, width, dpr] of SHOTS) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: dpr, mobile: false });
      await send('Emulation.setDefaultBackgroundColorOverride', section === 'solo' ? { color: { r: 0, g: 0, b: 0, a: 0 } } : {});
      await send('Page.navigate', { url: SHEET + '?shot=' + section });
      await wait(700);
      const errors = await evaluate('document.querySelectorAll("svg.nook,svg.nook-face").length');
      const r = JSON.parse(await evaluate(`JSON.stringify(document.querySelector('${selector}').getBoundingClientRect())`));
      const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: r.x, y: r.y, width: r.width, height: r.height, scale: 1 } });
      fs.writeFileSync(path.join(out, file), Buffer.from(shot.result.data, 'base64'));
      if (section === 'bodies-large') {
        // nothing may fall outside the 560x672 frame in any pose (visible shapes only)
        const clipped = await evaluate(`JSON.stringify(Array.from(document.querySelectorAll('#bodies-large svg.nook')).map(s => {
          const b = s.getBoundingClientRect(); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
          for (const p of s.querySelectorAll('path, circle')) { if (p.closest('[style*="opacity:0"], [style*="opacity: 0"]')) continue; const r = p.getBoundingClientRect(); if (!r.width) continue; x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); }
          const k = 560 / b.width; return [s.dataset.feeling, Math.round((x0 - b.left) * k), Math.round((y0 - b.top) * k), Math.round((x1 - b.left) * k), Math.round((y1 - b.top) * k)];
        }))`);
        for (const [f, x0, y0, x1, y1] of JSON.parse(clipped)) console.log('  extent', f.padEnd(13), x0, y0, x1, y1, x0 < 0 || y0 < 0 || x1 > 560 || y1 > 672 ? 'OUTSIDE THE FRAME' : 'inside');
      }
      console.log(file, Math.round(r.width) + 'x' + Math.round(r.height), '@' + dpr + 'x', errors, 'svgs');
    }
    ws.close();
  } finally {
    chrome.kill();
    await wait(300);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (_) {}
  }
})();
