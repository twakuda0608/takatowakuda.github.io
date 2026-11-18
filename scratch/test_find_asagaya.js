const fs = require('fs');
const dataCode = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const window = {};
eval(dataCode);

const stations = window.JR_STATIONS;
Object.keys(stations).forEach(id => {
  if (stations[id].name.includes('阿佐')) {
    console.log(`Found: ${id}: ${stations[id].name}`);
  }
});
