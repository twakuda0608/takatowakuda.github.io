const fs = require('fs');
const dump = JSON.parse(fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/batch4_stations_dump.json', 'utf8'));

const part4Lines = [
  'kyushu-kagoshima',
  'kyushu-nippo',
  'kyushu-nagasaki',
  'kyushu-sasebo',
  'kyushu-omura',
  'kyushu-kyudai',
  'kyushu-hohi',
  'kyushu-chikuhi',
  'kyushu-karatsu',
  'kyushu-misumi',
  'kyushu-ibusuki',
  'kyushu-nichinan',
  'kyushu-miyazaki-airport',
  'kyushu-kitto',
  'kyushu-hisatsu',
  'kyushu-chikuho',
  'kyushu-sasaguri',
  'kyushu-kashii',
  'kyushu-gotoji',
  'kyushu-hitahikosan'
];

part4Lines.forEach(lineId => {
  const line = dump[lineId];
  console.log(`\n=== ${line.name} (${line.id}): ${line.stations.length} stations ===`);
  const names = line.stations.map(s => s.name);
  console.log('Start:', names.slice(0, 5).join(' -> '));
  console.log('End:', names.slice(-5).join(' -> '));
  if (line.stations.length <= 15) {
    console.log('All:', names.join(' -> '));
  }
});
