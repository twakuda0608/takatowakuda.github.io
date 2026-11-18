const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

async function testWithCDP() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9333;
  
  const proc = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${port}`,
    'about:blank'
  ]);

  // wait for port
  await new Promise(r => setTimeout(r, 1000));

  // get ws url
  const res = await fetch(`http://127.0.0.1:${port}/json`);
  const list = await res.json();
  const page = list[0];
  console.log('Target page WS:', page.webSocketDebuggerUrl);

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      const handler = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.id === msgId) {
          ws.removeEventListener('message', handler);
          resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await new Promise(resolve => ws.addEventListener('open', resolve));

  ws.addEventListener('message', (evt) => {
    const data = JSON.parse(evt.data);
    if (data.method === 'Runtime.consoleAPICalled') {
      console.log('[BROWSER CONSOLE]', data.params.type, data.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' '));
    }
    if (data.method === 'Runtime.exceptionThrown') {
      console.error('[BROWSER EXCEPTION]', data.params.exceptionDetails);
    }
  });

  await send('Runtime.enable');
  await send('Page.enable');

  const targetUrl = 'file:///' + path.resolve('jr-map/index.html').replace(/\\/g, '/');
  console.log('Navigating to:', targetUrl);
  await send('Page.navigate', { url: targetUrl });

  await new Promise(r => setTimeout(r, 3000));

  // check map container children and SVG elements
  const evalResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const mapEl = document.getElementById('map');
      const paths = document.querySelectorAll('#map svg path');
      const circles = document.querySelectorAll('#map .station-marker');
      const leafletPanes = document.querySelectorAll('#map .leaflet-pane');
      return {
        mapInnerHTMLSlice: mapEl ? mapEl.innerHTML.slice(0, 300) : null,
        pathCount: paths.length,
        stationMarkerCount: circles.length,
        leafletPanesCount: leafletPanes.length,
        linesLayerGroupCount: window.linesLayerGroup ? window.linesLayerGroup.getLayers().length : 'no linesLayerGroup',
        stationsLayerGroupCount: window.stationsLayerGroup ? window.stationsLayerGroup.getLayers().length : 'no stationsLayerGroup',
        state: window.STATE || null
      };
    })()`,
    returnByValue: true
  });

  console.log('Map status in browser:', JSON.stringify(evalResult.result.value, null, 2));

  ws.close();
  proc.kill();
}

testWithCDP().catch(console.error);
