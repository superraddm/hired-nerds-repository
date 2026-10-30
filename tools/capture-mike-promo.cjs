// Promo footage of Mike the Mic: real gameplay from each level, rendered frame by frame in headless Chrome at 1920x1080,
// 60 fps, so every clip is perfectly smooth whatever the machine is doing. Silent (the game's sound is synthesised live).
//   Level 1 plays its own autopilot (?demo=1).
//   Level 2 plays its recorded run (demo-2.json).
//   Level 3 plays the test player's recorded runs: RECORD=1 node tools/test-mike-l3-run.cjs full, and boss with CARDS=1.
// Nothing in the game changes. For the capture only, a script added to the page before it loads gives the game's canvas
// and its cached scenery tiles twice the pixels, so the art is drawn crisply at 1080p instead of being scaled up. The
// far parallax backdrops stay at the game's own resolution (soft, like distance).
//   node tools/capture-mike-promo.cjs scan [run ...]     contact sheets, one frame every 2 s, for choosing the moments
//   node tools/capture-mike-promo.cjs render [clip ...]  the clips in CLIPS, each with the HUD and without it
//   node tools/capture-mike-promo.cjs still <run> <s>    one frame at 1080p and at the game's own 960x540, to compare
// Needs node tools/serve-fireworks.cjs 8788 and ffmpeg on the PATH. Writes the clips to docs/mike-platformer/promo/ (with
// EDITOR-BRIEF.md beside them) and its working files (sheets, stills, Level 3 recordings) to promo/_working/.
const { spawn } = require('child_process'), path = require('path'), fs = require('fs'), http = require('http'), { once } = require('events');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'docs/mike-platformer/promo'), BASE = process.env.MIKE_URL || 'http://localhost:8788/mike-game/';
const PORT = +process.env.PORT || 9354, FRAMES = PORT + 100, FPS = 60, HD = 2;

// The runs: the page to open, how to start, and where the inputs come from (none: Level 1's autopilot drives itself).
const RUNS = {
  l1: { title:'Level 1: The Night Shift', page:'index.html?demo=1&test=1', hook:'__mike' },
  l2: { title:'Level 2: Below the Wire', page:'level-2.html?demo=1&test=1', hook:'__l2', inputs:'public/fireworks/mike-game/demo-2.json' },
  'l3-full': { title:'Level 3: Cobot Mania', page:'level-3.html?test=1', hook:'__l3', start:'__l3.reset(0)', inputs:'docs/mike-platformer/promo/_working/runs/l3-full.json' },
  'l3-boss': { title:'Level 3: the Teach Cell', page:'level-3.html?test=1', hook:'__l3', start:"__l3.reset('boss')", inputs:'docs/mike-platformer/promo/_working/runs/l3-boss.json' }
};
// The clips: a run, where to start (seconds into it) and how long. Chosen from the contact sheets.
const CLIPS = {
  'l1-level': { run:'l1', start:13, seconds:10, note:'Camera Alley into the upper stores: slow motion beside the turning centre' },
  'l1-boss': { run:'l1', start:193, seconds:10, note:'The Five-Axis Service Cell: spindles, slow motion, a repair' },
  'l2-level': { run:'l2', start:141, seconds:10, note:'Swimming the cut-path maze: clear workpieces, flushing jets' },
  'l2-boss': { run:'l2', start:227, seconds:10, note:'The Threading Fault: a climb under the jets, slow motion, a repair' },
  'l3-level': { run:'l3-full', start:17, seconds:10, note:'Carried by cobots through the Assembly line and up the Transfer tower to the roof' },
  'l3-boss': { run:'l3-boss', start:95, seconds:10, note:'The Teach Cell, round 3: two routes, sweeps, re-teaching, and the route restored' }
};

// Added to every page before its scripts run. The game's canvas (#game) and every canvas made by a function called
// chunk (each level's scenery tiles, always drawn with an explicit size) get HD times the pixels, with their contexts'
// transforms pre-scaled to match, so the game still sees a 960x540 canvas. Shadows scale with them.
const HD_PATCH = `(() => {
  const K = ${HD}, P = HTMLCanvasElement.prototype, dw = Object.getOwnPropertyDescriptor(P, 'width'), dh = Object.getOwnPropertyDescriptor(P, 'height'), gc = P.getContext;
  const C2 = CanvasRenderingContext2D.prototype, sb = ['shadowBlur', 'shadowOffsetX', 'shadowOffsetY'].map(k => [k, Object.getOwnPropertyDescriptor(C2, k)]);
  const pick = cv => { if (cv.__k === undefined) cv.__k = cv.id === 'game' || /\\bat chunk \\(/.test(new Error().stack) ? K : 0; return cv.__k; };
  const base = cv => { if (cv.__ctx) cv.__ctx.__set(K, 0, 0, K, 0, 0); };
  for (const [prop, d] of [['width', dw], ['height', dh]]) Object.defineProperty(P, prop, { configurable:true,
    get(){ return this.__k ? this['__l' + prop] : d.get.call(this); },
    set(v){ if (pick(this)){ this['__l' + prop] = v; d.set.call(this, Math.round(v*K)); base(this); } else d.set.call(this, v); } });
  P.getContext = function(type, o){
    if (this.id === 'game' && this.__k === undefined){ const w = dw.get.call(this), h = dh.get.call(this); this.__k = K; this.__lwidth = w; this.__lheight = h; dw.set.call(this, w*K); dh.set.call(this, h*K); }
    if (this.id === 'game') o = Object.assign({}, o, { willReadFrequently:true });     // read back every frame: keep it CPU-side
    const c = gc.call(this, type, o);
    if (this.__k && type === '2d' && c && !c.__set){
      const st = c.setTransform.bind(c), gt = c.getTransform.bind(c); c.__set = st;
      c.setTransform = function(a, b, cc, d, e, f){ if (typeof a === 'object' && a){ return st(a.a*K, a.b*K, a.c*K, a.d*K, a.e*K, a.f*K); } return st(a*K, b*K, cc*K, d*K, e*K, f*K); };
      c.resetTransform = () => st(K, 0, 0, K, 0, 0);
      c.getTransform = () => { const m = gt(); return new DOMMatrix([m.a/K, m.b/K, m.c/K, m.d/K, m.e/K, m.f/K]); };
      for (const [k, d] of sb) Object.defineProperty(c, k, { get(){ return d.get.call(c)/K; }, set(v){ d.set.call(c, v*K); } });
      this.__ctx = c; st(K, 0, 0, K, 0, 0);
    }
    return c;
  };
})();`;

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function browser(){
  const dir = path.join(ROOT, `.wrangler/mike-promo-chrome-${PORT}`); fs.rmSync(dir, { recursive:true, force:true });     // a fresh profile: no saves, no campaign
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--mute-audio', '--window-size=960,540', 'about:blank'], { stdio:'ignore', windowsHide:true });
  let tabs; for (let i = 0; i < 80; i++){ try { tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (tabs.length) break; } catch {} await sleep(150); }
  const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let next = 0; const pending = new Map(), errors = [];
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && pending.has(d.id)){ pending.get(d.id)(d); pending.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text); };
  const send = (method, params = {}) => new Promise((r, j) => { const id = ++next; pending.set(id, d => d.error ? j(Error(d.error.message)) : r(d.result)); ws.send(JSON.stringify({ id, method, params })); });
  const ev = async expression => { const r = await send('Runtime.evaluate', { expression, returnByValue:true, awaitPromise:true }); if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width:960, height:540, deviceScaleFactor:1, mobile:false });
  let patch = null;
  return {
    ev, errors,
    async open(run, hd, clean){
      if (patch){ await send('Page.removeScriptToEvaluateOnNewDocument', { identifier:patch }); patch = null; }
      if (hd) patch = (await send('Page.addScriptToEvaluateOnNewDocument', { source:HD_PATCH })).identifier;
      await send('Page.navigate', { url:BASE + run.page });
      for (let i = 0; i < 300; i++){ await sleep(100); if (await ev('document.body && document.body.dataset.ready').catch(() => null) === '1') break; if (i === 299) throw Error('boot failed: ' + run.page); }
      // every web font in, the page's own animation loop stopped (the capture draws each frame itself), full quality
      await ev(`Promise.all([...document.fonts].map(f => f.load())).then(() => document.fonts.ready).then(() => true)`);
      await ev(`window.requestAnimationFrame = () => 0; true`); await sleep(100);
      if (run.start) await ev(run.start);
      const inputs = run.inputs ? JSON.parse(fs.readFileSync(path.join(ROOT, run.inputs), 'utf8')) : null;
      await ev(`(() => {
        const h = window.${run.hook}, keys = ${JSON.stringify(inputs ? inputs.keys : [])}, runs = ${JSON.stringify(inputs ? inputs.runs : [])}, frames = [];
        for (const [b, n] of runs) for (let i = 0; i < n; i++) frames.push(b);
        const noop = () => {};
        if (${!!clean}){ MIKE.hud.pills = noop; MIKE.hud.helper = noop; MIKE.hud.pill = noop; if (MIKE.bossStrip) MIKE.bossStrip = noop; }
        window.__promo = { i:0, n:frames.length,
          // advance n frames: the autopilot, or the recorded inputs one frame at a time
          adv(n){ if (!keys.length){ h.step(n); return; } for (let k = 0; k < n; k++){ const b = frames[this.i++] || 0, o = {}; keys.forEach((key, j) => { o[key] = !!(b & (1 << j)); }); h.step(1, o); } },
          snap(){ const s = h.snapshot() || {}; return { x:s.x, y:s.y, health:s.health, mode:s.mode, cam:h === window.__mike ? s.cameraOn : !!(h.S && h.S.cam && h.S.cam.on), boss:h === window.__mike ? s.boss.on : !!(h.S && h.S.boss && h.S.boss.on), won:s.won }; },
          // while fast-forwarding the canvas is shrunk to a few pixels, so the frames nobody sees cost almost nothing to draw
          shrink(on){ const cv = document.getElementById('game'); cv.width = on ? 4 : 960; cv.height = on ? 4 : 540; },
          live(){ if (keys.length && this.i >= frames.length) return false; return (h.G || {}).mode === 'play' || (h.snapshot() || {}).mode === 'play'; },   // stops where a recording ends
          grab(type){ h.G.lowQ = false; return document.getElementById('game').toDataURL(type || 'image/png', .92); },
          // film n frames: each frame's raw RGBA pixels posted to the capture tool, which feeds ffmpeg (lossless, no images)
          async film(n, url){ const cv = document.getElementById('game'), k = cv.__k || 1, c = cv.getContext('2d');
            for (let f = 0; f < n; f++){ this.adv(1); h.G.lowQ = false; await fetch(url, { method:'POST', mode:'no-cors', body:c.getImageData(0, 0, cv.width*k, cv.height*k).data }); }
            return n; }
        };
        return frames.length;
      })()`);
      return inputs;
    },
    async close(){ try { await send('Browser.close'); } catch {} ws.close(); chrome.kill(); }
  };
}

// ---------- scan: contact sheets ----------
async function scan(names){
  const b = await browser(), dir = path.join(OUT, '_working/scan'); fs.mkdirSync(dir, { recursive:true });
  try { for (const name of names){
    const run = RUNS[name]; await b.open(run, false, false);
    const meta = []; let sheet = 0, cells = [];
    const flush = async () => {
      if (!cells.length) return;
      const url = await b.ev(`(async () => {
        const cells = ${JSON.stringify(cells)}, cols = 6, w = 320, h = 180, rows = Math.ceil(cells.length/cols), cv = document.createElement('canvas'); cv.width = cols*w; cv.height = rows*(h + 22) + 40;
        const c = cv.getContext('2d'); c.fillStyle = '#0d2430'; c.fillRect(0, 0, cv.width, cv.height); c.fillStyle = '#fff'; c.font = '700 20px Arial'; c.fillText(${JSON.stringify(run.title + ' (' + name + ')')} + ', sheet ${sheet + 1}', 10, 28);
        for (let k = 0; k < cells.length; k++){ const im = new Image(); im.src = cells[k].src; await im.decode(); const x = (k % cols)*w, y = 40 + Math.floor(k/cols)*(h + 22);
          c.drawImage(im, x + 2, y, w - 4, h); c.fillStyle = '#cfe6ea'; c.font = '600 14px Arial'; c.fillText(cells[k].label, x + 6, y + h + 16); }
        return cv.toDataURL('image/jpeg', .85); })()`);
      fs.writeFileSync(path.join(dir, `${name}-${String(++sheet).padStart(2, '0')}.jpg`), Buffer.from(url.split(',')[1], 'base64')); cells = [];
    };
    for (let f = 0; f < 60*60*8; f += 2*FPS){
      if (!(await b.ev('__promo.live()'))) break;
      const s = await b.ev('__promo.snap()'), src = await b.ev(`__promo.grab('image/jpeg')`), t = f/FPS;
      const label = `${Math.floor(t/60)}:${String(Math.floor(t % 60)).padStart(2, '0')}  x ${s.x.toFixed(0)}${s.cam ? '  CAMERA' : ''}${s.boss ? '  BOSS' : ''}  hp ${s.health}`;
      meta.push(Object.assign({ t }, s)); cells.push({ src, label }); if (cells.length === 36) await flush();
      await b.ev(`__promo.adv(${2*FPS})`);
    }
    await flush(); fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify(meta));
    console.log(`${name}: ${meta.length} frames over ${meta.length*2} s, ${sheet} sheets`);
  } } finally { if (b.errors.length) console.log('page errors:', b.errors.slice(0, 5)); await b.close(); }
}

// ---------- render: 1080p60 clips ----------
// Each frame's pixels go straight into ffmpeg (H.264, CRF 14, BT.709): no image files in between.
function encoder(file){
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${960*HD}x${540*HD}`, '-r', String(FPS), '-i', '-',
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-movflags', '+faststart', file], { stdio:['pipe', 'ignore', 'inherit'] });
  const done = once(ff, 'close');
  return { async write(buf){ if (!ff.stdin.write(buf)) await once(ff.stdin, 'drain'); }, async end(){ ff.stdin.end(); const [code] = await done; if (code) throw Error('ffmpeg failed on ' + file); } };
}
// The page posts frames here, in order, one at a time (it waits for each reply).
function frameServer(){
  let enc = null, count = 0;
  const srv = http.createServer((req, res) => {
    const parts = []; req.on('data', d => parts.push(d));
    req.on('end', async () => { if (enc && req.method === 'POST'){ await enc.write(Buffer.concat(parts)); count++; } res.writeHead(204, { 'Access-Control-Allow-Origin':'*' }); res.end(); });
  });
  srv.listen(FRAMES, '127.0.0.1');
  return { url:`http://127.0.0.1:${FRAMES}/frame`, to(e){ enc = e; if (e) count = 0; }, get count(){ return count; }, close(){ srv.close(); } };
}
async function render(names){
  const b = await browser(), fsv = frameServer();
  try { for (const name of names){
    const clip = CLIPS[name], run = RUNS[clip.run];
    for (const clean of [false, true]){
      const tag = `${name}${clean ? '-clean' : ''}`, mp4 = path.join(OUT, `mike-${tag}.mp4`);
      await b.open(run, true, clean);
      // fast-forward to the start in big steps (only the last frame is drawn), then film one frame at a time
      let at = 0; const start = Math.round(clip.start*FPS), n = Math.round((+process.env.CLIP_SECONDS || clip.seconds)*FPS);   // CLIP_SECONDS=1 for a quick trial
      await b.ev('__promo.shrink(true)');
      while (at < start){ const k = Math.min(600, start - at); await b.ev(`__promo.adv(${k})`); at += k; }
      await b.ev('__promo.shrink(false)');
      const t0 = Date.now(), enc = encoder(mp4); fsv.to(enc);
      await b.ev(`__promo.film(${n}, ${JSON.stringify(fsv.url)})`);
      fsv.to(null); await enc.end();
      if (fsv.count !== n) console.log(`  warning: ${fsv.count} of ${n} frames arrived`);
      console.log(`${tag}: ${n} frames in ${((Date.now() - t0)/1000).toFixed(0)} s -> ${path.relative(ROOT, mp4)} (${(fs.statSync(mp4).size/1e6).toFixed(1)} MB)`);
    }
  } } finally { fsv.close(); if (b.errors.length) console.log('page errors:', b.errors.slice(0, 5)); await b.close(); }
}

// ---------- still: one frame, both ways ----------
async function still(name, secs){
  const b = await browser(), dir = path.join(OUT, '_working/stills'); fs.mkdirSync(dir, { recursive:true });
  try { for (const hd of [true, false]){
    await b.open(RUNS[name], hd, false); let at = 0; const to = Math.round(secs*FPS);
    while (at < to){ const k = Math.min(600, to - at); await b.ev(`__promo.adv(${k})`); at += k; }
    const url = await b.ev('__promo.grab()'), f = path.join(dir, `${name}-${secs}s-${hd ? '1080' : '540'}.png`);
    fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); console.log(path.relative(ROOT, f));
  } } finally { if (b.errors.length) console.log('page errors:', b.errors.slice(0, 5)); await b.close(); }
}

const [mode, ...names] = process.argv.slice(2);

(mode === 'scan' ? scan(names.length ? names : Object.keys(RUNS)) : mode === 'render' ? render(names.length ? names : Object.keys(CLIPS)) : mode === 'still' ? still(names[0], +names[1]) : Promise.reject(Error('usage: scan|render|still')))
  .catch(e => { console.error(e); process.exitCode = 1; });
