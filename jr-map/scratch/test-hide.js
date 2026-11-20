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
    const map = L.map('map', { center: [35.68, 139.76], zoom: 10 });
    const p = map.createPane('stationLabelsPane');
    p.classList.add('leaflet-zoom-hide');

    const icon = L.divIcon({ className: 'station-label', html: 'Tokyo' });
    const m = L.marker([35.72, 139.80], { icon: icon, pane: 'stationLabelsPane' }).addTo(map);

    logs.push('Initial visibility: ' + getComputedStyle(p).visibility);

    map.on('zoomstart', () => {
      logs.push('zoomstart visibility: ' + getComputedStyle(p).visibility);
      logs.push('container classes: ' + map.getContainer().className);
    });
    map.on('zoomanim', () => {
      logs.push('zoomanim visibility: ' + getComputedStyle(p).visibility);
    });
    map.on('zoomend', () => {
      logs.push('zoomend visibility: ' + getComputedStyle(p).visibility);
      document.getElementById('output').textContent = JSON.stringify(logs, null, 2);
    });

    setTimeout(() => {
      map.setZoom(11);
    }, 50);
  </script>
</body>
</html>`;

const tmpHtml = path.join(os.tmpdir(), 'test_zoom_hide.html');
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
