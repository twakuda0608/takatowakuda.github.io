const fs = require('fs');
const trackCode = fs.readFileSync('jr-map/data/tracks.js', 'utf8');
const window = {};
eval(trackCode);

const cmTrack = window.JR_TRACKS['chuo-main'][0];
console.log('Points 195 to 205:');
for (let i = 195; i <= 205; i++) {
  console.log(`idx ${i}: [${cmTrack[i]}]`);
}
