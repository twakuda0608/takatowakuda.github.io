const fs = require('fs');
globalThis.window = globalThis;
eval(fs.readFileSync('jr-map/data/build-data.js', 'utf8'));
eval(fs.readFileSync('jr-map/data/tracks.js', 'utf8'));
const RouteEngine = require('../jr-map/route-engine.js');
const STATIONS = window.JR_STATIONS;
const TRACKS = window.JR_TRACKS;

let ogakiId, taruiId, sekigaharaId;
for (const id in STATIONS) {
  if (STATIONS[id].name === '大垣') ogakiId = id;
  if (STATIONS[id].name === '垂井') taruiId = id;
  if (STATIONS[id].name === '関ヶ原') sekigaharaId = id;
}

const stOgaki = STATIONS[ogakiId];
const stTarui = STATIONS[taruiId];
const stSeki = STATIONS[sekigaharaId];

console.log('Ogaki:', stOgaki.lat, stOgaki.lng);
console.log('Tarui:', stTarui.lat, stTarui.lng);
console.log('Sekigahara:', stSeki.lat, stSeki.lng);

const chains = TRACKS['tokai-tokaido'] || [];
console.log('Total chains in tokai-tokaido:', chains.length);

// 大垣〜垂井間を getSegmentCoords がどう取得しているか調べる
function distSq(p1, p2) {
  const dLat = p1[0] - p2[0];
  const dLng = p1[1] - p2[1];
  return dLat * dLat + dLng * dLng;
}

chains.forEach((ch, idx) => {
  let minDOgaki = Infinity, minDTarui = Infinity, minDSeki = Infinity;
  ch.forEach(pt => {
    const lat = pt[0] > 90 ? pt[1] : pt[0];
    const lng = pt[0] > 90 ? pt[0] : pt[1];
    const dO = distSq([lat, lng], [stOgaki.lat, stOgaki.lng]);
    const dT = distSq([lat, lng], [stTarui.lat, stTarui.lng]);
    const dS = distSq([lat, lng], [stSeki.lat, stSeki.lng]);
    if (dO < minDOgaki) minDOgaki = dO;
    if (dT < minDTarui) minDTarui = dT;
    if (dS < minDSeki) minDSeki = dS;
  });
  console.log(`Chain ${idx}: points=${ch.length}, minDOgaki=${Math.sqrt(minDOgaki).toFixed(4)}, minDTarui=${Math.sqrt(minDTarui).toFixed(4)}, minDSeki=${Math.sqrt(minDSeki).toFixed(4)}`);
});

const segCoords = RouteEngine.getSegmentCoords(TRACKS, STATIONS, 'tokai-tokaido', ogakiId, taruiId);
console.log('Segment Coords count for Ogaki -> Tarui:', segCoords ? segCoords.length : 0);
if (segCoords && segCoords.length > 0) {
  console.log('First:', segCoords[0]);
  console.log('Mid:', segCoords[Math.floor(segCoords.length / 2)]);
  console.log('Last:', segCoords[segCoords.length - 1]);
}
