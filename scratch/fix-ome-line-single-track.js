const fs = require('fs');

const trackFile = 'jr-map/data/tracks.js';
const outDir = 'C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/718ddd58-6a5a-4862-8418-dedf5e77c519/scratch';

const window = {};
eval(fs.readFileSync(trackFile, 'utf8'));

const TRACKS = window.JR_TRACKS;
const ome = TRACKS['ome-line'];

console.log('Original ome-line chains count:', ome.length);
console.log('Chain 0 points:', ome[0].length);
console.log('Chain 1 points:', ome[1] ? ome[1].length : 'none');

// Chain 1: 立川駅青梅線ホーム (idx 0: 35.6983, 139.41599) 〜 西立川合流点 (idx 16: 35.70305, 139.39503)
// Chain 0: idx 42 が [ 35.70305, 139.39503 ]
// したがって、Chain 1 (0..16) + Chain 0 (43..末尾) を結合すると、
// 立川駅から奥多摩駅までの完全な1本の青梅線本線ポリラインになる！

const chain1 = ome[1];
const chain0 = ome[0];

console.log('Chain 1 end:', chain1[chain1.length - 1]);
console.log('Chain 0 at 42:', chain0[42]);
console.log('Chain 0 at 43:', chain0[43]);

const unifiedChain = chain1.concat(chain0.slice(43));
console.log('Unified ome-line chain points:', unifiedChain.length);
console.log('Unified start (Tachikawa):', unifiedChain[0]);
console.log('Unified end (Okutama):', unifiedChain[unifiedChain.length - 1]);

TRACKS['ome-line'] = [unifiedChain];

const newTracksJS = `/**
 * JR 全国全線路 ジオメトリデータ (国土交通省 鉄道実線路データ準拠)
 * 全187路線・全カーブ・蛇行・専用軌道完全再現ポリライン
 */

window.JR_TRACKS = ${JSON.stringify(TRACKS)};
`;

fs.writeFileSync(outDir + '/tracks-fixed.js', newTracksJS, 'utf8');
console.log('Saved tracks-fixed.js to brain scratch');
