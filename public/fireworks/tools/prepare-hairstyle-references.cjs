const fs = require('fs');
const path = require('path');
const sharp = require('../../../hirednerds-chat/app/node_modules/sharp');

const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'assets/glowgirls/sol/patch-sources/hair-references');

const jobs = [
  {
    id: 'hana-rosewaves',
    concept: ['hana-concepts-v2.png', 0],
    source: ['hair-v1.png', { left: 360, top: 0, width: 520, height: 724 }],
  },
  {
    id: 'hana-petalbob',
    concept: ['hana-concepts-v2.png', 1],
    source: ['hair-v2.png', { left: 390, top: 0, width: 365, height: 887 }],
  },
  {
    id: 'hana-starlittwins',
    concept: ['hana-concepts-v2.png', 2],
    source: ['hair-v1.png', { left: 1640, top: 0, width: 532, height: 724 }],
  },
  {
    id: 'jia-neontails',
    concept: ['jia-concepts-v2.png', 0],
    source: ['hair-v1.png', { left: 820, top: 0, width: 500, height: 724 }],
  },
  {
    id: 'jia-braidmatrix',
    concept: ['jia-concepts-v2.png', 1],
    source: ['hair-v2.png', { left: 690, top: 0, width: 420, height: 887 }],
  },
  {
    id: 'jia-embershag',
    concept: ['jia-concepts-v2.png', 2],
    source: ['hair-v2.png', { left: 1060, top: 0, width: 390, height: 887 }],
  },
];

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  for (const job of jobs) {
    const [conceptName, panel] = job.concept;
    await sharp(path.join(root, 'mockups', conceptName))
      .extract({ left: panel * 512, top: 0, width: 512, height: 1024 })
      .png()
      .toFile(path.join(outputDir, `${job.id}-concept.png`));

    const [sourceName, crop] = job.source;
    await sharp(path.join(root, 'assets/paperdoll', sourceName))
      .extract(crop)
      .png()
      .toFile(path.join(outputDir, `${job.id}-source.png`));
  }
  console.log(`Prepared ${jobs.length * 2} hairstyle references in ${outputDir}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
