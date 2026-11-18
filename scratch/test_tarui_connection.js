const fs = require('fs');
globalThis.window = globalThis;
eval(fs.readFileSync('jr-map/data/build-data.js', 'utf8'));
eval(fs.readFileSync('jr-map/data/tracks.js', 'utf8'));
const STATIONS = window.JR_STATIONS;
const TRACKS = window.JR_TRACKS;

const ch1 = TRACKS['tokai-tokaido'][1].map(p => p[0]>90 ? [p[1],p[0]] : p);
const ch7 = TRACKS['tokai-tokaido'][7].map(p => p[0]>90 ? [p[1],p[0]] : p);

// ch7 の idx 0 から 65 (関ヶ原 -> 垂井 -> 南荒尾分岐 [35.37201, 136.57868])
const partSekigaharaTaruiArao = ch7.slice(0, 66);

// ch1 の idx 173 から 222 (南荒尾分岐 [35.37201, 136.57868] -> 大垣)
// ch1[173] は南荒尾、ch1[222] は大垣
// なので partSekigaharaTaruiArao の末尾に ch1.slice(174, 223) をそのまま push すれば、関ヶ原 -> 垂井 -> 大垣 の連続軌道になる！
const fullTaruiLine = [...partSekigaharaTaruiArao, ...ch1.slice(174, 223)];

console.log('fullTaruiLine points count:', fullTaruiLine.length);
console.log('Start (Sekigahara):', fullTaruiLine[0]);
console.log('Tarui pt:', fullTaruiLine[35]);
console.log('Junction pt:', fullTaruiLine[65]);
console.log('End (Ogaki):', fullTaruiLine[fullTaruiLine.length - 1]);

// この fullTaruiLine を Chain 7 に代入して getSegmentCoords をテスト
TRACKS['tokai-tokaido'][7] = fullTaruiLine;

const RouteEngine = require('../jr-map/route-engine.js');
const coords = RouteEngine.getSegmentCoords(TRACKS, STATIONS, 'tokai-tokaido', 'st-fn8c', 'st-fbdf');
console.log('Ogaki -> Tarui coords count:', coords.length);
console.log('First:', coords[0]);
console.log('Last:', coords[coords.length - 1]);

// 途中の緯度をチェック (新垂井線の山の上 35.385 付近を通っていないか？)
let maxLat = -Infinity;
coords.forEach(p => { if (p[0] > maxLat) maxLat = p[0]; });
console.log('Max Lat in Ogaki->Tarui coords:', maxLat);
// 垂井駅は 35.36953, 大垣駅は 35.3671, 南荒尾は 35.37201
// 下側の線路を通っていれば、maxLat は 35.373 付近で収まる！
// 上側の新垂井線を通っていたときは 35.385 以上あった！
console.log('Passes south (normal) route?:', maxLat < 35.375);
