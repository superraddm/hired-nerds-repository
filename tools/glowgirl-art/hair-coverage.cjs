// Scalp coverage per hairstyle: how much of the painted skull above the brow line the FRONT layer hides,
// and where the crown top sits. Sol's styles are the reference.
const sharp = require('C:/hirednerds-portfolio/hirednerds-chat/app/node_modules/sharp');
const R = 'C:/hirednerds-portfolio/public/fireworks/assets/glowgirls/sol/', D = R + 'final/', W = 1024, H = 1536;
const load = f => sharp(f).ensureAlpha().raw().toBuffer();
async function headAlpha(girl) {   // the head as the game shows it: master (minus mask) + painted head
  const m = await load(R + 'master.png'); if (girl === 'sol') return m;
  const mask = await load(D + 'head-base-mask.png'), head = await load(D + 'head-' + girl + '-front.png');
  const out = Buffer.from(m); for (let i = 0; i < W * H; i++) { out[i*4+3] = Math.max(0, m[i*4+3] - mask[i*4+3]); if (head[i*4+3] > out[i*4+3]) out[i*4+3] = head[i*4+3]; } return out;
}
async function metrics(girl, style, front, rear) {
  const hd = await headAlpha(girl);
  // scalp = head alpha in the head box above the brow line (y < 112), temples = head alpha in y 112-150 outside the face core (x<478 or x>555)
  let scalp = 0, scalpCov = 0, temple = 0, templeCov = 0, faceCov = 0, faceN = 0, crown = H, fringe = H;
  for (let y = 40; y < 240; y++) for (let x = 400; x < 640; x++) { const i = y * W + x; const hair = front[i*4+3] > 100; const rearA = rear[i*4+3] > 100;
    if ((hair || rearA) && x >= 480 && x <= 550 && y < crown) crown = y;
    if (hair && x >= 490 && x <= 540 && y < fringe) fringe = y;
    if (hd[i*4+3] < 200) continue;
    if (y < 112) { scalp++; if (hair) scalpCov++; }
    else if (y < 150 && (x < 478 || x > 555)) { temple++; if (hair) templeCov++; }
    else if (y >= 150 && y < 235 && x >= 478 && x <= 555) { faceN++; if (hair) faceCov++; }
  }
  return { scalp: +(100 * scalpCov / scalp).toFixed(0), temple: +(100 * templeCov / temple).toFixed(0), face: +(100 * faceCov / faceN).toFixed(0), crown, fringe };
}
(async () => {
  const styles = { sol: ['moonpony','starbraid','cometbraid','silverwaves','neonbuns'], hana: ['hana-rosewaves','hana-petalbob','hana-starlittwins','hana-floralhalo','hana-petalpixie'], jia: ['jia-neontails','jia-braidmatrix','jia-embershag','jia-electricbob','jia-circuitfauxhawk'] };
  console.log('style                        scalp%  temple%  face%  crownY  fringeY');
  for (const [girl, list] of Object.entries(styles)) for (const s of list) {
    const front = await load(D + 'hair-' + s + '-front.png'), rear = await load(D + 'hair-' + s + '-rear.png');
    const m = await metrics(girl, s, front, rear);
    console.log(s.padEnd(28), String(m.scalp).padStart(5), String(m.temple).padStart(8), String(m.face).padStart(6), String(m.crown).padStart(7), String(m.fringe).padStart(8));
  }
})();
