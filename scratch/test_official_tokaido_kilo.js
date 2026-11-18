const fs = require('fs');

const TOKAIDO_KILO = {
  '東京': 0.0, '有楽町': 0.8, '新橋': 1.9, '浜松町': 3.1, '田町': 4.6, '高輪ゲートウェイ': 5.9, '品川': 6.8,
  '大井町': 9.2, '大森': 11.4, '蒲田': 14.4, '川崎': 18.2, '鶴見': 21.7, '新子安': 24.8, '東神奈川': 27.2,
  '横浜': 28.8, '保土ケ谷': 31.8, '東戸塚': 36.7, '戸塚': 40.9, '大船': 46.5, '藤沢': 51.1, '辻堂': 54.8,
  '茅ヶ崎': 58.6, '平塚': 63.8, '大磯': 67.8, '二宮': 73.1, '国府津': 77.7, '鴨宮': 80.8, '小田原': 83.9,
  '早川': 86.0, '根府川': 90.4, '真鶴': 95.8, '湯河原': 99.1, '熱海': 104.6, '函南': 114.5, '三島': 120.7,
  '沼津': 126.2, '片浜': 130.3, '原': 132.8, '東田子の浦': 137.4, '吉原': 141.3, '富士': 146.2, '富士川': 149.7,
  '新蒲原': 152.5, '蒲原': 154.9, '由比': 158.4, '興津': 164.3, '清水': 169.0, '草薙': 174.2, '東静岡': 177.4,
  '静岡': 180.2, '安倍川': 184.5, '用宗': 186.6, '焼津': 193.7, '西焼津': 197.0, '藤枝': 200.3, '六合': 204.9,
  '島田': 207.8, '金谷': 212.9, '菊川': 222.2, '掛川': 229.3, '愛野': 234.6, '袋井': 238.1, '御厨': 242.7,
  '磐田': 245.9, '豊田町': 248.8, '天竜川': 252.7, '浜松': 257.1, '高塚': 262.4, '舞阪': 267.5, '弁天島': 269.8,
  '新居町': 272.9, '鷲津': 276.6, '新所原': 282.4, '二川': 286.7, '豊橋': 293.6, '西小坂井': 298.4, '愛知御津': 302.1,
  '三河大塚': 305.2, '三河三谷': 308.3, '蒲郡': 310.6, '三河塩津': 312.9, '三ヶ根': 315.5, '幸田': 318.5, '相見': 321.6,
  '岡崎': 325.9, '西岡崎': 330.1, '安城': 333.7, '三河安城': 336.3, '東刈谷': 338.1, '野田新町': 339.7, '刈谷': 341.6,
  '逢妻': 343.5, '大府': 346.5, '共和': 349.5, '南大高': 351.8, '大高': 353.6, '笠寺': 356.8, '熱田': 360.8,
  '金山': 363.6, '尾頭橋': 364.5, '名古屋': 366.0, '枇杷島': 370.0, '清洲': 373.8, '稲沢': 377.1, '尾張一宮': 383.1,
  '木曽川': 388.6, '岐阜': 396.3, '西岐阜': 399.5, '穂積': 402.3, '大垣': 410.0, '垂井': 418.1, '関ヶ原': 423.8,
  '柏原': 430.9, '近江長岡': 435.2, '醒ヶ井': 439.8, '米原': 445.9, '彦根': 451.9, '南彦根': 455.2, '河瀬': 458.0,
  '稲枝': 462.0, '能登川': 467.4, '安土': 472.8, '近江八幡': 477.4, '篠原': 481.4, '野洲': 487.0, '守山': 490.1,
  '栗東': 492.2, '草津': 494.5, '南草津': 497.0, '瀬田': 499.7, '石山': 503.2, '膳所': 505.9, '大津': 507.7,
  '山科': 511.2, '京都': 513.6, '西大路': 516.1, '桂川': 518.9, '向日町': 520.0, '長岡京': 523.7, '山崎': 527.7,
  '島本': 529.9, '高槻': 535.2, '摂津富田': 538.5, 'JR総持寺': 540.0, '茨木': 541.5, '千里丘': 544.5, '岸辺': 546.0,
  '吹田': 548.8, '東淀川': 551.9, '新大阪': 552.6, '大阪': 556.4, '福島': 557.4, '塚本': 560.3, '尼崎': 563.1,
  '立花': 566.1, '甲子園口': 568.3, '西宮': 570.8, 'さくら夙川': 572.3, '芦屋': 574.7, '甲南山手': 576.1,
  '摂津本山': 577.6, '住吉': 579.2, '六甲道': 581.1, '摩耶': 582.5, '灘': 583.4, '三ノ宮': 585.8, '元町': 586.6,
  '神戸': 589.5,
  // 新幹線独自駅
  '新横浜': 28.8, '新富士': 146.2, '岐阜羽島': 396.3
};

globalThis.window = globalThis;
eval(fs.readFileSync('jr-map/data/build-data.js', 'utf8'));
eval(fs.readFileSync('jr-map/data/tracks.js', 'utf8'));
const STATIONS = window.JR_STATIONS;
const LINES = window.JR_LINES;

// 東海道線上に並ぶ駅で連続する駅間のキロ差の合計を計算
const lEast = LINES.find(l => l.id === 'tokaido');
const lTokai = LINES.find(l => l.id === 'tokai-tokaido');
const lWest = LINES.find(l => l.id === 'tokaido-west');

let totalKilo = 0;
// 東京から熱海
for (let i = 0; i < lEast.stations.length - 1; i++) {
  const u = STATIONS[lEast.stations[i]].name;
  const v = STATIONS[lEast.stations[i+1]].name;
  totalKilo += Math.abs(TOKAIDO_KILO[v] - TOKAIDO_KILO[u]);
}
console.log('Tokyo -> Atami official kilo:', totalKilo.toFixed(1));

// 熱海から米原
// lTokai は 米原 -> 熱海 の順序
const tokaiNames = lTokai.stations.map(id => STATIONS[id].name);
const atamiIdx = tokaiNames.indexOf('熱海');
const maibaraIdx = tokaiNames.indexOf('米原');
console.log('atamiIdx:', atamiIdx, 'maibaraIdx:', maibaraIdx);
let tokaiKilo = 0;
for (let i = atamiIdx; i > maibaraIdx; i--) {
  const u = tokaiNames[i];
  const v = tokaiNames[i-1];
  tokaiKilo += Math.abs(TOKAIDO_KILO[v] - TOKAIDO_KILO[u]);
}
console.log('Atami -> Maibara official kilo:', tokaiKilo.toFixed(1));

// 米原から京都
const westNames = lWest.stations.map(id => STATIONS[id].name);
const wMaibaraIdx = westNames.indexOf('米原');
const wKyotoIdx = westNames.indexOf('京都');
let westKilo = 0;
for (let i = wMaibaraIdx; i < wKyotoIdx; i++) {
  const u = westNames[i];
  const v = westNames[i+1];
  westKilo += Math.abs(TOKAIDO_KILO[v] - TOKAIDO_KILO[u]);
}
console.log('Maibara -> Kyoto official kilo:', westKilo.toFixed(1));

const fullTotal = totalKilo + tokaiKilo + westKilo;
console.log('TOTAL Tokyo -> Kyoto:', fullTotal.toFixed(1), 'km');
