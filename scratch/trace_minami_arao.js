const fs = require('fs');
globalThis.window = globalThis;
eval(fs.readFileSync('jr-map/data/build-data.js', 'utf8'));
eval(fs.readFileSync('jr-map/data/tracks.js', 'utf8'));
const STATIONS = window.JR_STATIONS;
const TRACKS = window.JR_TRACKS;

const chains = TRACKS['tokai-tokaido'] || [];
const ch1 = chains[1].map(pt => pt[0] > 90 ? [pt[1], pt[0]] : pt);
const ch7 = chains[7].map(pt => pt[0] > 90 ? [pt[1], pt[0]] : pt);

// ch7 の始点と終点
console.log('ch7 length:', ch7.length);
console.log('ch7[0]:', ch7[0]); // 関ヶ原側
console.log('ch7[last]:', ch7[ch7.length - 1]); // 大垣・南荒尾側

// ch1 の中で ch7[last] に最も近い点を探す
let minD = Infinity;
let bestIdx = -1;
for (let i = 0; i < ch1.length; i++) {
  const d = Math.hypot(ch1[i][0] - ch7[ch7.length - 1][0], ch1[i][1] - ch7[ch7.length - 1][1]);
  if (d < minD) { minD = d; bestIdx = i; }
}
console.log(`Nearest point in ch1 to ch7[last]: idx=${bestIdx}, pt=[${ch1[bestIdx]}], dist=${(minD * 111).toFixed(3)}km`);

// ch1 の中で大垣駅に最も近い点
const ogaki = STATIONS['st-fn8c'];
let minDOgaki = Infinity, ogakiIdx = -1;
for (let i = 0; i < ch1.length; i++) {
  const d = Math.hypot(ch1[i][0] - ogaki.lat, ch1[i][1] - ogaki.lng);
  if (d < minDOgaki) { minDOgaki = d; ogakiIdx = i; }
}
console.log(`Ogaki in ch1: idx=${ogakiIdx}, pt=[${ch1[ogakiIdx]}], dist=${(minDOgaki * 111).toFixed(3)}km`);

// ch7 の中で垂井駅に最も近い点
const tarui = STATIONS['st-fbdf'];
let minDTarui = Infinity, taruiIdx = -1;
for (let i = 0; i < ch7.length; i++) {
  const d = Math.hypot(ch7[i][0] - tarui.lat, ch7[i][1] - tarui.lng);
  if (d < minDTarui) { minDTarui = d; taruiIdx = i; }
}
console.log(`Tarui in ch7: idx=${taruiIdx}, pt=[${ch7[taruiIdx]}], dist=${(minDTarui * 111).toFixed(3)}km`);
