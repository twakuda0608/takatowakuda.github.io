const fs = require('fs');
const os = require('os');
const path = require('path');

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
  <script>
    window.errors = [];
    window.onerror = function(msg, url, line, col, err) {
      window.errors.push(msg + ' at ' + line + ':' + col);
      document.getElementById('output').textContent = 'ERROR: ' + JSON.stringify(window.errors);
    };
  </script>
  <script src="file:///C:/takatowakuda.github.io/jr-map/topojson-client.min.js"></script>
  <script src="file:///C:/takatowakuda.github.io/jr-map/data/borders.js"></script>
  <script src="file:///C:/takatowakuda.github.io/jr-map/data/build-data.js"></script>
  <script src="file:///C:/takatowakuda.github.io/jr-map/data/official-kilos.js"></script>
  <script src="file:///C:/takatowakuda.github.io/jr-map/data/tracks.js"></script>
  <script src="file:///C:/takatowakuda.github.io/jr-map/fare-engine.js"></script>
  <script src="file:///C:/takatowakuda.github.io/jr-map/route-engine.js"></script>
  <script src="file:///C:/takatowakuda.github.io/jr-map/app.js"></script>

  <script>
    try {
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
      logs.push('Initial count: ' + initialLabels.length);
      logs.push('Sample: ' + initialLabels.slice(0, 5).join(', '));

      document.getElementById('output').textContent = JSON.stringify(logs, null, 2);
    } catch (e) {
      document.getElementById('output').textContent = 'CATCH: ' + e.message + e.stack;
    }
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(os.tmpdir(), 'test_verify_map.html'), script, 'utf8');
console.log('Written test_verify_map.html');
