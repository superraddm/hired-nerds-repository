// Parent listening page for all 26 alphabet sounds; no speech services or runtime model.
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'../public/fireworks/little-patterns');
const specs=require('./little-patterns-phonics.json');
const voice=JSON.parse(fs.readFileSync(path.join(root,'assets/voice/manifest.json'),'utf8'));
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// The recording sheet says which rows are phonics sounds and which letter each one is.
const csv=fs.readFileSync(path.join(__dirname,'../docs/nook-voice-recordings.csv'),'utf8').replace(/^﻿/,'');
const rows=[];let row=[],cell='',quoted=false;
for(let i=0;i<csv.length;i++){const c=csv[i];
  if(quoted){if(c==='"'&&csv[i+1]==='"'){cell+='"';i++}else if(c==='"')quoted=false;else cell+=c}
  else if(c==='"')quoted=true;else if(c===','){row.push(cell);cell=''}
  else if(c==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell=''}else cell+=c}
if(cell||row.length){row.push(cell);rows.push(row)}
const head=rows.shift(),col=n=>head.indexOf(n);
const sounds=rows.filter(r=>r[col('recording_type')]==='phonics').map(r=>({key:r[col('lookup_key')],letter:r[col('letter')]}))
  .sort((a,b)=>a.letter.localeCompare(b.letter));
if(sounds.length!==26)throw new Error(`Expected 26 phonics rows on the recording sheet, found ${sounds.length}`);
const cards=sounds.map(({key,letter})=>{const clip=voice.clips[key];if(!clip)throw new Error(`No clip for ${key}`);
  const note=specs[key]?specs[key].example:`Said as “${key}”`;
  return `<section><h2>${esc(letter)}</h2><p>${esc(note)}</p><audio controls preload="none" src="${clip.file}" aria-label="Hear the ${esc(letter)} sound"></audio></section>`}).join('');
fs.writeFileSync(path.join(root,'phonics-review.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Alphabet sounds · Listening review</title><style>body{font:18px/1.5 "Trebuchet MS",Arial,sans-serif;background:#fffbe7;color:#253e59;margin:0}main{max-width:850px;padding:24px;margin:auto}a{color:#345980;display:inline-block;padding:12px 0}h1{line-height:1.2}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:18px}section{padding:18px;border:2px solid #82956f;border-radius:20px;background:#fffef3}h2{margin:0;font-size:2rem}audio{width:100%;min-height:54px}a:focus-visible{outline:3px solid #6c4892}</style></head><body><main><a href="garden.html">Back to the Garden</a><h1>Alphabet sounds</h1><p>All 26 keyboard sounds in Nook’s voice (${esc(voice.voice||'')}). Tap a player to listen. Nothing plays automatically.</p><p>These are generated sounds for listening review, not recordings verified by a phonics teacher. Each should be the short sound only, never the letter’s name.</p><div class="cards">${cards}</div></main></body></html>\n`);
console.log(`Built the ${sounds.length}-sound listening page.`);
