const data = require('C:/takatowakuda.github.io/jr-map/data/build-data.js');
const kilosMod = require('C:/takatowakuda.github.io/jr-map/data/official-kilos.js');
const RouteEngine = require('C:/takatowakuda.github.io/jr-map/route-engine.js');
kilosMod.applyOfficialKilos(data.JR_LINES);
const graph = RouteEngine.buildGraph(data.JR_LINES, data.JR_STATIONS);
const stations = data.JR_STATIONS;
const res = RouteEngine.searchMarsRoute(graph, null, stations, ['shin-osaka', 'hakata'], { useShinkansen: true });
console.log('TotalKm:', res.totalKm);
console.log('Mars:', res.marsString);
res.sections.forEach(s => {
  console.log(`  ${s.lineName}: ${s.deptName} -> ${s.destName} (${s.km}km, isEstimated: ${s.isEstimated})`);
});
