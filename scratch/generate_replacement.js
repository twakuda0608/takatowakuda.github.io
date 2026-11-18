const fs = require('fs');
const content = fs.readFileSync('jr-map/data/tracks.js', 'utf8');
const vm = require('vm');
const ctx = { window: {}, module: { exports: {} } };
vm.runInNewContext(content, ctx);
const tracks = ctx.window.JR_TRACKS || ctx.module.exports.JR_TRACKS;

const ysr = tracks['yokosuka-sobu-rapid'][0];
const cs = tracks['chuo-sobu'][0];
const sm = tracks['sobu-main'][0];

// Main line: Tokyo -> Choshi
const mainTrack = [
  ...ysr.slice(356, 375),
  ...sm.slice(41)
];

// Branch line: Ochanomizu -> Akihabara -> Asakusabashi -> Ryogoku -> Kinshicho
const branchTrack = [
  ...cs.slice(83, 93),
  [ 35.69666, 139.81294 ],
  [ 35.69739, 139.82788 ]
];

const newSobuMain = [mainTrack, branchTrack];
const replacement = '"sobu-main":' + JSON.stringify(newSobuMain) + ',';

const key = '"sobu-main":';
const idx = content.indexOf(key);
const nextKey = '"senseki-line":';
const nextIdx = content.indexOf(nextKey, idx);
const target = content.slice(idx, nextIdx);

console.log('TARGET_START');
console.log(target);
console.log('TARGET_END');

console.log('REPLACEMENT_START');
console.log(replacement);
console.log('REPLACEMENT_END');
