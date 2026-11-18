const fs = require('fs');

const dataCode = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const trackCode = fs.readFileSync('jr-map/data/tracks.js', 'utf8');
const window = {};
eval(dataCode);
eval(trackCode);

const STATIONS = window.JR_STATIONS;
const LINES = window.JR_LINES;
const TRACKS = window.JR_TRACKS;

const joban = LINES.find(l => l.id === 'joban');
console.log('=== Joban Official Line Verification ===');
console.log('ID:', joban.id);
console.log('Name:', joban.name);
console.log('Stations count:', joban.stations.length);
console.log('Start station:', STATIONS[joban.stations[0]].name, `(${joban.stations[0]})`);
console.log('End station:', STATIONS[joban.stations[joban.stations.length - 1]].name, `(${joban.stations[joban.stations.length - 1]})`);

const jTrack = TRACKS['joban'][0];
console.log('Track points:', jTrack.length);
console.log('Track start:', jTrack[0]);
console.log('Track end:', jTrack[jTrack.length - 1]);

// 東京・品川・上野に joban が含まれていないことを確認
console.log('\n=== Terminal Stations Verification ===');
['shinagawa', 'shimbashi', 'tokyo', 'ueno', 'nippori', 'iwanuma'].forEach(id => {
  const st = STATIONS[id];
  console.log(`${st.name} (${id}):`, st.lines);
});
