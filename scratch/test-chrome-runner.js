const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/jr-map/index.html';
  const filePath = path.join(rootDir, reqPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(8080, '127.0.0.1', async () => {
  console.log('Server listening on http://127.0.0.1:8080');

  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  // Chrome headless で console をダンプさせる
  const chrome = spawn(chromePath, [
    '--headless',
    '--disable-gpu',
    '--enable-logging=stderr',
    '--v=1',
    '--dump-dom',
    'http://127.0.0.1:8080/jr-map/index.html'
  ]);

  let dom = '';
  chrome.stdout.on('data', d => dom += d.toString());
  chrome.stderr.on('data', d => console.log('[CHROME LOG]', d.toString()));

  chrome.on('close', code => {
    console.log('Chrome finished with code', code);
    console.log('DOM length:', dom.length);
    // svg や line-text があるか確認
    console.log('Has svg:', dom.includes('<svg'));
    console.log('Has svg-line-labels-group:', dom.includes('svg-line-labels-group'));
    console.log('Has leaflet-container:', dom.includes('leaflet-container'));
    server.close();
  });
});
