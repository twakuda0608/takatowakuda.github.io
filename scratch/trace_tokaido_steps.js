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

const tokyoId = findId('東京');
const maibaraId = findId('米原');
const atamiId = findId('熱海');
const shizuokaId = findId('静岡');
const nagoyaId = findId('名古屋');

const graph = RouteEngine.buildGraph(window.JR_STATIONS, window.JR_LINES);

// 東京 -> 熱海
const r1 = RouteEngine.searchMarsRoute(graph, window.JR_TRACKS, window.JR_STATIONS, [tokyoId, atamiId], { useShinkansen: false });
console.log('Tokyo -> Atami:', r1.marsString, r1.totalKm);

// 熱海 -> 名古屋
const r2 = RouteEngine.searchMarsRoute(graph, window.JR_TRACKS, window.JR_STATIONS, [atamiId, nagoyaId], { useShinkansen: false });
console.log('Atami -> Nagoya:', r2.marsString, r2.totalKm);

// 名古屋 -> 米原
const r3 = RouteEngine.searchMarsRoute(graph, window.JR_TRACKS, window.JR_STATIONS, [nagoyaId, maibaraId], { useShinkansen: false });
console.log('Nagoya -> Maibara:', r3.marsString, r3.totalKm);

console.log('Tokaido Full sum:', (r1.totalKm + r2.totalKm + r3.totalKm).toFixed(1));

// 東京 -> 塩尻
const c1 = RouteEngine.searchMarsRoute(graph, window.JR_TRACKS, window.JR_STATIONS, [tokyoId, findId('塩尻')], { useShinkansen: false });
console.log('Tokyo -> Shiojiri:', c1.marsString, c1.totalKm);

// 塩尻 -> 岐阜
const c2 = RouteEngine.searchMarsRoute(graph, window.JR_TRACKS, window.JR_STATIONS, [findId('塩尻'), findId('岐阜')], { useShinkansen: false });
console.log('Shiojiri -> Gifu:', c2.marsString, c2.totalKm);

// 岐阜 -> 米原
const c3 = RouteEngine.searchMarsRoute(graph, window.JR_TRACKS, window.JR_STATIONS, [findId('岐阜'), maibaraId], { useShinkansen: false });
console.log('Gifu -> Maibara:', c3.marsString, c3.totalKm);

console.log('Chuo Full sum:', (c1.totalKm + c2.totalKm + c3.totalKm).toFixed(1));
