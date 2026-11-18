const fs = require('fs');
const vm = require('vm');

const sandbox = { window: {}, console, require, module: { exports: {} } };
vm.createContext(sandbox);

vm.runInContext(fs.readFileSync('jr-map/data/build-data.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/official_kilos_final_complete.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('jr-map/route-engine.js', 'utf8'), sandbox);

const RouteEngine = sandbox.window.JR_ROUTE_ENGINE;
const JR_STATIONS = sandbox.window.JR_STATIONS;
const JR_LINES = sandbox.window.JR_LINES;

sandbox.window.applyOfficialKilos(JR_LINES);
RouteEngine.buildGraph(JR_LINES, JR_STATIONS);

const uetsu = JR_LINES.find(l => l.id === 'uetsu-main');
console.log('Total uetsu stations:', uetsu.stations.length);

let total = 0;
for (let i = 0; i < uetsu.stations.length - 1; i++) {
  const u = uetsu.stations[i];
  const v = uetsu.stations[i+1];
  const uName = JR_STATIONS[u].name;
  const vName = JR_STATIONS[v].name;
  const ku = uetsu.stationKilos[u];
  const kv = uetsu.stationKilos[v];
  const d = Math.abs(kv - ku);
  total += d;
  if (d > 10) {
    console.log(`${i}: ${uName}(${ku}) -> ${vName}(${kv}): ${d.toFixed(1)} km`);
  }
}
console.log('Total sum:', total.toFixed(1), 'km');
