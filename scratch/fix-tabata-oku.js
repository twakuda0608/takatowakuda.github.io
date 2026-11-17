const fs = require('fs');

// 1. build-data.js の修正
console.log('--- Fixing build-data.js ---');
const dataFile = 'jr-map/data/build-data.js';
let dataContent = fs.readFileSync(dataFile, 'utf8');

// window.JR_LINES の中で tohoku-main-sendai, tohoku-main-morioka から oku を削除
const window = {};
eval(dataContent);

let modifiedLines = false;
window.JR_LINES.forEach(l => {
  if (l.id === 'tohoku-main-sendai' || l.id === 'tohoku-main-morioka') {
    const okuIdx = l.stations.indexOf('oku');
    if (okuIdx !== -1) {
      console.log(`Removing 'oku' from line ${l.id} at index ${okuIdx}`);
      l.stations.splice(okuIdx, 1);
      modifiedLines = true;
    }
  }
});

if (window.JR_STATIONS['oku']) {
  console.log('Old oku lines:', window.JR_STATIONS['oku'].lines);
  window.JR_STATIONS['oku'].lines = ['utsunomiya-line'];
  console.log('New oku lines:', window.JR_STATIONS['oku'].lines);
}

// 2. tracks.js の修正
console.log('\n--- Fixing tracks.js ---');
const trackFile = 'jr-map/data/tracks.js';
let trackContent = fs.readFileSync(trackFile, 'utf8');
eval(trackContent);

const TRACKS = window.JR_TRACKS;

// 2.1 tohoku-main-sendai のトラック修正
// idx 48 (35.75302, 139.73751) から idx 65 (35.75323, 139.73710) へ直結 (idx 49〜64 の往復・寄り道ループをカット)
const sendaiChain = TRACKS['tohoku-main-sendai'][0];
console.log('tohoku-main-sendai original length:', sendaiChain.length);
console.log('sendaiChain[48]:', sendaiChain[48]);
console.log('sendaiChain[49]:', sendaiChain[49]);
console.log('sendaiChain[65]:', sendaiChain[65]);

// idx 0..48 + idx 65..末尾
const newSendaiChain = sendaiChain.slice(0, 49).concat(sendaiChain.slice(65));
console.log('tohoku-main-sendai new length:', newSendaiChain.length);
TRACKS['tohoku-main-sendai'][0] = newSendaiChain;

// 2.2 tohoku-main-morioka のトラック修正
// idx 36 (35.73669, 139.76248: 田端)
// 田端〜王子間の正しい頂点列は sendaiChain.slice(37, 49) にある！
// moriokaChain の idx 37〜44 (田端〜尾久〜上中里) を、田端〜上中里〜王子の正しい頂点列に置換
const moriokaChain = TRACKS['tohoku-main-morioka'][0];
console.log('tohoku-main-morioka original length:', moriokaChain.length);
console.log('moriokaChain[36]:', moriokaChain[36]);
console.log('moriokaChain[45]:', moriokaChain[45]);

const correctTabataToOji = sendaiChain.slice(37, 49);
// moriokaChain: 0..36 (田端まで) + correctTabataToOji + 45..末尾 (王子以降)
const newMoriokaChain = moriokaChain.slice(0, 37).concat(correctTabataToOji, moriokaChain.slice(45));
console.log('tohoku-main-morioka new length:', newMoriokaChain.length);
TRACKS['tohoku-main-morioka'][0] = newMoriokaChain;

// 3. ファイルへの保存
const newBuildDataJS = `/**
 * JR 全国路線 & 駅マスターデータ (JR Nationwide Railway Dataset)
 * 収録: 全国のJR旅客6社 (JR北海道・JR東日本・JR東海・JR西日本・JR四国・JR九州)
 * 路線名規約: 国土交通省『鉄道要覧』およびJR各社線路名称公告に基づく100%完全な正式路線名
 */

window.JR_CATEGORIES = ${JSON.stringify(window.JR_CATEGORIES, null, 2)};

window.JR_LINES = ${JSON.stringify(window.JR_LINES, null, 2)};

window.JR_STATIONS = ${JSON.stringify(window.JR_STATIONS, null, 2)};
`;

const outDir = 'C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/718ddd58-6a5a-4862-8418-dedf5e77c519/scratch';
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
