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

function traceLine(lineId) {
  const line = JR_LINES.find(l => l.id === lineId);
  console.log(`\n=== Trace for ${line.name} (${line.id}) ===`);
  const kilos = line.stationKilos || {};
  let prevK = null;
  let prevName = null;
  line.stations.forEach((stId, idx) => {
    const st = JR_STATIONS[stId];
    const name = st ? st.name : stId;
    const k = kilos[stId] !== undefined ? kilos[stId] : kilos[name];
    const diff = (prevK !== null && k !== undefined) ? (k - prevK).toFixed(1) : '-';
    if (idx < 10 || idx > line.stations.length - 10 || Math.abs(diff) > 20) {
      console.log(`  ${idx}: ${name} (${stId}) -> ${k} km (diff: ${diff})`);
    }
    prevK = k;
    prevName = name;
  });
}

traceLine('uetsu-main');
traceLine('hokkaido-chitose');
traceLine('hokkaido-muroran');
traceLine('hokkaido-soya');
traceLine('kyushu-kyudai');
traceLine('kyushu-nichinan');
