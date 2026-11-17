const { spawn } = require('child_process');

async function main() {
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const url = "file:///C:/takatowakuda.github.io/jr-map/index.html";
  const port = 9222;

  const chromeProc = spawn(chromePath, [
    '--headless',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    url
  ]);

  // Chrome の起動待ち
  let list = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      list = await res.json();
      if (list && list.length > 0) break;
    } catch (e) {}
  }

  if (!list || list.length === 0) {
    console.error('Failed to connect to Chrome CDP');
    chromeProc.kill();
    return;
  }

  const page = list.find(p => p.type === 'page') || list[0];
  console.log('Connecting to page:', page.title, page.webSocketDebuggerUrl);

  const ws = new WebSocket(page.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.on('open', async () => {
    console.log('WebSocket connected');
    // コンソールとランタイムログを有効化
    await send('Runtime.enable');
    await send('Console.enable');

    // ページの初期化完了待ち
    await new Promise(r => setTimeout(r, 2500));

    // 現在のズームとマップ状態を評価
    console.log('\n--- Evaluating initial map state ---');
    let res = await send('Runtime.evaluate', {
      expression: `
        (() => {
          if (!window.map) return 'No window.map';
          return {
            zoom: window.map.getZoom(),
            center: window.map.getCenter(),
            bounds: window.map.getBounds()
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Initial Map:', res.result ? res.result.value : res);

    // ズームイン実行 (zoom + 1)
    console.log('\n--- Simulating map.setZoom(zoom + 1) ---');
    res = await send('Runtime.evaluate', {
      expression: `
        (() => {
          try {
            const z = window.map.getZoom();
            window.map.setZoom(z + 1);
            return 'setZoom executed to ' + (z + 1);
          } catch (e) {
            return 'setZoom error: ' + e.message + '\\n' + e.stack;
          }
        })()
      `,
      returnByValue: true
    });
    console.log('setZoom Result:', res.result ? res.result.value : res);

    // ズーム後のDOMやスタイル、transformをチェック
    await new Promise(r => setTimeout(r, 1000));

    res = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const mapEl = document.getElementById('map');
          const mapPane = mapEl.querySelector('.leaflet-map-pane');
          const overlayPane = mapEl.querySelector('.leaflet-overlay-pane');
          const svg = overlayPane ? overlayPane.querySelector('svg') : null;
          const labelsGroup = document.getElementById('svg-line-labels-group');
          const stationLabels = document.querySelectorAll('.station-label');
          
          let visibleLineTexts = 0;
          if (labelsGroup) {
            labelsGroup.querySelectorAll('.svg-line-text').forEach(el => {
              if (el.style.display !== 'none') visibleLineTexts++;
            });
          }

          let visibleStationLabels = 0;
          stationLabels.forEach(el => {
            if (el.style.display !== 'none') visibleStationLabels++;
          });

          return {
            zoom: window.map ? window.map.getZoom() : null,
            mapPaneTransform: mapPane ? mapPane.style.transform : null,
            overlayPaneTransform: overlayPane ? overlayPane.style.transform : null,
            svgAttrs: svg ? {
              viewBox: svg.getAttribute('viewBox'),
              width: svg.getAttribute('width'),
              height: svg.getAttribute('height'),
              style: svg.getAttribute('style')
            } : null,
            visibleLineTexts,
            visibleStationLabels
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Post-zoom State:', res.result ? res.result.value : res);

    await new Promise(r => setTimeout(r, 500));
    ws.close();
    chromeProc.kill();
    process.exit(0);
  });

  ws.on('message', data => {
    const msg = JSON.parse(data.toString());
    if (msg.method === 'Runtime.consoleAPICalled') {
      const args = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
      console.log(`[BROWSER CONSOLE ${msg.params.type.toUpperCase()}]`, args);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[BROWSER UNCAUGHT EXCEPTION]', msg.params.exceptionDetails);
    } else if (msg.id && pending.has(msg.id)) {
      const { resolve } = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg);
    }
  });

  ws.on('error', err => {
    console.error('WS Error:', err.message);
    chromeProc.kill();
  });
}

main().catch(console.error);
