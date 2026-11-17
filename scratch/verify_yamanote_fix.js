const fs = require('fs');

const dataCode = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const trackCode = fs.readFileSync('jr-map/data/tracks.js', 'utf8');
const window = {};
eval(dataCode);
eval(trackCode);

const LINES = window.JR_LINES;
const STATIONS = window.JR_STATIONS;
const TRACKS = window.JR_TRACKS;

const yamanote = LINES.find(l => l.id === 'yamanote');
console.log('=== Yamanote Official Verification ===');
console.log('Name:', yamanote.name);
console.log('Stations count:', yamanote.stations.length);
console.log('Stations (names):', yamanote.stations.map(id => STATIONS[id].name).join(' -> '));

const yTrack = TRACKS['yamanote'][0];
console.log('Track points:', yTrack.length);
console.log('Track Start:', yTrack[0]);
console.log('Track End:', yTrack[yTrack.length - 1]);

// 東側各駅の確認
console.log('\n=== East Side Stations Verification ===');
['shinagawa', 'tamachi', 'hamamatsucho', 'shimbashi', 'yurakucho', 'tokyo', 'kanda', 'akihabara', 'ueno', 'tabata'].forEach(id => {
  const st = STATIONS[id];
  console.log(`${st.name} (${id}):`, st.lines);
});
