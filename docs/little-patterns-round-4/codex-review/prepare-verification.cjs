// Reuse the supplied screenshot harness with an isolated workspace-local Chrome profile.
const fs = require('node:fs');
const path = require('node:path');
let source = fs.readFileSync(path.join(__dirname, '../mockups/shoot.cjs'), 'utf8');
source = source.replace('const PORT = 9377;', 'const PORT = 9381;');
source = source.replace(/C:\/Users\/joffa\/AppData\/Local\/Temp\/claude\/[^']+\/chrome-profile/g, path.join(__dirname, 'chrome-profile').replaceAll('\\', '/'));
source = source.replace("let id = 0;", "let checks = 0; const records = []; let id = 0;");
source = source.replace("if (v.length) console.log('CHECK', name, s, v.join(' | '));", "records.push({viewport:name,screen:s,findings:v}); if (v.length) { checks += v.length; console.log('CHECK', name, s, v.join(' | ')); }");
source = source.replace('ws.close(); chrome.kill();', `
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
  ws.close(); chrome.kill();`);
fs.writeFileSync(path.join(__dirname, 'verify-mockups.cjs'), source);
