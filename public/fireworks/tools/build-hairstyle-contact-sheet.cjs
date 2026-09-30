const fs = require('fs');
const path = require('path');
const sharp = require('../../../hirednerds-chat/app/node_modules/sharp');

const W = 1024;
const H = 1536;
const root = path.resolve(__dirname, '..');
const assets = path.join(root, 'assets/glowgirls/sol');
const finalDir = path.join(assets, 'final');
const sourceDir = path.join(assets, 'patch-sources');
const outPath = path.join(sourceDir, 'hairstyle-batch-contact-sheet.png');
const cellW = 256;
const cellH = 420;

const rows = [
  {
    character: 'hana',
    top: 'petaljacket',
    bottom: 'petalskort',
    styles: [
      ['hana-rosewaves', 'ROSE WAVES'],
      ['hana-petalbob', 'PETAL BOB'],
      ['hana-starlittwins', 'STARLIT TWINS'],
      ['hana-floralhalo', 'FLORAL HALO'],
      ['hana-petalpixie', 'PETAL PIXIE'],
    ],
  },
  {
    character: 'jia',
    top: 'tailcoat',
    bottom: 'cargoshorts',
    styles: [
      ['jia-neontails', 'NEON TAILS'],
      ['jia-braidmatrix', 'BRAID MATRIX'],
      ['jia-embershag', 'EMBER SHAG'],
      ['jia-electricbob', 'ELECTRIC BOB'],
      ['jia-circuitfauxhawk', 'CIRCUIT FAUXHAWK'],
    ],
  },
];

function asset(kind, id, side) {
  return path.join(finalDir, `${kind}-${id}-${side}.png`);
}

function layer(input) {
  return fs.existsSync(input) ? { input } : null;
}

async function characterTile(row, id, label) {
  const ordered = [
    layer(asset('hair', id, 'rear')),
    layer(asset('top', row.top, 'rear')),
    layer(asset('bottom', row.bottom, 'rear')),
    layer(path.join(sourceDir, `master-${row.character}-registered.png`)),
    layer(asset('bottom', row.bottom, 'front')),
    layer(asset('top', row.top, 'front')),
    layer(asset('hair', id, 'front')),
  ].filter(Boolean);
  const puppet = await sharp({
    create: { width: W, height: H, channels: 4, background: { r: 25, g: 18, b: 37, alpha: 1 } },
  }).composite(ordered).png().toBuffer();
  const portrait = await sharp(puppet)
    .extract({ left: 252, top: 0, width: 520, height: 850 })
    .resize(228, 372, { fit: 'contain', background: { r: 25, g: 18, b: 37, alpha: 1 } })
    .png()
    .toBuffer();
  const svg = Buffer.from(`<svg width="${cellW}" height="${cellH}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" rx="18" fill="#191225" stroke="#5c4278" stroke-width="2"/>
    <text x="128" y="404" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" font-weight="700" fill="#fff">${label}</text>
  </svg>`);
  return sharp(svg).composite([{ input: portrait, left: 14, top: 8 }]).png().toBuffer();
}

async function main() {
  const composites = [];
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].styles.length; x++) {
      const [id, label] = rows[y].styles[x];
      composites.push({ input: await characterTile(rows[y], id, label), left: x * cellW, top: y * cellH });
    }
  }
  await sharp({
    create: { width: cellW * 5, height: cellH * 2, channels: 4, background: { r: 10, g: 7, b: 17, alpha: 1 } },
  }).composite(composites).png().toFile(outPath);
  console.log(outPath);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
