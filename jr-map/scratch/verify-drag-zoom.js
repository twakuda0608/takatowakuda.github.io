const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const script = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="file:///C:/takatowakuda.github.io/jr-map/scratch/leaflet.css">
  <script src="file:///C:/takatowakuda.github.io/jr-map/scratch/leaflet.js"></script>
  <link rel="stylesheet" href="file:///C:/takatowakuda.github.io/common.css">
  <link rel="stylesheet" href="file:///C:/takatowakuda.github.io/jr-map/style.css">
  <style>
    #map { width: 800px; height: 600px; }
  </style>
</head>
<body class="theme-light">
  <div id="app">
    <div id="map"></div>
  </div>
  <pre id="output"></pre>
  <script src="file:///C:/takatowakuda.github.io/jr-map/topojson-client.min.js"></script>
  <script src="file:///C:/takatowakuda.github.io/jr-map/data/borders.js"></script>
  <script src="file:///C:/takatowakuda.github.io/jr-map/data/build-data.js"></script>
  <script src="file:///C:/takatowakuda.github.io/jr-map/data/official-kilos.js"></script>
  <script src="file:///C:/takatowakuda.github.io/jr-map/data/tracks.js"></script>
  <script src="file:///C:/takatowakuda.github.io/jr-map/fare-engine.js"></script>
  <script src="file:///C:/takatowakuda.github.io/jr-map/route-engine.js"></script>
  <script src="file:///C:/takatowakuda.github.io/jr-map/app.js"></script>

  <script>
    (function() {
      const logs = [];
      const getVisibleLabels = () => {
        const labels = [];
        const els = document.querySelectorAll('.station-label');
        els.forEach(el => {
          if (el.style.display !== 'none' && el.textContent.trim()) {
            labels.push(el.textContent.trim());
          }
        });
        return labels.sort();
      };

      const initialLabels = getVisibleLabels();
      logs.push('Initial visible count at zoom ' + map.getZoom() + ': ' + initialLabels.length);
      logs.push('Initial labels sample: ' + initialLabels.slice(0, 8).join(', '));

      // Pan by small amount (15px)
      const center = map.getCenter();
      const pt = map.latLngToContainerPoint(center);
      const newPt = L.point(pt.x + 15, pt.y);
      const newCenter = map.containerPointToLatLng(newPt);
      map.panTo(newCenter, { animate: false });

      const afterPan1Labels = getVisibleLabels();
      logs.push('After 15px pan visible count: ' + afterPan1Labels.length);

      const missing = initialLabels.filter(name => !afterPan1Labels.includes(name));
      logs.push('Missing after 15px pan: ' + (missing.length ? missing.join(', ') : 'NONE (100% stable!)'));

      // Test Zoom
      let zoomstartFired = false;
      let hiddenDuringZoom = false;
      map.on('zoomstart', () => {
        zoomstartFired = true;
        const pane = map.getPane('stationLabelsPane');
        hiddenDuringZoom = (pane && (pane.style.opacity === '0' || getComputedStyle(pane).visibility === 'hidden'));
      });

      map.on('zoomend', () => {
        const pane = map.getPane('stationLabelsPane');
        const visibleAfterZoom = (pane && pane.style.opacity === '1');
        logs.push('Zoom test: zoomstartFired=' + zoomstartFired + ', hiddenDuringZoom=' + hiddenDuringZoom + ', visibleAfterZoom=' + visibleAfterZoom);
        logs.push('Zoomed labels count at zoom ' + map.getZoom() + ': ' + getVisibleLabels().length);
        document.getElementById('output').textContent = JSON.stringify(logs, null, 2);
      });

      map.setZoom(10);
    })();
  </script>
</body>
</html>`;

const tmpHtml = path.join(os.tmpdir(), 'test_verify_map.html');
fs.writeFileSync(tmpHtml, script, 'utf8');

const res = spawnSync(chromePath, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--allow-file-access-from-files',
  '--dump-dom',
  'file:///' + tmpHtml.replace(/\\/g, '/')
], { encoding: 'utf8' });

const m = res.stdout.match(/<pre id="output">([\s\S]*?)<\/pre>/);
if (m) console.log(m[1]);
else console.log('Not found, output length:', res.stdout ? res.stdout.length : 0);
