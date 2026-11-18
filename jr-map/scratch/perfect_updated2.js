const fs = require('fs');
const vm = require('vm');
const buildData = require('../data/build-data.js');

const code = fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/official-kilos-updated2.js', 'utf8');
const ctx = { module: { exports: {} }, exports: {} };
vm.createContext(ctx);
vm.runInContext(code, ctx);
const OFFICIAL = ctx.module.exports.OFFICIAL_STATION_KILOS;

// 1. Perfect tokaido-west
const tw = OFFICIAL['tokaido-west'];
tw['野洲'] = 484.5;
tw['st-peec'] = 484.5;
tw['守山'] = 487.0;
tw['st-g2qx'] = 487.0;
tw['栗東'] = 489.1;
tw['st-i9tm'] = 489.1;
tw['草津'] = 491.4;
tw['st-mxh8'] = 491.4;
tw['南草津'] = 493.9;
tw['st-cudn7'] = 493.9;
tw['瀬田'] = 496.6;
tw['st-jq10-1'] = 496.6;
tw['石山'] = 499.1;
tw['st-kwri'] = 499.1;
tw['膳所'] = 501.9;
tw['st-mlm5'] = 501.9;
tw['大津'] = 503.6;
tw['st-frha'] = 503.6;
tw['山科'] = 508.1;
tw['st-ge4g'] = 508.1;
tw['京都'] = 513.6;
tw['kyoto'] = 513.6;
// Kobe area
tw['塚本'] = 559.8;
tw['st-flea'] = 559.8;
tw['尼崎'] = 564.1;
tw['st-g76a'] = 564.1;
tw['立花'] = 567.1;
tw['st-llqe'] = 567.1;
tw['甲子園口'] = 569.3;
tw['st-f5xrsf'] = 569.3;
tw['西宮'] = 571.8;
tw['st-nw27'] = 571.8;
tw['さくら夙川'] = 573.3;
tw['st-1h7uhxv'] = 573.3;
tw['芦屋'] = 575.6;
tw['st-mq91'] = 575.6;
tw['甲南山手'] = 577.0;
tw['st-f4sq3j'] = 577.0;
tw['摂津本山'] = 578.5;
tw['st-d3pxyg'] = 578.5;
tw['住吉'] = 580.1;
tw['st-dy8q-1'] = 580.1;
tw['六甲道'] = 582.3;
tw['st-ci2z2'] = 582.3;
tw['摩耶'] = 583.2;
tw['st-hs6l'] = 583.2;
tw['灘'] = 584.6;
tw['st-m6w'] = 584.6;
tw['三ノ宮'] = 587.0;
tw['st-boa5l'] = 587.0;
tw['元町'] = 587.8;
tw['st-egrb'] = 587.8;
tw['神戸'] = 589.5;
tw['st-l6l6'] = 589.5;

// 2. Perfect kyushu-hohi
const hohi = OFFICIAL['kyushu-hohi'];
const hohiKilos = {
  "大分": 0.0,
  "滝尾": 5.1,
  "敷戸": 7.8,
  "大分大学前": 9.2,
  "中判田": 11.7,
  "竹中": 17.2,
  "犬飼": 22.8,
  "菅尾": 30.7,
  "三重町": 36.1,
  "豊後清川": 42.6,
  "緒方": 47.5,
  "朝地": 53.9,
  "豊後竹田": 59.8,
  "玉来": 62.9,
  "豊後荻": 72.6,
  "滝水": 78.8,
  "波野": 83.7,
  "宮地": 94.4,
  "いこいの村": 96.6,
  "阿蘇": 97.9,
  "内牧": 101.4,
  "市ノ川": 105.2,
  "赤水": 107.6,
  "立野": 115.5,
  "瀬田": 120.6,
  "肥後大津": 125.2,
  "原水": 129.1,
  "三里木": 132.2,
  "光の森": 133.2,
  "武蔵塚": 135.1,
  "竜田口": 139.1,
  "東海学園前": 140.2,
  "水前寺": 142.2,
  "新水前寺": 142.8,
  "南熊本": 144.4,
  "平成": 145.3,
  "熊本": 148.0
};
for (const [stName, k] of Object.entries(hohiKilos)) {
  hohi[stName] = k;
}
// Also update station ID keys
const hohiLine = buildData.JR_LINES.find(l => l.id === 'kyushu-hohi');
for (const stId of hohiLine.stations) {
  const st = buildData.JR_STATIONS[stId];
  if (st && hohiKilos[st.name] !== undefined) {
    hohi[stId] = hohiKilos[st.name];
  }
}

// Write perfected updated2
const lines = fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/official-kilos-updated2.js', 'utf8').split('\n');

// Replace line 79 (tokaido-west) and line 175 (kyushu-hohi) in lines
lines[79] = '    "tokaido-west": ' + JSON.stringify(tw) + ',';
lines[175] = '    "kyushu-hohi": ' + JSON.stringify(hohi) + ',';

fs.writeFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/official-kilos-updated2.js', lines.join('\n'));
console.log('Successfully perfected updated2.js');
