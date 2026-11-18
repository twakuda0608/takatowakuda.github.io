const fs = require('fs');
const vm = require('vm');

const sandbox = { window: {}, console, require, module: { exports: {} } };
vm.createContext(sandbox);

vm.runInContext(fs.readFileSync('jr-map/data/build-data.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/official_kilos_updated.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('jr-map/route-engine.js', 'utf8'), sandbox);

const RouteEngine = sandbox.window.JR_ROUTE_ENGINE;
const JR_STATIONS = sandbox.window.JR_STATIONS;
const JR_LINES = sandbox.window.JR_LINES;

sandbox.window.applyOfficialKilos(JR_LINES);
RouteEngine.buildGraph(JR_LINES, JR_STATIONS);

function getStationId(name) {
  const stationList = Object.values(JR_STATIONS);
  const s = stationList.find(st => st.name === name);
  return s.id;
}

const r = RouteEngine.searchMarsRoute(getStationId('東京'), [getStationId('神戸'), getStationId('柳井')], getStationId('山口'));
console.log('Total dist:', r.totalDist);
r.lineRuns.forEach(lr => {
  console.log(lr.lineName, lr.fromName || lr.from, '->', lr.toName || lr.to, lr.dist + 'km');
});
