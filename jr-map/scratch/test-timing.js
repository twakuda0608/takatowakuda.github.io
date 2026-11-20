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
    .station-label { font-size: 12px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <pre id="output"></pre>
  <script>
    const logs = [];
    const map = L.map('map', { center: [35.68, 139.76], zoom: 10, preferCanvas: true });
    const canvasRenderer = L.canvas();

    // Circle marker on canvas at Tokyo
    const circle = L.circleMarker([35.72, 139.80], {
      renderer: canvasRenderer,
      radius: 5
    }).addTo(map);

    // Label with leaflet-zoom-animated
    const icon1 = L.divIcon({ className: 'station-label leaflet-zoom-animated', html: 'WithAnim' });
    const m1 = L.marker([35.72, 139.80], { icon: icon1 }).addTo(map);

    // Label WITHOUT leaflet-zoom-animated (current jr-map bug)
    const icon2 = L.divIcon({ className: 'station-label', html: 'WithoutAnim' });
    const m2 = L.marker([35.72, 139.80], { icon: icon2 }).addTo(map);
    m2.getElement().className = 'leaflet-marker-icon station-label'; // strips leaflet-zoom-animated

    const el1 = m1.getElement();
    const el2 = m2.getElement();

    setTimeout(() => {
      logs.push('Before zoom:');
      logs.push('  el1 transform: ' + el1.style.transform);
      logs.push('  el2 transform: ' + el2.style.transform);

      map.setZoom(11);

      // Check immediately (frame 0 after setZoom)
      logs.push('Immediate after setZoom(11):');
      logs.push('  el1 transform: ' + el1.style.transform);
      logs.push('  el2 transform: ' + el2.style.transform);
      logs.push('  el1 computed: ' + getComputedStyle(el1).transform);
      logs.push('  el2 computed: ' + getComputedStyle(el2).transform);

      setTimeout(() => {
        logs.push('After 100ms (during anim):');
        logs.push('  el1 computed: ' + getComputedStyle(el1).transform);
        logs.push('  el2 computed: ' + getComputedStyle(el2).transform);
      }, 100);

      setTimeout(() => {
        logs.push('After 300ms (zoom ended):');
        logs.push('  el1 computed: ' + getComputedStyle(el1).transform);
        logs.push('  el2 computed: ' + getComputedStyle(el2).transform);
        document.getElementById('output').textContent = JSON.stringify(logs, null, 2);
      }, 350);
    }, 100);
  </script>
</body>
</html>`;

const tmpHtml = path.join(os.tmpdir(), 'test_zoom_timing.html');
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
