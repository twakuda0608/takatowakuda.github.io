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

console.log('=== TEST 1: Tokyo -> Kyoto (Continuous Single Highlight) ===');
const res1 = RouteEngine.searchMarsRoute(graph, window.JR_TRACKS, window.JR_STATIONS, [findId('東京'), findId('京都')], { useShinkansen: false, searchMode: 'shortest' });
console.log('Success:', res1.success);
console.log('normalPolylines count:', res1.normalPolylines.length);
console.log('duplicatePolylines count:', res1.duplicatePolylines.length);
if (res1.normalPolylines.length > 0) {
  console.log('Total coordinates in normalPolyline[0]:', res1.normalPolylines[0].length);
}
// 駅数とポリライン数の比率（駅数は100以上だがポリラインは1〜2本！）
console.log('Stations count:', res1.allStationIds.length, 'vs Polylines count:', res1.normalPolylines.length);
if (res1.normalPolylines.length <= 3 && res1.allStationIds.length > 50) {
  console.log('[PASS] Long continuous highlight verified! (Not divided by station)');
} else {
  console.log('[FAIL] Too many polylines!');
}

console.log('\n=== TEST 2: Nagoya -> Mino-Akasaka -> Maibara (Red Duplicate Highlight) ===');
const res2 = RouteEngine.searchMarsRoute(graph, window.JR_TRACKS, window.JR_STATIONS, [findId('名古屋'), findId('美濃赤坂'), findId('米原')], { useShinkansen: false, searchMode: 'shortest' });
console.log('Success:', res2.success);
console.log('isOneWayTrip:', res2.isOneWayTrip);
console.log('normalPolylines count:', res2.normalPolylines.length);
console.log('duplicatePolylines count:', res2.duplicatePolylines.length);
if (res2.duplicatePolylines.length > 0) {
  console.log('Duplicate polyline points:', res2.duplicatePolylines[0].length);
  console.log('[PASS] Duplicate red polyline properly generated!');
} else {
  console.log('[FAIL] Duplicate polyline not generated!');
}

console.log('\n=== TEST 3: Duplicate Stations Highlight ===');
console.log('Duplicate station IDs:', res2.duplicateStationIds);
const dupStationNames = res2.duplicateStationIds.map(id => STATIONS[id]?.name);
console.log('Duplicate station names:', dupStationNames);
if (dupStationNames.includes('大垣') && dupStationNames.includes('美濃赤坂')) {
  console.log('[PASS] Ogaki and Mino-Akasaka correctly identified as duplicate stations!');
} else {
  console.log('[FAIL] Duplicate stations missing!');
}
