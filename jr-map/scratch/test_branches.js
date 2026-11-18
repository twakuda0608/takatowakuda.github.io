const fs = require('fs');
const vm = require('vm');

const sandbox = { window: {}, console, require, module: { exports: {} } };
vm.createContext(sandbox);

vm.runInContext(fs.readFileSync('jr-map/data/build-data.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('jr-map/data/official-kilos.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('jr-map/route-engine.js', 'utf8'), sandbox);

const RouteEngine = sandbox.window.JR_ROUTE_ENGINE;
const JR_STATIONS = sandbox.window.JR_STATIONS;
const JR_LINES = sandbox.window.JR_LINES;

sandbox.window.applyOfficialKilos(JR_LINES);
RouteEngine.buildGraph(JR_LINES, JR_STATIONS);

function getStationId(name) {
  const s = Object.values(JR_STATIONS).find(st => st.name === name);
  return s.id;
}

// 予讃線新線経由
const rUchiko = RouteEngine.searchMarsRoute(getStationId('高松'), [getStationId('松山'), getStationId('内子')], getStationId('宇和島'));
console.log('高松 -> (松山・内子) -> 宇和島:');
console.log('Total dist:', rUchiko.totalDist, 'km');
rUchiko.lineRuns.forEach(lr => console.log(' ', lr.lineName, lr.dist + 'km'));

// 和田岬線
const rWada = RouteEngine.searchMarsRoute(getStationId('兵庫'), [], getStationId('和田岬'));
console.log('兵庫 -> 和田岬:');
console.log('Total dist:', rWada.totalDist, 'km');
rWada.lineRuns.forEach(lr => console.log(' ', lr.lineName, lr.dist + 'km'));

// 仙崎支線
const rSenzaki = RouteEngine.searchMarsRoute(getStationId('長門市'), [], getStationId('仙崎'));
console.log('長門市 -> 仙崎:');
console.log('Total dist:', rSenzaki.totalDist, 'km');
rSenzaki.lineRuns.forEach(lr => console.log(' ', lr.lineName, lr.dist + 'km'));
