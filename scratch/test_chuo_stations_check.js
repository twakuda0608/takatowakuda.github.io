const fs = require('fs');
const dataCode = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const window = {};
eval(dataCode);

const stations = window.JR_STATIONS;

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

console.log('Total Chuo East stations:', chuoEastStations.length);
chuoEastStations.forEach((id, idx) => {
  const s = stations[id];
  console.log(`${idx + 1}. [${id}]: ${s ? s.name : 'MISSING'}`);
});
