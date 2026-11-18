const fs = require('fs');

const dataCode = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const window = {};
eval(dataCode);

const LINES = window.JR_LINES;
const STATIONS = window.JR_STATIONS;

// kiha54500 の在来線・新幹線一覧
// ユーザープロンプトのテキストから各路線の正式区間を抽出
const expectedOfficialSections = {
  // 新幹線
  'shinkansen-tokaido': '東京－新大阪 (東海道・山陽新幹線 東京－博多)',
  'shinkansen-sanyo': '新大阪－博多',
  'shinkansen-tohoku': '東京－新青森',
  'shinkansen-hokkaido': '新青森－新函館北斗',
  'shinkansen-joetsu': '東京（大宮）－新潟',
  'shinkansen-hokuriku': '東京（高崎）－敦賀',
  'shinkansen-kyushu': '博多－鹿児島中央',
  'shinkansen-nishi-kyushu': '武雄温泉－長崎',

  // 在来線 (kiha54500 リストに基づく)
  'yamanote': '品川－新宿－田端 (20.6km)',
  'akabane-line': '池袋－赤羽 (5.5km)',
  'negishi-line': '横浜－大船 (22.1km)',
  'yokosuka-line': '大船－久里浜 (23.9km)',
  'yokohama-line': '東神奈川－八王子 (42.6km)',
  'nambu': '川崎－立川 (35.5km)',
  'tsurumi-line': '鶴見－扇町',
  'ome-line': '立川－奥多摩 (37.2km)',
  'itsukaichi-line': '拝島－武蔵五日市 (11.1km)',
  'musashino': '府中本町－西船橋 (71.8km)',
  'keiyo': '東京－蘇我 (43.0km)',
  'joban': '日暮里－岩沼 (343.7km)',
  'takasaki-line': '大宮－高崎 (74.7km)',
  'chuo-main': '東京（神田）－塩尻－名古屋',
  'sobu-main': '東京－銚子 (錦糸町－御茶ノ水)',
  'tokaido': '東京－神戸',
  'tohoku-main': '東京－盛岡'
};

console.log('=== Checking Key Lines against kiha54500 official list ===');
LINES.forEach(l => {
  const s0 = STATIONS[l.stations[0]] ? STATIONS[l.stations[0]].name : l.stations[0];
  const sN = STATIONS[l.stations[l.stations.length - 1]] ? STATIONS[l.stations[l.stations.length - 1]].name : l.stations[l.stations.length - 1];
  
  // 気になる点があるかチェック
  if (l.id.includes('joban') || l.id.includes('yamanote') || l.id.includes('musashino') || l.id.includes('chuo') || l.id.includes('tohoku') || l.id.includes('tokaido')) {
    console.log(`[${l.id}] ${l.name}: ${s0} 〜 ${sN} (${l.stations.length} stations)`);
  }
});
