const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
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
    const icon1 = L.divIcon({ className: 'test-with-anim', html: 'WithAnim' });
    const m1 = L.marker([35.72, 139.80], { icon: icon1 }).addTo(map);

    const icon2 = L.divIcon({ className: 'test-no-anim', html: 'NoAnim' });
    const m2 = L.marker([35.72, 139.80], { icon: icon2 }).addTo(map);
    m2.getElement().className = 'leaflet-marker-icon test-no-anim'; // stripped

    const el1 = m1.getElement();
    const el2 = m2.getElement();

    logs.push('Initial 1: ' + el1.style.transform);
    logs.push('Initial 2: ' + el2.style.transform);

    map.on('zoomstart', () => {
      logs.push('zoomstart 1: ' + el1.style.transform);
      logs.push('zoomstart 2: ' + el2.style.transform);
    });
    map.on('zoomanim', (e) => {
      logs.push('zoomanim 1: ' + el1.style.transform + ' (transition: ' + getComputedStyle(el1).transition + ')');
      logs.push('zoomanim 2: ' + el2.style.transform + ' (transition: ' + getComputedStyle(el2).transition + ')');
    });
    map.on('zoomend', () => {
      logs.push('zoomend 1: ' + el1.style.transform);
      logs.push('zoomend 2: ' + el2.style.transform);
      document.getElementById('output').textContent = JSON.stringify(logs, null, 2);
    });

    map.setZoom(11);
  </script>
</body>
</html>`;

const tmpHtml = path.join(os.tmpdir(), 'test_zoom.html');
fs.writeFileSync(tmpHtml, script, 'utf8');

const res = spawnSync(chromePath, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--allow-file-access-from-files',
  '--virtual-time-budget=2000',
  '--dump-dom',
  'file:///' + tmpHtml.replace(/\\\\/g, '/')
], { encoding: 'utf8' });

const m = res.stdout.match(/<pre id="output">([\s\S]*?)<\/pre>/);
if (m) console.log(m[1]);
else console.log('Not found in DOM');
