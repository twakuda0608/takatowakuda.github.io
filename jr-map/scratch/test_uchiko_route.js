const fs = require('fs');
const vm = require('vm');

const sandbox = {
  window: {},
  console: console,
  require: require,
  module: { exports: {} }
};
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
  const stationList = Object.values(JR_STATIONS);
  const s = stationList.find(st => st.name === name);
  return s ? s.id : null;
}

// 1. Uchiko Line: Uchiko -> Niiya (5.3km)
const resUchiko = RouteEngine.searchMarsRoute(getStationId('内子'), [], getStationId('新谷'));
console.log('Uchiko -> Niiya:', resUchiko.totalDist, 'km, hasEstimatedDistance:', resUchiko.hasEstimatedDistance);

// 2. Matsuyama -> Uwajima (via Yosan new line: Uchiko)
const resMatsuyamaUwajima = RouteEngine.searchMarsRoute(getStationId('松山'), [getStationId('内子')], getStationId('宇和島'));
console.log('Matsuyama -> Uwajima (via Uchiko):', resMatsuyamaUwajima.totalDist, 'km, hasEstimatedDistance:', resMatsuyamaUwajima.hasEstimatedDistance);
console.log('Route path station names:');
console.log(resMatsuyamaUwajima.stationList.map(s => s.name).join(' -> '));
