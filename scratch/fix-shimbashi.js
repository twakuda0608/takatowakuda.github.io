const fs = require('fs');

const dataFile = 'jr-map/data/build-data.js';
const outDir = 'C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/718ddd58-6a5a-4862-8418-dedf5e77c519/scratch';

const window = {};
eval(fs.readFileSync(dataFile, 'utf8'));

if (window.JR_STATIONS['shimbashi']) {
  window.JR_STATIONS['shimbashi'].lines = window.JR_STATIONS['shimbashi'].lines.filter(l => l !== 'yamanote');
  console.log('Fixed shimbashi lines:', window.JR_STATIONS['shimbashi'].lines);
}

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
