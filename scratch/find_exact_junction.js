const fs = require('fs');
globalThis.window = globalThis;
eval(fs.readFileSync('jr-map/data/build-data.js', 'utf8'));
eval(fs.readFileSync('jr-map/data/tracks.js', 'utf8'));
const STATIONS = window.JR_STATIONS;
const TRACKS = window.JR_TRACKS;

const ch1 = TRACKS['tokai-tokaido'][1].map(p => p[0]>90 ? [p[1],p[0]] : p);
const ch7 = TRACKS['tokai-tokaido'][7].map(p => p[0]>90 ? [p[1],p[0]] : p);

const ogaki = STATIONS['st-fn8c'];
const tarui = STATIONS['st-fbdf'];

// ch1 で大垣に最も近い点 (idx 222)
// ch1 は idx が減ると南荒尾へ向かう (idx 222 -> 180 付近)
console.log('ch1[222] (Ogaki):', ch1[222]);

// ch7 で垂井に最も近い点 (idx 35 付近)
console.log('ch7[35] (Tarui):', ch7[35]);

// ch7 は idx 0 が関ヶ原側、idx 88 が美濃赤坂側
// 垂井(idx 35)から南荒尾(idx 75付近)へ向かうには idx 35 -> 75
// ch7 の南荒尾付近(idx 70〜80)と、ch1 の南荒尾付近(idx 175〜185)の最接近ペアを探す
let minD = Infinity;
let bestI1 = -1, bestI7 = -1;

for (let i1 = 170; i1 <= 190; i1++) {
  for (let i7 = 65; i7 <= 85; i7++) {
    const d = Math.hypot(ch1[i1][0] - ch7[i7][0], ch1[i1][1] - ch7[i7][1]);
    if (d < minD) {
      minD = d;
      bestI1 = i1;
      bestI7 = i7;
    }
  }
}

console.log(`Best junction between ch1 and ch7: ch1[${bestI1}]=[${ch1[bestI1]}], ch7[${bestI7}]=[${ch7[bestI7]}], dist=${(minD*111000).toFixed(1)}m`);
