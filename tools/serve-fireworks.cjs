#!/usr/bin/env node
// Serve public/fireworks locally for review before a deploy: http://localhost:8787/
// Binds all interfaces so a tablet on the same Wi-Fi can open http://<this PC's IP>:8787/ too.
// No caching headers, so a plain reload always shows the working tree.
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const root = path.join(__dirname, '..', 'public', 'fireworks'), port = +(process.argv[2] || 8787);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.css': 'text/css' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.normalize(path.join(root, p));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(f).pipe(res);
}).listen(port, '0.0.0.0', () => {
  const ips = Object.values(os.networkInterfaces()).flat().filter(i => i.family === 'IPv4' && !i.internal).map(i => i.address);
  console.log(`fireworks: http://localhost:${port}/  ` + ips.map(ip => `http://${ip}:${port}/`).join('  '));
});
