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

// 経由地に「防府」または「柳井」（山陽本線固有駅）を指定した場合
const r = RouteEngine.searchMarsRoute(getStationId('東京'), [getStationId('神戸'), getStationId('柳井')], getStationId('山口'));
console.log('東京 -> (神戸・柳井) -> 山口 dist:', r.totalDist);
r.lineRuns.forEach(lr => console.log(lr.lineName, lr.dist + 'km'));
