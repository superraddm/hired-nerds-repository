// Runtime allow-list: never publish sketches, source artwork or saved test data.
const fs = require('node:fs');
const path = require('node:path');
const source = path.resolve(__dirname, '../public/fireworks/little-patterns');
const files = [
  'index.html', 'home.css', 'shared.css', 'shared.js', 'learning.js',
  'blocks.html', 'blocks.css', 'blocks-live.css', 'blocks.js', 'core.js',
  'garden.html', 'garden-preview.css', 'garden-live.css', 'garden.js',
  'assets/nook.png', 'LICENSE.txt', 'content.html', 'voice-library.js',
  'assets/voice/manifest.json', 'assets/voice/NOTICE.txt'
];
const voice = JSON.parse(fs.readFileSync(path.join(source, 'assets/voice/manifest.json'), 'utf8'));
for (const clip of Object.values(voice.clips)) {
  if (!/^assets\/voice\/[a-f0-9]{16}\.wav$/.test(clip.file)) throw Error('Invalid voice asset path');
  if (!files.includes(clip.file)) files.push(clip.file);
}

function validate() {
  for (const file of files) {
    if (!fs.statSync(path.join(source, file)).isFile()) throw Error(`Missing runtime file: ${file}`);
    if (!file.endsWith('.html')) continue;
    const html = fs.readFileSync(path.join(source, file), 'utf8');
    for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      const ref = match[1].split(/[?#]/)[0];
      if (!ref) continue;
      if (/^(?:[a-z]+:|\/)/i.test(ref)) throw Error(`Unexpected external reference in ${file}: ${ref}`);
      const resolved = path.posix.normalize(ref.endsWith('/') ? `${ref}index.html` : ref);
      if (!files.includes(resolved)) throw Error(`Runtime file is not included: ${file} -> ${ref}`);
    }
  }
}

function stage(destination) {
  validate();
  const target = path.resolve(destination, 'little-patterns');
  if (target === source || source.startsWith(target + path.sep)) throw Error('Stage outside the source folder.');
  // A fresh directory prevents obsolete assets from leaking into a release.
  if (fs.existsSync(target)) throw Error(`Stage already exists: ${target}`);
  for (const file of files) {
    const output = path.join(target, file);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.copyFileSync(path.join(source, file), output);
  }
  return target;
}

if (require.main === module) {
  try {
    if (process.argv[2] && process.argv[2] !== '--check') console.log(`Staged ${files.length} files at ${stage(process.argv[2])}`);
    else { validate(); console.log(`Little Patterns: ${files.length} runtime files and their page references checked.`); }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { files, validate, stage };
