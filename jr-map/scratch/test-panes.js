const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const script = `<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="file:///C:/takatowakuda.github.io/jr-map/scratch/leaflet.css">
  <script src="file:///C:/takatowakuda.github.io/jr-map/scratch/leaflet.js"></script>
  <style>
    #map { width: 400px; height: 400px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <pre id="output"></pre>
  <script>
    const logs = [];
    const map = L.map('map', { center: [35.68, 139.76], zoom: 10, preferCanvas: true });
    const icon = L.divIcon({ className: 'station-label', html: 'Tokyo' });
    const m = L.marker([35.72, 139.80], { icon }).addTo(map);

    const mapPane = map.getPanes().mapPane;
    const markerPane = map.getPanes().markerPane;
    const overlayPane = map.getPanes().overlayPane;
    const el = m.getElement();

    map.on('zoomanim', (e) => {
      logs.push('zoomanim marker: ' + el.style.transform);
      logs.push('zoomanim mapPane: ' + mapPane.style.transform);
    });

    map.on('zoomend', () => {
      logs.push('zoomend marker: ' + el.style.transform);
      logs.push('zoomend mapPane: ' + mapPane.style.transform);
      document.getElementById('output').textContent = JSON.stringify(logs, null, 2);
    });

    setTimeout(() => {
      map.setZoom(11);
    }, 50);
  </script>
</body>
</html>`;

const tmpHtml = path.join(os.tmpdir(), 'test_panes.html');
fs.writeFileSync(tmpHtml, script, 'utf8');

const res = spawnSync(chromePath, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--allow-file-access-from-files',
  '--virtual-time-budget=2000',
  '--dump-dom',
  'file:///' + tmpHtml.replace(/\\/g, '/')
], { encoding: 'utf8' });

const m = res.stdout.match(/<pre id="output">([\s\S]*?)<\/pre>/);
if (m) console.log(m[1]);
else console.log('Not found');
