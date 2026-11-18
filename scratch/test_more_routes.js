const fs = require('fs');
globalThis.window = globalThis;
eval(fs.readFileSync('jr-map/data/build-data.js', 'utf8'));
eval(fs.readFileSync('jr-map/data/tracks.js', 'utf8'));

let code = fs.readFileSync('jr-map/route-engine.js', 'utf8');
const CHUO_DATA = `
  const CHUO_EAST_KILO = {
    '東京': 0.0, '神田': 1.3, '御茶ノ水': 2.6, '水道橋': 3.4, '飯田橋': 4.3, '市ヶ谷': 5.8, '市ケ谷': 5.8,
    '四ツ谷': 6.6, '信濃町': 7.9, '千駄ヶ谷': 8.6, '千駄ケ谷': 8.6, '代々木': 9.6, '新宿': 10.3,
    '大久保': 11.7, '東中野': 12.8, '中野': 14.7, '高円寺': 16.1, '阿佐ヶ谷': 17.3, '阿佐ケ谷': 17.3,
    '荻窪': 18.7, '西荻窪': 20.6, '吉祥寺': 22.5, '三鷹': 24.1, '武蔵境': 25.7, '東小金井': 27.4,
    '武蔵小金井': 29.1, '国分寺': 31.4, '西国分寺': 32.8, '国立': 34.5, '立川': 37.5, '日野': 40.8,
    '豊田': 43.1, '八王子': 47.4, '西八王子': 49.8, '高尾': 53.1, '相模湖': 62.6, '藤野': 66.3,
    '上野原': 69.8, '四方津': 74.0, '梁川': 77.6, '鳥沢': 81.2, '猿橋': 85.3, '大月': 87.8,
    '初狩': 93.9, '笹子': 100.4, '甲斐大和': 106.5, '勝沼ぶどう郷': 112.5, '塩山': 116.9, '東山梨': 120.1,
    '山梨市': 122.2, '春日居町': 125.0, '石和温泉': 127.8, '酒折': 131.2, '甲府': 134.1, '竜王': 138.6,
    '塩崎': 142.7, '韮崎': 147.0, '新府': 151.2, '穴山': 154.7, '日野春': 160.1, '長坂': 166.3,
    '小淵沢': 173.7, '信濃境': 178.2, '富士見': 182.9, 'すずらんの里': 186.1, '青柳': 188.0, '茅野': 195.2,
    '上諏訪': 201.9, '下諏訪': 206.3, '岡谷': 210.4, 'みどり湖': 218.2, '塩尻': 222.1
  };
  const CHUO_WEST_KILO = {
    '塩尻': 0.0, '洗馬': 4.2, '日出塩': 8.9, '贄川': 14.1, '木曽平沢': 19.3, '奈良井': 21.1,
    '藪原': 27.7, '宮ノ越': 33.4, '原野': 36.2, '木曽福島': 41.7, '上松': 49.0, '倉本': 55.6,
    '須原': 60.4, '大桑': 63.7, '野尻': 66.7, '十二兼': 70.4, '南木曽': 75.9, '田立': 82.2,
    '坂下': 85.0, '落合川': 91.1, '中津川': 94.9, '美乃坂本': 101.3, '恵那': 106.5, '武並': 111.9,
    '釜戸': 117.3, '瑞浪': 124.7, '土岐市': 131.6, '多治見': 138.6, '古虎渓': 143.2, '定光寺': 146.7,
    '高蔵寺': 150.8, '神領': 154.0, '春日井': 156.7, '勝川': 159.8, '新守山': 162.5, '大曽根': 165.0,
    '千種': 167.7, '鶴舞': 169.2, '金山': 171.5, '名古屋': 174.8
  };
  const YAMANOTE_KILO = {
    '品川': 0.0, '大崎': 2.0, '五反田': 2.9, '目黒': 4.1, '恵比寿': 5.6, '渋谷': 7.2,
    '原宿': 8.4, '代々木': 9.9, '新宿': 10.6, '新大久保': 11.9, '高田馬場': 13.3,
    '目白': 14.2, '池袋': 15.4, '大塚': 17.2, '巣鴨': 18.3, '駒込': 19.0, '田端': 20.6
  };
`;
code = code.replace("  const OFFICIAL_LINE_KILOS = {", CHUO_DATA + "\n  const OFFICIAL_LINE_KILOS = {\n    'chuo-main': CHUO_EAST_KILO,\n    'tokai-chuo': CHUO_WEST_KILO,\n    'yamanote': YAMANOTE_KILO,");
eval(code);

const STATIONS = window.JR_STATIONS;
function findId(name) {
  for (const id in STATIONS) {
    if (STATIONS[id].name === name) return id;
  }
}

const rTokyoShinjuku = window.JR_ROUTE_ENGINE.searchMarsRoute(findId('東京'), [], findId('新宿'));
console.log('東京 -> 新宿:', rTokyoShinjuku.totalKm, 'km (Official: 10.3 km)');

const rShinjukuTakao = window.JR_ROUTE_ENGINE.searchMarsRoute(findId('新宿'), [], findId('高尾'));
console.log('新宿 -> 高尾:', rShinjukuTakao.totalKm, 'km (Official: 42.8 km)');

const rTokyoShiojiri = window.JR_ROUTE_ENGINE.searchMarsRoute(findId('東京'), [], findId('塩尻'));
console.log('東京 -> 塩尻:', rTokyoShiojiri.totalKm, 'km (Official: 222.1 km)');

const rShinjukuShibuya = window.JR_ROUTE_ENGINE.searchMarsRoute(findId('新宿'), [], findId('渋谷'));
console.log('新宿 -> 渋谷 (山手線):', rShinjukuShibuya.totalKm, 'km (Official: 3.4 km)');
