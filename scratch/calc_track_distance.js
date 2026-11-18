const fs = require('fs');
globalThis.window = globalThis;
eval(fs.readFileSync('jr-map/data/build-data.js', 'utf8'));
eval(fs.readFileSync('jr-map/data/tracks.js', 'utf8'));
const RouteEngine = require('../jr-map/route-engine.js');
const STATIONS = window.JR_STATIONS;

function findId(name) {
  for (const id in STATIONS) {
    if (STATIONS[id].name === name) return id;
  }
}

const graph = RouteEngine.buildGraph(window.JR_STATIONS, window.JR_LINES);

const res = RouteEngine.searchMarsRoute(
  graph,
  window.JR_TRACKS,
  window.JR_STATIONS,
  [findId('東京'), findId('京都')],
  { useShinkansen: false }
);

// geometryLatlngs (実軌道の全カーブポイント) の積算距離を計算
let trackTotalKm = 0;
const pts = res.geometryLatlngs;
for (let i = 0; i < pts.length - 1; i++) {
  const p1 = pts[i];
  const p2 = pts[i + 1];
  const dLat = (p1[0] - p2[0]) * 111.13;
  const dLng = (p1[1] - p2[1]) * 91.0;
  trackTotalKm += Math.sqrt(dLat * dLat + dLng * dLng);
}
console.log('Geometry points count:', pts.length);
console.log('Geometry polyline actual track length:', trackTotalKm.toFixed(1), 'km');
console.log('User target JR official kilo:', 513.6, 'km');
console.log('Ratio:', (513.6 / trackTotalKm).toFixed(4));
