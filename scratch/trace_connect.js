const fs = require('fs');
globalThis.window = globalThis;
eval(fs.readFileSync('jr-map/data/build-data.js', 'utf8'));
eval(fs.readFileSync('jr-map/data/tracks.js', 'utf8'));
const STATIONS = window.JR_STATIONS;
const TRACKS = window.JR_TRACKS;

const chains = TRACKS['tokai-tokaido'];
const ch1 = chains[1].map(p => p[0] > 90 ? [p[1], p[0]] : p);
const ch7 = chains[7].map(p => p[0] > 90 ? [p[1], p[0]] : p);

// 荒尾駅の座標
const arao = STATIONS['st-mucs-1'];
console.log('Arao station:', arao.lat, arao.lng);

// ch7 の座標を調べる (どこからどこへ向いているか)
console.log('ch7[0]:', ch7[0]); // 関ヶ原側
console.log('ch7[last]:', ch7[ch7.length - 1]); // 荒尾側

// ch1 の中で荒尾駅に最も近い点
let minDArao = Infinity, araoCh1Idx = -1;
for (let i = 0; i < ch1.length; i++) {
  const d = Math.hypot(ch1[i][0] - arao.lat, ch1[i][1] - arao.lng);
  if (d < minDArao) { minDArao = d; araoCh1Idx = i; }
}
console.log(`Arao in ch1: idx=${araoCh1Idx}, pt=[${ch1[araoCh1Idx]}], dist=${(minDArao*111).toFixed(3)}km`);

// ch1 の中で大垣駅に最も近い点
const ogaki = STATIONS['st-fn8c'];
let minDOgaki = Infinity, ogakiCh1Idx = -1;
for (let i = 0; i < ch1.length; i++) {
  const d = Math.hypot(ch1[i][0] - ogaki.lat, ch1[i][1] - ogaki.lng);
  if (d < minDOgaki) { minDOgaki = d; ogakiCh1Idx = i; }
}
console.log(`Ogaki in ch1: idx=${ogakiCh1Idx}, pt=[${ch1[ogakiCh1Idx]}], dist=${(minDOgaki*111).toFixed(3)}km`);

// ch1 は idx が増える方向で大垣へ向かっているか？
console.log('araoCh1Idx:', araoCh1Idx, 'ogakiCh1Idx:', ogakiCh1Idx);
// araoCh1Idx = 188, ogakiCh1Idx = 222
// つまり、188 -> 222 が 荒尾 -> 大垣。
// 逆に、大垣 -> 荒尾 は 222 -> 188！
console.log('ch1 from Ogaki to Arao:', ch1.slice(188, 223).length, 'points');
