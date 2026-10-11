// Screenshot the round-4 mockups with headless Chrome over CDP (Node 22: global fetch + WebSocket).
// usage: node shoot.cjs <outDir> [screens...]
const { spawn } = require('node:child_process');
const fs = require('node:fs'), path = require('node:path');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9381;
const out = path.resolve(process.argv[2] || '.');
const only = process.argv.slice(3);
const MOCK = 'file:///C:/hirednerds-portfolio/docs/little-patterns-round-4/mockups/mock.html';
const SCREENS = ['shelf','shelf-over-count','count','add','add-help','add-done','add-bridge','take','words','patterns','shapes-sides','shapes-sides-done','shapes-name','feelings-board','feelings-perform','feelings-perform-sad','feelings-match','feelings-me','nook-sheet'];
// CSS pixel sizes: S24 Ultra (412x915 at DPR 3.5, shown here at 2), S24 landscape with Chrome's bar, iPad 5 landscape in Safari
const SIZES = { phone: [412, 860, 2, true], small: [360, 740, 2, true], land: [915, 356, 2, true], land2: [740, 360, 2, true], ipad: [1024, 698, 1, true], desk: [1280, 800, 1, false] };
fs.mkdirSync(out, { recursive: true });
(async () => {
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--remote-debugging-port=' + PORT, '--user-data-dir=' + 'C:/hirednerds-portfolio/docs/little-patterns-round-4/codex-review/chrome-profile', '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
  const wait = ms => new Promise(r => setTimeout(r, ms));
  let tabs; for (let i = 0; i < 40; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (tabs.length) break; } catch (_) {} await wait(250); }
  const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let checks = 0; const records = []; let id = 0; const pending = new Map();
  ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
  const send = (method, params = {}) => new Promise(res => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
  await send('Page.enable'); await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  for (const [name, [w, h, dpr, mobile]] of Object.entries(SIZES)) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile });
    for (const s of SCREENS) {
      if (only.length && !only.includes(s)) continue;
      await send('Page.navigate', { url: MOCK + '?screen=' + s });
      await wait(450);
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(out, `${name}-${s}.png`), Buffer.from(shot.result.data, 'base64'));
      const m = await send('Runtime.evaluate', { expression: `(()=>{const out=[];const d=document.documentElement;if(d.scrollHeight>innerHeight+1||d.scrollWidth>innerWidth+1)out.push('page overflow '+d.scrollWidth+'x'+d.scrollHeight);
        const inside=(a,b)=>a.left>=b.left-1&&a.right<=b.right+1&&a.top>=b.top-1&&a.bottom<=b.bottom+1;
        for(const el of document.querySelectorAll('.chip,.pill,.answer,.tile,.card,.feel,.key')){if(el.scrollWidth>el.clientWidth+1)out.push('label clipped: '+(el.textContent.trim().slice(0,24)||el.className));}
        for(const card of document.querySelectorAll('.nf-task')){const r=card.getBoundingClientRect();for(const el of card.querySelectorAll('.nook,.big-shape,.five-frame,.answers,.board,.keys,.strip,.join-row,.ten-pair,.me-card')){const q=el.getBoundingClientRect();if(q.width&&!inside(q,r))out.push('clipped in card: '+el.className.split(' ')[0]+' '+Math.round(q.left)+','+Math.round(q.top)+' '+Math.round(q.right)+','+Math.round(q.bottom)+' card '+Math.round(r.right)+','+Math.round(r.bottom));}
          const nook=card.querySelector('.nook');if(nook){const n=nook.getBoundingClientRect();for(const a of card.querySelectorAll('.answer')){const q=a.getBoundingClientRect();if(q.left<n.right&&q.right>n.left&&q.top<n.bottom&&q.bottom>n.top)out.push('answer overlaps Nook');}}}
        return JSON.stringify(out);})()`, returnByValue: true });
      const v = JSON.parse(m.result.result.value || '["check script failed"]');
      records.push({viewport:name,screen:s,findings:v}); if (v.length) { checks += v.length; console.log('CHECK', name, s, v.join(' | ')); }
    }
  }
  
  await send('Emulation.setDeviceMetricsOverride', {width:1280,height:1000,deviceScaleFactor:1,mobile:false});
  const profileMode = process.argv.includes('--profile');
  await send('Page.navigate', {url:profileMode ? 'file:///C:/hirednerds-portfolio/docs/little-patterns-round-4/codex-review/index.html' : 'file:///C:/hirednerds-portfolio/docs/little-patterns-round-4/proposal.html'});
  await wait(900);
  const headings = await send('Runtime.evaluate', {expression:'JSON.stringify([...document.querySelectorAll("h1,h2")].map(e=>({text:e.textContent,y:e.getBoundingClientRect().top+scrollY})))',returnByValue:true});
  const sections = JSON.parse(headings.result.result.value);
  for (const [index, section] of sections.entries()) {
    if (!(profileMode ? [0,2,3] : [0,3,4,8]).includes(index)) continue;
    await send('Runtime.evaluate', {expression:'window.scrollTo(0,' + Math.max(0,section.y-24) + ')'});
    await wait(120);
    const shot = await send('Page.captureScreenshot', {format:'png'});
    fs.writeFileSync(path.join(out,(profileMode ? 'profile-section-' : 'proposal-section-')+index+'.png'),Buffer.from(shot.result.data,'base64'));
  }
  fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({date:'2026-10-11',engine:'local headless Chrome',scope:'static mockups; no game interaction or physical device testing',cases:records.length,findings:checks,records,proposalSections:sections},null,2));
  process.exitCode = checks ? 1 : 0;
  ws.close(); chrome.kill();
  console.log('done', out);
})();
