import path from 'node:path'; import fs from 'node:fs';
import { launchBrowser, CDP } from './cdp.mjs'; import { startServer } from './serve.mjs';
const [girl, style, out] = process.argv.slice(2);
const srv = await startServer('C:/hirednerds-portfolio/public/fireworks', 0);
const browser = await launchBrowser({ profileDir: path.join(process.cwd(), 'profiles', 'comp-' + Date.now()) });
const page = await browser.pageTarget(); const cdp = await CDP.connect(page.webSocketDebuggerUrl);
await cdp.send('Page.enable'); await cdp.send('Runtime.enable');
await cdp.send('Page.navigate', { url: `http://127.0.0.1:${srv.port}/?auto=1&dress=1&quality=full` });
const ev = async e => { const r = await cdp.send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0,400)); return r.result.value; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
for (let i = 0; i < 150; i++){ if (await ev('!!(window.__kb && __kb.GG && __kb.GG.ready && __kb.GG.loaded===__kb.GG.total)')) break; await sleep(200); }
const png = await ev(`(function(){ const L=JSON.parse(JSON.stringify(__kb.LOOKS[${girl}])); L.hair={style:'${style}',color:null}; L.face=[]; const r=__kb.ggComposite(${girl}, L, false, 1); return JSON.stringify({dy:r.dy,data:r.src.toDataURL()}); })()`);
const o = JSON.parse(png); fs.writeFileSync(out, Buffer.from(o.data.split(',')[1], 'base64')); console.log('saved', out, 'dy', o.dy);
cdp.close(); await browser.close(); srv.close(); process.exit(0);
