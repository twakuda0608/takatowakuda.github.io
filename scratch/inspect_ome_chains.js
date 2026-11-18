const fs = require('fs');
const trackCode = fs.readFileSync('jr-map/data/tracks.js', 'utf8');
const window = {};
eval(trackCode);
const ome = window.JR_TRACKS['ome-line'];

console.log('ome-line chains count:', ome.length);

console.log('\n--- Chain 1 (17 points) ---');
ome[1].forEach((pt, i) => console.log(i, pt));

console.log('\n--- Chain 0 around Tachikawa (first 30 points) ---');
for (let i = 0; i < Math.min(30, ome[0].length); i++) {
  console.log(i, ome[0][i]);
}
