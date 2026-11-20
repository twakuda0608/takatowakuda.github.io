const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PORT = 8092;
const ROOT = path.resolve(__dirname, '../../');

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '/jr-map/' || reqPath === '/jr-map/index.html') {
    let html = fs.readFileSync(path.join(ROOT, 'jr-map/index.html'), 'utf8');
    html = html.replace('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', '/jr-map/scratch/leaflet.css');
    html = html.replace('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', '/jr-map/scratch/leaflet.js');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  const filePath = path.join(ROOT, reqPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not Found: ' + reqPath);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const os = require('os');
  const tempDir = os.tmpdir();
  const pcShot = path.join(tempDir, 'jr_map_pc_view.png');
  const spShot = path.join(tempDir, 'jr_map_sp_view.png');

  // PC 表示
  console.log('Capturing PC screenshot...');
  const resPC = spawnSync(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1280,800',
    '--virtual-time-budget=6000',
    `--screenshot=${pcShot}`,
    `http://127.0.0.1:${PORT}/jr-map/index.html`
  ], { encoding: 'utf8' });
  if (resPC.stderr) console.log('PC stderr:', resPC.stderr);

  // SP 表示
  console.log('Capturing SP screenshot...');
  const resSP = spawnSync(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=390,844',
    '--virtual-time-budget=6000',
    `--screenshot=${spShot}`,
    `http://127.0.0.1:${PORT}/jr-map/index.html`
  ], { encoding: 'utf8' });
  if (resSP.stderr) console.log('SP stderr:', resSP.stderr);

  console.log('PC exists:', fs.existsSync(pcShot));
  console.log('SP exists:', fs.existsSync(spShot));

  server.close();
});
