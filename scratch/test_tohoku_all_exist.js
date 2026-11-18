const fs = require('fs');
const dataCode = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const window = {};
eval(dataCode);

const stations = window.JR_STATIONS;
const tohokuSendai = window.JR_LINES.find(l => l.id === 'tohoku-main-sendai');
const tohokuStations = [...tohokuSendai.stations].reverse();

let allExist = true;
tohokuStations.forEach((id, idx) => {
  const s = stations[id];
  if (!s) {
    console.log(`MISSING: ${id}`);
    allExist = false;
  }
});
if (allExist) {
  console.log(`All ${tohokuStations.length} Tohoku Main stations exist! Start: ${stations[tohokuStations[0]].name}, End: ${stations[tohokuStations[tohokuStations.length-1]].name}`);
}
