const fs = require('fs');

const dir = 'C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/718ddd58-6a5a-4862-8418-dedf5e77c519/scratch';
const dt = fs.readFileSync(dir + '/desktoptetsu.html', 'utf8');
const dataCode = fs.readFileSync('jr-map/data/build-data.js', 'utf8');

const window = {};
eval(dataCode);
const LINES = window.JR_LINES;
const STATIONS = window.JR_STATIONS;

// desktoptetsu の各路線情報をパース
const linesTable = [];
const rowRegex = /<tr>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>/g;
let m;
while ((m = rowRegex.exec(dt)) !== null) {
  linesTable.push({
    name: m[1].trim(),
    section: m[2].trim(),
    category: m[3].trim(),
    gauge: m[4].trim(),
    km: m[5].trim()
  });
}

console.log(`Parsed ${linesTable.length} table rows from desktoptetsu.`);

// 首都圏および主要路線の正式区間照合
const officialTargetNames = [
  '山手線', '赤羽線', '根岸線', '横浜線', '南武線', '鶴見線', '武蔵野線', '京葉線',
  '東海道本線', '東北本線', '中央本線', '総武本線', '常磐線', '高崎線', '上越線',
  '信越本線', '篠ノ井線', '青梅線', '五日市線', '八高線', '伊東線', '日光線', '烏山線',
  '吾妻線', '両毛線', '水戸線', '水郡線', '内房線', '外房線', '成田線', '鹿島線', '久留里線'
];

officialTargetNames.forEach(name => {
  const dtMatches = linesTable.filter(r => r.name === name || r.section.includes(name));
  const appMatches = LINES.filter(l => l.name === name);
  console.log(`\n=== 【${name}】 ===`);
  console.log('desktoptetsu:');
  dtMatches.forEach(r => console.log(`  - ${r.name}: ${r.section} (${r.km}km)`));
  console.log('App current:');
  appMatches.forEach(l => {
    const s0 = STATIONS[l.stations[0]] ? STATIONS[l.stations[0]].name : l.stations[0];
    const sN = STATIONS[l.stations[l.stations.length - 1]] ? STATIONS[l.stations[l.stations.length - 1]].name : l.stations[l.stations.length - 1];
    console.log(`  - ID: ${l.id}, Name: ${l.name}, Stations: ${l.stations.length} (${s0} 〜 ${sN})`);
  });
});
