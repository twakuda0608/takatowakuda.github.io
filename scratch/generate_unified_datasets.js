const fs = require('fs');

const dataCode = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const trackCode = fs.readFileSync('jr-map/data/tracks.js', 'utf8');
const window = {};
eval(dataCode);
eval(trackCode);

const originalLines = window.JR_LINES;
const originalStations = window.JR_STATIONS;
const originalTracks = window.JR_TRACKS;

console.log('Original lines:', originalLines.length);
console.log('Original tracks keys:', Object.keys(originalTracks).length);

// 1. 中央本線
const crTrack = originalTracks['chuo-rapid'][0];
const cmTrack = originalTracks['chuo-main'][0];
const combinedChuoTrack = [...crTrack, ...cmTrack.slice(199)];

const chuoEastStations = [
  'tokyo', 'kanda', 'ochanomizu', 'yotsuya', 'shinjuku', 'nakano',
  'koenji', 'st-ja2vn6', 'ogikubo', 'nishi-ogikubo', 'kichijoji', 'mitaka',
  'musashi-sakai', 'higashi-koganei', 'musashi-koganei', 'kokubunji', 'nishi-kokubunji',
  'kunitachi', 'tachikawa', 'hino', 'toyoda', 'hachioji', 'nishi-hachioji',
  'takao', 'sagamiko', 'fujino', 'uenohara', 'st-d7vzb', 'st-iags', 'st-ra71', 'st-k6p8',
  'otsuki', 'st-elik', 'st-lgl3', 'st-f7g6eb', 'st-xpzlnn', 'st-fjmw', 'st-flqq0',
  'st-e1rbf', 'st-db6eid', 'st-fhkbjt', 'st-p9c6', 'kofu', 'st-lj5b', 'st-fjr9',
  'nirasaki', 'st-htd8', 'st-lc3h', 'st-fmncs', 'st-pwh7', 'kobuchizawa',
  'st-c8p1d', 'st-dvx70', 'st-hxrsyx', 'st-qb4x', 'chino', 'kamisuwa',
  'st-c3vye', 'okaya', 'st-6bjeqe', 'shiojiri'
];

const newChuoLine = {
  id: 'chuo-main',
  name: '中央本線',
  company: 'JR東日本',
  color: '#f15a22',
  type: 'local',
  stations: chuoEastStations
};

// 2. 東北本線
const tohokuSendai = originalLines.find(l => l.id === 'tohoku-main-sendai');
const tohokuStations = [...tohokuSendai.stations].reverse();
const tohokuTrack = originalTracks['tohoku-main-sendai'][0];

const newTohokuLine = {
  id: 'tohoku-main',
  name: '東北本線',
  company: 'JR東日本',
  color: '#008000',
  type: 'local',
  stations: tohokuStations
};

// 3. 羽越本線
const uetsuNiigata = originalLines.find(l => l.id === 'uetsu-niigata');
const uetsuStations = [...uetsuNiigata.stations].reverse();
const uetsuTrack = originalTracks['uetsu-niigata'][0];

const newUetsuLine = {
  id: 'uetsu-main',
  name: '羽越本線',
  company: 'JR東日本',
  color: '#00838f',
  type: 'local',
  stations: uetsuStations
};

// 4. 奥羽本線
const ouSouth = originalLines.find(l => l.id === 'ou-main-south');
const ouStations = [...ouSouth.stations].reverse();
const ouSTrack = originalTracks['ou-main-south'][0];
const ouNTrack = originalTracks['ou-main-north'][0];
const combinedOuTrack = [...ouSTrack.slice(0, 134), ...ouNTrack];

const newOuLine = {
  id: 'ou-main',
  name: '奥羽本線',
  company: 'JR東日本',
  color: '#ff8c00',
  type: 'local',
  stations: ouStations
};

// 5. 大糸線
const oitoLine = originalLines.find(l => l.id === 'oito-line');
const oitoWest = originalLines.find(l => l.id === 'oito-west');
const oitoStations = [
  ...oitoWest.stations,
  ...oitoLine.stations.slice(2)
];
const oitoTrack = originalTracks['oito-line'][0];

const newOitoLine = {
  id: 'oito-line',
  name: '大糸線',
  company: 'JR東日本',
  color: '#673ab7',
  type: 'local',
  stations: oitoStations
};

// 削除対象の旧路線ID
const removedLineIds = new Set([
  'chuo-rapid',
  'utsunomiya-line', 'tohoku-main-sendai', 'tohoku-main-morioka',
  'uetsu-niigata', 'uetsu-north',
  'ou-main-south', 'ou-main-north',
  'oito-west'
]);

// 新路線リストの構築
const updatedLines = [];
let chuoReplaced = false, tohokuReplaced = false, uetsuReplaced = false, ouReplaced = false, oitoReplaced = false;

originalLines.forEach(l => {
  if (removedLineIds.has(l.id)) {
    return; // スキップ
  }
  if (l.id === 'chuo-main') {
    updatedLines.push(newChuoLine);
    chuoReplaced = true;
  } else if (l.id === 'oito-line') {
    updatedLines.push(newOitoLine);
    oitoReplaced = true;
  } else {
    updatedLines.push(l);
  }
});

// 追加（位置はおおむね元の場所）
if (!chuoReplaced) updatedLines.push(newChuoLine);
updatedLines.push(newTohokuLine);
updatedLines.push(newUetsuLine);
updatedLines.push(newOuLine);
if (!oitoReplaced) updatedLines.push(newOitoLine);

console.log('Updated lines count:', updatedLines.length);

// 駅の lines 配属の更新
const updatedStations = JSON.parse(JSON.stringify(originalStations));

// 置換・削除マップ
const lineIdMap = {
  'chuo-rapid': 'chuo-main',
  'utsunomiya-line': 'tohoku-main',
  'tohoku-main-sendai': 'tohoku-main',
  'tohoku-main-morioka': 'tohoku-main',
  'uetsu-niigata': 'uetsu-main',
  'uetsu-north': 'uetsu-main',
  'ou-main-south': 'ou-main',
  'ou-main-north': 'ou-main',
  'oito-west': 'oito-line'
};

Object.keys(updatedStations).forEach(stId => {
  const st = updatedStations[stId];
  const newSet = new Set();
  (st.lines || []).forEach(lid => {
    if (lineIdMap[lid]) {
      newSet.add(lineIdMap[lid]);
    } else if (!removedLineIds.has(lid)) {
      newSet.add(lid);
    }
  });

  // 各新路線の駅に含まれている場合は確実に付与
  if (chuoEastStations.includes(stId)) newSet.add('chuo-main');
  if (tohokuStations.includes(stId)) newSet.add('tohoku-main');
  if (uetsuStations.includes(stId)) newSet.add('uetsu-main');
  if (ouStations.includes(stId)) newSet.add('ou-main');
  if (oitoStations.includes(stId)) newSet.add('oito-line');

  st.lines = Array.from(newSet);
});

// トラックの更新
const updatedTracks = {};
Object.keys(originalTracks).forEach(tId => {
  if (removedLineIds.has(tId)) {
    return; // スキップ
  }
  updatedTracks[tId] = originalTracks[tId];
});

updatedTracks['chuo-main'] = [combinedChuoTrack];
updatedTracks['tohoku-main'] = [tohokuTrack];
updatedTracks['uetsu-main'] = [uetsuTrack];
updatedTracks['ou-main'] = [combinedOuTrack];
updatedTracks['oito-line'] = [oitoTrack];

console.log('Updated tracks count:', Object.keys(updatedTracks).length);

// 出力スクリプトの作成
const outBrainDir = 'C:\\Users\\Takato Wakuda\\.gemini\\antigravity-cli\\brain\\718ddd58-6a5a-4862-8418-dedf5e77c519\\scratch\\';

const buildDataContent = `// JR East & Nationwide Stations and Lines Data
(function() {
  const JR_LINES = ${JSON.stringify(updatedLines, null, 2)};
  const JR_STATIONS = ${JSON.stringify(updatedStations, null, 2)};

  if (typeof window !== 'undefined') {
    window.JR_LINES = JR_LINES;
    window.JR_STATIONS = JR_STATIONS;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { JR_LINES, JR_STATIONS };
  }
})();
`;

const tracksContent = `// Detailed track geometry data (GeoJSON polyline coordinates per line)
(function() {
  const JR_TRACKS = ${JSON.stringify(updatedTracks)};

  if (typeof window !== 'undefined') {
    window.JR_TRACKS = JR_TRACKS;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { JR_TRACKS };
  }
})();
`;

fs.writeFileSync(outBrainDir + 'build-data-unified.js', buildDataContent, 'utf8');
fs.writeFileSync(outBrainDir + 'tracks-unified.js', tracksContent, 'utf8');
console.log('Successfully written unified datasets to brain scratch!');
