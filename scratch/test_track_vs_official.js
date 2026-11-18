const fs = require('fs');
globalThis.window = globalThis;
eval(fs.readFileSync('jr-map/data/build-data.js', 'utf8'));
eval(fs.readFileSync('jr-map/data/tracks.js', 'utf8'));
const RouteEngine = require('../jr-map/route-engine.js');

const STATIONS = window.JR_STATIONS;
const LINES = window.JR_LINES;
const TRACKS = window.JR_TRACKS;

// 例: 東京〜三鷹 の各駅間で、
// 1. 直線距離
// 2. 軌道ポリライン実長
// 3. 公式営業キロ程
// を比較してみよう！

const chuoMain = LINES.find(l => l.id === 'chuo-main');
const tokyoIdx = chuoMain.stations.findIndex(id => STATIONS[id].name === '東京');
const mitakaIdx = chuoMain.stations.findIndex(id => STATIONS[id].name === '三鷹');

let sumStraight = 0;
let sumTrack = 0;

for (let i = tokyoIdx; i < mitakaIdx; i++) {
  const u = chuoMain.stations[i];
  const v = chuoMain.stations[i+1];
  const stU = STATIONS[u];
  const stV = STATIONS[v];

  // 直線距離
  const dLat = (stU.lat - stV.lat) * 111.13;
  const dLng = (stU.lng - stV.lng) * 91.0;
  const straight = Math.sqrt(dLat*dLat + dLng*dLng);
  sumStraight += straight;

  // 軌道ポリライン長
  const coords = RouteEngine.getSegmentCoords(TRACKS, STATIONS, 'chuo-main', u, v);
  let segTrack = 0;
  for (let j = 0; j < coords.length - 1; j++) {
    const p1 = coords[j];
    const p2 = coords[j+1];
    const dl = (p1[0] - p2[0]) * 111.13;
    const dg = (p1[1] - p2[1]) * 91.0;
    segTrack += Math.sqrt(dl*dl + dg*dg);
  }
  sumTrack += segTrack;
  console.log(`${stU.name} -> ${stV.name}: straight=${straight.toFixed(2)}km, track=${segTrack.toFixed(2)}km`);
}

console.log('Total straight:', sumStraight.toFixed(1), 'km');
console.log('Total track length:', sumTrack.toFixed(1), 'km');
console.log('Official kilo:', 24.1, 'km');
