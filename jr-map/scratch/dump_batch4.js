const fs = require('fs');
const vm = require('vm');

const sandbox = { window: {}, console, require, module: { exports: {} } };
vm.createContext(sandbox);

vm.runInContext(fs.readFileSync('jr-map/data/build-data.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('jr-map/data/official-kilos.js', 'utf8'), sandbox);

const JR_LINES = sandbox.window.JR_LINES;
const JR_STATIONS = sandbox.window.JR_STATIONS;
const registeredKilos = sandbox.window.JR_OFFICIAL_KILOS || sandbox.module.exports.OFFICIAL_STATION_KILOS;

const unregisteredLines = JR_LINES.filter(l => !registeredKilos[l.id]);

const dump = {};
unregisteredLines.forEach(line => {
  dump[line.id] = {
    id: line.id,
    name: line.name,
    category: line.category,
    stations: line.stations.map((stId, idx) => {
      const st = JR_STATIONS[stId];
      return {
        idx,
        id: stId,
        name: st ? st.name : stId,
        lat: st ? st.lat : null,
        lng: st ? st.lng : null
      };
    })
  };
});

fs.writeFileSync(
  'C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/batch4_stations_dump.json',
  JSON.stringify(dump, null, 2),
  'utf8'
);

console.log('Dumped', Object.keys(dump).length, 'lines.');
let totalStations = 0;
Object.values(dump).forEach(d => totalStations += d.stations.length);
console.log('Total stations across 55 lines:', totalStations);
