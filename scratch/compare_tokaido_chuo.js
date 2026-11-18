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

// 東京 -> 米原 の探索
const res = RouteEngine.searchMarsRoute(graph, window.JR_TRACKS, window.JR_STATIONS, [findId('東京'), findId('米原')], { useShinkansen: false });
console.log('Tokyo -> Maibara (Auto):', res.marsString, 'Dist:', res.totalKm);

// 東京 -> 名古屋 -> 米原 の探索 (東海道本線経由)
const resTokaido = RouteEngine.searchMarsRoute(graph, window.JR_TRACKS, window.JR_STATIONS, [findId('東京'), findId('名古屋'), findId('米原')], { useShinkansen: false });
console.log('Tokyo -> Nagoya -> Maibara:', resTokaido.marsString, 'Dist:', resTokaido.totalKm);
