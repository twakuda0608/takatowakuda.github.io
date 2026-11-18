const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/build-data.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. tokaido: stations 配列に "chigasaki" を tsujido と hiratsuka の間に追加
const tokaidoOld = `      "tsujido",
      "hiratsuka",`;
const tokaidoNew = `      "tsujido",
      "chigasaki",
      "hiratsuka",`;
if (!content.includes(tokaidoOld)) throw new Error('tokaido target not found');
content = content.replace(tokaidoOld, tokaidoNew);

// 2. sagami: stations 配列の更新
const sagamiOld = `  {
    "id": "sagami",
    "name": "相模線",
    "en": "Sagami Line",
    "code": "",
    "color": "#00a497",
    "textColor": "#ffffff",
    "category": "kanagawa",
    "isLoop": false,
    "description": "茅ケ崎から海老名・厚木を経て橋本を結ぶ神奈川の内陸路線。",
    "stations": [
      "hashimoto",
      "kamimizo",
      "harataima",
      "ebina",
      "atsugi",
      "samukawa"
    ]
  },`;

const sagamiNew = `  {
    "id": "sagami",
    "name": "相模線",
    "en": "Sagami Line",
    "code": "",
    "color": "#00a497",
    "textColor": "#ffffff",
    "category": "kanagawa",
    "isLoop": false,
    "description": "茅ケ崎から海老名・厚木を経て橋本を結ぶ神奈川の内陸路線。",
    "stations": [
      "chigasaki",
      "st-b0pr8m",
      "st-qn38",
      "samukawa",
      "st-g3nn",
      "st-ed9e",
      "st-mfdd5",
      "st-l4jc",
      "atsugi",
      "ebina",
      "st-em42",
      "st-dvqq",
      "harataima",
      "st-km4m",
      "kamimizo",
      "st-cq3fc",
      "hashimoto"
    ]
  },`;
if (!content.includes(sagamiOld)) throw new Error('sagami target not found');
content = content.replace(sagamiOld, sagamiNew);

// 3. tsurumi-line: stations 更新および branches 追加
const tsurumiOld = `  {
    "id": "tsurumi-line",
    "name": "鶴見線",
    "en": "Tsurumi Line",
    "code": "JI",
    "color": "#ffd400",
    "textColor": "#111111",
    "category": "kanagawa",
    "isLoop": false,
    "description": "京浜工業地帯を走る個性豊かな臨海鉄道。",
    "stations": [
      "ogimachi",
      "hamakawasaki",
      "anzen",
      "asano",
      "tsurumi"
    ]
  },`;

const tsurumiNew = `  {
    "id": "tsurumi-line",
    "name": "鶴見線",
    "en": "Tsurumi Line",
    "code": "JI",
    "color": "#ffd400",
    "textColor": "#111111",
    "category": "kanagawa",
    "isLoop": false,
    "description": "京浜工業地帯を走る個性豊かな臨海鉄道。",
    "stations": [
      "tsurumi",
      "st-fl6e",
      "st-kgo8c6",
      "st-ecpab",
      "asano",
      "anzen",
      "st-e3qsx1",
      "hamakawasaki",
      "st-hudb",
      "ogimachi"
    ],
    "branches": [
      [
        "asano",
        "st-fj0gp",
        "st-go0tc"
      ],
      [
        "anzen",
        "st-fogm"
      ]
    ]
  },`;
if (!content.includes(tsurumiOld)) throw new Error('tsurumi target not found');
content = content.replace(tsurumiOld, tsurumiNew);

// 4. ito-line: stations 更新（中間4駅追加）
const itoOld = `  {
    "id": "ito-line",
    "name": "伊東線",
    "en": "Ito Line",
    "code": "JT",
    "color": "#f68b1f",
    "textColor": "#ffffff",
    "category": "kanagawa",
    "isLoop": false,
    "description": "熱海から伊豆半島東岸の伊東へ至るリゾート路線。",
    "stations": [
      "atami",
      "ito"
    ]
  },`;

const itoNew = `  {
    "id": "ito-line",
    "name": "伊東線",
    "en": "Ito Line",
    "code": "JT",
    "color": "#f68b1f",
    "textColor": "#ffffff",
    "category": "kanagawa",
    "isLoop": false,
    "description": "熱海から伊豆半島東岸の伊東へ至るリゾート路線。",
    "stations": [
      "atami",
      "st-i38p",
      "st-ajvhpe",
      "st-lt9t",
      "st-dst8l",
      "ito"
    ]
  },`;
if (!content.includes(itoOld)) throw new Error('ito target not found');
content = content.replace(itoOld, itoNew);

// 5. osaka-loop: edgeDistances 追加
const osakaLoopOld = `    "stations": [
      "st-dmapk",
      "st-e1kec",
      "st-ii50",
      "st-reon",
      "st-kfxz",
      "st-fm3gu",
      "st-cqjlpt",
      "st-dyqn",
      "st-fj37g",
      "st-frsn",
      "st-fzkz",
      "st-l6pz",
      "st-pfz6",
      "st-kiwrn",
      "st-ecrg2",
      "st-fr4s",
      "st-jjpo2",
      "st-dwkk",
      "st-fa3mc"
    ],
    "isLoop": true
  },`;

const osakaLoopNew = `    "stations": [
      "st-dmapk",
      "st-e1kec",
      "st-ii50",
      "st-reon",
      "st-kfxz",
      "st-fm3gu",
      "st-cqjlpt",
      "st-dyqn",
      "st-fj37g",
      "st-frsn",
      "st-fzkz",
      "st-l6pz",
      "st-pfz6",
      "st-kiwrn",
      "st-ecrg2",
      "st-fr4s",
      "st-jjpo2",
      "st-dwkk",
      "st-fa3mc"
    ],
    "isLoop": true,
    "edgeDistances": {
      "st-fa3mc-st-dmapk": 1.0,
      "新今宮-天王寺": 1.0
    }
  },`;
if (!content.includes(osakaLoopOld)) throw new Error('osaka-loop target not found');
content = content.replace(osakaLoopOld, osakaLoopNew);

// 6. hakataminami-line: category を kyushu に
const hakataOld = `  {
    "id": "hakataminami-line",
    "name": "博多南線",
    "en": "Hakata-Minami Line",
    "category": "chugoku",`;
const hakataNew = `  {
    "id": "hakataminami-line",
    "name": "博多南線",
    "en": "Hakata-Minami Line",
    "category": "kyushu",`;
if (!content.includes(hakataOld)) throw new Error('hakataminami target not found');
content = content.replace(hakataOld, hakataNew);

// 7. hokkaido-soya: 抜海駅 ("st-hdgb",) の削除
const bakkaiOld = `      "st-csnya",
      "st-hdgb",
      "st-eqke",`;
const bakkaiNew = `      "st-csnya",
      "st-eqke",`;
if (!content.includes(bakkaiOld)) throw new Error('bakkai in soya target not found');
content = content.replace(bakkaiOld, bakkaiNew);

// 8. kyushu-nippo: 仙巌園駅 ("senganen") の追加
const senganenOld = `      "st-i8r8a",
      "st-nm351"
    ]
  },
  {
    "id": "kyushu-nagasaki"`;
const senganenNew = `      "st-i8r8a",
      "senganen",
      "st-nm351"
    ]
  },
  {
    "id": "kyushu-nagasaki"`;
if (!content.includes(senganenOld)) throw new Error('senganen in nippo target not found');
content = content.replace(senganenOld, senganenNew);

// 9. JR_STATIONS 内の新規駅追加: chigasaki, senganen
const stationsHeadOld = `  const JR_STATIONS = {
  "st-c0cdw": {`;
const stationsHeadNew = `  const JR_STATIONS = {
  "chigasaki": {
    "id": "chigasaki",
    "name": "茅ケ崎",
    "kana": "ちがさき",
    "en": "Chigasaki",
    "lat": 35.33055,
    "lng": 139.40719,
    "pref": "神奈川県",
    "lines": [
      "tokaido",
      "sagami"
    ]
  },
  "senganen": {
    "id": "senganen",
    "name": "仙巌園",
    "kana": "せんがんえん",
    "en": "Senganen",
    "lat": 31.6176,
    "lng": 130.5788,
    "pref": "鹿児島県",
    "lines": [
      "kyushu-nippo"
    ]
  },
  "st-c0cdw": {`;
if (!content.includes(stationsHeadOld)) throw new Error('stationsHead target not found');
content = content.replace(stationsHeadOld, stationsHeadNew);

// 10. JR_STATIONS 内の抜海駅削除
const bakkaiStationOld = `  "st-hdgb": {
    "id": "st-hdgb",
    "name": "抜海",
    "kana": "",
    "en": "抜海",
    "lat": 45.3167,
    "lng": 141.6447,
    "pref": "北海道",
    "lines": [
      "hokkaido-soya"
    ]
  },
`;
if (!content.includes(bakkaiStationOld)) throw new Error('bakkaiStation target not found');
content = content.replace(bakkaiStationOld, '');

// 11. JR_STATIONS 内の既存駅の lines/kana/en 更新
function replaceStation(stationId, oldSnippet, newSnippet) {
  if (!content.includes(oldSnippet)) {
    throw new Error(`Station snippet not found for ${stationId}`);
  }
  content = content.replace(oldSnippet, newSnippet);
}

// st-jfp99 (茅ヶ崎)
replaceStation('st-jfp99', `  "st-jfp99": {
    "id": "st-jfp99",
    "name": "茅ヶ崎",
    "kana": "",
    "en": "茅ヶ崎",
    "lat": 35.33055,
    "lng": 139.40719,
    "pref": "神奈川県",
    "lines": []
  },`, `  "st-jfp99": {
    "id": "st-jfp99",
    "name": "茅ヶ崎",
    "kana": "ちがさき",
    "en": "Chigasaki",
    "lat": 35.33055,
    "lng": 139.40719,
    "pref": "神奈川県",
    "lines": [
      "tokaido",
      "sagami"
    ]
  },`);

// st-b0pr8m (北茅ヶ崎)
replaceStation('st-b0pr8m', `  "st-b0pr8m": {
    "id": "st-b0pr8m",
    "name": "北茅ヶ崎",
    "kana": "",
    "en": "北茅ヶ崎",
    "lat": 35.33968,
    "lng": 139.40747,
    "pref": "神奈川県",
    "lines": []
  },`, `  "st-b0pr8m": {
    "id": "st-b0pr8m",
    "name": "北茅ケ崎",
    "kana": "きたちがさき",
    "en": "Kita-Chigasaki",
    "lat": 35.33968,
    "lng": 139.40747,
    "pref": "神奈川県",
    "lines": [
      "sagami"
    ]
  },`);

// st-qn38 (香川)
replaceStation('st-qn38', `  "st-qn38": {
    "id": "st-qn38",
    "name": "香川",
    "kana": "",
    "en": "香川",
    "lat": 35.3566,
    "lng": 139.39983,
    "pref": "神奈川県",
    "lines": []
  },`, `  "st-qn38": {
    "id": "st-qn38",
    "name": "香川",
    "kana": "かがわ",
    "en": "Kagawa",
    "lat": 35.3566,
    "lng": 139.39983,
    "pref": "神奈川県",
    "lines": [
      "sagami"
    ]
  },`);

// st-g3nn (宮山)
replaceStation('st-g3nn', `  "st-g3nn": {
    "id": "st-g3nn",
    "name": "宮山",
    "kana": "",
    "en": "宮山",
    "lat": 35.38222,
    "lng": 139.37966,
    "pref": "神奈川県",
    "lines": []
  },`, `  "st-g3nn": {
    "id": "st-g3nn",
    "name": "宮山",
    "kana": "みややま",
    "en": "Miyayama",
    "lat": 35.38222,
    "lng": 139.37966,
    "pref": "神奈川県",
    "lines": [
      "sagami"
    ]
  },`);

// st-ed9e (倉見)
replaceStation('st-ed9e', `  "st-ed9e": {
    "id": "st-ed9e",
    "name": "倉見",
    "kana": "",
    "en": "倉見",
    "lat": 35.39506,
    "lng": 139.37838,
    "pref": "神奈川県",
    "lines": []
  },`, `  "st-ed9e": {
    "id": "st-ed9e",
    "name": "倉見",
    "kana": "くらみ",
    "en": "Kurami",
    "lat": 35.39506,
    "lng": 139.37838,
    "pref": "神奈川県",
    "lines": [
      "sagami"
    ]
  },`);

// st-mfdd5 (門沢橋)
replaceStation('st-mfdd5', `  "st-mfdd5": {
    "id": "st-mfdd5",
    "name": "門沢橋",
    "kana": "",
    "en": "門沢橋",
    "lat": 35.4067,
    "lng": 139.38006,
    "pref": "神奈川県",
    "lines": []
  },`, `  "st-mfdd5": {
    "id": "st-mfdd5",
    "name": "門沢橋",
    "kana": "かどさわばし",
    "en": "Kadosawabashi",
    "lat": 35.4067,
    "lng": 139.38006,
    "pref": "神奈川県",
    "lines": [
      "sagami"
    ]
  },`);

// st-l4jc (社家)
replaceStation('st-l4jc', `  "st-l4jc": {
    "id": "st-l4jc",
    "name": "社家",
    "kana": "",
    "en": "社家",
    "lat": 35.42041,
    "lng": 139.37719,
    "pref": "神奈川県",
    "lines": []
  },`, `  "st-l4jc": {
    "id": "st-l4jc",
    "name": "社家",
    "kana": "しゃけ",
    "en": "Shake",
    "lat": 35.42041,
    "lng": 139.37719,
    "pref": "神奈川県",
    "lines": [
      "sagami"
    ]
  },`);

// st-em42 (入谷)
replaceStation('st-em42', `  "st-em42": {
    "id": "st-em42",
    "name": "入谷",
    "kana": "",
    "en": "入谷",
    "lat": 35.47838,
    "lng": 139.39187,
    "pref": "神奈川県",
    "lines": []
  },`, `  "st-em42": {
    "id": "st-em42",
    "name": "入谷",
    "kana": "いりや",
    "en": "Iriya",
    "lat": 35.47838,
    "lng": 139.39187,
    "pref": "神奈川県",
    "lines": [
      "sagami"
    ]
  },`);

// st-dvqq (下溝) - pref は東京都
replaceStation('st-dvqq', `  "st-dvqq": {
    "id": "st-dvqq",
    "name": "下溝",
    "kana": "",
    "en": "下溝",
    "lat": 35.51832,
    "lng": 139.38051,
    "pref": "東京都",
    "lines": []
  },`, `  "st-dvqq": {
    "id": "st-dvqq",
    "name": "下溝",
    "kana": "しもみぞ",
    "en": "Shimomizo",
    "lat": 35.51832,
    "lng": 139.38051,
    "pref": "神奈川県",
    "lines": [
      "sagami"
    ]
  },`);

// st-km4m (番田) - pref は東京都
replaceStation('st-km4m', `  "st-km4m": {
    "id": "st-km4m",
    "name": "番田",
    "kana": "",
    "en": "番田",
    "lat": 35.54538,
    "lng": 139.36311,
    "pref": "東京都",
    "lines": []
  },`, `  "st-km4m": {
    "id": "st-km4m",
    "name": "番田",
    "kana": "ばんだ",
    "en": "Banda",
    "lat": 35.54538,
    "lng": 139.36311,
    "pref": "神奈川県",
    "lines": [
      "sagami"
    ]
  },`);

// st-cq3fc (南橋本) - pref は東京都
replaceStation('st-cq3fc', `  "st-cq3fc": {
    "id": "st-cq3fc",
    "name": "南橋本",
    "kana": "",
    "en": "南橋本",
    "lat": 35.5804,
    "lng": 139.35242,
    "pref": "東京都",
    "lines": []
  },`, `  "st-cq3fc": {
    "id": "st-cq3fc",
    "name": "南橋本",
    "kana": "みなみはしもと",
    "en": "Minami-Hashimoto",
    "lat": 35.5804,
    "lng": 139.35242,
    "pref": "神奈川県",
    "lines": [
      "sagami"
    ]
  },`);

// 伊東線の中間4駅
// st-i38p (来宮)
replaceStation('st-i38p', `  "st-i38p": {
    "id": "st-i38p",
    "name": "来宮",
    "kana": "",
    "en": "来宮",
    "lat": 35.09872,
    "lng": 139.06557,
    "pref": "静岡県",
    "lines": []
  },`, `  "st-i38p": {
    "id": "st-i38p",
    "name": "来宮",
    "kana": "きのみや",
    "en": "Kinomiya",
    "lat": 35.09872,
    "lng": 139.06557,
    "pref": "静岡県",
    "lines": [
      "ito-line"
    ]
  },`);

// st-ajvhpe (伊豆多賀)
replaceStation('st-ajvhpe', `  "st-ajvhpe": {
    "id": "st-ajvhpe",
    "name": "伊豆多賀",
    "kana": "",
    "en": "伊豆多賀",
    "lat": 35.05948,
    "lng": 139.06691,
    "pref": "静岡県",
    "lines": []
  },`, `  "st-ajvhpe": {
    "id": "st-ajvhpe",
    "name": "伊豆多賀",
    "kana": "いずたが",
    "en": "Izu-Taga",
    "lat": 35.05948,
    "lng": 139.06691,
    "pref": "静岡県",
    "lines": [
      "ito-line"
    ]
  },`);

// st-lt9t (網代)
replaceStation('st-lt9t', `  "st-lt9t": {
    "id": "st-lt9t",
    "name": "網代",
    "kana": "",
    "en": "網代",
    "lat": 35.04351,
    "lng": 139.08107,
    "pref": "静岡県",
    "lines": []
  },`, `  "st-lt9t": {
    "id": "st-lt9t",
    "name": "網代",
    "kana": "あじろ",
    "en": "Ajiro",
    "lat": 35.04351,
    "lng": 139.08107,
    "pref": "静岡県",
    "lines": [
      "ito-line"
    ]
  },`);

// st-dst8l (宇佐美)
replaceStation('st-dst8l', `  "st-dst8l": {
    "id": "st-dst8l",
    "name": "宇佐美",
    "kana": "",
    "en": "宇佐美",
    "lat": 35.00564,
    "lng": 139.07978,
    "pref": "静岡県",
    "lines": []
  },`, `  "st-dst8l": {
    "id": "st-dst8l",
    "name": "宇佐美",
    "kana": "うさみ",
    "en": "Usami",
    "lat": 35.00564,
    "lng": 139.07978,
    "pref": "静岡県",
    "lines": [
      "ito-line"
    ]
  },`);

// 鶴見線の中間駅・支線駅
// st-fl6e (国道)
replaceStation('st-fl6e', `  "st-fl6e": {
    "id": "st-fl6e",
    "name": "国道",
    "kana": "",
    "en": "国道",
    "lat": 35.50077,
    "lng": 139.67571,
    "pref": "東京都",
    "lines": []
  },`, `  "st-fl6e": {
    "id": "st-fl6e",
    "name": "国道",
    "kana": "こくどう",
    "en": "Kokudo",
    "lat": 35.50077,
    "lng": 139.67571,
    "pref": "神奈川県",
    "lines": [
      "tsurumi-line"
    ]
  },`);

// st-kgo8c6 (鶴見小野)
replaceStation('st-kgo8c6', `  "st-kgo8c6": {
    "id": "st-kgo8c6",
    "name": "鶴見小野",
    "kana": "",
    "en": "鶴見小野",
    "lat": 35.49702,
    "lng": 139.68128,
    "pref": "神奈川県",
    "lines": []
  },`, `  "st-kgo8c6": {
    "id": "st-kgo8c6",
    "name": "鶴見小野",
    "kana": "つるみおの",
    "en": "Tsurumi-Ono",
    "lat": 35.49702,
    "lng": 139.68128,
    "pref": "神奈川県",
    "lines": [
      "tsurumi-line"
    ]
  },`);

// st-ecpab (弁天橋)
replaceStation('st-ecpab', `  "st-ecpab": {
    "id": "st-ecpab",
    "name": "弁天橋",
    "kana": "",
    "en": "弁天橋",
    "lat": 35.4958,
    "lng": 139.68948,
    "pref": "神奈川県",
    "lines": []
  },`, `  "st-ecpab": {
    "id": "st-ecpab",
    "name": "弁天橋",
    "kana": "べんてんばし",
    "en": "Bentenbashi",
    "lat": 35.4958,
    "lng": 139.68948,
    "pref": "神奈川県",
    "lines": [
      "tsurumi-line"
    ]
  },`);

// st-e3qsx1 (武蔵白石)
replaceStation('st-e3qsx1', `  "st-e3qsx1": {
    "id": "st-e3qsx1",
    "name": "武蔵白石",
    "kana": "",
    "en": "武蔵白石",
    "lat": 35.50193,
    "lng": 139.70653,
    "pref": "千葉県",
    "lines": []
  },`, `  "st-e3qsx1": {
    "id": "st-e3qsx1",
    "name": "武蔵白石",
    "kana": "むさししらいし",
    "en": "Musashi-Shiraishi",
    "lat": 35.50193,
    "lng": 139.70653,
    "pref": "神奈川県",
    "lines": [
      "tsurumi-line"
    ]
  },`);

// st-hudb (昭和)
replaceStation('st-hudb', `  "st-hudb": {
    "id": "st-hudb",
    "name": "昭和",
    "kana": "",
    "en": "昭和",
    "lat": 35.50689,
    "lng": 139.72393,
    "pref": "千葉県",
    "lines": []
  },`, `  "st-hudb": {
    "id": "st-hudb",
    "name": "昭和",
    "kana": "しょうわ",
    "en": "Showa",
    "lat": 35.50689,
    "lng": 139.72393,
    "pref": "神奈川県",
    "lines": [
      "tsurumi-line"
    ]
  },`);

// st-fj0gp (新芝浦)
replaceStation('st-fj0gp', `  "st-fj0gp": {
    "id": "st-fj0gp",
    "name": "新芝浦",
    "kana": "",
    "en": "新芝浦",
    "lat": 35.49192,
    "lng": 139.70013,
    "pref": "千葉県",
    "lines": []
  },`, `  "st-fj0gp": {
    "id": "st-fj0gp",
    "name": "新芝浦",
    "kana": "しんしばうら",
    "en": "Shin-Shibaura",
    "lat": 35.49192,
    "lng": 139.70013,
    "pref": "神奈川県",
    "lines": [
      "tsurumi-line"
    ]
  },`);

// st-go0tc (海芝浦)
replaceStation('st-go0tc', `  "st-go0tc": {
    "id": "st-go0tc",
    "name": "海芝浦",
    "kana": "",
    "en": "海芝浦",
    "lat": 35.48613,
    "lng": 139.70067,
    "pref": "千葉県",
    "lines": []
  },`, `  "st-go0tc": {
    "id": "st-go0tc",
    "name": "海芝浦",
    "kana": "うみしばうら",
    "en": "Umi-Shibaura",
    "lat": 35.48613,
    "lng": 139.70067,
    "pref": "神奈川県",
    "lines": [
      "tsurumi-line"
    ]
  },`);

// st-fogm (大川)
replaceStation('st-fogm', `  "st-fogm": {
    "id": "st-fogm",
    "name": "大川",
    "kana": "",
    "en": "大川",
    "lat": 35.49541,
    "lng": 139.71138,
    "pref": "千葉県",
    "lines": []
  },`, `  "st-fogm": {
    "id": "st-fogm",
    "name": "大川",
    "kana": "おおかわ",
    "en": "Okawa",
    "lat": 35.49541,
    "lng": 139.71138,
    "pref": "神奈川県",
    "lines": [
      "tsurumi-line"
    ]
  },`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated build-data.js');
