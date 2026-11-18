const fs = require('fs');
const content = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const vm = require('vm');
const s = { window: {} };
vm.createContext(s);
vm.runInContext(content, s);

const yosan = s.window.JR_LINES.find(l => l.id === 'shikoku-yosan');
yosan.stations.slice(62, 82).forEach((id, idx) => {
  console.log((idx + 62), id, s.window.JR_STATIONS[id].name);
});
