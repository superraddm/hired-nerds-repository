// Drive texture-bench.html in headless Chrome over CDP with the CPU throttled, and print the frame statistics.
// usage: node docs/little-patterns-round-4/build/character/bench-texture.cjs [cpuSlowdown=6] [seconds=4]
// A desktop with a throttled CPU is only a rough stand-in: the decision on texture is made on the iPad 5.
const { spawn } = require('node:child_process');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9393, slow = +(process.argv[2] || 6), secs = +(process.argv[3] || 4);
const PAGE = 'file:///' + path.join(__dirname, 'texture-bench.html').replace(/\\/g, '/');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'nook-bench-'));
(async () => {
  const chrome = spawn(CHROME, ['--headless=new', '--hide-scrollbars', '--no-first-run', '--allow-file-access-from-files', '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
  const wait = ms => new Promise(r => setTimeout(r, ms));
  try {
    let tabs; for (let i = 0; i < 40; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (tabs.length) break; } catch (_) {} await wait(250); }
    const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
    let id = 0; const pending = new Map();
    ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
    const send = (method, params = {}) => new Promise(res => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
    await send('Page.enable');
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 768, deviceScaleFactor: 2, mobile: false });
    await send('Page.navigate', { url: PAGE });
    await wait(800);
    await send('Emulation.setCPUThrottlingRate', { rate: slow });
    const r = await send('Runtime.evaluate', { expression: `bench(${secs}).then(r => JSON.stringify(r))`, awaitPromise: true, returnByValue: true, timeout: 120000 });
    const rows = JSON.parse(r.result.result.value);
    console.log('CPU slowdown ' + slow + 'x, DPR 2, ' + secs + ' s per case');
    console.log('case'.padEnd(28) + 'render ms  frames  mean ms  p95 ms  max ms  over 20 ms');
    for (const x of rows) console.log(x.case.padEnd(28) + String(x.render).padStart(9) + String(x.frames).padStart(8) + String(x.mean).padStart(9) + String(x.p95).padStart(8) + String(x.max).padStart(8) + String(x.over20).padStart(12));
    ws.close();
  } finally {
    chrome.kill(); await wait(300);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (_) {}
  }
})();
