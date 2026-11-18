const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.resolve('jr-map/index.html').replace(/\\/g, '/');

const res = spawnSync(chrome, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--virtual-time-budget=3000',
  '--dump-dom',
  `file:///${htmlPath}`
], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });

console.log('status:', res.status);
const out = res.stdout || '';
console.log('stdout length:', out.length);

// #map 内の状況を調べる
const mapIndex = out.indexOf('id="map"');
if (mapIndex !== -1) {
  console.log('map html slice:');
  console.log(out.slice(mapIndex, mapIndex + 500));
} else {
  console.log('#map not found');
}

// svg や leaflet-tile, leaflet-marker 等が含まれているか？
console.log('Has leaflet-container:', out.includes('leaflet-container'));
console.log('Has leaflet-pane:', out.includes('leaflet-pane'));
console.log('Has svg:', out.includes('<svg'));
console.log('Has station-node:', out.includes('station-node'));
console.log('Has line-path:', out.includes('line-path'));
