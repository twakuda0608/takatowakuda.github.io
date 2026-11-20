const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8090;
const ROOT = path.resolve(__dirname, '../../'); // C:\takatowakuda.github.io

// 簡易静的ファイルサーバー
const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/jr-map/index.html';
  const filePath = path.join(ROOT, reqPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not Found');
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

server.listen(PORT, async () => {
  console.log(`Server listening on http://localhost:${PORT}`);

  // Chrome をデバッグモードで起動
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(__dirname, 'chrome-profile');
  
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    `--user-data-dir=${userDataDir}`,
    '--disable-gpu-sandbox',
    '--window-size=1280,800',
    `http://localhost:${PORT}/jr-map/index.html`
  ]);

  // CDP に接続
  setTimeout(async () => {
    try {
      const fetch = (await import('node:http')).get;
      const jsonRes = await new Promise((resolve, reject) => {
        http.get('http://localhost:9223/json', (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
      });

      console.log('Pages:', jsonRes.map(p => ({ title: p.title, url: p.url, ws: p.webSocketDebuggerUrl })));
      const page = jsonRes.find(p => p.url.includes('jr-map'));
      if (!page) {
        console.error('jr-map page not found');
        cleanup();
        return;
      }

      // WebSocket で接続 (Node v22+ built-in WebSocket)
      const ws = new WebSocket(page.webSocketDebuggerUrl);

      let msgId = 1;
      const callbacks = new Map();

      ws.on('message', (data) => {
        const msg = JSON.parse(data);
        if (msg.id && callbacks.has(msg.id)) {
          callbacks.get(msg.id)(msg);
          callbacks.delete(msg.id);
        }
      });

      function send(method, params = {}) {
        return new Promise((resolve) => {
          const id = msgId++;
          callbacks.set(id, resolve);
          ws.send(JSON.stringify({ id, method, params }));
        });
      }

      ws.on('open', async () => {
        console.log('Connected to CDP');
        await send('Runtime.enable');
        await send('Performance.enable');

        // 計測: 画面内のDOM要素数やLeafletのレイヤー状況
        const domCount = await send('Runtime.evaluate', {
          expression: 'document.querySelectorAll("*").length'
        });
        console.log('DOM node count:', domCount.result.value);

        const svgElements = await send('Runtime.evaluate', {
          expression: 'document.querySelectorAll("svg *").length'
        });
        console.log('SVG child elements count:', svgElements.result.value);

        const stationLabelsCount = await send('Runtime.evaluate', {
          expression: 'document.querySelectorAll(".station-label").length'
        });
        console.log('Station label elements in DOM:', stationLabelsCount.result.value);

        const circleMarkerCount = await send('Runtime.evaluate', {
          expression: 'document.querySelectorAll(".station-node").length'
        });
        console.log('CircleMarker elements in DOM:', circleMarkerCount.result.value);

        // マップをパン・ズームさせたときの速度・FPS・レイアウト時間をテスト
        console.log('Testing pan and zoom performance...');
        const perfResult = await send('Runtime.evaluate', {
          expression: `(async () => {
            const start = performance.now();
            // ズームイン・ズームアウト・パンのベンチマーク
            const map = window.L && document.querySelector('#map') ? window.map || (function(){
              // leaflet map instance finding
              for (const k in window) {
                if (window[k] && window[k]._leaflet_id) return window[k];
              }
            })() : null;

            if (!map) return { error: 'map not found' };

            const times = [];
            for (let z = 9; z <= 13; z++) {
              const t0 = performance.now();
              map.setZoom(z, { animate: false });
              times.push({ zoom: z, ms: performance.now() - t0 });
            }
            for (let z = 12; z >= 9; z--) {
              const t0 = performance.now();
              map.setZoom(z, { animate: false });
              times.push({ zoom: z, ms: performance.now() - t0 });
            }

            // パンのベンチマーク
            const panTimes = [];
            for (let i = 0; i < 10; i++) {
              const t0 = performance.now();
              map.panBy([50, 50], { animate: false });
              panTimes.push(performance.now() - t0);
            }

            return {
              zoomTimes: times,
              panTimes: panTimes,
              totalMs: performance.now() - start
            };
          })()`,
          awaitPromise: true,
          returnByValue: true
        });

        console.log('Performance result:', JSON.stringify(perfResult.result.value, null, 2));

        ws.close();
        cleanup();
      });

    } catch (e) {
      console.error('Error during profiling:', e);
      cleanup();
    }
  }, 2500);

  function cleanup() {
    chrome.kill();
    server.close();
    process.exit(0);
  }
});
