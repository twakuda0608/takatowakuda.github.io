const path = require('path');
const kilos = require(path.resolve(__dirname, '../data/official-kilos.js')).OFFICIAL_STATION_KILOS;
const yosan = kilos['shikoku-yosan'];
console.log('yosan sample around 伊予長浜 & 伊予大洲:');
for (const k of ['向井原', '高野川', '下灘', '伊予長浜', '五郎', '新谷', '内子', '伊予大洲', '八幡浜', '宇和島']) {
  console.log(k, yosan[k]);
}
