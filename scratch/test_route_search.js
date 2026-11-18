const fs = require('fs');
globalThis.window = globalThis;
eval(fs.readFileSync('jr-map/data/build-data.js', 'utf8'));
eval(fs.readFileSync('jr-map/data/tracks.js', 'utf8'));

const STATIONS = window.JR_STATIONS;
const LINES = window.JR_LINES;
const TRACKS = window.JR_TRACKS;

// 1. tracks.js の垂井修正を適用
const ch1 = TRACKS['tokai-tokaido'][1].map(p => p[0]>90 ? [p[1],p[0]] : p);
const ch7 = TRACKS['tokai-tokaido'][7].map(p => p[0]>90 ? [p[1],p[0]] : p);
const fullTaruiLine = [...ch7.slice(0, 66), ...ch1.slice(174, 223)];
TRACKS['tokai-tokaido'][7] = fullTaruiLine;

// 美濃赤坂線
const ogakiToArao = ch1.slice(173, 223).reverse();
const minoLine = [...ogakiToArao, ...ch7.slice(66, 89)];
TRACKS['tokai-minoakasaka'] = [minoLine];

// 2. route-engine.js を読み込みテスト
const RouteEngine = require('../jr-map/route-engine.js');

// 東京駅ID, 京都駅ID
let tokyoId, kyotoId, ogakiId, taruiId;
Object.entries(STATIONS).forEach(([id, st]) => {
  if (st.name === '東京') tokyoId = id;
  if (st.name === '京都') kyotoId = id;
  if (st.name === '大垣') ogakiId = id;
  if (st.name === '垂井') taruiId = id;
});

console.log('tokyoId:', tokyoId, 'kyotoId:', kyotoId, 'ogakiId:', ogakiId, 'taruiId:', taruiId);

// 探索テスト: 東京 -> 京都 (在来線)
const routeZairai = RouteEngine.searchMarsRoute(tokyoId, [], kyotoId, { useShinkansen: false });
console.log('--- 東京 -> 京都 (在来線) ---');
console.log('Success:', routeZairai.success);
console.log('Total Km (raw):', routeZairai.totalKm);
console.log('Mars Format:', routeZairai.marsFormat);
console.log('Sections count:', routeZairai.sections ? routeZairai.sections.length : 0);

// 探索テスト: 東京 -> 京都 (新幹線)
const routeShinkansen = RouteEngine.searchMarsRoute(tokyoId, [], kyotoId, { useShinkansen: true });
console.log('--- 東京 -> 京都 (新幹線) ---');
console.log('Success:', routeShinkansen.success);
console.log('Total Km (raw):', routeShinkansen.totalKm);
console.log('Mars Format:', routeShinkansen.marsFormat);

// ジオメトリテスト: 大垣 -> 垂井
const ogakiTaruiCoords = RouteEngine.getSegmentCoords(TRACKS, STATIONS, 'tokai-tokaido', ogakiId, taruiId);
console.log('--- 大垣 -> 垂井 ジオメトリ ---');
console.log('Points count:', ogakiTaruiCoords.length);
let maxLat = -Infinity;
ogakiTaruiCoords.forEach(p => { if (p[0] > maxLat) maxLat = p[0]; });
console.log('Max Lat in Ogaki -> Tarui:', maxLat, '(Should be < 35.375)');
