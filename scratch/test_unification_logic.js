const fs = require('fs');

const dataCode = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const trackCode = fs.readFileSync('jr-map/data/tracks.js', 'utf8');
const window = {};
eval(dataCode);
eval(trackCode);

const lines = window.JR_LINES;
const tracks = window.JR_TRACKS;
const stations = window.JR_STATIONS;

console.log('Original lines count:', lines.length);

// 1. 中央本線
const chuoRapid = lines.find(l => l.id === 'chuo-rapid');
const chuoMain = lines.find(l => l.id === 'chuo-main');

// 中央本線（東京〜塩尻）の駅リスト
const chuoEastStations = [
  'tokyo', 'kanda', 'ochanomizu', 'yotsuya', 'shinjuku', 'nakano',
  'koenji', 'asagaya', 'ogikubo', 'nishi-ogikubo', 'kichijoji', 'mitaka',
  'musashi-sakai', 'higashi-koganei', 'musashi-koganei', 'kokubunji', 'nishi-kokubunji',
  'kunitachi', 'tachikawa', 'hino', 'toyoda', 'hachioji', 'nishi-hachioji',
  'takao', 'sagamiko', 'fujino', 'uenohara', 'st-d7vzb', 'st-iags', 'st-ra71', 'st-k6p8',
  'otsuki', 'st-elik', 'st-lgl3', 'st-f7g6eb', 'st-xpzlnn', 'st-fjmw', 'st-flqq0',
  'st-e1rbf', 'st-db6eid', 'st-fhkbjt', 'st-p9c6', 'kofu', 'st-lj5b', 'st-fjr9',
  'nirasaki', 'st-htd8', 'st-lc3h', 'st-fmncs', 'st-pwh7', 'kobuchizawa',
  'st-c8p1d', 'st-dvx70', 'st-hxrsyx', 'st-qb4x', 'chino', 'kamisuwa',
  'st-c3vye', 'okaya', 'st-6bjeqe', 'shiojiri'
];

// トラック結合: chuo-rapid (0〜370) + chuo-main (199〜771)
const crTrack = tracks['chuo-rapid'][0];
const cmTrack = tracks['chuo-main'][0];
const combinedChuoTrack = [...crTrack, ...cmTrack.slice(199)];

console.log('Combined Chuo track length:', combinedChuoTrack.length);
console.log('Combined Chuo start:', combinedChuoTrack[0]);
console.log('Combined Chuo end:', combinedChuoTrack[combinedChuoTrack.length - 1]);

// 2. 東北本線
const tohokuSendai = lines.find(l => l.id === 'tohoku-main-sendai');
const tohokuStations = [...tohokuSendai.stations].reverse(); // 東京 -> 盛岡
const tohokuTrack = tracks['tohoku-main-sendai'][0]; // 東京 -> 盛岡

console.log('Tohoku track length:', tohokuTrack.length);

// 3. 羽越本線
const uetsuNiigata = lines.find(l => l.id === 'uetsu-niigata');
const uetsuStations = [...uetsuNiigata.stations].reverse(); // 新津 -> 秋田
const uetsuTrack = tracks['uetsu-niigata'][0]; // 新津 -> 秋田

console.log('Uetsu track length:', uetsuTrack.length);

// 4. 奥羽本線
const ouSouth = lines.find(l => l.id === 'ou-main-south');
const ouStations = [...ouSouth.stations].reverse(); // 福島 -> 青森
const ouSTrack = tracks['ou-main-south'][0];
const ouNTrack = tracks['ou-main-north'][0];
const combinedOuTrack = [...ouSTrack.slice(0, 134), ...ouNTrack]; // 福島 -> 青森

console.log('Combined Ou track length:', combinedOuTrack.length);
console.log('Combined Ou start:', combinedOuTrack[0]);
console.log('Combined Ou end:', combinedOuTrack[combinedOuTrack.length - 1]);

// 5. 大糸線
const oitoLine = lines.find(l => l.id === 'oito-line');
const oitoWest = lines.find(l => l.id === 'oito-west');
const oitoStations = [
  'itoigawa', 'st-ft5e', 'st-jkgza5', 'st-z787s1', 'st-011n2t', 'st-8k50', 'st-cmk4f', 'st-drwy',
  'st-cnvkv', 'st-en16', 'st-b2oovk', 'st-s5a7', 'hakuba', 'st-51b63t', 'st-r986', 'st-r8x8',
  'st-q97k', 'st-q8r2', 'st-q77q', 'st-8j3v', 'st-e11r1c', 'shinano-omachi', 'st-8iqe',
  'st-d9v8', 'st-g79j', 'st-f7z0', 'st-f6h0', 'st-f50q', 'st-f421', 'st-f3bb', 'st-f24b',
  'st-365g96', 'st-2216k3', 'st-f03j', 'st-1t90w4', 'st-0t78i4', 'st-f9p5e', 'st-f80e0',
  'st-g9cf', 'st-coath', 'matsumoto'
];
const oitoTrack = tracks['oito-line'][0];

console.log('Oito track length:', oitoTrack.length);
