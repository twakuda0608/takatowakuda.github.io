const fs = require('fs');
globalThis.window = globalThis;
eval(fs.readFileSync('jr-map/data/tracks.js', 'utf8'));

const TRACKS = window.JR_TRACKS;
const ch1 = TRACKS['tokai-tokaido'][1];
const ch7 = TRACKS['tokai-tokaido'][7];

// ch1, ch7 を [lat, lng] に正規化
const pts1 = ch1.map(p => p[0]>90 ? [p[1], p[0]] : p);
const pts7 = ch7.map(p => p[0]>90 ? [p[1], p[0]] : p);

// pts7 は [0]=関ヶ原付近 ... [65]=[35.37201, 136.57868] (南荒尾分岐) ... [88]=[35.38735, 136.58218] (美濃赤坂)
// pts1 は [173]=[35.37201, 136.57868] (南荒尾分岐) ... [222]=[35.36712, 136.61733] (大垣)

// 1. 東海道本線 (下側本線・垂井線): 関ヶ原 -> 垂井 -> 南荒尾 -> 大垣
const fullTaruiLine = [...pts7.slice(0, 66), ...pts1.slice(174, 223)];

// 2. 美濃赤坂線: 大垣 -> 南荒尾 -> 美濃赤坂
// pts1.slice(174, 223) を逆順にすると 大垣 -> 南荒尾
const ogakiToArao = pts1.slice(173, 223).reverse();
// pts7.slice(65, 89) は 南荒尾 -> 美濃赤坂
const minoLine = [...ogakiToArao, ...pts7.slice(66, 89)];

console.log('fullTaruiLine points:', fullTaruiLine.length);
console.log('minoLine points:', minoLine.length);
console.log('minoLine start (Ogaki):', minoLine[0], 'end (Mino-Akasaka):', minoLine[minoLine.length-1]);
