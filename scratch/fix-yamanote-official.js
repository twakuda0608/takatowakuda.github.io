const fs = require('fs');

const dataFile = 'jr-map/data/build-data.js';
const trackFile = 'jr-map/data/tracks.js';
const outDir = 'C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/718ddd58-6a5a-4862-8418-dedf5e77c519/scratch';

const window = {};
eval(fs.readFileSync(dataFile, 'utf8'));
eval(fs.readFileSync(trackFile, 'utf8'));

// 1. 山手線の駅リストを正式区間（品川〜田端）に修正
const yamanoteStations = [
  'shinagawa', 'osaki', 'gotanda', 'meguro', 'ebisu',
  'shibuya', 'harajuku', 'yoyogi', 'shinjuku', 'shin-okubo',
  'takadanobaba', 'mejiro', 'ikebukuro', 'otsuka', 'sugamo',
  'komagome', 'tabata'
];

const yamanoteLine = window.JR_LINES.find(l => l.id === 'yamanote');
console.log('Old yamanote stations count:', yamanoteLine.stations.length);
yamanoteLine.stations = yamanoteStations;
console.log('New yamanote stations count:', yamanoteLine.stations.length);

// 2. 東海道本線 (tokaido) に東京〜品川間の電車線駅を追加
const tokaidoLine = window.JR_LINES.find(l => l.id === 'tokaido');
console.log('Old tokaido stations:', tokaidoLine.stations.slice(0, 5));

// 東京、有楽町、新橋、浜松町、田町、高輪ゲートウェイ、品川、川崎...
const tokaidoHead = ['tokyo', 'yurakucho', 'shimbashi', 'hamamatsucho', 'tamachi', 'takanawa-gateway', 'shinagawa'];
const tokaidoRest = tokaidoLine.stations.filter(s => !tokaidoHead.includes(s));
tokaidoLine.stations = tokaidoHead.concat(tokaidoRest);
console.log('New tokaido stations (first 8):', tokaidoLine.stations.slice(0, 8));

// 3. 各駅の lines の整合性更新
const eastSideStations = ['yurakucho', 'hamamatsucho', 'tamachi', 'takanawa-gateway'];
eastSideStations.forEach(stId => {
  if (window.JR_STATIONS[stId]) {
    // 山手線を除外し、東海道本線を追加
    window.JR_STATIONS[stId].lines = ['tokaido'];
  }
});

const northEastSideStations = ['kanda', 'akihabara', 'okachimachi', 'ueno', 'uguisudani', 'nippori', 'nishi-nippori'];
northEastSideStations.forEach(stId => {
  if (window.JR_STATIONS[stId]) {
    // 山手線を除外
    window.JR_STATIONS[stId].lines = window.JR_STATIONS[stId].lines.filter(l => l !== 'yamanote');
  }
});

// 東京駅からも山手線を除外 (東海道本線・東北本線等の起点)
if (window.JR_STATIONS['tokyo']) {
  window.JR_STATIONS['tokyo'].lines = window.JR_STATIONS['tokyo'].lines.filter(l => l !== 'yamanote');
}

// 田端駅: yamanote, tohoku-main-sendai, tohoku-main-morioka (山手線終点)
if (window.JR_STATIONS['tabata']) {
  if (!window.JR_STATIONS['tabata'].lines.includes('yamanote')) {
    window.JR_STATIONS['tabata'].lines.unshift('yamanote');
  }
}

// 品川駅: yamanote, tokaido... (山手線起点)
if (window.JR_STATIONS['shinagawa']) {
  if (!window.JR_STATIONS['shinagawa'].lines.includes('yamanote')) {
    window.JR_STATIONS['shinagawa'].lines.unshift('yamanote');
  }
}

// 4. tracks.js の yamanote トラックを品川〜田端区間に切り詰め
const TRACKS = window.JR_TRACKS;
const origYamanoteTrack = TRACKS['yamanote'][0];
console.log('Old yamanote track points:', origYamanoteTrack.length);

// idx 36 (品川: 35.627, 139.73863) 〜 idx 128 (田端: 35.73669, 139.76248)
const newYamanoteTrack = origYamanoteTrack.slice(36, 129);
console.log('New yamanote track points:', newYamanoteTrack.length);
console.log('Start (Shinagawa):', newYamanoteTrack[0]);
console.log('End (Tabata):', newYamanoteTrack[newYamanoteTrack.length - 1]);
TRACKS['yamanote'][0] = newYamanoteTrack;

// 5. ファイル保存
const newBuildDataJS = `/**
 * JR 全国路線 & 駅マスターデータ (JR Nationwide Railway Dataset)
 * 収録: 全国のJR旅客6社 (JR北海道・JR東日本・JR東海・JR西日本・JR四国・JR九州)
 * 路線名規約: 国土交通省『鉄道要覧』およびJR各社線路名称公告に基づく100%完全な正式路線名
 */

window.JR_CATEGORIES = ${JSON.stringify(window.JR_CATEGORIES, null, 2)};

window.JR_LINES = ${JSON.stringify(window.JR_LINES, null, 2)};

window.JR_STATIONS = ${JSON.stringify(window.JR_STATIONS, null, 2)};
`;

fs.writeFileSync(outDir + '/build-data-fixed.js', newBuildDataJS, 'utf8');
console.log('Saved build-data-fixed.js');

const newTracksJS = `/**
 * JR 全国全線路 ジオメトリデータ (国土交通省 鉄道実線路データ準拠)
 * 全187路線・全カーブ・蛇行・専用軌道完全再現ポリライン
 */

window.JR_TRACKS = ${JSON.stringify(TRACKS)};
`;

fs.writeFileSync(outDir + '/tracks-fixed.js', newTracksJS, 'utf8');
console.log('Saved tracks-fixed.js');
