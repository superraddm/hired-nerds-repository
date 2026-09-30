const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('../../../hirednerds-chat/app/node_modules/sharp');

const W = 1024;
const H = 1536;
const root = path.resolve(__dirname, '..');
const finalDir = path.join(root, 'assets/glowgirls/sol/final');
const manifestPath = path.join(__dirname, 'hairstyle-batch.json');
const contactPath = path.join(root, 'assets/glowgirls/sol/patch-sources/hairstyle-batch-contact-sheet.png');
const baseUrl = (process.argv[2] || '').replace(/\/$/, '');
const styles = {
  sol: ['moonpony', 'starbraid', 'cometbraid', 'silverwaves', 'neonbuns'],
  hana: ['hana-rosewaves', 'hana-petalbob', 'hana-starlittwins', 'hana-floralhalo', 'hana-petalpixie'],
  jia: ['jia-neontails', 'jia-braidmatrix', 'jia-embershag', 'jia-electricbob', 'jia-circuitfauxhawk'],
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function alphaReport(rgba) {
  let count = 0;
  let x0 = W;
  let y0 = H;
  let x1 = -1;
  let y1 = -1;
  let eyeClear = 0;
  let eyeTotal = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const alpha = rgba[(y * W + x) * 4 + 3];
    if (x >= 482 && x <= 546 && y >= 128 && y <= 184) {
      eyeTotal++;
      if (alpha <= 8) eyeClear++;
    }
    if (alpha <= 8) continue;
    count++;
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return { count, bounds: count ? [x0, y0, x1, y1] : null, eyeClear: eyeClear / eyeTotal };
}

async function verifyLayer(id, side) {
  const name = `hair-${id}-${side}.png`;
  const full = path.join(finalDir, name);
  assert(fs.existsSync(full), `Missing ${name}`);
  const image = sharp(full);
  const metadata = await image.metadata();
  assert(metadata.width === W && metadata.height === H, `${name} is not ${W}x${H}`);
  assert(metadata.hasAlpha && metadata.channels === 4, `${name} is not RGBA`);
  const rgba = await image.ensureAlpha().raw().toBuffer();
  const report = alphaReport(rgba);
  assert(report.count > 500, `${name} is unexpectedly empty`);
  assert(report.count < W * H * 0.25, `${name} contains an implausibly large opaque background`);
  if (side === 'front') assert(report.eyeClear > 0.32, `${name} obscures too much of the eye area`);
  return { ...report, hash: crypto.createHash('sha256').update(rgba).digest('hex') };
}

async function verifyHttp(relative) {
  if (!baseUrl) return;
  const response = await fetch(`${baseUrl}/${relative.replace(/\\/g, '/')}`);
  assert(response.ok, `${response.status} loading ${relative}`);
  assert((await response.arrayBuffer()).byteLength > 0, `Empty response for ${relative}`);
}

async function main() {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
  for (const script of scripts) new Function(script);

  assert(html.includes('const HAIR_BY_CHAR='), 'HAIR_BY_CHAR is missing');
  assert(html.includes("if(cat==='hair') return HAIR_BY_CHAR"), 'Character hair filtering is missing');
  const allIds = Object.values(styles).flat();
  assert(new Set(allIds).size === 15, 'Character hair IDs are not unique');
  for (const [character, ids] of Object.entries(styles)) {
    assert(ids.length === 5, `${character} does not have exactly five styles`);
    for (const id of ids) assert(html.includes(`'${id}'`), `${id} is not wired into index.html`);
  }

  const reports = [];
  for (const [character, ids] of Object.entries(styles)) {
    const characterHashes = new Set();
    for (const id of ids) {
      const front = await verifyLayer(id, 'front');
      const rear = await verifyLayer(id, 'rear');
      characterHashes.add(`${front.hash}:${rear.hash}`);
      reports.push({ character, id, frontPixels: front.count, rearPixels: rear.count, eyeClear: `${Math.round(front.eyeClear * 100)}%` });
      await verifyHttp(path.join('assets/glowgirls/sol/final', `hair-${id}-front.png`));
      await verifyHttp(path.join('assets/glowgirls/sol/final', `hair-${id}-rear.png`));
    }
    assert(characterHashes.size === 5, `${character} contains duplicate layer pairs`);
  }

  const batch = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert(batch.jobs.length === 10, 'Hairstyle manifest must contain ten Hana/Jia jobs');
  assert(batch.jobs.every(job => job.status === 'approved'), 'Not every hairstyle job is approved');
  assert(fs.existsSync(contactPath), 'Hairstyle contact sheet is missing');
  const contact = await sharp(contactPath).metadata();
  assert(contact.width === 1280 && contact.height === 840, 'Contact sheet has unexpected dimensions');
  await verifyHttp('index.html');

  console.table(reports);
  console.log(`PASS: 3 characters x 5 distinct styles; 30 registered RGBA layers; ${scripts.length} script block(s) parsed${baseUrl ? '; HTTP assets loaded' : ''}.`);
}

main().catch(error => {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
});
