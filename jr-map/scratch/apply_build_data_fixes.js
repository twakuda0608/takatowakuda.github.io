const fs = require('fs');
let content = fs.readFileSync('jr-map/data/build-data.js', 'utf8');

// 1. sanyo-main の直後に sanyo-wadamisaki を追加
const wadamisakiLine = `  {
    "id": "sanyo-wadamisaki",
    "name": "山陽本線(和田岬線)",
    "en": "Sanyo Main Line (Wadamisaki Branch)",
    "category": "chugoku",
    "color": "#0072bc",
    "textColor": "#ffffff",
    "code": "W",
    "description": "兵庫から和田岬を結ぶ山陽本線の支線。",
    "stations": [
      "st-edhy",
      "st-cy96w"
    ]
  },`;

const sanyoEndMarker = `      "st-gp26",
      "st-e3g7"
    ]
  },`;

if (!content.includes('"id": "sanyo-wadamisaki"')) {
  content = content.replace(sanyoEndMarker, sanyoEndMarker + '\n' + wadamisakiLine);
  console.log('Added sanyo-wadamisaki');
}

// 2. sanin-main から st-dx79 (仙崎) を削除
const senzakiTarget = `      "st-qg06",
      "st-jgy9tx",
      "st-dx79",
      "st-mm2ih",`;
const senzakiReplacement = `      "st-qg06",
      "st-jgy9tx",
      "st-mm2ih",`;
if (content.includes(senzakiTarget)) {
  content = content.replace(senzakiTarget, senzakiReplacement);
  console.log('Removed st-dx79 from sanin-main');
}

// 3. sanin-main の直後に sanin-senzaki を追加
const senzakiLine = `  {
    "id": "sanin-senzaki",
    "name": "山陰本線(仙崎支線)",
    "en": "Sanin Main Line (Senzaki Branch)",
    "category": "chugoku",
    "color": "#804192",
    "textColor": "#ffffff",
    "code": "E",
    "description": "長門市から仙崎を結ぶ山陰本線の支線。",
    "stations": [
      "st-mm2ih",
      "st-dx79"
    ]
  },`;

const saninEndMatch = content.match(/"id":\s*"sanin-main"[\s\S]*?"stations":\s*\[[\s\S]*?\]\s*\n\s*\},/);
if (saninEndMatch && !content.includes('"id": "sanin-senzaki"')) {
  const matchedText = saninEndMatch[0];
  content = content.replace(matchedText, matchedText + '\n' + senzakiLine);
  console.log('Added sanin-senzaki');
}

// 4. shikoku-yosan から新線駅を削除
const yosanTarget = `      "st-cp3sr",
      "st-aatoiy",
      "st-ndsx3",
      "st-aarw0c",
      "st-dw31",
      "st-fg2",
      "st-cz6sa",
      "st-ab40sj",
      "st-aaslmf",
      "st-aayrem",
      "st-ccxv1",
      "st-i5a3",
      "st-e5ru",
      "st-i2dj",
      "st-ed7v",
      "st-aazeeo",
      "st-aarswy",
      "st-aatrft",`;

const yosanReplacement = `      "st-cp3sr",
      "st-ndsx3",
      "st-aarw0c",
      "st-dw31",
      "st-fg2",
      "st-cz6sa",
      "st-ab40sj",
      "st-aaslmf",
      "st-aayrem",
      "st-ccxv1",
      "st-i5a3",
      "st-e5ru",
      "st-aatrft",`;

if (content.includes(yosanTarget)) {
  content = content.replace(yosanTarget, yosanReplacement);
  console.log('Cleaned shikoku-yosan stations');
}

// 5. shikoku-yosan-new (内子新線特急ルート) を追加
const yosanNewLine = `  {
    "id": "shikoku-yosan-new",
    "name": "予讃線(内子経由新線)",
    "en": "Yosan Line (via Uchiko)",
    "category": "shikoku",
    "color": "#f15a24",
    "textColor": "#ffffff",
    "code": "Y",
    "description": "向井原から内子線を経由して伊予大洲を結ぶ短絡ルート（特急列車ルート）。",
    "stations": [
      "st-cp3sr",
      "st-aatoiy",
      "st-aarswy",
      "st-aazeeo",
      "st-ed7v",
      "st-edg0a",
      "st-cwlhq",
      "st-i2dj",
      "st-aatrft"
    ]
  },`;

const yosanEndMatch = content.match(/"id":\s*"shikoku-yosan"[\s\S]*?"stations":\s*\[[\s\S]*?\]\s*\n\s*\},/);
if (yosanEndMatch && !content.includes('"id": "shikoku-yosan-new"')) {
  const matchedText = yosanEndMatch[0];
  content = content.replace(matchedText, matchedText + '\n' + yosanNewLine);
  console.log('Added shikoku-yosan-new');
}

// 6. 各駅の lines プロパティに新路線IDを追加
content = content.replace(/"id":\s*"st-cy96w"[\s\S]*?"lines":\s*\[([\s\S]*?)\]/, (m, p1) => {
  if (!p1.includes('sanyo-wadamisaki')) {
    return m.replace(p1, p1.trim() + ',\n      "sanyo-wadamisaki"\n    ');
  }
  return m;
});

content = content.replace(/"id":\s*"st-edhy"[\s\S]*?"lines":\s*\[([\s\S]*?)\]/, (m, p1) => {
  if (!p1.includes('sanyo-wadamisaki')) {
    return m.replace(p1, p1.trim() + ',\n      "sanyo-wadamisaki"\n    ');
  }
  return m;
});

content = content.replace(/"id":\s*"st-dx79"[\s\S]*?"lines":\s*\[([\s\S]*?)\]/, (m, p1) => {
  if (!p1.includes('sanin-senzaki')) {
    return m.replace(p1, p1.trim() + ',\n      "sanin-senzaki"\n    ');
  }
  return m;
});

content = content.replace(/"id":\s*"st-mm2ih"[\s\S]*?"lines":\s*\[([\s\S]*?)\]/, (m, p1) => {
  if (!p1.includes('sanin-senzaki')) {
    return m.replace(p1, p1.trim() + ',\n      "sanin-senzaki"\n    ');
  }
  return m;
});

const newYosanStationIds = ["st-cp3sr", "st-aatoiy", "st-aarswy", "st-aazeeo", "st-ed7v", "st-edg0a", "st-cwlhq", "st-i2dj", "st-aatrft"];
for (const stId of newYosanStationIds) {
  const reg = new RegExp(`"id":\\s*"${stId}"[\\s\\S]*?"lines":\\s*\\[([\\s\\S]*?)\\]`);
  content = content.replace(reg, (m, p1) => {
    if (!p1.includes('shikoku-yosan-new')) {
      return m.replace(p1, p1.trim() + ',\n      "shikoku-yosan-new"\n    ');
    }
    return m;
  });
}

// スクラッチディレクトリに保存
const scratchPath = 'C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/build-data-fixed.js';
fs.writeFileSync(scratchPath, content, 'utf8');
console.log('Saved to scratchPath, size:', content.length);
