const fs = require('fs');

globalThis.window = globalThis;
eval(fs.readFileSync('jr-map/data/build-data.js', 'utf8'));
eval(fs.readFileSync('jr-map/data/tracks.js', 'utf8'));
const RouteEngine = require('../jr-map/route-engine.js');

const STATIONS = window.JR_STATIONS;
const TRACKS = window.JR_TRACKS;

// テスト1: 東京 -> 品川 (東海道本線)
const coords1 = RouteEngine.getSegmentCoords(TRACKS, STATIONS, 'east-tokaido', 'tokyo', 'shinagawa');
console.log('Tokyo -> Shinagawa coords count:', coords1 ? coords1.length : 0);
if (coords1 && coords1.length > 2) {
  console.log('First:', coords1[0], 'Last:', coords1[coords1.length - 1]);
  console.log('Is curved (count > 2)?:', coords1.length > 2);
}

// テスト2: 大垣 -> 垂井 (東海 東海道本線)
let ogakiId, taruiId;
for (const id in STATIONS) {
  if (STATIONS[id].name === '大垣') ogakiId = id;
  if (STATIONS[id].name === '垂井') taruiId = id;
}
const coords2 = RouteEngine.getSegmentCoords(TRACKS, STATIONS, 'tokai-tokaido', ogakiId, taruiId);
console.log('Ogaki -> Tarui coords count:', coords2 ? coords2.length : 0);
if (coords2 && coords2.length > 2) {
  console.log('First:', coords2[0], 'Last:', coords2[coords2.length - 1]);
}
