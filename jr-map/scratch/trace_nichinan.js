const routeEngine = require('../route-engine.js');
const buildData = require('../data/build-data.js');
const officialKilos = require('../data/official-kilos.js');
routeEngine.initGraph(buildData.JR_STATIONS, buildData.JR_LINES);

const stStart = Object.values(buildData.JR_STATIONS).find(s => s.name === '南宮崎' && s.lines.includes('kyushu-nichinan'));
const stGoal = Object.values(buildData.JR_STATIONS).find(s => s.name === '志布志' && s.lines.includes('kyushu-nichinan'));
const result = routeEngine.findRoute(stStart.id, stGoal.id);
console.log('Total km:', result.totalDistanceKm, 'hasEstimated:', result.hasEstimatedDistance);
for (let i = 0; i < result.path.length - 1; i++) {
  const u = result.path[i];
  const v = result.path[i+1];
  const dist = routeEngine.getEdgeDistance(u, v, 'kyushu-nichinan');
  console.log(`${buildData.JR_STATIONS[u].name} -> ${buildData.JR_STATIONS[v].name}: ${dist} km`);
}
