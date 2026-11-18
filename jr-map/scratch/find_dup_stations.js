const fs = require('fs');
const dump = JSON.parse(fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/batch4_stations_dump.json', 'utf8'));

// build-data.js の全駅リストから同名駅を調査
const vm = require('vm');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('jr-map/data/build-data.js', 'utf8'), sandbox);
const JR_STATIONS = sandbox.window.JR_STATIONS;

const nameMap = {};
Object.values(JR_STATIONS).forEach(st => {
  if (!nameMap[st.name]) nameMap[st.name] = [];
  nameMap[st.name].push({ id: st.id, pref: st.pref, lines: st.lines });
});

for (const [name, list] of Object.entries(nameMap)) {
  if (list.length > 1) {
    console.log(`Duplicate station: "${name}" (${list.length} stations):`, list.map(s => `${s.id} in [${s.lines.join(',')}] (${s.pref})`).join(' | '));
  }
}
