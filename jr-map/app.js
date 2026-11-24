/**
 * JR 路線図 (JR Railway Map)
 * 全国路線図ビューア - 関東エリア & 全国新幹線
 */

(function () {
  'use strict';

  // --- 定数 & 状態管理 ---
  const STATIONS = window.JR_STATIONS || {};
  const LINES = window.JR_LINES || [];
  const CATEGORIES = window.JR_CATEGORIES || [];
  const TOPO = window.JR_TOPO || null;

  const STATE = {
    currentCategory: 'all',
    selectedLineId: null,
    selectedStationId: null,
    currentPreset: 'kanto',
    placedStationBoxes: []
  };

  // プリセット座標 (MapLibre GL JS: [lng, lat])
  const PRESETS = {
    kanto: { center: [139.7671, 35.6812], zoom: 8.2 },
    kansai: { center: [135.5023, 34.6937], zoom: 8.2 },
    tokai: { center: [136.8815, 35.1709], zoom: 8.2 },
    hokkaido: { center: [141.3508, 43.0687], zoom: 7.2 },
    tohoku: { center: [140.8694, 38.2682], zoom: 6.5 },
    chugoku: { center: [133.0, 34.5], zoom: 7.2 },
    shikoku: { center: [133.5, 33.8], zoom: 7.2 },
    kyushu: { center: [130.8, 33.0], zoom: 7.2 },
    japan: { center: [138.2529, 36.2048], zoom: 5.5 }
  };

  // --- 駅名ラベルの階層定義 (重なり防止システム) ---
  // Tier 1: ズームアウト(ズーム6〜11)でも重ならない全国広域・代表メガハブ駅
  const TIER1_MEGA_HUBS = new Set([
    'tokyo', 'shinjuku', 'yokohama', 'omiya', 'chiba', 'takasaki', 'utsunomiya', 'mito', 'odawara',
    'nagoya', 'shin-osaka', 'sendai', 'niigata', 'kanazawa', 'morioka', 'shin-aomori', 'aomori', 'akita',
    'yamagata', 'fukushima', 'koriyama', 'nagano', 'shin-hakodate-hokuto', 'sapporo', 'hakata', 'hiroshima', 'okayama',
    'kumamoto', 'kagoshima-chuo', 'nagasaki', 'toyama', 'fukui', 'tsuruga'
  ]);

  const TIER1_STATION_NAMES = new Set([
    '札幌', '旭川', '函館', '新函館北斗',
    '青森', '新青森', '八戸', '盛岡', '秋田', '山形', '仙台', '福島', '郡山',
    '新潟', '長野', '富山', '金沢', '福井', '敦賀',
    '東京', '品川', '上野', '新宿', '渋谷', '池袋', '横浜', '大宮', '千葉', '高崎', '宇都宮', '水戸',
    '静岡', '浜松', '名古屋', '豊橋', '岐阜', '米原',
    '京都', '大阪', '新大阪', '天王寺', '三ノ宮', '神戸', '姫路', '奈良', '和歌山',
    '岡山', '広島', '鳥取', '松江', '新山口', '下関',
    '高松', '徳島', '松山', '高知',
    '小倉', '博多', '佐賀', '長崎', '熊本', '大分', '宮崎', '鹿児島中央'
  ]);

  // Tier 2: ズーム12以上で表示する大都市圏主要ターミナル・地域拠点駅
  const TIER2_MAJOR_HUBS = new Set([
    'shibuya', 'ikebukuro', 'ueno', 'shinagawa', 'tachikawa', 'hachioji', 'kawasaki',
    'ofuna', 'funabashi', 'kashiwa', 'oyama', 'kumagaya', 'kisarazu', 'atami', 'otsuki', 'shizuoka', 'kyoto',
    'matsumoto', 'nagaoka', 'hachinohe', 'ichinoseki', 'hirosaki', 'aizu-wakamatsu', 'iwaki', 'yonezawa', 'shinjo', 'kitakami', 'kofu',
    'shin-kobe', 'himeji', 'shin-yamaguchi', 'kokura', 'shin-tosu', 'takeo-onsen', 'shin-takaoka', 'kurobe-unazukionsen', 'kaga-onsen', 'komatsu', 'itoigawa', 'joetsumyoko'
  ]);

  const TIER2_STATION_NAMES = new Set([
    '帯広', '釧路', '北見', '網走', '稚内', '室蘭', '苫小牧', '新千歳空港', '小樽', '岩見沢', '滝川',
    '弘前', '一ノ関', '北上', '酒田', '鶴岡', '米沢', '新庄', 'いわき', '会津若松',
    '長岡', '柏崎', '直江津', '糸魚川', '上越妙高', '松本', '上田', '軽井沢', '佐久平', '高岡', '新高岡', '小松', '加賀温泉', '越前たけふ', '芦原温泉',
    '立川', '八王子', '川崎', '大船', '藤沢', '小田原', '船橋', '柏', '木更津', '小山', '熊谷', '大月', '熱海', '甲府',
    '沼津', '富士', '掛川', '三島', '多治見', '中津川', '高山', '松阪', '津', '伊勢市', '四日市',
    '草津', '山科', '鶴橋', '京橋', '弁天町', '新今宮', '西九条', '福知山', '舞鶴', '近江今津', '尼崎', '西宮', '明石', '相生',
    '倉敷', '津山', '新見', '尾道', '福山', '三原', '呉', '岩国', '徳山', '防府', '宇部', '出雲市', '益田',
    '坂出', '丸亀', '多度津', '今治', '宇和島', '鳴門', '阿南', '窪川',
    '門司港', '折尾', '黒崎', '鳥栖', '新鳥栖', '武雄温泉', '嬉野温泉', '諫早', '新大村', '八代', '川内', '延岡', '指宿', '隼人', '吉松'
  ]);

  // Tier 3: ズーム14以上で表示する主要乗換駅・拠点駅
  const TIER3_LOCAL_HUBS = new Set([
    'akabane', 'musashi-kosugi', 'kinshicho', 'nakano', 'machida', 'shin-yokohama',
    'fujisawa', 'tsudanuma', 'kaihimmakuhari', 'toride', 'komagawa', 'kawagoe', 'haijima', 'ebina',
    'hashimoto', 'chigasaki', 'hiratsuka', 'shin-kiba', 'maihama', 'shin-matsudo', 'musashi-urawa',
    'minami-urawa', 'kokubunji', 'ogikubo', 'mitaka', 'shimbashi', 'hamamatsucho', 'akihabara', 'kanda',
    'sakata', 'tsuruoka', 'ishinomaki', 'kesennuma', 'kamaishi', 'miyako', 'odate', 'noshiro',
    'sakudaira', 'karuizawa', 'ueda', 'minakami', 'echigo-yuzawa', 'shibukawa', 'kashimajingu', 'hitachi-daigo',
    'annaka', 'yokokawa', 'naoetsu', 'kashiwazaki', 'niitsu', 'shibata', 'echizen-takefu', 'awara-onsen', 'ureshino-onsen', 'shin-omura', 'isahaya'
  ]);

  function isMajorStation(stOrId) {
    if (!stOrId) return false;
    const id = typeof stOrId === 'string' ? stOrId : stOrId.id;
    const st = typeof stOrId === 'string' ? STATIONS[stOrId] : stOrId;
    const name = st ? st.name : '';
    return TIER1_MEGA_HUBS.has(id) ||
           TIER1_STATION_NAMES.has(name) ||
           TIER2_MAJOR_HUBS.has(id) ||
           TIER2_STATION_NAMES.has(name);
  }

  // --- MapLibre GL JS 地図 & 状態管理 ---
  let map = null;
  const lineCoordinatesMap = new Map(); // lineId -> [[lng, lat], ...]
  const linePolylines = new Map(); // 互換性用
  const stationMarkers = new Map(); // 互換性用
  let hoverPopup = null;

  // =======================================================
  // 1. 初期化
  // =======================================================
  function init() {
    if (typeof maplibregl === 'undefined') {
      console.error('MapLibre GL JS library is not loaded.');
      const appEl = document.getElementById('app');
      if (appEl) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1e293b;color:#fff;padding:24px;border-radius:12px;text-align:center;max-width:320px;box-shadow:0 8px 30px rgba(0,0,0,0.5);z-index:99999;';
        errorDiv.innerHTML = '<h3 style="margin-bottom:8px;font-size:16px;">地図ライブラリ読込中</h3><p style="font-size:13px;color:#94a3b8;margin-bottom:12px;">インターネット接続をご確認の上、ページを再読込してください。</p><button type="button" onclick="location.reload()" style="background:#0078d7;color:#fff;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;font-weight:700;">再読込</button>';
        appEl.appendChild(errorDiv);
      }
      return;
    }

    prepareStationSearchIndex();
    normalizeStationPrefectures();
    initDuplicateStations();
    precomputeStationScores();
    initMap();
    buildAdjacentStationsIndex();
    setupEventHandlers();
    initRouteEngineUI();
  }

  // 検索用インデックスの事前構築 (検索時の文字列生成オーバーヘッドを完全排除)
  function prepareStationSearchIndex() {
    for (const id in STATIONS) {
      const st = STATIONS[id];
      st._nameLower = (st.name || '').toLowerCase();
      st._kanaLower = (st.kana || '').toLowerCase();
      st._enLower = (getStationEnName(st) || '').toLowerCase();
    }
  }

  // =======================================================
  // 同名駅の自動検出・UI表記（都道府県併記）・マルス表記マスタ
  // =======================================================
  const DUPLICATE_STATION_NAMES = new Set();
  const DUPLICATE_STATION_IDS = new Map(); // id -> { name, pref, prefAbbr, uiName, marsName }

  function getPrefAbbr(pref) {
    if (!pref) return '';
    if (pref === '北海道') return '北海道';
    return pref.replace(/[都府県]$/, '');
  }

  function initDuplicateStations() {
    if (!STATIONS) return;
    const nameMap = {};
    for (const id in STATIONS) {
      const st = STATIONS[id];
      if (!nameMap[st.name]) nameMap[st.name] = [];
      nameMap[st.name].push({ id, ...st });
    }
    const marsMap = (window.JR_ROUTE_ENGINE && window.JR_ROUTE_ENGINE.MARS_DUPLICATE_STATION_MAP) || {};

    for (const name in nameMap) {
      const list = nameMap[name];
      if (list.length > 1) {
        DUPLICATE_STATION_NAMES.add(name);
        for (const st of list) {
          const prefAbbr = getPrefAbbr(st.pref);
          const uiName = `${st.name}（${prefAbbr}）`;
          const marsName = marsMap[st.id] || st.name;
          const info = {
            id: st.id,
            name: st.name,
            pref: st.pref,
            prefAbbr,
            uiName,
            marsName
          };
          DUPLICATE_STATION_IDS.set(st.id, info);
          if (STATIONS[st.id]) {
            STATIONS[st.id]._uiName = uiName;
            STATIONS[st.id]._marsName = marsName;
            STATIONS[st.id]._isDuplicate = true;
          }
        }
      }
    }
  }

  function getStationUiName(stOrId) {
    if (!stOrId) return '';
    const id = typeof stOrId === 'string' ? stOrId : stOrId.id;
    if (DUPLICATE_STATION_IDS.has(id)) {
      return DUPLICATE_STATION_IDS.get(id).uiName;
    }
    const st = STATIONS[id] || (typeof stOrId === 'object' ? stOrId : null);
    if (!st) return typeof stOrId === 'string' ? stOrId : '';
    if (DUPLICATE_STATION_NAMES.has(st.name)) {
      const prefAbbr = getPrefAbbr(st.pref);
      return `${st.name}（${prefAbbr}）`;
    }
    return st.name;
  }

  function getStationMarsName(stOrId) {
    if (!stOrId) return '';
    const id = typeof stOrId === 'string' ? stOrId : stOrId.id;
    if (DUPLICATE_STATION_IDS.has(id)) {
      return DUPLICATE_STATION_IDS.get(id).marsName;
    }
    const marsMap = (window.JR_ROUTE_ENGINE && window.JR_ROUTE_ENGINE.MARS_DUPLICATE_STATION_MAP) || {};
    if (marsMap[id]) return marsMap[id];
    const st = STATIONS[id] || (typeof stOrId === 'object' ? stOrId : null);
    return st ? st.name : (typeof stOrId === 'string' ? stOrId : '');
  }

  // =======================================================
  // 駅名入力欄ゴーストサフィックス・共通ヘルパー関数
  // =======================================================
  function attachStationGhostOverlay(inputEl) {
    if (!inputEl) return null;
    if (inputEl._ghostOverlay) return inputEl._ghostOverlay;

    const overlay = document.createElement('div');
    overlay.className = 'station-input-ghost-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    const mirror = document.createElement('span');
    mirror.className = 'ghost-mirror';

    const pref = document.createElement('span');
    pref.className = 'ghost-pref';

    overlay.appendChild(mirror);
    overlay.appendChild(pref);

    // input要素の直後に挿入 (親ラッパー内に配置)
    if (inputEl.parentNode) {
      inputEl.parentNode.insertBefore(overlay, inputEl.nextSibling);
    }

    inputEl._ghostOverlay = overlay;
    inputEl._ghostMirror = mirror;
    inputEl._ghostPref = pref;

    // スクロール同期
    inputEl.addEventListener('scroll', () => {
      overlay.scrollLeft = inputEl.scrollLeft;
    });

    // 文字編集時（1文字でも書き換えたら即座に data-id とゴースト表示をクリア）
    inputEl.addEventListener('input', () => {
      inputEl.removeAttribute('data-id');
      mirror.textContent = '';
      pref.textContent = '';
    });

    // フォーカス状態の同期
    inputEl.addEventListener('focus', () => {
      overlay.classList.add('is-focused');
    });
    inputEl.addEventListener('blur', () => {
      overlay.classList.remove('is-focused');
    });

    return overlay;
  }

  function setStationInputValue(inputEl, st) {
    if (!inputEl) return;
    if (DUPLICATE_STATION_IDS.size === 0 && typeof initDuplicateStations === 'function') {
      initDuplicateStations();
    }
    if (!inputEl._ghostOverlay) {
      attachStationGhostOverlay(inputEl);
    }
    const resolvedSt = typeof st === 'string' ? STATIONS[st] : st;
    if (!resolvedSt) {
      clearStationInputValue(inputEl);
      return;
    }

    inputEl.value = resolvedSt.name;
    inputEl.setAttribute('data-id', resolvedSt.id);

    const isDuplicate = DUPLICATE_STATION_IDS.has(resolvedSt.id) || DUPLICATE_STATION_NAMES.has(resolvedSt.name);
    if (isDuplicate) {
      const prefAbbr = getPrefAbbr(resolvedSt.pref);
      if (inputEl._ghostMirror) inputEl._ghostMirror.textContent = resolvedSt.name;
      if (inputEl._ghostPref) inputEl._ghostPref.textContent = `（${prefAbbr}）`;
    } else {
      if (inputEl._ghostMirror) inputEl._ghostMirror.textContent = '';
      if (inputEl._ghostPref) inputEl._ghostPref.textContent = '';
    }

    if (inputEl._ghostOverlay) {
      inputEl._ghostOverlay.scrollLeft = inputEl.scrollLeft;
    }
  }

  function clearStationInputValue(inputEl) {
    if (!inputEl) return;
    if (!inputEl._ghostOverlay) {
      attachStationGhostOverlay(inputEl);
    }
    inputEl.value = '';
    inputEl.removeAttribute('data-id');
    if (inputEl._ghostMirror) inputEl._ghostMirror.textContent = '';
    if (inputEl._ghostPref) inputEl._ghostPref.textContent = '';
    if (inputEl._ghostOverlay) {
      inputEl._ghostOverlay.scrollLeft = 0;
    }
  }

  function swapStationInputs(inputA, inputB) {
    if (!inputA || !inputB) return;
    if (!inputA._ghostOverlay) attachStationGhostOverlay(inputA);
    if (!inputB._ghostOverlay) attachStationGhostOverlay(inputB);

    const valA = inputA.value;
    const idA = inputA.getAttribute('data-id');
    const mirrorA = inputA._ghostMirror ? inputA._ghostMirror.textContent : '';
    const prefA = inputA._ghostPref ? inputA._ghostPref.textContent : '';

    const valB = inputB.value;
    const idB = inputB.getAttribute('data-id');
    const mirrorB = inputB._ghostMirror ? inputB._ghostMirror.textContent : '';
    const prefB = inputB._ghostPref ? inputB._ghostPref.textContent : '';

    inputA.value = valB;
    if (idB) inputA.setAttribute('data-id', idB);
    else inputA.removeAttribute('data-id');
    if (inputA._ghostMirror) inputA._ghostMirror.textContent = mirrorB;
    if (inputA._ghostPref) inputA._ghostPref.textContent = prefB;

    inputB.value = valA;
    if (idA) inputB.setAttribute('data-id', idA);
    else inputB.removeAttribute('data-id');
    if (inputB._ghostMirror) inputB._ghostMirror.textContent = mirrorA;
    if (inputB._ghostPref) inputB._ghostPref.textContent = prefA;

    if (inputA._ghostOverlay) inputA._ghostOverlay.scrollLeft = inputA.scrollLeft;
    if (inputB._ghostOverlay) inputB._ghostOverlay.scrollLeft = inputB.scrollLeft;
  }

  // =======================================================
  // ヘボン式ローマ字安全変換 & 駅英語名取得ヘルパー
  // =======================================================
  const KANA_HEPBURN_MAP = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'を': 'o', 'ん': 'n',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
    'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
    'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
    'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
    'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
    'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
    'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
    'ぢゃ': 'ja', 'ぢゅ': 'ju', 'ぢょ': 'jo',
    'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
    'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
    'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
    'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
    'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
    'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
    'ふぁ': 'fa', 'ふぃ': 'fi', 'ふぇ': 'fe', 'ふぉ': 'fo',
    'てぃ': 'ti', 'でぃ': 'di', 'ヴ': 'v'
  };

  function kanaToHepburnSafe(kana) {
    if (!kana) return '';
    let k = kana.replace(/[\u30a1-\u30f6]/g, m => String.fromCharCode(m.charCodeAt(0) - 0x60));
    let res = '';
    let i = 0;
    while (i < k.length) {
      if (i + 1 < k.length) {
        const two = k.slice(i, i + 2);
        if (KANA_HEPBURN_MAP[two]) {
          res += KANA_HEPBURN_MAP[two];
          i += 2;
          continue;
        }
      }
      const c = k[i];
      if (c === 'っ') {
        if (i + 1 < k.length) {
          const nextTwo = k.slice(i + 1, i + 3);
          const nextOne = k[i + 1];
          let nextR = KANA_HEPBURN_MAP[nextTwo] || KANA_HEPBURN_MAP[nextOne] || '';
          if (nextR.startsWith('ch')) res += 't';
          else if (nextR) res += nextR[0];
        }
        i++;
        continue;
      }
      if (c === 'ー') {
        i++;
        continue;
      }
      if (c === 'う' && i > 0 && ['o', 'u'].includes(res.slice(-1))) {
        i++;
        continue;
      }
      if (c === 'お' && i > 0 && res.slice(-1) === 'o') {
        i++;
        continue;
      }
      if (KANA_HEPBURN_MAP[c]) {
        res += KANA_HEPBURN_MAP[c];
      } else {
        res += c;
      }
      i++;
    }
    res = res.replace(/nb/g, 'mb').replace(/np/g, 'mp').replace(/nm/g, 'mm');
    if (res) res = res.charAt(0).toUpperCase() + res.slice(1);
    return res;
  }

  function getStationEnName(stOrId) {
    if (!stOrId) return '';
    const st = typeof stOrId === 'string' ? STATIONS[stOrId] : stOrId;
    if (!st) return '';
    // st.en に日本語（ひらがな・カタカナ・漢字等）が含まれず空でない場合はそのまま使用
    if (st.en && !/[^\x00-\x7F]/.test(st.en)) {
      return st.en;
    }
    // 万一 st.en に日本語が残っているか空の場合は st.kana または st.name からヘボン式ローマ字へ安全に変換
    const fallbackSource = (st.kana && !/[\u4e00-\u9faf]/.test(st.kana)) ? st.kana : (st.name || '');
    return kanaToHepburnSafe(fallbackSource) || st.en || st.name || '';
  }

  // 駅の優先度スコア・局所孤立度（過疎地域判定）の事前計算 (起動時に1回のみ高速実行)
  // 地図ドラッグ時に毎回計算するのを廃止し、同じズーム度なら駅名表示が絶対にブレない決定論的仕様を実現
  function precomputeStationScores() {
    const stations = Object.values(STATIONS);
    if (!stations.length) return;

    // 経緯度 0.5度グリッドによる最近傍駅距離（孤立度）の高速算出
    const grid = new Map();
    stations.forEach(st => {
      const gx = Math.floor(st.lng / 0.5);
      const gy = Math.floor(st.lat / 0.5);
      const key = `${gx},${gy}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(st);
    });

    stations.forEach(st => {
      const gx = Math.floor(st.lng / 0.5);
      const gy = Math.floor(st.lat / 0.5);
      let minDistSq = Infinity;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const cell = grid.get(`${gx + dx},${gy + dy}`);
          if (!cell) continue;
          for (let i = 0; i < cell.length; i++) {
            const o = cell[i];
            if (o.id === st.id) continue;
            const dSq = (st.lng - o.lng) ** 2 + (st.lat - o.lat) ** 2;
            if (dSq < minDistSq) minDistSq = dSq;
          }
        }
      }
      st._geoMinDist = Math.sqrt(minDistSq);

      // 完全固定の基本優先度スコア
      let baseScore = 0;
      const isMega = TIER1_MEGA_HUBS.has(st.id) || TIER1_STATION_NAMES.has(st.name);
      const isMajor = TIER2_MAJOR_HUBS.has(st.id) || TIER2_STATION_NAMES.has(st.name);
      const isLocal = TIER3_LOCAL_HUBS.has(st.id);

      if (isMega) {
        baseScore += 5000;
      } else if (isMajor) {
        baseScore += 3000;
      } else if (isLocal) {
        baseScore += 1800;
      } else if (st.hub) {
        baseScore += 1000;
      }

      const lineCount = st.lines ? st.lines.length : 1;
      baseScore += lineCount * 150;

      // 孤立駅（過疎地域・北海道等で周囲に駅が密集していない孤立駅を優遇）
      if (st._geoMinDist >= 0.20) {
        baseScore += 1200; // ~22km以上
      } else if (st._geoMinDist >= 0.10) {
        baseScore += 800;  // ~11km以上
      } else if (st._geoMinDist >= 0.05) {
        baseScore += 400;  // ~5.5km以上
      }

      // 完全決定論的なタイブレーカー (駅IDハッシュ 0〜49.9)
      let hash = 0;
      for (let i = 0; i < st.id.length; i++) {
        hash = ((hash << 5) - hash + st.id.charCodeAt(i)) & 0x7fff;
      }
      baseScore += (hash % 50) * 0.1;

      st._baseScore = baseScore;
    });
  }

  // 地図インスタンスの初期化 (MapLibre GL JS - WebGL 連続ベクター描画)
  function initMap() {
    const initialView = PRESETS.kanto;
    map = new maplibregl.Map({
      container: 'map',
      style: {
        version: 8,
        name: 'JR Map Pure Vector',
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {},
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: {
              'background-color': '#f8fafc'
            }
          }
        ]
      },
      center: initialView.center,
      zoom: initialView.zoom,
      minZoom: 4,
      maxZoom: 18,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      attributionControl: false,
      localIdeographFontFamily: "'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif"
    });
    window.JR_MAP = map;

    hoverPopup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: [0, -8],
      className: 'station-hover-popup'
    });

    map.on('load', () => {
      // 駅◯コライダー用の完全透明 18x18px 画像を登録
      if (!map.hasImage('station-collider')) {
        const width = 18;
        const height = 18;
        const data = new Uint8Array(width * height * 4); // 全ピクセル RGBA: 0,0,0,0
        map.addImage('station-collider', { width, height, data });
      }
      drawBorders();
      updateMapLayers();
      setupMapInteractions();
      updateResponsiveLayerZooms(true);
    });
  }

  const STATION_DOT_LAYERS = [
    'local-station-dots',
    'major-tier2-dots',
    'major-mega-dots'
  ];
  const STATION_COLLIDER_LAYERS = [
    'local-station-dot-colliders',
    'major-tier2-dot-colliders',
    'major-mega-dot-colliders'
  ];
  const STATION_LABEL_LAYERS = [
    'local-station-labels',
    'major-tier2-labels',
    'major-mega-labels'
  ];
  const ALL_STATION_INTERACTIVE_LAYERS = [
    ...STATION_DOT_LAYERS,
    ...STATION_COLLIDER_LAYERS,
    ...STATION_LABEL_LAYERS
  ];

  function setupMapInteractions() {
    if (!map) return;

    // 単一のクリックイベントハンドラ（駅優先 & 貫通防止）
    map.on('click', (e) => {
      if (e.defaultPrevented) return;

      // 1. まず駅（全駅ドット・全駅名ラベル・全駅コライダー）へのヒット判定
      const hitLayers = ALL_STATION_INTERACTIVE_LAYERS.filter(id => map.getLayer(id));
      const stationFeatures = map.queryRenderedFeatures(e.point, {
        layers: hitLayers
      });

      if (stationFeatures && stationFeatures.length > 0) {
        const stId = stationFeatures[0].properties.id;
        if (stId) {
          // 開いている路線バナーがあれば閉じる
          closeLineBanner();
          // 地図上の駅クリック時はカメラ移動させず（shouldPan = false）、駅名看板とリングのみ表示
          selectStation(stId, false);
          return;
        }
      }

      // 2. 駅にヒットしなかった場合は余白クリックとしてシートおよび路線バナーを閉じる（路線クリック誤爆なし）
      closeStationSheet();
      closeLineBanner();
    });

    // カーソル & ホバーツールチップ (全駅ドット & 全駅名ラベル)
    const hoverLayers = [...STATION_DOT_LAYERS, ...STATION_LABEL_LAYERS];
    hoverLayers.forEach(layerId => {
      map.on('mousemove', layerId, (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer';
          const f = e.features[0];
          const coords = f.geometry.coordinates.slice();
          const name = f.properties.name;
          hoverPopup.setLngLat(coords).setHTML(`<div class="station-hover-tooltip">${name}</div>`).addTo(map);
        }
      });
      map.on('mouseleave', layerId, () => {
        map.getCanvas().style.cursor = '';
        hoverPopup.remove();
      });
    });
  }

  function initLabelPool() {
    // 互換性スタブ (MapLibre GL JS では GPU Symbol レイヤーが自動処理)
  }

  // =======================================================
  // 1.5 駅都道府県データの自動補正 (国土地理院 行政界ポリゴン判定)
  // =======================================================
  function normalizeStationPrefectures() {
    // 全駅にすでに都道府県名 (pref) が設定済みか高速確認 (設定済みの場合は重厚計算をスキップ)
    let needsNormalization = false;
    for (const stId in STATIONS) {
      if (!STATIONS[stId].pref) {
        needsNormalization = true;
        break;
      }
    }
    if (!needsNormalization) return;

    const topo = TOPO || window.JR_TOPO;
    if (!topo || typeof topojson === 'undefined' || !topo.objects || !topo.objects.japan) return;

    try {
      const geojson = topojson.feature(topo, topo.objects.japan);
      if (!geojson || !geojson.features) return;

      function pointInRing(x, y, ring) {
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          const xi = ring[i][0], yi = ring[i][1];
          const xj = ring[j][0], yj = ring[j][1];
          const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
          if (intersect) inside = !inside;
        }
        return inside;
      }

      function pointInPoly(x, y, coords) {
        if (!pointInRing(x, y, coords[0])) return false;
        for (let h = 1; h < coords.length; h++) {
          if (pointInRing(x, y, coords[h])) return false;
        }
        return true;
      }

      function pointInGeom(x, y, geom) {
        if (geom.type === 'Polygon') {
          return pointInPoly(x, y, geom.coordinates);
        } else if (geom.type === 'MultiPolygon') {
          for (let p = 0; p < geom.coordinates.length; p++) {
            if (pointInPoly(x, y, geom.coordinates[p])) return true;
          }
        }
        return false;
      }

      function distSqToSegment(x, y, x1, y1, x2, y2) {
        const dx = x2 - x1, dy = y2 - y1;
        if (dx === 0 && dy === 0) {
          const ddx = x - x1, ddy = y - y1;
          return ddx * ddx + ddy * ddy;
        }
        const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
        const px = x1 + t * dx, py = y1 + t * dy;
        const ex = x - px, ey = y - py;
        return ex * ex + ey * ey;
      }

      function distSqToGeom(x, y, geom) {
        let minD = Infinity;
        const checkRings = (rings) => {
          for (let r = 0; r < rings.length; r++) {
            const ring = rings[r];
            for (let i = 0; i < ring.length - 1; i++) {
              const d = distSqToSegment(x, y, ring[i][0], ring[i][1], ring[i + 1][0], ring[i + 1][1]);
              if (d < minD) minD = d;
            }
          }
        };
        if (geom.type === 'Polygon') {
          checkRings(geom.coordinates);
        } else if (geom.type === 'MultiPolygon') {
          for (let p = 0; p < geom.coordinates.length; p++) {
            checkRings(geom.coordinates[p]);
          }
        }
        return minD;
      }

      const prefList = geojson.features.map(f => {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const updateBBox = (ring) => {
          for (let i = 0; i < ring.length; i++) {
            const x = ring[i][0], y = ring[i][1];
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        };

        if (f.geometry.type === 'Polygon') {
          f.geometry.coordinates.forEach(updateBBox);
        } else if (f.geometry.type === 'MultiPolygon') {
          f.geometry.coordinates.forEach(poly => poly.forEach(updateBBox));
        }

        return {
          name: f.properties.nam_ja,
          minX, minY, maxX, maxY,
          geom: f.geometry
        };
      });

      const unassigned = [];
      for (const stId in STATIONS) {
        const st = STATIONS[stId];
        const x = st.lng, y = st.lat;
        let matched = false;
        for (let i = 0; i < prefList.length; i++) {
          const p = prefList[i];
          if (x < p.minX || x > p.maxX || y < p.minY || y > p.maxY) continue;
          if (pointInGeom(x, y, p.geom)) {
            st.pref = p.name;
            matched = true;
            break;
          }
        }
        if (!matched) {
          unassigned.push(st);
        }
      }

      // 沿岸部・埋立地等のフォールバック判定 (最寄り境界線)
      unassigned.forEach(st => {
        const x = st.lng, y = st.lat;
        let bestPref = null;
        let bestDist = Infinity;
        for (let i = 0; i < prefList.length; i++) {
          const p = prefList[i];
          if (x < p.minX - 1.0 || x > p.maxX + 1.0 || y < p.minY - 1.0 || y > p.maxY + 1.0) continue;
          const d = distSqToGeom(x, y, p.geom);
          if (d < bestDist) {
            bestDist = d;
            bestPref = p.name;
          }
        }
        if (bestPref) {
          st.pref = bestPref;
        }
      });
    } catch (e) {
      console.warn('Failed to normalize station prefectures:', e);
    }
  }

  // =======================================================
  // 2. リアル行政境界線 & 海岸線の描画 (国土地理院データ - MapLibre GeoJSON)
  // =======================================================
  function drawBorders() {
    if (!map) return;
    const topo = TOPO || window.JR_TOPO;
    if (!topo || typeof topojson === "undefined") {
      console.warn("JR_TOPO or topojson-client is not loaded.");
      return;
    }

    // 1. 陸地ポリゴン (全国47都道府県のリアルな陸地輪郭・海岸線)
    const landGeoJSON = topojson.feature(topo, topo.objects.japan);
    if (!map.getSource("land-source")) {
      map.addSource("land-source", {
        type: "geojson",
        data: landGeoJSON
      });

      map.addLayer({
        id: "land-fill",
        type: "fill",
        source: "land-source",
        paint: {
          "fill-color": "#ffffff",
          "fill-opacity": 0.95
        }
      });

      map.addLayer({
        id: "land-border",
        type: "line",
        source: "land-source",
        paint: {
          "line-color": "#94a3b8",
          "line-width": 1.0,
          "line-opacity": 0.8
        }
      });
    }

    // 2. 都道府県境界線 (内側のリアル県境のみを抽出して破線描画)
    const interiorMesh = topojson.mesh(topo, topo.objects.japan, (a, b) => a !== b);
    const borderGeoJSON = {
      type: "Feature",
      properties: {},
      geometry: interiorMesh
    };

    if (!map.getSource("borders-source")) {
      map.addSource("borders-source", {
        type: "geojson",
        data: borderGeoJSON
      });

      map.addLayer({
        id: "prefecture-border",
        type: "line",
        source: "borders-source",
        paint: {
          "line-color": "#64748b",
          "line-width": 1.0,
          "line-dasharray": [2.5, 3.5],
          "line-opacity": 0.65
        }
      });
    }
  }

  // =======================================================
  // 3. 線路描画 & 並走オフセット処理 (国土交通省公式データ準拠)
  // =======================================================
  function offsetLineMeters(points, offsetMeters) {
    if (!offsetMeters || points.length < 2) return points;
    const latLen = 111000;
    const result = [];
    const n = points.length;

    for (let i = 0; i < n; i++) {
      const lat = points[i][0];
      const lng = points[i][1];
      const lngLen = 111000 * Math.cos(lat * Math.PI / 180);

      let dx = 0, dy = 0;
      if (i > 0) {
        dx += (lng - points[i - 1][1]) * lngLen;
        dy += (lat - points[i - 1][0]) * latLen;
      }
      if (i < n - 1) {
        dx += (points[i + 1][1] - lng) * lngLen;
        dy += (points[i + 1][0] - lat) * latLen;
      }

      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;

      const newLat = lat + (ny * offsetMeters) / latLen;
      const newLng = lng + (nx * offsetMeters) / lngLen;
      result.push([newLat, newLng]);
    }
    return result;
  }

  function cleanLineName(name) {
    if (!name) return "";
    return name.replace(/\([^)]*\)/g, "").replace(/（[^）]*）/g, "").trim();
  }

  // 路線名ラベル用ポリラインの結合（ガイドパス生成）
  function buildSmoothedLineLabelFeatures(lines, tracks) {
    const labelFeatures = [];

    function distSq(p1, p2) {
      return (p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2;
    }

    function calcChainLength(pts) {
      let total = 0;
      for (let i = 1; i < pts.length; i++) {
        total += Math.sqrt(distSq(pts[i - 1], pts[i]));
      }
      return total;
    }

    // 急激な折り返し（Uターン結合）防止チェック（内積 < -0.5 で約120度以上の急旋回を検出）
    function isSharpTurn(pPrev, pJoint, pNext) {
      if (!pPrev || !pJoint || !pNext) return false;
      const v1x = pJoint[0] - pPrev[0], v1y = pJoint[1] - pPrev[1];
      const v2x = pNext[0] - pJoint[0], v2y = pNext[1] - pJoint[1];
      const l1 = Math.sqrt(v1x * v1x + v1y * v1y);
      const l2 = Math.sqrt(v2x * v2x + v2y * v2y);
      if (l1 === 0 || l2 === 0) return false;
      const dot = (v1x * v2x + v1y * v2y) / (l1 * l2);
      return dot < -0.5;
    }

    function mergeChains(chains, maxDistDeg = 0.003) {
      if (!chains || chains.length <= 1) return chains ? chains.map(c => [...c]) : [];
      const maxD2 = maxDistDeg * maxDistDeg;
      let pool = chains.map(c => [...c]);
      const merged = [];

      while (pool.length > 0) {
        pool.sort((a, b) => b.length - a.length);
        let current = pool.shift();
        let extended = true;

        while (extended) {
          extended = false;
          const head = current[0];
          const tail = current[current.length - 1];

          for (let i = 0; i < pool.length; i++) {
            const candidate = pool[i];
            const cHead = candidate[0];
            const cTail = candidate[candidate.length - 1];

            if (distSq(tail, cHead) <= maxD2) {
              if (current.length >= 2 && candidate.length >= 2 && isSharpTurn(current[current.length - 2], tail, candidate[1])) {
                continue;
              }
              current.push(...candidate.slice(1));
              pool.splice(i, 1);
              extended = true;
              break;
            } else if (distSq(tail, cTail) <= maxD2) {
              if (current.length >= 2 && candidate.length >= 2 && isSharpTurn(current[current.length - 2], tail, candidate[candidate.length - 2])) {
                continue;
              }
              current.push(...candidate.slice(0, -1).reverse());
              pool.splice(i, 1);
              extended = true;
              break;
            } else if (distSq(head, cTail) <= maxD2) {
              if (candidate.length >= 2 && current.length >= 2 && isSharpTurn(candidate[candidate.length - 2], head, current[1])) {
                continue;
              }
              current.unshift(...candidate.slice(0, -1));
              pool.splice(i, 1);
              extended = true;
              break;
            } else if (distSq(head, cHead) <= maxD2) {
              if (candidate.length >= 2 && current.length >= 2 && isSharpTurn(candidate[1], head, current[1])) {
                continue;
              }
              current.unshift(...candidate.slice(1).reverse());
              pool.splice(i, 1);
              extended = true;
              break;
            }
          }
        }
        merged.push(current);
      }
      return merged;
    }

    lines.forEach(line => {
      let rawChains = [];
      const offsetMeters = line.trackOffset || 0;

      if (tracks[line.id] && tracks[line.id].length > 0) {
        rawChains = tracks[line.id].map(chain => {
          const latlngs = chain.map(pt => (pt[0] > 90 ? [pt[1], pt[0]] : pt));
          return offsetMeters !== 0 ? offsetLineMeters(latlngs, offsetMeters) : latlngs;
        });
      } else {
        const pathStationIds = line.trackPath || line.stations;
        const rawLatlngs = [];
        pathStationIds.forEach(stId => {
          const st = STATIONS[stId];
          if (st) rawLatlngs.push([st.lat, st.lng]);
        });
        if (rawLatlngs.length >= 2) {
          rawChains = [offsetMeters !== 0 ? offsetLineMeters(rawLatlngs, offsetMeters) : rawLatlngs];
        }
      }

      if (rawChains.length === 0) return;

      const lnglatChains = rawChains.map(chain => chain.map(pt => [pt[1], pt[0]]));
      const mergedChains = mergeChains(lnglatChains, 0.003);

      const cName = cleanLineName(line.name);
      const isShinkansen = line.category === "shinkansen";
      const isMainLine = line.category === "main" || line.category === "kanto-main" || isShinkansen;

      mergedChains.forEach((chain, cIdx) => {
        const len = calcChainLength(chain);
        if (mergedChains.length > 1 && len < 0.015) return;

        // ガイドパスは実線路の座標をそのまま保持（乖離0m）。
        // ズームに応じた動的簡略化は MapLibre ソースの tolerance: 2.5 に委ねる。
        if (chain.length >= 2) {
          const sortKey = isShinkansen ? 100 : (isMainLine ? 250 : 500);

          labelFeatures.push({
            type: "Feature",
            id: "label-" + line.id + "-" + cIdx,
            properties: {
              lineId: line.id,
              name: cName,
              fullName: line.name,
              color: line.color,
              isShinkansen: isShinkansen,
              category: line.category || "other",
              sortKey: sortKey
            },
            geometry: {
              type: "LineString",
              coordinates: chain
            }
          });
        }
      });
    });

    return labelFeatures;
  }

  // =======================================================
  // 4. 路線 & 駅の描画 (MapLibre GL JS WebGL レイヤー)
  // =======================================================
  function updateMapLayers() {
    if (!map) return;

    // --- A. 路線データの準備 ---
    const TRACKS = window.JR_TRACKS || {};
    const lineFeatures = [];
    lineCoordinatesMap.clear();

    LINES.forEach(line => {
      const isShinkansen = line.category === "shinkansen";
      const offsetMeters = line.trackOffset || 0;
      let lineChains = [];

      if (TRACKS[line.id] && TRACKS[line.id].length > 0) {
        lineChains = TRACKS[line.id].map(chain => {
          const latlngs = chain.map(pt => (pt[0] > 90 ? [pt[1], pt[0]] : pt));
          return offsetMeters !== 0 ? offsetLineMeters(latlngs, offsetMeters) : latlngs;
        });
      } else {
        const pathStationIds = line.trackPath || line.stations;
        const rawLatlngs = [];
        pathStationIds.forEach(stId => {
          const st = STATIONS[stId];
          if (st) rawLatlngs.push([st.lat, st.lng]);
        });
        if (rawLatlngs.length >= 2) {
          lineChains = [offsetMeters !== 0 ? offsetLineMeters(rawLatlngs, offsetMeters) : rawLatlngs];
        }
      }

      if (lineChains.length === 0) return;

      const allCoordsForLine = [];
      const cName = cleanLineName(line.name);

      lineChains.forEach((chain, cIdx) => {
        const lnglats = chain.map(pt => [pt[1], pt[0]]);
        if (lnglats.length >= 2) {
          allCoordsForLine.push(...lnglats);
          lineFeatures.push({
            type: "Feature",
            id: line.id + "-" + cIdx,
            properties: {
              lineId: line.id,
              name: cName,
              fullName: line.name,
              color: line.color,
              isShinkansen: isShinkansen,
              category: line.category || "other"
            },
            geometry: {
              type: "LineString",
              coordinates: lnglats
            }
          });
        }
      });

      lineCoordinatesMap.set(line.id, allCoordsForLine);
    });

    const labelFeatures = buildSmoothedLineLabelFeatures(LINES, TRACKS);

    if (!map.getSource("lines-source")) {
      map.addSource("lines-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: lineFeatures
        }
      });

      map.addSource("line-labels-source", {
        type: "geojson",
        tolerance: 2.5,
        data: {
          type: "FeatureCollection",
          features: labelFeatures
        }
      });

      map.addLayer({
        id: "conventional-lines",
        type: "line",
        source: "lines-source",
        filter: ["!=", ["get", "isShinkansen"], true],
        layout: {
          "line-cap": "round",
          "line-join": "round"
        },
        paint: {
          "line-color": ["get", "color"],
          "line-width": [
            "interpolate", ["linear"], ["zoom"],
            5, 1.2,
            8, 2.4,
            10, 3.4,
            12, 4.6,
            15, 6.8
          ],
          "line-opacity": 0.95
        }
      });

      map.addLayer({
        id: "shinkansen-lines-casing",
        type: "line",
        source: "lines-source",
        filter: ["==", ["get", "isShinkansen"], true],
        layout: {
          "line-cap": "round",
          "line-join": "round"
        },
        paint: {
          "line-color": ["get", "color"],
          "line-width": [
            "interpolate", ["linear"], ["zoom"],
            5, 2.0,
            8, 3.8,
            10, 5.2,
            12, 7.0,
            15, 9.5
          ],
          "line-opacity": 1.0
        }
      });

      map.addLayer({
        id: "shinkansen-lines-dash",
        type: "line",
        source: "lines-source",
        filter: ["==", ["get", "isShinkansen"], true],
        layout: {
          "line-cap": "butt",
          "line-join": "round"
        },
        paint: {
          "line-color": "#ffffff",
          "line-width": [
            "interpolate", ["linear"], ["zoom"],
            5, 1.0,
            8, 1.8,
            10, 2.6,
            12, 3.6,
            15, 4.8
          ],
          "line-dasharray": [3, 2.5],
          "line-opacity": 1.0
        }
      });

      map.addLayer({
        id: "line-labels",
        type: "symbol",
        source: "line-labels-source",
        minzoom: 6.5,
        layout: {
          "symbol-placement": "line",
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": [
            "interpolate", ["linear"], ["zoom"],
            6.5, 11.5,
            12, 12.5,
            15, 13.5
          ],
          "text-letter-spacing": 0.1,
          "symbol-spacing": 220,
          "text-max-angle": 65,
          "text-pitch-alignment": "viewport",
          "text-rotation-alignment": "map",
          "text-keep-upright": true,
          "text-allow-overlap": false,
          "text-padding": 8,
          "symbol-sort-key": ["get", "sortKey"]
        },
        paint: {
          "text-color": "#475569",
          "text-halo-color": "#ffffff",
          "text-halo-width": 3.0,
          "text-opacity": [
            "interpolate", ["linear"], ["zoom"],
            6.5, 0,
            7.2, 0.88
          ]
        }
      });
    } else {
      map.getSource("lines-source").setData({
        type: "FeatureCollection",
        features: lineFeatures
      });
      if (map.getSource("line-labels-source")) {
        map.getSource("line-labels-source").setData({
          type: "FeatureCollection",
          features: labelFeatures
        });
      }
    }

    // --- B. 駅データの準備 ---
    const stationFeatures = [];
    for (const stId in STATIONS) {
      const st = STATIONS[stId];
      const isMega = TIER1_MEGA_HUBS.has(st.id) || TIER1_STATION_NAMES.has(st.name);
      const isMajor = isMajorStation(st);
      const tier = isMega ? 1 : (isMajor ? 2 : 3);
      const score = (st._baseScore !== undefined) ? st._baseScore : (isMega ? 5000 : (isMajor ? 3000 : 100));

      stationFeatures.push({
        type: "Feature",
        id: stId,
        properties: {
          id: st.id,
          name: st.name,
          pref: st.pref || "",
          isMega: isMega,
          isMajor: isMajor,
          tier: tier,
          score: score
        },
        geometry: {
          type: "Point",
          coordinates: [st.lng, st.lat]
        }
      });
    }

    if (!map.getSource("stations-source")) {
      map.addSource("stations-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: stationFeatures
        }
      });

      // 1. 一般駅の◯ (zoom 10.2〜)
      map.addLayer({
        id: "local-station-dots",
        type: "circle",
        source: "stations-source",
        minzoom: 10.2,
        filter: ["!=", ["get", "isMajor"], true],
        paint: {
          "circle-color": "#ffffff",
          "circle-stroke-color": "#64748b",
          "circle-stroke-width": 1.4,
          "circle-radius": [
            "interpolate", ["linear"], ["zoom"],
            10.2, 2.8,
            12, 3.6,
            15, 4.8
          ]
        }
      });

      // 2. 主要拠点駅 (Tier2) の◯ (zoom 7.0〜)
      map.addLayer({
        id: "major-tier2-dots",
        type: "circle",
        source: "stations-source",
        minzoom: 7.0,
        filter: ["all", ["==", ["get", "isMajor"], true], ["!=", ["get", "isMega"], true]],
        paint: {
          "circle-color": "#ffffff",
          "circle-stroke-color": "#334155",
          "circle-stroke-width": [
            "interpolate", ["linear"], ["zoom"],
            7.0, 1.4,
            10, 1.8,
            14, 2.5
          ],
          "circle-radius": [
            "interpolate", ["linear"], ["zoom"],
            7.0, 3.0,
            10, 3.8,
            14, 5.2
          ]
        }
      });

      // 3. 最優先メガハブ駅 (Tier1) の◯ (zoom 4.0〜)
      map.addLayer({
        id: "major-mega-dots",
        type: "circle",
        source: "stations-source",
        minzoom: 4.0,
        filter: ["==", ["get", "isMega"], true],
        paint: {
          "circle-color": "#ffffff",
          "circle-stroke-color": "#0f172a",
          "circle-stroke-width": [
            "interpolate", ["linear"], ["zoom"],
            4.0, 1.4,
            10, 2.0,
            14, 2.8
          ],
          "circle-radius": [
            "interpolate", ["linear"], ["zoom"],
            4.0, 3.2,
            10, 4.4,
            14, 6.0
          ]
        }
      });

      // 4. 一般駅◯の衝突コライダー (zoom 10.2〜)
      map.addLayer({
        id: "local-station-dot-colliders",
        type: "symbol",
        source: "stations-source",
        minzoom: 10.2,
        filter: ["!=", ["get", "isMajor"], true],
        layout: {
          "icon-image": "station-collider",
          "icon-allow-overlap": true,
          "icon-ignore-placement": false,
          "icon-padding": 5
        }
      });

      // 5. 主要拠点駅◯の衝突コライダー (zoom 7.0〜)
      map.addLayer({
        id: "major-tier2-dot-colliders",
        type: "symbol",
        source: "stations-source",
        minzoom: 7.0,
        filter: ["all", ["==", ["get", "isMajor"], true], ["!=", ["get", "isMega"], true]],
        layout: {
          "icon-image": "station-collider",
          "icon-allow-overlap": true,
          "icon-ignore-placement": false,
          "icon-padding": 6
        }
      });

      // 6. メガハブ駅◯の衝突コライダー (zoom 4.0〜)
      map.addLayer({
        id: "major-mega-dot-colliders",
        type: "symbol",
        source: "stations-source",
        minzoom: 4.0,
        filter: ["==", ["get", "isMega"], true],
        layout: {
          "icon-image": "station-collider",
          "icon-allow-overlap": true,
          "icon-ignore-placement": false,
          "icon-padding": 6
        }
      });

      // 選択中駅の青塗りつぶし点レイヤー (駅◯直上・駅名ラベル直下)
      if (!map.getSource("selected-station-source")) {
        map.addSource("selected-station-source", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: []
          }
        });

        map.addLayer({
          id: "selected-station-dot",
          type: "circle",
          source: "selected-station-source",
          paint: {
            "circle-color": "#2563eb",
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2.2,
            "circle-radius": [
              "interpolate", ["linear"], ["zoom"],
              4, 5.5,
              10, 6.5,
              14, 7.5
            ]
          }
        });
      }

      // 7. 一般駅の名前ラベル (zoom 11.8〜)
      map.addLayer({
        id: "local-station-labels",
        type: "symbol",
        source: "stations-source",
        minzoom: 11.8,
        filter: ["!=", ["get", "isMajor"], true],
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": [
            "interpolate", ["linear"], ["zoom"],
            11.8, 11.5,
            14, 12.5,
            16, 13.5
          ],
          "text-anchor": "left",
          "text-offset": ["literal", [0.75, 0]],
          "text-justify": "left",
          "symbol-sort-key": ["-", 1000000, ["get", "score"]],
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-optional": true,
          "text-padding": 6
        },
        paint: {
          "text-color": "#1e293b",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2.5,
          "text-halo-blur": 0.5,
          "text-opacity": [
            "interpolate", ["linear"], ["zoom"],
            11.8, 0,
            12.1, 1.0
          ]
        }
      });

      // 8. 主要拠点駅 (Tier2) の名前ラベル (zoom 7.0〜)
      map.addLayer({
        id: "major-tier2-labels",
        type: "symbol",
        source: "stations-source",
        minzoom: 7.0,
        filter: ["all", ["==", ["get", "isMajor"], true], ["!=", ["get", "isMega"], true]],
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": [
            "interpolate", ["linear"], ["zoom"],
            7.0, 11.5,
            11, 13.0,
            15, 14.5
          ],
          "text-anchor": "left",
          "text-offset": ["literal", [0.7, 0]],
          "text-justify": "left",
          "symbol-sort-key": ["-", 1000000, ["get", "score"]],
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-optional": true,
          "text-padding": 8
        },
        paint: {
          "text-color": "#0f172a",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2.5,
          "text-halo-blur": 0.5,
          "text-opacity": [
            "interpolate", ["linear"], ["zoom"],
            7.0, 0,
            7.3, 1.0
          ]
        }
      });

      // 9. 最優先メガハブ駅 (Tier1) の名前ラベル (zoom 4.0〜)
      map.addLayer({
        id: "major-mega-labels",
        type: "symbol",
        source: "stations-source",
        minzoom: 4.0,
        filter: ["==", ["get", "isMega"], true],
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": [
            "interpolate", ["linear"], ["zoom"],
            4.0, 12.0,
            9, 13.5,
            14, 15.5
          ],
          "text-anchor": "left",
          "text-offset": ["literal", [0.65, 0]],
          "text-justify": "left",
          "symbol-sort-key": ["-", 1000000, ["get", "score"]],
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-optional": true,
          "text-padding": 8
        },
        paint: {
          "text-color": "#0f172a",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2.5,
          "text-halo-blur": 0.5
        }
      });
    } else {
      map.getSource("stations-source").setData({
        type: "FeatureCollection",
        features: stationFeatures
      });
    }

    // --- D. 経路探索ハイライトレイヤーの準備 ---
    if (!map.getSource("route-source")) {
      map.addSource("route-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: []
        }
      });

      map.addLayer({
        id: "route-glow",
        type: "line",
        source: "route-source",
        filter: ["==", ["get", "routeType"], "conventional"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#00ffff",
          "line-width": 16,
          "line-blur": 6,
          "line-opacity": 0.7
        }
      });

      map.addLayer({
        id: "route-core",
        type: "line",
        source: "route-source",
        filter: ["==", ["get", "routeType"], "conventional"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#0284c7",
          "line-width": 8,
          "line-opacity": 1.0
        }
      });

      map.addLayer({
        id: "route-shine",
        type: "line",
        source: "route-source",
        filter: ["==", ["get", "routeType"], "conventional"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#e0f2fe",
          "line-width": 2.5,
          "line-opacity": 0.95
        }
      });

      map.addLayer({
        id: "route-shinkansen-glow",
        type: "line",
        source: "route-source",
        filter: ["==", ["get", "routeType"], "shinkansen"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#3b82f6",
          "line-width": 16,
          "line-blur": 6,
          "line-opacity": 0.75
        }
      });

      map.addLayer({
        id: "route-shinkansen-core",
        type: "line",
        source: "route-source",
        filter: ["==", ["get", "routeType"], "shinkansen"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#003399",
          "line-width": 9,
          "line-opacity": 1.0
        }
      });

      map.addLayer({
        id: "route-shinkansen-stripe",
        type: "line",
        source: "route-source",
        filter: ["==", ["get", "routeType"], "shinkansen"],
        layout: { "line-cap": "butt", "line-join": "round" },
        paint: {
          "line-color": "#ffffff",
          "line-width": 3,
          "line-dasharray": [3, 2],
          "line-opacity": 0.95
        }
      });

      map.addLayer({
        id: "route-duplicate-glow",
        type: "line",
        source: "route-source",
        filter: ["==", ["get", "routeType"], "duplicate"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#ef4444",
          "line-width": 18,
          "line-blur": 6,
          "line-opacity": 0.8
        }
      });

      map.addLayer({
        id: "route-duplicate-core",
        type: "line",
        source: "route-source",
        filter: ["==", ["get", "routeType"], "duplicate"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#dc2626",
          "line-width": 9,
          "line-opacity": 1.0
        }
      });

      map.addLayer({
        id: "route-duplicate-stripe",
        type: "line",
        source: "route-source",
        filter: ["==", ["get", "routeType"], "duplicate"],
        layout: { "line-cap": "butt", "line-join": "round" },
        paint: {
          "line-color": "#ffffff",
          "line-width": 3,
          "line-dasharray": [2, 2],
          "line-opacity": 0.95
        }
      });
    }

    // --- E. 発・経由・着ピン WebGL レイヤーの準備 ---
    if (!map.getSource("route-pins-source")) {
      map.addSource("route-pins-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: []
        }
      });

      map.addLayer({
        id: "route-pins-circle",
        type: "circle",
        source: "route-pins-source",
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": ["get", "radius"],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2.5
        }
      });

      map.addLayer({
        id: "route-pins-label",
        type: "symbol",
        source: "route-pins-source",
        layout: {
          "text-field": ["get", "label"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 12,
          "text-anchor": "center",
          "text-allow-overlap": true,
          "text-ignore-placement": true,
          "icon-allow-overlap": true
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "#ffffff",
          "text-halo-width": 0.5
        }
      });

      ['route-pins-circle', 'route-pins-label'].forEach(layerId => {
        map.on('mouseenter', layerId, (e) => {
          map.getCanvas().style.cursor = 'pointer';
          if (e.features && e.features.length > 0) {
            const f = e.features[0];
            const coords = f.geometry.coordinates.slice();
            const title = f.properties.title || '';
            if (title && hoverPopup) {
              hoverPopup.setLngLat(coords).setHTML(`<div class="station-hover-tooltip">${title}</div>`).addTo(map);
            }
          }
        });
        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
          if (hoverPopup) hoverPopup.remove();
        });
        map.on('click', layerId, (e) => {
          if (e.features && e.features.length > 0) {
            const stId = e.features[0].properties.stationId;
            if (stId) selectStation(stId, false);
          }
        });
      });
    }
  }

  // =======================================================
  // ヘルパー: 画面幅に応じた路線名ラベル透過度
  // =======================================================
  function getLineLabelsOpacityExpression() {
    const isMobile = window.innerWidth <= 768;
    return [
      "interpolate", ["linear"], ["zoom"],
      isMobile ? 5.2 : 6.5, 0,
      isMobile ? 5.8 : 7.2, 0.88
    ];
  }

  // =======================================================
  // ヘルパー: レイヤーのレスポンシブ minzoom & プロパティ制御
  // =======================================================
  let currentZoomIsMobile = null;
  function updateResponsiveLayerZooms(force = false) {
    if (!map) return;
    const isMobile = window.innerWidth <= 768;
    if (!force && currentZoomIsMobile === isMobile) return;
    currentZoomIsMobile = isMobile;

    // 1. 最優先メガハブ駅 (Tier1)
    const megaMin = isMobile ? 3.5 : 4.0;
    ['major-mega-dots', 'major-mega-dot-colliders', 'major-mega-labels'].forEach(id => {
      if (map.getLayer(id)) map.setLayerZoomRange(id, megaMin, 24);
    });
    if (map.getLayer('major-mega-dots')) {
      map.setPaintProperty('major-mega-dots', 'circle-radius', [
        'interpolate', ['linear'], ['zoom'],
        megaMin, isMobile ? 3.0 : 3.2,
        10, 4.4,
        14, 6.0
      ]);
    }
    if (map.getLayer('major-mega-labels')) {
      map.setLayoutProperty('major-mega-labels', 'text-size', [
        'interpolate', ['linear'], ['zoom'],
        megaMin, 12.0,
        9, 13.5,
        14, 15.5
      ]);
    }

    // 2. 路線名ラベル
    const lineMin = isMobile ? 5.2 : 6.5;
    if (map.getLayer('line-labels')) {
      map.setLayerZoomRange('line-labels', lineMin, 24);
      map.setLayoutProperty('line-labels', 'text-size', [
        'interpolate', ['linear'], ['zoom'],
        lineMin, 11.5,
        12, 12.5,
        15, 13.5
      ]);
      if (!STATE.selectedLineId && !ROUTE_STATE.lastResult) {
        map.setPaintProperty('line-labels', 'text-opacity', getLineLabelsOpacityExpression());
      }
    }

    // 3. 主要拠点駅 (Tier2)
    const tier2Min = isMobile ? 5.5 : 7.0;
    const tier2FadeEnd = isMobile ? 5.9 : 7.3;
    ['major-tier2-dots', 'major-tier2-dot-colliders', 'major-tier2-labels'].forEach(id => {
      if (map.getLayer(id)) map.setLayerZoomRange(id, tier2Min, 24);
    });
    if (map.getLayer('major-tier2-dots')) {
      map.setPaintProperty('major-tier2-dots', 'circle-radius', [
        'interpolate', ['linear'], ['zoom'],
        tier2Min, isMobile ? 2.8 : 3.0,
        10, 3.8,
        14, 5.2
      ]);
    }
    if (map.getLayer('major-tier2-labels')) {
      map.setLayoutProperty('major-tier2-labels', 'text-size', [
        'interpolate', ['linear'], ['zoom'],
        tier2Min, 11.5,
        11, 13.0,
        15, 14.5
      ]);
      map.setPaintProperty('major-tier2-labels', 'text-opacity', [
        'interpolate', ['linear'], ['zoom'],
        tier2Min, 0,
        tier2FadeEnd, 1.0
      ]);
    }

    // 4. 一般駅の◯
    const localDotsMin = isMobile ? 8.6 : 10.2;
    ['local-station-dots', 'local-station-dot-colliders'].forEach(id => {
      if (map.getLayer(id)) map.setLayerZoomRange(id, localDotsMin, 24);
    });
    if (map.getLayer('local-station-dots')) {
      map.setPaintProperty('local-station-dots', 'circle-radius', [
        'interpolate', ['linear'], ['zoom'],
        localDotsMin, isMobile ? 2.6 : 2.8,
        12, 3.6,
        15, 4.8
      ]);
    }

    // 5. 一般駅の名前ラベル
    const localLabelsMin = isMobile ? 9.8 : 11.8;
    const localFadeEnd = isMobile ? 10.2 : 12.1;
    if (map.getLayer('local-station-labels')) {
      map.setLayerZoomRange('local-station-labels', localLabelsMin, 24);
      map.setLayoutProperty('local-station-labels', 'text-size', [
        'interpolate', ['linear'], ['zoom'],
        localLabelsMin, 11.5,
        14, 12.5,
        16, 13.5
      ]);
      map.setPaintProperty('local-station-labels', 'text-opacity', [
        'interpolate', ['linear'], ['zoom'],
        localLabelsMin, 0,
        localFadeEnd, 1.0
      ]);
    }
  }

  // =======================================================
  // ヘルパー: 選択中駅のハイライト (青塗りつぶし点 & 駅名青強調)
  // =======================================================
  function updateSelectedStationHighlight(stId, st) {
    if (!map) return;
    // 1. 青塗りつぶし点
    const selSource = map.getSource('selected-station-source');
    if (selSource) {
      selSource.setData({
        type: 'FeatureCollection',
        features: (st && stId) ? [{
          type: 'Feature',
          properties: { id: stId },
          geometry: {
            type: 'Point',
            coordinates: [st.lng, st.lat]
          }
        }] : []
      });
    }

    // 2. 駅名ラベルの文字色強調
    const defaultColors = {
      'local-station-labels': '#1e293b',
      'major-tier2-labels': '#0f172a',
      'major-mega-labels': '#0f172a'
    };
    ['major-mega-labels', 'major-tier2-labels', 'local-station-labels'].forEach(layerId => {
      if (!map.getLayer(layerId)) return;
      const defColor = defaultColors[layerId] || '#0f172a';
      if (stId) {
        map.setPaintProperty(layerId, 'text-color', [
          'case',
          ['==', ['get', 'id'], stId], '#1d4ed8',
          defColor
        ]);
      } else {
        map.setPaintProperty(layerId, 'text-color', defColor);
      }
    });
  }

  // =======================================================
  // ヘルパー: 画面幅に応じた検索プレースホルダー切り替え
  // =======================================================
  function updateSearchPlaceholder() {
    const searchInput = document.getElementById('station-search');
    if (!searchInput) return;
    if (window.innerWidth <= 768) {
      searchInput.placeholder = '駅名を検索';
    } else {
      searchInput.placeholder = '駅名を検索 (例: 新宿, tokyo)';
    }
  }

  // =======================================================
  // ヘルパー: パネル・ヘッダーを考慮した可視領域パディング計算
  // =======================================================
  function getVisibleMapPadding(basePad = 60) {
    if (!map) return { top: basePad, bottom: basePad, left: basePad, right: basePad };
    const mapContainer = map.getContainer();
    if (!mapContainer) return { top: basePad, bottom: basePad, left: basePad, right: basePad };

    const mapRect = mapContainer.getBoundingClientRect();
    const mapW = mapRect.width || window.innerWidth || 800;
    const mapH = mapRect.height || window.innerHeight || 600;

    let left = basePad;
    let top = basePad;
    let right = Math.max(basePad, 72);
    let bottom = basePad;

    const isMobile = window.innerWidth <= 768;
    const routePanel = document.getElementById('route-panel');
    let isMobileResultSheet = false;

    // #route-panel の計測
    if (routePanel) {
      const pStyle = window.getComputedStyle(routePanel);
      if (pStyle.display !== 'none' && pStyle.visibility !== 'hidden') {
        const panelRect = routePanel.getBoundingClientRect();
        if (!isMobile && panelRect.width > 0 && panelRect.width < mapW * 0.7) {
          // PC / タブレット (左側配置)
          left = Math.round(panelRect.right - mapRect.left) + 36;
        } else if (isMobile && routePanel.classList.contains('has-result') && !routePanel.classList.contains('is-editing')) {
          // スマホ (下部ボトムシート)
          isMobileResultSheet = true;
          const pHeight = (panelRect.height > 50) ? panelRect.height : Math.round(mapH * 0.46);
          bottom = Math.round(pHeight) + 24;
        }
      }
    }

    // 上部 .map-header の計測
    const mapHeader = document.querySelector('.map-header');
    if (mapHeader) {
      const hStyle = window.getComputedStyle(mapHeader);
      if (hStyle.display !== 'none' && hStyle.visibility !== 'hidden') {
        const headerRect = mapHeader.getBoundingClientRect();
        if (headerRect.height > 0) {
          top = Math.max(top, Math.round(headerRect.bottom - mapRect.top) + 24);
        }
      }
    }

    // 上限クランプ（エラー防止）: スマホ結果モード時は bottom が mapH * 0.62 まで許容
    const maxHorizPad = Math.floor(mapW * 0.35);
    const maxBottomPad = Math.floor(mapH * (isMobileResultSheet ? 0.62 : 0.35));
    const maxTopPad = Math.floor(mapH * (isMobileResultSheet ? 0.25 : 0.35));

    if (left + right >= mapW * 0.75) {
      left = Math.min(left, maxHorizPad);
      right = Math.min(right, maxHorizPad);
    }
    if (top + bottom >= mapH * (isMobileResultSheet ? 0.85 : 0.75)) {
      top = Math.min(top, maxTopPad);
      bottom = Math.min(bottom, maxBottomPad);
    }

    return { top, bottom, left, right };
  }

  // =======================================================
  // ヘルパー: 駅フォーカス時の可視領域オフセット計算 ([0, offsetY])
  // =======================================================
  function getStationCenterOffset() {
    if (!map) return [0, 0];
    const mapContainer = map.getContainer();
    if (!mapContainer) return [0, 0];

    const mapRect = mapContainer.getBoundingClientRect();
    if (window.innerWidth > 768) {
      return [0, 0];
    }

    let visibleTop = 0;
    const header = document.querySelector('.map-header');
    if (header) {
      const hStyle = window.getComputedStyle(header);
      if (hStyle.display !== 'none' && hStyle.visibility !== 'hidden') {
        const headerRect = header.getBoundingClientRect();
        visibleTop = Math.max(0, Math.round(headerRect.bottom - mapRect.top) + 8);
      }
    }

    let visibleBottom = mapRect.height;
    const sheet = document.getElementById('station-sheet');
    if (sheet) {
      const sStyle = window.getComputedStyle(sheet);
      if (sStyle.display !== 'none' && sStyle.visibility !== 'hidden') {
        const sheetRect = sheet.getBoundingClientRect();
        if (sheetRect.top < mapRect.bottom) {
          visibleBottom = Math.round(sheetRect.top - mapRect.top) - 8;
        }
      }
    }

    if (visibleBottom <= visibleTop + 40) {
      visibleBottom = Math.max(visibleTop + 40, Math.round(mapRect.height * 0.45));
    }

    const targetY = (visibleTop + visibleBottom) / 2;
    const mapCenterY = mapRect.height / 2;
    let offsetY = Math.round(targetY - mapCenterY);

    const maxAbsOffset = Math.round(mapRect.height * 0.42);
    offsetY = Math.max(-maxAbsOffset, Math.min(maxAbsOffset, offsetY));

    return [0, offsetY];
  }

  // 互換性スタブ
  function updateStationMarkerSizes() {}
  function updateLabelsVisibility() {}
  function updateLineLabelsVisibility() {}
  function updateLineWeights() {}
  function setupLineLabels() {}
  function getZoomLayout() { return { placedLineSlots: [] }; }
  // =======================================================
  // 5.0 全路線の向きを「公式起点 (0.0km) → 終点」へ正規化
  // =======================================================
  function normalizeLineStationOrders() {
    const kilos = window.JR_OFFICIAL_KILOS;
    if (!kilos || !LINES) return [];

    const reversedList = [];

    function getChainDirection(stIds, line) {
      const lineKilos = (kilos[line.id] || kilos[line.name] || (line.marsCode ? kilos[line.marsCode] : null)) || line.stationKilos;
      if (!lineKilos) return 1;

      let firstK = null, lastK = null;
      for (let i = 0; i < stIds.length; i++) {
        const id = stIds[i];
        const name = STATIONS[id] ? STATIONS[id].name : id;
        const k = (lineKilos[id] !== undefined) ? lineKilos[id] : lineKilos[name];
        if (k !== undefined) { firstK = k; break; }
      }
      for (let i = stIds.length - 1; i >= 0; i--) {
        const id = stIds[i];
        const name = STATIONS[id] ? STATIONS[id].name : id;
        const k = (lineKilos[id] !== undefined) ? lineKilos[id] : lineKilos[name];
        if (k !== undefined) { lastK = k; break; }
      }
      if (firstK !== null && lastK !== null && firstK > lastK) return -1;
      return 1;
    }

    LINES.forEach(line => {
      if (line._isNormalized) return;
      line._isNormalized = true;

      if (line.stations && getChainDirection(line.stations, line) === -1) {
        reversedList.push({ id: line.id, name: line.name });
        line.stations.reverse();
      }

      if (line.branches) {
        line.branches.forEach((b) => {
          if (getChainDirection(b, line) === -1) {
            b.reverse();
          }
        });
      }
    });

    return reversedList;
  }

  // =======================================================
  // 5. インデックス作成 (隣接駅の計算)
  // =======================================================
  const adjacentIndex = new Map();

  function buildAdjacentStationsIndex() {
    normalizeLineStationOrders();

    adjacentIndex.clear();
    LINES.forEach(line => {
      const chains = [line.stations, ...(line.branches || [])];
      chains.forEach(stIds => {
        if (!stIds || stIds.length === 0) return;
        for (let i = 0; i < stIds.length; i++) {
          const cur = stIds[i];
          if (!adjacentIndex.has(cur)) {
            adjacentIndex.set(cur, {});
          }
          const adj = adjacentIndex.get(cur);

          let prev = null;
          if (i > 0) {
            prev = stIds[i - 1];
          } else if (line.isLoop && stIds.length > 2) {
            prev = (stIds[stIds.length - 1] === stIds[0]) ? stIds[stIds.length - 2] : stIds[stIds.length - 1];
          }

          let next = null;
          if (i < stIds.length - 1) {
            next = stIds[i + 1];
          } else if (line.isLoop && stIds.length > 2) {
            next = (stIds[stIds.length - 1] === stIds[0]) ? stIds[1] : stIds[0];
          }

          if (!adj[line.id]) {
            adj[line.id] = {
              prev: prev ? [prev] : [],
              next: next ? [next] : []
            };
          } else {
            if (prev && !adj[line.id].prev.includes(prev)) {
              adj[line.id].prev.push(prev);
            }
            if (next && !adj[line.id].next.includes(next)) {
              adj[line.id].next.push(next);
            }
          }
        }
      });
    });

    // 環状線 (山手線) の品川・田端端点の両方向接続補正
    if (adjacentIndex.has('shinagawa') && adjacentIndex.get('shinagawa')['yamanote']) {
      const adj = adjacentIndex.get('shinagawa')['yamanote'];
      if (!adj.prev.includes('takanawa-gateway')) adj.prev.unshift('takanawa-gateway');
    }
    if (adjacentIndex.has('tabata') && adjacentIndex.get('tabata')['yamanote']) {
      const adj = adjacentIndex.get('tabata')['yamanote'];
      if (!adj.next.includes('nishi-nippori')) adj.next.push('nishi-nippori');
    }
  }

  // =======================================================
  // 6. 路線ハイライト選択
  // =======================================================
  function selectLine(lineId) {
    STATE.selectedLineId = lineId;

    const banner = document.getElementById('line-banner');

    if (!lineId) {
      if (banner) banner.style.display = 'none';
      if (map) {
        if (map.getLayer('conventional-lines')) {
          map.setPaintProperty('conventional-lines', 'line-opacity', 1.0);
        }
        if (map.getLayer('shinkansen-lines-casing')) {
          map.setPaintProperty('shinkansen-lines-casing', 'line-opacity', 1.0);
        }
        if (map.getLayer('shinkansen-lines-dash')) {
          map.setPaintProperty('shinkansen-lines-dash', 'line-opacity', 1.0);
        }
        if (map.getLayer('line-labels')) {
          map.setPaintProperty('line-labels', 'text-opacity', getLineLabelsOpacityExpression());
        }
      }
      return;
    }

    const line = LINES.find(l => l.id === lineId);
    if (!line) return;

    if (banner) {
      const badge = document.getElementById('banner-badge');
      if (badge) {
        badge.textContent = line.code || 'JR';
        badge.style.background = line.color;
        badge.style.color = line.textColor || '#fff';
      }
      const bannerName = document.getElementById('banner-name');
      if (bannerName) bannerName.textContent = line.name;
      const bannerEn = document.getElementById('banner-en');
      if (bannerEn) bannerEn.textContent = line.en || '';
      const desc = line.description ? `${line.description} ` : '';
      const totalCount = new Set([...line.stations, ...(line.branches ? line.branches.flat() : [])]).size;
      const bannerDesc = document.getElementById('banner-desc');
      if (bannerDesc) bannerDesc.textContent = `${desc}(全${totalCount}駅)`;
      banner.style.display = 'flex';
    }

    if (map) {
      if (map.getLayer('conventional-lines')) {
        map.setPaintProperty('conventional-lines', 'line-opacity', [
          'case',
          ['==', ['get', 'lineId'], lineId], 1.0,
          0.2
        ]);
      }
      if (map.getLayer('shinkansen-lines-casing')) {
        map.setPaintProperty('shinkansen-lines-casing', 'line-opacity', [
          'case',
          ['==', ['get', 'lineId'], lineId], 1.0,
          0.2
        ]);
      }
      if (map.getLayer('shinkansen-lines-dash')) {
        map.setPaintProperty('shinkansen-lines-dash', 'line-opacity', [
          'case',
          ['==', ['get', 'lineId'], lineId], 1.0,
          0.2
        ]);
      }
      if (map.getLayer('line-labels')) {
        map.setPaintProperty('line-labels', 'text-opacity', [
          'case',
          ['==', ['get', 'lineId'], lineId], 1.0,
          0.2
        ]);
      }

      const coords = lineCoordinatesMap.get(lineId);
      if (coords && coords.length > 0) {
        let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
        coords.forEach(pt => {
          const lng = pt[0], lat = pt[1];
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        });
        if (minLng !== Infinity) {
          map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
            padding: 60,
            maxZoom: 14,
            duration: 700
          });
        }
      }
    }
  }

  function closeLineBanner() {
    selectLine(null);
  }

  // JR各社コーポレートカラー
  const JR_COMPANY_COLORS = {
    east: '#008c44',      // JR東日本 (緑)
    central: '#f97316',   // JR東海 (オレンジ)
    west: '#0072bc',      // JR西日本 (青)
    hokkaido: '#84cc16',  // JR北海道 (萌黄/ライトグリーン)
    shikoku: '#0ea5e9',   // JR四国 (水色)
    kyushu: '#dc2626'     // JR九州 (赤)
  };

  // 会社境界駅オーバーライド (駅名標の管轄会社カラー優先)
  const STATION_COMPANY_OVERRIDE = {
    'tokyo': 'east',
    'shinagawa': 'east',
    'ueno': 'east',
    'shinjuku': 'east',
    'nagoya': 'central',
    'kyoto': 'west',
    'osaka': 'west',
    'st-fzkz': 'west',
    'shin-osaka': 'west',
    'shin-kobe': 'west',
    'shinkobe': 'west',
    'hiroshima': 'west',
    'kokura': 'kyushu',
    'hakata': 'kyushu',
    'sapporo': 'hokkaido',
    'takamatsu': 'shikoku',
    'st-qwme': 'shikoku'
  };

  // 都道府県別所轄JR会社マップ
  const PREF_COMPANY_MAP = {
    '北海道': 'hokkaido',
    '青森県': 'east', '岩手県': 'east', '宮城県': 'east', '秋田県': 'east', '山形県': 'east', '福島県': 'east',
    '茨城県': 'east', '栃木県': 'east', '群馬県': 'east', '埼玉県': 'east', '千葉県': 'east', '東京都': 'east', '神奈川県': 'east',
    '新潟県': 'east', '山梨県': 'east', '長野県': 'east',
    '静岡県': 'central', '愛知県': 'central', '岐阜県': 'central', '三重県': 'central',
    '富山県': 'west', '石川県': 'west', '福井県': 'west', '滋賀県': 'west', '京都府': 'west', '大阪府': 'west',
    '兵庫県': 'west', '奈良県': 'west', '和歌山県': 'west', '鳥取県': 'west', '島根県': 'west', '岡山県': 'west',
    '広島県': 'west', '山口県': 'west',
    '徳島県': 'shikoku', '香川県': 'shikoku', '愛媛県': 'shikoku', '高知県': 'shikoku',
    '福岡県': 'kyushu', '佐賀県': 'kyushu', '長崎県': 'kyushu', '熊本県': 'kyushu', '大分県': 'kyushu', '宮崎県': 'kyushu', '鹿児島県': 'kyushu', '沖縄県': 'kyushu'
  };

  function getStationCompanyKey(st) {
    if (!st) return 'east';
    if (STATION_COMPANY_OVERRIDE[st.id]) {
      return STATION_COMPANY_OVERRIDE[st.id];
    }
    if (st.pref && PREF_COMPANY_MAP[st.pref]) {
      return PREF_COMPANY_MAP[st.pref];
    }
    // 路線からフォールバック
    if (st.lines && st.lines.length > 0 && window.JR_FARE_ENGINE && window.JR_FARE_ENGINE.getLineCompany) {
      for (const lId of st.lines) {
        if (lId === 'hakataminami-line') continue; // 西日本だが福岡
        const comp = window.JR_FARE_ENGINE.getLineCompany(lId, st.name, st.name);
        if (comp) return comp;
      }
    }
    return 'east';
  }

  function getStationCompanyColor(st) {
    const compKey = getStationCompanyKey(st);
    return JR_COMPANY_COLORS[compKey] || JR_COMPANY_COLORS.east;
  }

  function getStationRepresentativeLineColor(st, companyColor) {
    if (!st || !st.lines || st.lines.length === 0) return 'transparent';
    const regularLineId = st.lines.find(lId => !lId.startsWith('shinkansen-')) || st.lines[0];
    const line = LINES.find(l => l.id === regularLineId);
    if (!line || !line.color) return 'transparent';
    if (line.color.toLowerCase() === companyColor.toLowerCase()) return 'transparent';
    return line.color;
  }

  // =======================================================
  // 7. 駅詳細選択 & ボトムシート
  // =======================================================
  function selectStation(stId, shouldPan = true, options = {}) {
    const st = STATIONS[stId];
    if (!st) return;

    STATE.selectedStationId = stId;

    const sheet = document.getElementById('station-sheet');
    const prefEl = document.getElementById('sheet-pref');
    const kanaEl = document.getElementById('sheet-kana');
    const enEl = document.getElementById('sheet-en');
    const nameEl = document.getElementById('sheet-name');
    const badgesContainer = document.getElementById('sheet-zone-badges');
    const signBand = document.getElementById('sheet-sign-band');
    const signCenter = document.getElementById('sheet-sign-center');

    if (prefEl) prefEl.textContent = st.pref || '';
    if (kanaEl) kanaEl.textContent = st.kana || '';
    if (enEl) enEl.textContent = getStationEnName(st);

    const uiName = getStationUiName(st);
    if (nameEl) {
      nameEl.textContent = uiName;
      nameEl.classList.remove('name-long', 'name-xlong');
      if (uiName.length >= 8) {
        nameEl.classList.add('name-xlong');
      } else if (uiName.length >= 6) {
        nameEl.classList.add('name-long');
      }
    }

    // ゾーンマーク（[山], [区], [京], [阪] 等）の動的描画
    if (badgesContainer) {
      badgesContainer.innerHTML = '';
      if (window.JR_FARE_ENGINE && typeof window.JR_FARE_ENGINE.getStationZoneMarks === 'function') {
        const zoneMarks = window.JR_FARE_ENGINE.getStationZoneMarks(st, STATIONS);
        zoneMarks.forEach(zm => {
          const badge = document.createElement('span');
          badge.className = zm.type === 'yamanote' ? 'zone-mark-yamanote' : 'zone-mark-city';
          badge.textContent = zm.char;
          badge.title = zm.title || '';
          badgesContainer.appendChild(badge);
        });
      }
    }

    // 会社カラー帯と代表路線アクセント色
    const compColor = getStationCompanyColor(st);
    if (signBand) {
      signBand.style.backgroundColor = compColor;
    }
    if (signCenter) {
      const repColor = getStationRepresentativeLineColor(st, compColor);
      signCenter.style.backgroundColor = repColor;
    }

    const linesContainer = document.getElementById('sheet-lines');
    if (linesContainer) {
      linesContainer.innerHTML = '';
      (st.lines || []).forEach(lId => {
        const line = LINES.find(l => l.id === lId);
        if (!line) return;
        const badge = document.createElement('div');
        badge.className = 'line-badge-item';
        badge.style.background = line.color;
        badge.style.color = line.textColor || '#fff';
        badge.innerHTML = `${line.code ? `<span class="line-badge-code">${line.code}</span>` : ''} <span>${line.name}</span>`;
        linesContainer.appendChild(badge);
      });
    }

    // 乗り入れ路線・隣接駅の統合一覧
    const adjContainer = document.getElementById('sheet-adjacents');
    if (adjContainer) {
      adjContainer.innerHTML = '';
      const adjInfo = adjacentIndex.get(stId) || {};
      const stationLines = st.lines || [];

      if (stationLines.length === 0) {
        adjContainer.innerHTML = '<span class="adj-none" style="color:var(--text-muted);font-size:11px;">起点・終点または単独駅です</span>';
      } else {
        stationLines.forEach(lId => {
          const line = LINES.find(l => l.id === lId);
          if (!line) return;
          const info = adjInfo[lId];

          const prevList = info && Array.isArray(info.prev) ? info.prev : (info && info.prev ? [info.prev] : []);
          const nextList = info && Array.isArray(info.next) ? info.next : (info && info.next ? [info.next] : []);

          const isLoop = !!(line.isLoop || line.id === 'yamanote');

          let linkContent = '';
          if (prevList.length === 0 && nextList.length === 0) {
            linkContent = '<span class="adj-none">単独区間</span>';
          } else {
            const prevHtml = prevList
              .map(id => STATIONS[id] ? `<span class="adj-link" data-id="${id}">${getStationUiName(STATIONS[id])}</span>` : '')
              .filter(Boolean)
              .join('・');

            const nextHtml = nextList
              .map(id => STATIONS[id] ? `<span class="adj-link" data-id="${id}">${getStationUiName(STATIONS[id])}</span>` : '')
              .filter(Boolean)
              .join('・');

            if (isLoop) {
              if (prevHtml && nextHtml) {
                linkContent = `← ${prevHtml} / ${nextHtml} →`;
              } else if (prevHtml) {
                linkContent = `← ${prevHtml}`;
              } else if (nextHtml) {
                linkContent = `${nextHtml} →`;
              }
            } else {
              if (prevHtml && nextHtml) {
                linkContent = `← ${prevHtml} / ${nextHtml} →`;
              } else if (prevHtml) {
                linkContent = `← ${prevHtml} <span class="adj-terminal">(終点)</span>`;
              } else if (nextHtml) {
                linkContent = `<span class="adj-terminal">(起点)</span> ${nextHtml} →`;
              }
            }
          }

          const row = document.createElement('div');
          row.className = 'adj-row';
          row.innerHTML = `
            <span class="line-badge-item adj-line-badge" style="background:${line.color};color:${line.textColor || '#fff'};">
              ${line.code ? `<span class="line-badge-code">${line.code}</span>` : ''}<span>${line.name}</span>
            </span>
            <div class="adj-stations">
              ${linkContent}
            </div>
          `;

          row.querySelectorAll('.adj-link').forEach(link => {
            link.addEventListener('click', (e) => {
              const nextId = e.target.getAttribute('data-id');
              if (nextId) selectStation(nextId, true, { preserveExpanded: true });
            });
          });
          adjContainer.appendChild(row);
        });
      }
    }

    updateSelectedStationHighlight(stId, st);

    if (window.innerWidth <= 768) {
      // 1. スマホ幅: visibility: hidden で即時配置しレイアウトを同期確定
      sheet.style.transition = 'none';
      sheet.style.visibility = 'hidden';
      sheet.style.display = 'flex';
      sheet.style.transform = 'translateY(0px)';

      // 2. 同期的に計測
      const sheetRect = sheet.getBoundingClientRect();
      const header = sheet.querySelector('.sheet-header');
      const headerRect = header ? header.getBoundingClientRect() : null;
      const peekVisibleHeight = headerRect ? Math.round(headerRect.bottom - sheetRect.top) : 165;
      const peekY = Math.max(0, Math.round(sheetRect.height - peekVisibleHeight));
      sheet.dataset.peekY = peekY;

      // 3. 展開維持 (preserveExpanded) かどうかの判定
      const keepExpanded = (options && options.preserveExpanded === true) &&
                           sheet.classList.contains('is-expanded');

      const targetY = keepExpanded ? 0 : peekY;
      sheet.style.transform = `translateY(${targetY}px)`;
      sheet.dataset.currentY = targetY;

      if (keepExpanded) {
        sheet.classList.add('is-expanded');
        sheet.classList.remove('is-peek');
      } else {
        sheet.classList.add('is-peek');
        sheet.classList.remove('is-expanded');
      }

      // 4. 可視化
      sheet.style.visibility = 'visible';
    } else {
      sheet.style.display = 'block';
      sheet.style.visibility = 'visible';
      sheet.style.transition = '';
      sheet.style.transform = '';
      sheet.classList.remove('is-peek', 'is-expanded');
    }

    updateStationMarkerSizes();
    updateLabelsVisibility();

    // 5. カメラを可視領域中央へ移動 (シート位置・可視領域が確定した後に実行)
    if (shouldPan) {
      map.flyTo({
        center: [st.lng, st.lat],
        zoom: Math.max(map.getZoom(), 12.5),
        offset: getStationCenterOffset(),
        duration: 600
      });
    }
  }

  function closeStationSheet() {
    STATE.selectedStationId = null;
    updateSelectedStationHighlight(null, null);
    const sheet = document.getElementById('station-sheet');
    if (sheet) {
      sheet.style.display = 'none';
      sheet.style.transform = '';
      sheet.style.transition = '';
      sheet.classList.remove('is-peek', 'is-expanded');
    }
  }

  // =======================================================
  // 8. 駅名インクリメンタル検索 & スコアリングソート
  // =======================================================
  function searchStations(query, limit = 8, referenceStation = null) {
    if (!query) return [];
    let q = query.trim().toLowerCase();
    if (!q) return [];

    let targetPrefFilter = null;
    const parenM = q.match(/^(.+?)[（\(](.*?)[）\)]?$/);
    if (parenM) {
      q = parenM[1].trim();
      targetPrefFilter = parenM[2].trim().replace(/[都府県]$/, '');
    }

    const scored = [];
    for (const id in STATIONS) {
      const st = STATIONS[id];
      const name = st._nameLower || st.name.toLowerCase();
      const kana = st._kanaLower || (st.kana || '').toLowerCase();
      const en = st._enLower || (getStationEnName(st) || '').toLowerCase();

      let score = -1;
      // 1. 漢字完全一致 (最優先)
      if (name === q) {
        score = 10000;
      } else if (kana === q || en === q) {
        // 2. 読み仮名・英名完全一致
        score = 8000;
      } else if (name.startsWith(q)) {
        // 3. 漢字前方一致 (名前が短い＝入力に近いほど上位)
        score = 5000 - (name.length - q.length) * 20;
      } else if (kana.startsWith(q) || en.startsWith(q)) {
        // 4. 読み仮名・英名前方一致
        score = 4000 - (kana.length - q.length) * 10;
      } else if (name.includes(q)) {
        // 5. 漢字部分一致 (出現位置が先頭に近いほど上位)
        score = 2000 - name.indexOf(q) * 20 - (name.length - q.length) * 5;
      } else if (kana.includes(q) || en.includes(q)) {
        // 6. かな・英名部分一致
        const idx = Math.min(
          kana.includes(q) ? kana.indexOf(q) : 99,
          en.includes(q) ? en.indexOf(q) : 99
        );
        score = 1000 - idx * 10;
      }

      if (score > 0) {
        // 都道府県フィルタがある場合のボーナス
        if (targetPrefFilter) {
          const prefAbbr = getPrefAbbr(st.pref).toLowerCase();
          if (prefAbbr === targetPrefFilter || prefAbbr.startsWith(targetPrefFilter)) {
            score += 20000;
          } else if (prefAbbr.includes(targetPrefFilter)) {
            score += 10000;
          }
        }
        // 路線数による加点 (ターミナル駅・乗換駅を優先)
        const lineCount = (st.lines && Array.isArray(st.lines)) ? st.lines.length : 1;
        score += lineCount * 5;
        // 新幹線駅加点
        const hasShinkansen = st.lines && st.lines.some(lid => lid.startsWith('shinkansen-'));
        if (hasShinkansen) score += 25;

        scored.push({ st, score });
      }
    }

    scored.sort((a, b) => {
      // 基準駅 (発駅) がある場合
      if (referenceStation && referenceStation.lat != null && referenceStation.lng != null) {
        // 同名駅同士の比較: 発駅からの直線距離が近い方を最優先
        if (a.st.name === b.st.name) {
          const distA = Math.hypot(a.st.lat - referenceStation.lat, a.st.lng - referenceStation.lng);
          const distB = Math.hypot(b.st.lat - referenceStation.lat, b.st.lng - referenceStation.lng);
          return distA - distB;
        }
      }
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // スコア同点時のタイブレーク: 発駅からの距離が近い順
      if (referenceStation && referenceStation.lat != null && referenceStation.lng != null) {
        const distA = Math.hypot(a.st.lat - referenceStation.lat, a.st.lng - referenceStation.lng);
        const distB = Math.hypot(b.st.lat - referenceStation.lat, b.st.lng - referenceStation.lng);
        return distA - distB;
      }
      return 0;
    });

    return scored.slice(0, limit).map(item => item.st);
  }

  function setupSearch() {
    const input = document.getElementById('station-search');
    const results = document.getElementById('search-results');
    const clearBtn = document.getElementById('search-clear');
    if (input) attachStationGhostOverlay(input);

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      clearBtn.style.display = q ? 'block' : 'none';

      if (!q) {
        results.style.display = 'none';
        return;
      }

      const matches = searchStations(q, 8);

      if (matches.length === 0) {
        results.innerHTML = '<div style="padding:10px 14px;color:var(--text-muted);font-size:12px;">該当する駅が見つかりません</div>';
        results.style.display = 'block';
        return;
      }

      results.innerHTML = '';
      matches.forEach((st, idx) => {
        const item = document.createElement('div');
        item.className = `search-item ${idx === 0 ? 'active' : ''}`;
        item.innerHTML = `
          <div class="search-item-info">
            <span class="search-item-name">${getStationUiName(st)}</span>
            <span class="search-item-kana">${st.kana || ''}</span>
          </div>
          <span class="search-item-pref">${st.pref}</span>
        `;
        item.addEventListener('click', () => {
          setStationInputValue(input, st);
          clearBtn.style.display = 'block';
          results.style.display = 'none';
          selectStation(st.id);
        });
        results.appendChild(item);
      });

      results.style.display = 'block';
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const first = results.querySelector('.search-item');
        if (first) {
          first.click();
        }
      } else if (e.key === 'Escape') {
        results.style.display = 'none';
      }
    });

    clearBtn.addEventListener('click', () => {
      clearStationInputValue(input);
      clearBtn.style.display = 'none';
      results.style.display = 'none';
      input.focus();
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.header-search')) {
        results.style.display = 'none';
      }
    });
  }

  // =======================================================
  // 9. イベントハンドラー & コントロール
  // =======================================================
  function setupStationSheetMobileInteractions() {
    const sheet = document.getElementById('station-sheet');
    if (!sheet) return;

    let isDragging = false;
    let startY = 0;
    let startTranslateY = 0;
    let lastY = 0;
    let lastTime = 0;
    let moved = false;

    function snapTo(targetY) {
      sheet.style.transition = 'transform 0.26s cubic-bezier(0.22, 1, 0.36, 1)';
      sheet.style.transform = `translateY(${targetY}px)`;
      sheet.dataset.currentY = targetY;
      if (targetY === 0) {
        sheet.classList.add('is-expanded');
        sheet.classList.remove('is-peek');
      } else {
        sheet.classList.add('is-peek');
        sheet.classList.remove('is-expanded');
      }
    }

    function onTouchStart(e) {
      if (window.innerWidth > 768) return;
      if (e.touches.length !== 1) return;
      if (e.target.closest('button') || e.target.closest('.adj-link')) return;

      const touch = e.touches[0];
      startY = touch.clientY;
      lastY = touch.clientY;
      lastTime = performance.now();
      moved = false;

      const peekY = parseFloat(sheet.dataset.peekY) || 200;
      let curY = parseFloat(sheet.dataset.currentY);
      if (isNaN(curY)) {
        curY = peekY;
      }
      startTranslateY = curY;
      sheet.style.transition = 'none';
      isDragging = true;
    }

    function onTouchMove(e) {
      if (!isDragging || window.innerWidth > 768) return;
      const touch = e.touches[0];
      const deltaY = touch.clientY - startY;
      if (Math.abs(deltaY) > 6) {
        moved = true;
      }

      const peekY = parseFloat(sheet.dataset.peekY) || 200;
      let nextY = startTranslateY + deltaY;
      nextY = Math.max(0, Math.min(peekY, nextY));

      sheet.style.transform = `translateY(${nextY}px)`;
      sheet.dataset.currentY = nextY;

      lastY = touch.clientY;
      lastTime = performance.now();

      if (e.cancelable) e.preventDefault();
    }

    function onTouchEnd(e) {
      if (!isDragging || window.innerWidth > 768) return;
      isDragging = false;

      const peekY = parseFloat(sheet.dataset.peekY) || 200;
      const curY = parseFloat(sheet.dataset.currentY) || 0;

      // タップ判定 (移動量 < 8px)
      if (!moved) {
        if (curY >= peekY * 0.5) {
          snapTo(0);
        } else {
          snapTo(peekY);
        }
        return;
      }

      // スワイプ速度 (フリック) 判定
      const endY = e.changedTouches[0] ? e.changedTouches[0].clientY : lastY;
      const elapsed = Math.max(1, performance.now() - lastTime);
      const velocity = (endY - lastY) / elapsed; // px/ms

      if (velocity < -0.3) {
        // 高速上スワイプ -> Expanded
        snapTo(0);
      } else if (velocity > 0.3) {
        // 高速下スワイプ -> Peek
        snapTo(peekY);
      } else {
        // 位置判定 (50% 閾値)
        if (curY < peekY * 0.5) {
          snapTo(0);
        } else {
          snapTo(peekY);
        }
      }
    }

    const topBar = document.getElementById('sheet-top-bar');
    const header = sheet.querySelector('.sheet-header');
    const handle = document.getElementById('sheet-handle');

    [topBar, header, handle].forEach(el => {
      if (!el) return;
      el.addEventListener('touchstart', onTouchStart, { passive: true });
      el.addEventListener('touchmove', onTouchMove, { passive: false });
      el.addEventListener('touchend', onTouchEnd, { passive: false });
      el.addEventListener('touchcancel', () => {
        if (isDragging) {
          isDragging = false;
          const peekY = parseFloat(sheet.dataset.peekY) || 200;
          snapTo(peekY);
        }
      });
    });
  }

  // =======================================================
  // スマホ経路検索ボトムシート (ハーフ/フル展開 & サマリーバー操作)
  // =======================================================
  function setupRouteSheetMobileInteractions() {
    const panel = document.getElementById('route-panel');
    const handle = document.getElementById('route-sheet-handle');
    const summaryBar = document.getElementById('route-mobile-summary-bar');
    const btnModify = document.getElementById('btn-route-modify');
    const btnSummaryClear = document.getElementById('btn-route-summary-clear');

    if (!panel) return;

    if (btnModify) {
      btnModify.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.add('is-editing');
      });
    }

    if (btnSummaryClear) {
      btnSummaryClear.addEventListener('click', (e) => {
        e.stopPropagation();
        clearRouteEngineUI();
      });
    }

    function toggleRouteSheetHeight() {
      if (!panel.classList.contains('has-result') || panel.classList.contains('is-editing')) return;
      if (panel.classList.contains('mobile-sheet-full')) {
        panel.classList.remove('mobile-sheet-full');
        panel.classList.add('mobile-sheet-half');
      } else {
        panel.classList.remove('mobile-sheet-half');
        panel.classList.add('mobile-sheet-full');
      }
    }

    let touchStartY = 0;
    let isSwiping = false;

    function onTouchStart(e) {
      if (window.innerWidth > 768) return;
      if (!panel.classList.contains('has-result') || panel.classList.contains('is-editing')) return;
      if (e.target.closest('button')) return;
      if (e.touches.length !== 1) return;
      touchStartY = e.touches[0].clientY;
      isSwiping = true;
    }

    function onTouchMove(e) {
      if (!isSwiping || window.innerWidth > 768) return;
      const curY = e.touches[0].clientY;
      const diffY = curY - touchStartY;
      if (Math.abs(diffY) > 6 && e.cancelable) {
        e.preventDefault();
      }
    }

    function onTouchEnd(e) {
      if (!isSwiping || window.innerWidth > 768) return;
      isSwiping = false;
      const endY = e.changedTouches[0] ? e.changedTouches[0].clientY : touchStartY;
      const diffY = endY - touchStartY;

      if (Math.abs(diffY) < 8) {
        toggleRouteSheetHeight();
      } else if (diffY < -30) {
        panel.classList.remove('mobile-sheet-half');
        panel.classList.add('mobile-sheet-full');
      } else if (diffY > 30) {
        panel.classList.remove('mobile-sheet-full');
        panel.classList.add('mobile-sheet-half');
      }
    }

    [handle, summaryBar].forEach(el => {
      if (!el) return;
      el.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        toggleRouteSheetHeight();
      });
      el.addEventListener('touchstart', onTouchStart, { passive: true });
      el.addEventListener('touchmove', onTouchMove, { passive: false });
      el.addEventListener('touchend', onTouchEnd, { passive: false });
    });
  }

  function setupEventHandlers() {
    setupSearch();
    setupStationSheetMobileInteractions();
    setupRouteSheetMobileInteractions();
    updateSearchPlaceholder();

    document.getElementById('btn-zoom-in').addEventListener('click', () => {
      map.zoomIn();
    });
    document.getElementById('btn-zoom-out').addEventListener('click', () => {
      map.zoomOut();
    });
    document.getElementById('btn-zoom-reset').addEventListener('click', () => {
      const preset = PRESETS[STATE.currentPreset] || PRESETS.kanto;
      map.flyTo({ center: preset.center, zoom: preset.zoom, duration: 700 });
    });

    document.getElementById('btn-sheet-close').addEventListener('click', closeStationSheet);

    document.getElementById('btn-focus-station').addEventListener('click', () => {
      if (STATE.selectedStationId) {
        const st = STATIONS[STATE.selectedStationId];
        if (st) {
          map.easeTo({
            center: [st.lng, st.lat],
            offset: getStationCenterOffset(),
            duration: 400
          });
        }
      }
    });

    document.getElementById('btn-banner-close').addEventListener('click', closeLineBanner);

    window.addEventListener('resize', () => {
      updateLabelsVisibility();
      updateResponsiveLayerZooms();
      updateSearchPlaceholder();
      const sheet = document.getElementById('station-sheet');
      if (sheet && sheet.style.display !== 'none') {
        if (window.innerWidth <= 768) {
          const sheetHeight = sheet.offsetHeight || sheet.getBoundingClientRect().height;
          const header = sheet.querySelector('.sheet-header');
          const sheetRect = sheet.getBoundingClientRect();
          const headerRect = header ? header.getBoundingClientRect() : null;
          const peekVisibleHeight = headerRect ? Math.round(headerRect.bottom - sheetRect.top) : 165;
          const peekY = Math.max(0, sheetHeight - peekVisibleHeight);
          sheet.dataset.peekY = peekY;
          if (sheet.classList.contains('is-peek')) {
            sheet.style.transform = `translateY(${peekY}px)`;
            sheet.dataset.currentY = peekY;
          }
        } else {
          sheet.style.transform = '';
          sheet.style.transition = '';
        }
      }
    });
  }

  // ローカル日付文字列 (YYYY-MM-DD) 取得
  function getLocalISODate(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // =======================================================
  // 9. マルス経路探索 UI & 地図連携
  // =======================================================
  const ROUTE_STATE = {
    isOpen: false,
    useShinkansen: false,
    searchMode: 'shortest',
    shinkansenSegments: [], // [{ fromId, toId, fromName, toName, km, lineId }]
    activeRouteLayers: [],
    activePinLayers: [],
    lastResult: null,
    currentFareType: 'adult',    // 'adult' | 'child' | 'student'
    ticketDate: getLocalISODate()
  };

  // 全国の主要デフォルト新幹線区間 (初期状態または非該当時用)
  const DEFAULT_SHINKANSEN_PAIRS = [
    { from: '東京', to: '新大阪', fromId: 'tokyo', toId: 'shin-osaka', km: 552.6, line: '東海道新幹線', lineId: 'shinkansen-tokaido' },
    { from: '東京', to: '仙台', fromId: 'tokyo', toId: 'sendai', km: 351.8, line: '東北新幹線', lineId: 'shinkansen-tohoku' },
    { from: '東京', to: '金沢', fromId: 'tokyo', toId: 'kanazawa', km: 450.5, line: '北陸新幹線', lineId: 'shinkansen-hokuriku' },
    { from: '新大阪', to: '博多', fromId: 'shin-osaka', toId: 'hakata', km: 644.0, line: '山陽新幹線', lineId: 'shinkansen-sanyo' },
    { from: '博多', to: '鹿児島中央', fromId: 'hakata', toId: 'kagoshima-chuo', km: 288.9, line: '九州新幹線', lineId: 'shinkansen-kyushu' }
  ];

  // 在来線ターミナルから新幹線停車駅への対応マッピング
  const CITY_HUB_TO_SHINKANSEN = {
    'shinjuku': ['tokyo', 'shinagawa'],
    'shibuya': ['shinagawa', 'tokyo'],
    'ikebukuro': ['ueno', 'tokyo', 'omiya'],
    'akihabara': ['tokyo', 'ueno'],
    'kanda': ['tokyo', 'ueno'],
    'yokohama': ['shin-yokohama'],
    'tachikawa': ['tokyo', 'shin-yokohama'],
    'hachioji': ['shin-yokohama', 'tokyo'],
    'chiba': ['tokyo'],
    'st-fzkz': ['shin-osaka'],     // 大阪
    'tennoji': ['shin-osaka'],     // 天王寺
    'jr-nanba': ['shin-osaka'],    // JR難波
    'sannomiya': ['shin-kobe'],    // 三ノ宮
    'st-l6l6': ['shin-kobe'],      // 神戸
    'nara': ['kyoto', 'shin-osaka']
  };

  // 経路探索ボタンの活性・非活性管理
  function setSearchButtonEnabled(enabled) {
    const searchBtn = document.getElementById('btn-search-route');
    if (!searchBtn) return;
    searchBtn.disabled = !enabled;
  }

  // 入力項目 (発着駅・経由駅・新幹線・モード等) の変更検知
  function markInputChanged() {
    setSearchButtonEnabled(true);
  }

  // 候補チップの手動向き反転状態マップ (pairKey -> boolean)
  const pairReversedMap = new Map();

  function getPairKey(pair) {
    const ids = [pair.fromId || pair.from, pair.toId || pair.to];
    return ids.slice().sort().join('--');
  }

  // ルート順序や手動指定に合わせて、ペアの現在の実効向き (from/to) を解決
  function getEffectivePair(pair) {
    const key = getPairKey(pair);
    let isReversed = pairReversedMap.get(key);

    if (isReversed === undefined) {
      isReversed = false;
      const order = [];
      if (ROUTE_STATE.lastResult && ROUTE_STATE.lastResult.allStationIds) {
        order.push(...ROUTE_STATE.lastResult.allStationIds);
      } else {
        const deptInput = document.getElementById('route-dept-input');
        const destInput = document.getElementById('route-dest-input');
        const viaInputs = document.querySelectorAll('.route-via-input');
        if (deptInput && deptInput.getAttribute('data-id')) order.push(deptInput.getAttribute('data-id'));
        viaInputs.forEach(v => {
          if (v.getAttribute('data-id')) order.push(v.getAttribute('data-id'));
        });
        if (destInput && destInput.getAttribute('data-id')) order.push(destInput.getAttribute('data-id'));
      }

      const idxFrom = order.indexOf(pair.fromId);
      const idxTo = order.indexOf(pair.toId);
      if (idxFrom >= 0 && idxTo >= 0 && idxTo < idxFrom) {
        isReversed = true;
      }
    }

    if (isReversed) {
      return {
        ...pair,
        from: pair.to,
        to: pair.from,
        fromId: pair.toId,
        toId: pair.fromId,
        isReversed: true
      };
    }
    return {
      ...pair,
      isReversed: false
    };
  }

  function toggleShinkansenSegment(pair) {
    if (!ROUTE_STATE.shinkansenSegments) ROUTE_STATE.shinkansenSegments = [];
    const idx = ROUTE_STATE.shinkansenSegments.findIndex(s =>
      (s.fromId === pair.fromId && s.toId === pair.toId) ||
      (s.fromId === pair.toId && s.toId === pair.fromId) ||
      (s.fromName === pair.from && s.toName === pair.to) ||
      (s.fromName === pair.to && s.toName === pair.from)
    );

    if (idx >= 0) {
      ROUTE_STATE.shinkansenSegments.splice(idx, 1);
    } else {
      ROUTE_STATE.shinkansenSegments.push({
        fromId: pair.fromId,
        toId: pair.toId,
        fromName: pair.from,
        toName: pair.to,
        km: pair.km,
        lineId: pair.lineId
      });
    }

    renderShinkansenSegmentsList();
    updateShinkansenCandidateChips();
    markInputChanged();
  }

  function swapShinkansenSegment(idx) {
    if (!ROUTE_STATE.shinkansenSegments || !ROUTE_STATE.shinkansenSegments[idx]) return;
    const seg = ROUTE_STATE.shinkansenSegments[idx];
    const tmpId = seg.fromId;
    const tmpName = seg.fromName;
    seg.fromId = seg.toId;
    seg.fromName = seg.toName;
    seg.toId = tmpId;
    seg.toName = tmpName;

    const key = [seg.fromId, seg.toId].sort().join('--');
    pairReversedMap.set(key, !pairReversedMap.get(key));

    renderShinkansenSegmentsList();
    updateShinkansenCandidateChips();
    markInputChanged();
  }

  function addShinkansenSegment(fromSt, toSt) {
    if (!ROUTE_STATE.shinkansenSegments) ROUTE_STATE.shinkansenSegments = [];
    const exists = ROUTE_STATE.shinkansenSegments.some(s => s.fromId === fromSt.id && s.toId === toSt.id);
    if (!exists) {
      const distInfo = calcShinkansenDistance(fromSt.id, toSt.id);
      ROUTE_STATE.shinkansenSegments.push({
        fromId: fromSt.id,
        toId: toSt.id,
        fromName: fromSt.name,
        toName: toSt.name,
        km: distInfo ? distInfo.km : 0,
        line: distInfo ? distInfo.line : '新幹線',
        lineId: distInfo ? distInfo.lineId : 'shinkansen'
      });
      renderShinkansenSegmentsList();
      updateShinkansenCandidateChips();
      markInputChanged();
    }
  }

  function removeShinkansenSegment(idx) {
    if (ROUTE_STATE.shinkansenSegments && ROUTE_STATE.shinkansenSegments[idx]) {
      ROUTE_STATE.shinkansenSegments.splice(idx, 1);
      renderShinkansenSegmentsList();
      updateShinkansenCandidateChips();
      markInputChanged();
    }
  }

  // キャッシュされた経路探索グラフ
  let ROUTE_ENGINE_GRAPH = null;

  // 同一新幹線路線上の営業キロ算出 (完全非再帰・O(1)・駅ID/駅名両対応・edgeDistances積算フォールバック)
  function calcDirectShinkansenDistance(fromId, toId) {
    if (!fromId || !toId || fromId === toId || !LINES) return null;
    const st1 = STATIONS[fromId] || Object.values(STATIONS).find(s => s.name === fromId);
    const st2 = STATIONS[toId] || Object.values(STATIONS).find(s => s.name === toId);
    const id1 = st1 ? st1.id : fromId;
    const id2 = st2 ? st2.id : toId;
    const name1 = st1 ? st1.name : fromId;
    const name2 = st2 ? st2.name : toId;

    const shLines = LINES.filter(l => l.category === 'shinkansen');

    for (const line of shLines) {
      const stIds = line.stations || [];
      let idx1 = stIds.indexOf(id1);
      let idx2 = stIds.indexOf(id2);
      if (idx1 < 0 && st1) idx1 = stIds.findIndex(sid => STATIONS[sid] && STATIONS[sid].name === name1);
      if (idx2 < 0 && st2) idx2 = stIds.findIndex(sid => STATIONS[sid] && STATIONS[sid].name === name2);

      if (idx1 >= 0 && idx2 >= 0) {
        // A. stationKilos による計算 (駅IDキーまたは駅名キーの両方に対応)
        if (line.stationKilos) {
          const k1 = line.stationKilos[id1] !== undefined ? line.stationKilos[id1] : line.stationKilos[name1];
          const k2 = line.stationKilos[id2] !== undefined ? line.stationKilos[id2] : line.stationKilos[name2];
          if (k1 !== undefined && k2 !== undefined) {
            const dist = Math.abs(Math.round((k2 - k1) * 10) / 10);
            return { km: dist, line: line.name, lineId: line.id };
          }
        }

        // B. edgeDistances による累積加算フォールバック
        if (line.edgeDistances) {
          const startIdx = Math.min(idx1, idx2);
          const endIdx = Math.max(idx1, idx2);
          let sumKm = 0, ok = true;
          for (let i = startIdx; i < endIdx; i++) {
            const sA = stIds[i], sB = stIds[i + 1];
            const nA = STATIONS[sA] ? STATIONS[sA].name : sA;
            const nB = STATIONS[sB] ? STATIONS[sB].name : sB;
            const d = line.edgeDistances[`${sA}-${sB}`] ?? line.edgeDistances[`${sB}-${sA}`] ??
                      line.edgeDistances[`${sA}--${sB}`] ?? line.edgeDistances[`${sB}--${sA}`] ??
                      line.edgeDistances[`${nA}-${nB}`] ?? line.edgeDistances[`${nB}-${nA}`] ??
                      line.edgeDistances[`${nA}--${nB}`] ?? line.edgeDistances[`${nB}--${nA}`];
            if (d !== undefined && d > 0) {
              sumKm += d;
            } else {
              ok = false;
              break;
            }
          }
          if (ok && sumKm > 0) {
            return { km: Math.round(sumKm * 10) / 10, line: line.name, lineId: line.id };
          }
        }
      }
    }
    return null;
  }

  // 新幹線駅ペアの高速営業キロ算出 (LINESとofficial-kilosからO(1)で直接計算・非再帰・全主要新幹線ハブ網羅)
  function calcShinkansenDistance(fromId, toId, depth = 0) {
    if (!fromId || !toId || fromId === toId || !LINES || depth > 2) return null;

    // 1. 同一新幹線路線上にある場合 (直通)
    const direct = calcDirectShinkansenDistance(fromId, toId);
    if (direct) return direct;

    // 2. 接続する主要新幹線路線跨ぎ (東海道〜山陽: 新大阪、山陽〜九州: 博多、東北〜北海道: 新青森、東海道〜東北: 東京、上越〜北陸: 高崎、東北〜上越・北陸: 大宮、東北〜山形: 福島、東北〜秋田: 盛岡)
    const throughBridges = [
      { hub: 'shin-osaka', name: '東海道・山陽新幹線', lineId: 'shinkansen-tokaido' },
      { hub: 'hakata', name: '山陽・九州新幹線', lineId: 'shinkansen-sanyo' },
      { hub: 'shin-aomori', name: '東北・北海道新幹線', lineId: 'shinkansen-tohoku' },
      { hub: 'tokyo', name: '東海道・東北新幹線', lineId: 'shinkansen-tokaido' },
      { hub: 'omiya', name: '東北・上越・北陸新幹線', lineId: 'shinkansen-tohoku' },
      { hub: 'takasaki', name: '上越・北陸新幹線', lineId: 'shinkansen-joetsu' },
      { hub: 'fukushima', name: '東北・山形新幹線', lineId: 'shinkansen-tohoku' },
      { hub: 'morioka', name: '東北・秋田新幹線', lineId: 'shinkansen-tohoku' }
    ];

    for (const b of throughBridges) {
      if (fromId !== b.hub && toId !== b.hub) {
        const leg1 = calcDirectShinkansenDistance(fromId, b.hub);
        const leg2 = calcDirectShinkansenDistance(b.hub, toId);
        if (leg1 && leg2 && leg1.km > 0 && leg2.km > 0) {
          return {
            km: Math.round((leg1.km + leg2.km) * 10) / 10,
            line: b.name,
            lineId: b.lineId
          };
        }
      }
    }

    // 3. 2回乗り継ぎ (東海道〜山陽〜九州: 新大阪と博多経由)
    const legSanyo = calcDirectShinkansenDistance('shin-osaka', 'hakata');
    if (legSanyo) {
      const legTokaido = calcDirectShinkansenDistance(fromId, 'shin-osaka');
      const legKyushu = calcDirectShinkansenDistance('hakata', toId);
      if (legTokaido && legKyushu) {
        return {
          km: Math.round((legTokaido.km + legSanyo.km + legKyushu.km) * 10) / 10,
          line: '東海道・山陽・九州新幹線',
          lineId: 'shinkansen-tokaido'
        };
      }
      const legKyushuRev = calcDirectShinkansenDistance(fromId, 'hakata');
      const legTokaidoRev = calcDirectShinkansenDistance('shin-osaka', toId);
      if (legKyushuRev && legTokaidoRev) {
        return {
          km: Math.round((legKyushuRev.km + legSanyo.km + legTokaidoRev.km) * 10) / 10,
          line: '山陽・九州・東海道新幹線',
          lineId: 'shinkansen-tokaido'
        };
      }
    }

    // 4. フォールバック: キャッシュ済みグラフでの探索 (buildGraph再呼び出しは行わない)
    if (ROUTE_ENGINE_GRAPH && window.JR_ROUTE_ENGINE && window.JR_ROUTE_ENGINE.findLeg) {
      try {
        const leg = window.JR_ROUTE_ENGINE.findLeg(ROUTE_ENGINE_GRAPH, fromId, toId, { allowShinkansen: true, forceShinkansen: true });
        if (leg && leg.length > 0) {
          const allShinkansen = leg.every(s => (s.lineCategory === 'shinkansen' || (s.lineName && s.lineName.includes('新幹線'))));
          if (allShinkansen) {
            const kmTenths = leg.reduce((sum, s) => sum + Math.round((s.dist || s.km) * 10), 0);
            return {
              km: kmTenths / 10,
              line: leg[0].lineName || '新幹線',
              lineId: leg[0].lineId
            };
          }
        }
      } catch (e) {}
    }

    return null;
  }

  // ルートから関連する新幹線候補ペアを動的に抽出 (第三セクター並行在来線区間・ルート文脈ハブ厳選)
  function getRelevantShinkansenPairs(explicitDeptSt, explicitDestSt) {
    const isShinkansenStation = (id) => {
      if (!id || !STATIONS[id]) return false;
      const st = STATIONS[id];
      return !!(st.lines && st.lines.some(l => l.startsWith('shinkansen-')));
    };

    const candidates = [];
    const seenPairs = new Set();

    const addCandidatePair = (fromId, toId, priority = 0) => {
      if (!fromId || !toId || fromId === toId) return;
      const pairKey = [fromId, toId].sort().join('--');
      if (seenPairs.has(pairKey)) return;

      const shDist = calcShinkansenDistance(fromId, toId);
      if (shDist && shDist.km > 0) {
        seenPairs.add(pairKey);
        candidates.push({
          from: STATIONS[fromId].name,
          to: STATIONS[toId].name,
          fromId: fromId,
          toId: toId,
          km: shDist.km,
          line: shDist.line,
          lineId: shDist.lineId,
          priority: priority
        });
      }
    };

    const deptInput = document.getElementById('route-dept-input');
    const destInput = document.getElementById('route-dest-input');

    const deptSt = explicitDeptSt ? (typeof explicitDeptSt === 'string' ? STATIONS[explicitDeptSt] : explicitDeptSt) : resolveStation(deptInput);
    const destSt = explicitDestSt ? (typeof explicitDestSt === 'string' ? STATIONS[explicitDestSt] : explicitDestSt) : resolveStation(destInput);

    const viaInputs = document.querySelectorAll('.route-via-input');
    const viaSts = [];
    viaInputs.forEach(inp => {
      const st = resolveStation(inp);
      if (st) viaSts.push(st);
    });

    const inputChain = [deptSt, ...viaSts, destSt].filter(Boolean);

    // 全国主要新幹線接続ハブ
    const MAJOR_SHINKANSEN_HUBS = new Set([
      'tokyo', 'shinagawa', 'shin-yokohama', 'shizuoka', 'hamamatsu', 'nagoya', 'kyoto', 'shin-osaka', 'shin-kobe', 'okayama', 'hiroshima', 'kokura', 'hakata',
      'ueno', 'omiya', 'utsunomiya', 'koriyama', 'fukushima', 'sendai', 'morioka', 'hachinohe', 'shin-aomori', 'shin-hakodate-hokuto',
      'takasaki', 'echigo-yuzawa', 'nagaoka', 'niigata', 'karuizawa', 'nagano', 'toyama', 'kanazawa', 'fukui', 'tsuruga',
      'yamagata', 'shinjo', 'akita', 'kumamoto', 'kagoshima-chuo', 'takeo-onsen', 'nagasaki'
    ]);

    if (inputChain.length >= 2) {
      // 1. ルート文脈 (発着・経由および探索経路) 上に存在する新幹線駅を順序通り抽出
      const routeShIds = [];
      const seenSh = new Set();

      const addShStation = (id) => {
        if (id && isShinkansenStation(id) && !seenSh.has(id)) {
          seenSh.add(id);
          routeShIds.push(id);
        }
      };

      // lastResult があればその通過駅を採用
      if (ROUTE_STATE.lastResult && ROUTE_STATE.lastResult.allStationIds) {
        ROUTE_STATE.lastResult.allStationIds.forEach(addShStation);
      }

      // inputChain の各区間を新幹線許可探索して直接的な新幹線駅経路を取得
      for (let k = 0; k < inputChain.length - 1; k++) {
        const u = inputChain[k];
        const v = inputChain[k + 1];

        if (isShinkansenStation(u.id)) addShStation(u.id);

        if (window.JR_ROUTE_ENGINE && ROUTE_ENGINE_GRAPH && u.id !== v.id) {
          try {
            const leg = window.JR_ROUTE_ENGINE.findLeg(
              ROUTE_ENGINE_GRAPH,
              u.id,
              v.id,
              { allowShinkansen: true }
            );
            if (leg && Array.isArray(leg)) {
              leg.forEach(step => {
                if (step && step.to) addShStation(step.to);
              });
            }
          } catch (e) {}
        }

        if (isShinkansenStation(v.id)) addShStation(v.id);
      }

      // 発駅・着駅自身が新幹線駅の場合は、端点位置を明確に一致させる
      let firstSh = routeShIds[0];
      let lastSh = routeShIds[routeShIds.length - 1];

      if (deptSt && isShinkansenStation(deptSt.id)) {
        firstSh = deptSt.id;
      }
      if (destSt && isShinkansenStation(destSt.id)) {
        lastSh = destSt.id;
      }

      // 2. 収集した新幹線駅から、優先度付きで候補ペアを生成
      if (firstSh && lastSh && firstSh !== lastSh) {
        // 優先度 1: 発駅側新幹線駅 〜 着駅側新幹線駅 (最優先)
        addCandidatePair(firstSh, lastSh, 1000);

        // 発駅が新幹線駅でない場合、経路上の各主要乗換駅 〜 着駅側新幹線駅 (最優先候補に追加)
        if (deptSt && !isShinkansenStation(deptSt.id)) {
          for (let i = 0; i < routeShIds.length; i++) {
            const entry = routeShIds[i];
            if (entry !== lastSh && MAJOR_SHINKANSEN_HUBS.has(entry)) {
              addCandidatePair(entry, lastSh, 950 - i);
            }
          }
        }

        // 優先度 2: 発駅側新幹線駅 〜 経路上の主要ハブ駅
        for (let i = routeShIds.length - 1; i >= 0; i--) {
          const mid = routeShIds[i];
          if (mid !== firstSh && mid !== lastSh && MAJOR_SHINKANSEN_HUBS.has(mid)) {
            addCandidatePair(firstSh, mid, 800 + i);
          }
        }

        // 優先度 3: 経路上の主要ハブ駅 〜 着駅側新幹線駅
        for (let i = 0; i < routeShIds.length; i++) {
          const mid = routeShIds[i];
          if (mid !== firstSh && mid !== lastSh && MAJOR_SHINKANSEN_HUBS.has(mid)) {
            addCandidatePair(mid, lastSh, 600 - i);
          }
        }

        // 優先度 4: 経路上の主要ハブ駅同士
        for (let i = 0; i < routeShIds.length; i++) {
          for (let j = i + 1; j < routeShIds.length; j++) {
            const mid1 = routeShIds[i];
            const mid2 = routeShIds[j];
            if (mid1 !== firstSh && mid2 !== lastSh && MAJOR_SHINKANSEN_HUBS.has(mid1) && MAJOR_SHINKANSEN_HUBS.has(mid2)) {
              addCandidatePair(mid1, mid2, 400);
            }
          }
        }

        // 優先度 5: 発駅からの近隣新幹線区間
        for (let i = 0; i < routeShIds.length; i++) {
          if (routeShIds[i] !== firstSh) {
            addCandidatePair(firstSh, routeShIds[i], 200 - i);
          }
        }
      }
    } else if (inputChain.length === 1) {
      // 発駅のみ入力時は、その駅が所属する新幹線路線の主要ハブを提示
      const singleSt = inputChain[0];
      if (isShinkansenStation(singleSt.id)) {
        const myLines = LINES.filter(l => l.category === 'shinkansen' && l.stations.includes(singleSt.id));
        myLines.forEach(line => {
          line.stations.forEach(stId => {
            if (stId !== singleSt.id && MAJOR_SHINKANSEN_HUBS.has(stId)) {
              addCandidatePair(singleSt.id, stId, 100);
            }
          });
        });
      }
    }

    // 優先度順にソートして上位10件に絞り込み
    candidates.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    const resultCandidates = candidates.slice(0, 10);

    // 選択中セグメントの保持 (候補に含まれていない場合も先頭に追加して解除可能に)
    if (ROUTE_STATE.shinkansenSegments && ROUTE_STATE.shinkansenSegments.length > 0) {
      ROUTE_STATE.shinkansenSegments.forEach(seg => {
        const pairKey = [seg.fromId, seg.toId].sort().join('--');
        const exists = resultCandidates.some(c => [c.fromId, c.toId].sort().join('--') === pairKey);
        if (!exists) {
          resultCandidates.unshift({
            from: seg.fromName || (STATIONS[seg.fromId] ? STATIONS[seg.fromId].name : seg.fromId),
            to: seg.toName || (STATIONS[seg.toId] ? STATIONS[seg.toId].name : seg.toId),
            fromId: seg.fromId,
            toId: seg.toId,
            km: seg.km || 0,
            line: seg.line,
            lineId: seg.lineId,
            priority: 9999
          });
        }
      });
    }

    return resultCandidates.length > 0 ? resultCandidates : DEFAULT_SHINKANSEN_PAIRS;
  }

  // 全国主要新幹線ハブ一覧 (ルート未入力時やフォールバック用)
  const MAJOR_SHINKANSEN_STATIONS = [
    // 東海道・山陽・九州
    'tokyo', 'shinagawa', 'shin-yokohama', 'odawara', 'atami', 'mishima', 'shizuoka', 'hamamatsu', 'toyohashi', 'nagoya', 'kyoto', 'shin-osaka', 'shin-kobe', 'himeji', 'okayama', 'hiroshima', 'shin-yamaguchi', 'kokura', 'hakata', 'kumamoto', 'kagoshima-chuo',
    // 東北・北海道・山形・秋田
    'ueno', 'omiya', 'utsunomiya', 'koriyama', 'fukushima', 'sendai', 'morioka', 'hachinohe', 'shin-aomori', 'shin-hakodate-hokuto', 'yamagata', 'shinjo', 'akita',
    // 上越・北陸
    'takasaki', 'echigo-yuzawa', 'nagaoka', 'niigata', 'karuizawa', 'nagano', 'toyama', 'kanazawa', 'fukui', 'tsuruga'
  ];

  // 新幹線路線上の停車駅を進行方向順に取得 (同一路線および主要ハブ経由の直通・接続)
  function getShinkansenLineStationPath(fromId, toId) {
    if (!fromId || !toId || fromId === toId || !LINES) return [];
    const shLines = LINES.filter(l => l.category === 'shinkansen');
    for (const line of shLines) {
      const stIds = line.stations || [];
      const idx1 = stIds.indexOf(fromId);
      const idx2 = stIds.indexOf(toId);
      if (idx1 >= 0 && idx2 >= 0) {
        if (idx1 < idx2) {
          return stIds.slice(idx1, idx2 + 1);
        } else {
          return stIds.slice(idx2, idx1 + 1).reverse();
        }
      }
    }
    // 主要ハブ経由の接続 (新大阪、大宮、高崎、博多、東京、盛岡、福島)
    const hubs = ['shin-osaka', 'omiya', 'takasaki', 'hakata', 'tokyo', 'morioka', 'fukushima'];
    for (const hub of hubs) {
      if (fromId !== hub && toId !== hub) {
        let p1 = null, p2 = null;
        for (const line of shLines) {
          const stIds = line.stations || [];
          const iF = stIds.indexOf(fromId), iH = stIds.indexOf(hub);
          if (iF >= 0 && iH >= 0) {
            p1 = iF < iH ? stIds.slice(iF, iH + 1) : stIds.slice(iH, iF + 1).reverse();
            break;
          }
        }
        if (!p1) continue;
        for (const line of shLines) {
          const stIds = line.stations || [];
          const iH = stIds.indexOf(hub), iT = stIds.indexOf(toId);
          if (iH >= 0 && iT >= 0) {
            p2 = iH < iT ? stIds.slice(iH, iT + 1) : stIds.slice(iT, iH + 1).reverse();
            break;
          }
        }
        if (p1 && p2) {
          return [...p1, ...p2.slice(1)];
        }
      }
    }
    return [];
  }

  // 東京山手線内 (旅規第87条) 駅名Set
  const YAMANOTE_ZONE_NAMES = new Set([
    '東京', '有楽町', '新橋', '浜松町', '田町', '高輪ゲートウェイ', '品川',
    '大崎', '五反田', '目黒', '恵比寿', '渋谷', '原宿', '代々木', '新宿',
    '新大久保', '高田馬場', '目白', '池袋', '大塚', '巣鴨', '駒込', '田端',
    '西日暮里', '日暮里', '鶯谷', '上野', '御徒町', '秋葉原', '神田',
    '御茶ノ水', '水道橋', '飯田橋', '市ヶ谷', '四ツ谷', '信濃町', '千駄ヶ谷'
  ]);

  // 駅が東京山手線内ゾーンに属するか判定
  function isYamanoteZoneStation(stOrId) {
    if (!stOrId) return false;
    const st = typeof stOrId === 'string' ? (STATIONS[stOrId] || { name: stOrId }) : stOrId;
    const name = st.name || (typeof stOrId === 'string' ? stOrId : '');
    let yamanoteSet = YAMANOTE_ZONE_NAMES;
    if (typeof window !== 'undefined' && window.JR_FARE_RULES_DATA && window.JR_FARE_RULES_DATA.SPECIFIC_CITY_ZONES && window.JR_FARE_RULES_DATA.SPECIFIC_CITY_ZONES.yamanote) {
      yamanoteSet = window.JR_FARE_RULES_DATA.SPECIFIC_CITY_ZONES.yamanote.stationNames;
    } else if (typeof require !== 'undefined') {
      try {
        const frd = require('./data/fare-rules-data.js');
        if (frd && frd.SPECIFIC_CITY_ZONES && frd.SPECIFIC_CITY_ZONES.yamanote) {
          yamanoteSet = frd.SPECIFIC_CITY_ZONES.yamanote.stationNames;
        }
      } catch(e) {}
    }
    if (!yamanoteSet.has(name)) return false;
    if (st.lat != null && st.lng != null) {
      const tokyoSt = STATIONS['tokyo'];
      if (tokyoSt && tokyoSt.lat != null) {
        const dLat = Math.abs(st.lat - tokyoSt.lat);
        const dLng = Math.abs(st.lng - tokyoSt.lng);
        if (dLat > 0.5 || dLng > 0.5) return false;
      }
    }
    return true;
  }

  // 新幹線駅の順序マスタ (系統別・進行方向順整列用)
  const TOKAIDO_SANYO_ORDER = [
    'tokyo', 'shinagawa', 'shin-yokohama', 'odawara', 'atami', 'mishima', 'shin-fuji',
    'shizuoka', 'kakegawa', 'hamamatsu', 'toyohashi', 'mikawa-anjo', 'nagoya',
    'gifu-hashima', 'maibara', 'kyoto', 'shin-osaka', 'shin-kobe', 'nishi-akashi',
    'himeji', 'aioi', 'okayama', 'shin-kurashiki', 'fukuyama', 'shin-onomichi',
    'mihara', 'higashi-hiroshima', 'hiroshima', 'shin-iwakuni', 'tokuyama',
    'shin-yamaguchi', 'asa', 'shin-shimonoseki', 'kokura', 'hakata',
    'shin-tosu', 'kurume', 'chikugo-funagoya', 'shin-omuta', 'shin-tamana',
    'kumamoto', 'shin-yatsushiro', 'shin-minamata', 'izumi', 'sendai-kagoshima', 'kagoshima-chuo'
  ];

  const TOHOKU_ORDER = [
    'tokyo', 'ueno', 'omiya', 'oyama', 'utsunomiya', 'nasushiobara', 'shin-shirakawa',
    'koriyama', 'fukushima', 'shiroishi-zao', 'sendai', 'furukawa', 'kurikoma-kogen',
    'ichinoseki', 'mizusawa-esashi', 'kitakami', 'morioka', 'iwate-numakunai',
    'ninohe', 'hachinohe', 'shichinohe-towada', 'shin-aomori'
  ];

  const JOETSU_ORDER = [
    'tokyo', 'ueno', 'omiya', 'kumagaya', 'honjo-waseda', 'takasaki', 'jomo-kogen',
    'echigo-yuzawa', 'urasa', 'nagaoka', 'tsubamesanjo', 'niigata'
  ];

  const HOKURIKU_ORDER = [
    'tokyo', 'ueno', 'omiya', 'kumagaya', 'honjo-waseda', 'takasaki', 'annaka-haruna',
    'karuizawa', 'sakudaira', 'ueda', 'nagano', 'iiyama', 'joetsumyoko',
    'itoigawa', 'kurobe-unazukionsen', 'toyama', 'shin-takaoka', 'kanazawa',
    'komatsu', 'kagaonsen', 'awarakonsen', 'fukui', 'echizen-takefu', 'tsuruga'
  ];

  // ルートから関連する新幹線停車駅を進行方向順に抽出
  function getRelevantShinkansenStationList(explicitDeptSt, explicitDestSt) {
    const isShinkansenStation = (id) => {
      if (!id || !STATIONS[id]) return false;
      const st = STATIONS[id];
      return !!(st.lines && st.lines.some(l => l.startsWith('shinkansen-')));
    };

    const deptInput = document.getElementById('route-dept-input');
    const destInput = document.getElementById('route-dest-input');

    const deptSt = explicitDeptSt ? (typeof explicitDeptSt === 'string' ? STATIONS[explicitDeptSt] : explicitDeptSt) : resolveStation(deptInput);
    const destSt = explicitDestSt ? (typeof explicitDestSt === 'string' ? STATIONS[explicitDestSt] : explicitDestSt) : resolveStation(destInput);

    const viaInputs = document.querySelectorAll('.route-via-input');
    const viaSts = [];
    viaInputs.forEach(inp => {
      const st = resolveStation(inp);
      if (st) viaSts.push(st);
    });

    const inputChain = [deptSt, ...viaSts, destSt].filter(Boolean);

    // 発駅・着駅が揃っていない場合は空配列を返却 (単駅・全国フォールバック廃止)
    if (inputChain.length < 2) {
      return [];
    }

    const inputIds = inputChain.map(s => s.id);
    // 現在の入力欄と前回の探索結果が完全一致している場合のみ lastResult を参照
    const isLastResultMatching = ROUTE_STATE.lastResult &&
      Array.isArray(ROUTE_STATE.lastResult.stops) &&
      ROUTE_STATE.lastResult.stops.length === inputIds.length &&
      ROUTE_STATE.lastResult.stops.every((id, idx) => id === inputIds[idx]);

    const rawShIds = new Set();
    const allVisitedIds = new Set(inputIds);

    let hasYamanoteZone = inputChain.some(st => isYamanoteZoneStation(st));

    // 1. 直近の完全一致する探索結果があれば反映
    if (isLastResultMatching && ROUTE_STATE.lastResult) {
      if (ROUTE_STATE.lastResult.allStationIds) {
        ROUTE_STATE.lastResult.allStationIds.forEach(id => {
          allVisitedIds.add(id);
          if (isYamanoteZoneStation(id)) hasYamanoteZone = true;
          if (isShinkansenStation(id)) rawShIds.add(id);
        });
      }
      if (ROUTE_STATE.lastResult.fullSegments) {
        ROUTE_STATE.lastResult.fullSegments.forEach(step => {
          if (step.lineId === 'yamanote') hasYamanoteZone = true;
          if (step.from) {
            allVisitedIds.add(step.from);
            if (isYamanoteZoneStation(step.from)) hasYamanoteZone = true;
            if (isShinkansenStation(step.from)) rawShIds.add(step.from);
          }
          if (step.to) {
            allVisitedIds.add(step.to);
            if (isYamanoteZoneStation(step.to)) hasYamanoteZone = true;
            if (isShinkansenStation(step.to)) rawShIds.add(step.to);
          }
        });
      }
    }

    // 2. inputChain の各区間を探索して通過駅・新幹線駅を収集
    const engineGraph = ROUTE_ENGINE_GRAPH || (window.JR_ROUTE_ENGINE && window.JR_ROUTE_ENGINE.buildGraph && window.JR_ROUTE_ENGINE.buildGraph());

    for (let k = 0; k < inputChain.length - 1; k++) {
      const u = inputChain[k];
      const v = inputChain[k + 1];

      const directShPath = getShinkansenLineStationPath(u.id, v.id);
      if (directShPath && directShPath.length >= 2) {
        directShPath.forEach(id => {
          allVisitedIds.add(id);
          rawShIds.add(id);
        });
      } else {
        if (isShinkansenStation(u.id)) rawShIds.add(u.id);

        if (window.JR_ROUTE_ENGINE && engineGraph && u.id !== v.id) {
          const routeModes = [
            { allowShinkansen: false },
            { allowShinkansen: true }
          ];

          for (const opt of routeModes) {
            try {
              const leg = window.JR_ROUTE_ENGINE.findLeg(engineGraph, u.id, v.id, opt);
              if (leg && Array.isArray(leg)) {
                leg.forEach(step => {
                  if (step.lineId === 'yamanote') hasYamanoteZone = true;
                  if (step.from) {
                    allVisitedIds.add(step.from);
                    if (isYamanoteZoneStation(step.from)) hasYamanoteZone = true;
                    if (isShinkansenStation(step.from)) rawShIds.add(step.from);
                  }
                  if (step.to) {
                    allVisitedIds.add(step.to);
                    if (isYamanoteZoneStation(step.to)) hasYamanoteZone = true;
                    if (isShinkansenStation(step.to)) rawShIds.add(step.to);
                  }
                });
              }
            } catch (e) {}
          }
        }

        if (isShinkansenStation(v.id)) rawShIds.add(v.id);
      }
    }

    // 山手線内を通らず、新幹線駅も2駅未満なら空配列 (全国フォールバック完全廃止)
    if (!hasYamanoteZone && rawShIds.size < 2) {
      return [];
    }

    const dept = inputChain[0];
    const dest = inputChain[inputChain.length - 1];

    const tokaidoStations = Array.from(rawShIds).filter(id => TOKAIDO_SANYO_ORDER.includes(id) && id !== 'tokyo' && id !== 'shinagawa');
    const northStations = Array.from(rawShIds).filter(id => (TOHOKU_ORDER.includes(id) || JOETSU_ORDER.includes(id) || HOKURIKU_ORDER.includes(id)) && id !== 'tokyo' && id !== 'ueno');

    let resultIds = [];

    if (tokaidoStations.length > 0) {
      // 東海道・山陽新幹線主体のルート
      const isWestbound = (dest.lng != null && dept.lng != null) ? (dest.lng < dept.lng || dest.lat < dept.lat) : true;

      const sortedTokaido = Array.from(rawShIds)
        .filter(id => TOKAIDO_SANYO_ORDER.includes(id) && id !== 'tokyo' && id !== 'shinagawa')
        .sort((a, b) => TOKAIDO_SANYO_ORDER.indexOf(a) - TOKAIDO_SANYO_ORDER.indexOf(b));

      if (isWestbound) {
        const prefix = hasYamanoteZone ? ['ueno', 'tokyo', 'shinagawa'] : (rawShIds.has('tokyo') ? (rawShIds.has('shinagawa') ? ['tokyo', 'shinagawa'] : ['tokyo']) : (rawShIds.has('shinagawa') ? ['shinagawa'] : []));
        const resSet = new Set(prefix);
        sortedTokaido.forEach(id => resSet.add(id));
        resultIds = Array.from(resSet);
      } else {
        const suffix = hasYamanoteZone ? ['shinagawa', 'tokyo', 'ueno'] : (rawShIds.has('shinagawa') ? (rawShIds.has('tokyo') ? ['shinagawa', 'tokyo'] : ['shinagawa']) : (rawShIds.has('tokyo') ? ['tokyo'] : []));
        const resSet = new Set(sortedTokaido.reverse());
        suffix.forEach(id => resSet.add(id));
        resultIds = Array.from(resSet);
      }
    } else if (northStations.length > 0) {
      // 東北・上越・北陸新幹線主体のルート
      const isNorthbound = (dest.lat != null && dept.lat != null) ? (dest.lat > dept.lat || dest.lng > dept.lng) : true;

      const masterOrder = northStations.some(id => TOHOKU_ORDER.includes(id)) ? TOHOKU_ORDER : (northStations.some(id => JOETSU_ORDER.includes(id)) ? JOETSU_ORDER : HOKURIKU_ORDER);
      const sortedNorth = Array.from(rawShIds)
        .filter(id => masterOrder.includes(id) && id !== 'tokyo' && id !== 'ueno')
        .sort((a, b) => masterOrder.indexOf(a) - masterOrder.indexOf(b));

      if (isNorthbound) {
        const prefix = hasYamanoteZone ? ['shinagawa', 'tokyo', 'ueno'] : (rawShIds.has('tokyo') ? (rawShIds.has('ueno') ? ['tokyo', 'ueno'] : ['tokyo']) : (rawShIds.has('ueno') ? ['ueno'] : []));
        const resSet = new Set(prefix);
        sortedNorth.forEach(id => resSet.add(id));
        resultIds = Array.from(resSet);
      } else {
        const suffix = hasYamanoteZone ? ['ueno', 'tokyo', 'shinagawa'] : (rawShIds.has('ueno') ? (rawShIds.has('tokyo') ? ['ueno', 'tokyo'] : ['ueno']) : (rawShIds.has('tokyo') ? ['tokyo'] : []));
        const resSet = new Set(sortedNorth.reverse());
        suffix.forEach(id => resSet.add(id));
        resultIds = Array.from(resSet);
      }
    } else if (hasYamanoteZone) {
      // 山手線内のみの移動 (御茶ノ水 -> 甲府、新宿 -> 渋谷 等)
      resultIds = ['shinagawa', 'tokyo', 'ueno'];
    } else {
      resultIds = Array.from(rawShIds);
    }

    if (resultIds.length >= 2) {
      return resultIds.map(id => STATIONS[id]).filter(Boolean);
    }

    return [];
  }

  // デフォルト新幹線区間プリセットの決定
  function determineDefaultPreset(stationList, deptSt, destSt) {
    if (!stationList || stationList.length < 2) return null;
    const fromSt = typeof deptSt === 'string' ? STATIONS[deptSt] : deptSt;
    const toSt = typeof destSt === 'string' ? STATIONS[destSt] : destSt;

    let bestPair = null;
    let bestScore = -Infinity;

    for (let i = 0; i < stationList.length; i++) {
      for (let j = 0; j < stationList.length; j++) {
        if (i === j) continue;
        const s1 = stationList[i];
        const s2 = stationList[j];
        const distInfo = calcShinkansenDistance(s1.id, s2.id);
        if (!distInfo || distInfo.km <= 0) continue;

        let score = 0;
        // 順方向 (i < j) を優遇
        if (i < j) score += 50;

        // 発駅一致
        if (fromSt && s1.id === fromSt.id) score += 100;
        // 着駅一致
        if (toSt && s2.id === toSt.id) score += 100;
        // 新幹線駅名対応 (大阪 -> 新大阪)
        if (toSt && s2.name === '新' + toSt.name) score += 95;
        if (fromSt && s1.name === '新' + fromSt.name) score += 95;

        // 東海道新幹線を利用する場合: 東京・品川からの乗車を強く優先、上野発はペナルティ
        if (distInfo.line && distInfo.line.includes('東海道')) {
          if (s1.id === 'ueno') score -= 50;
          if (s1.id === 'tokyo' || s1.id === 'shinagawa') score += 40;
        }
        // 東北・上越・北陸新幹線を利用する場合: 東京・上野からの乗車を強く優先、品川発はペナルティ
        if (distInfo.line && (distInfo.line.includes('東北') || distInfo.line.includes('上越') || distInfo.line.includes('北陸'))) {
          if (s1.id === 'shinagawa') score -= 50;
          if (s1.id === 'tokyo') score += 40;
        }

        // 距離ボーナス (最長区間を優先)
        score += distInfo.km * 0.1;

        if (score > bestScore) {
          bestScore = score;
          bestPair = { from: s1, to: s2, km: distInfo.km };
        }
      }
    }

    return bestPair;
  }

  let lastStationListIds = '';

  // ルート連動の新幹線乗車・降車駅セレクタUIを更新
  function updateShinkansenSelectors() {
    const fromSelect = document.getElementById('shinkansen-from-select');
    const toSelect = document.getElementById('shinkansen-to-select');
    const swapBtn = document.getElementById('btn-swap-shinkansen-select');
    const addBtn = document.getElementById('btn-add-shinkansen-select');
    const distEl = document.getElementById('shinkansen-select-dist');
    const lineEl = document.getElementById('shinkansen-select-line');
    if (!fromSelect || !toSelect) return;

    const stationList = getRelevantShinkansenStationList();

    // 候補が2駅未満（新幹線区間なし、または未入力時）の場合はセレクトとボタンを完全無効化
    if (!stationList || stationList.length < 2) {
      lastStationListIds = '';
      const deptInput = document.getElementById('route-dept-input');
      const destInput = document.getElementById('route-dest-input');
      const hasInputs = deptInput && destInput && deptInput.value.trim() && destInput.value.trim();
      const placeholderText = hasInputs ? 'この経路に新幹線区間なし' : '発駅・着駅を入力';

      fromSelect.innerHTML = `<option value="">${placeholderText}</option>`;
      toSelect.innerHTML = `<option value="">${placeholderText}</option>`;
      fromSelect.disabled = true;
      toSelect.disabled = true;
      if (swapBtn) swapBtn.disabled = true;
      if (addBtn) addBtn.disabled = true;
      if (distEl) {
        distEl.textContent = '-';
        distEl.style.background = '#f1f5f9';
        distEl.style.borderColor = '#cbd5e1';
        distEl.style.color = '#64748b';
      }
      if (lineEl) lineEl.textContent = '';
      return;
    }

    // 候補が2駅以上ある場合はセレクトと入れ替えボタンを有効化
    fromSelect.disabled = false;
    toSelect.disabled = false;
    if (swapBtn) swapBtn.disabled = false;

    const currentFromVal = fromSelect.value;
    const currentToVal = toSelect.value;

    const currentListIds = stationList.map(s => s.id).join(',');
    const listChanged = (currentListIds !== lastStationListIds);
    lastStationListIds = currentListIds;

    // 選択肢の再構築 (駅リストが変わった場合のみ再描画してチラつき防止)
    if (listChanged || fromSelect.options.length === 0) {
      fromSelect.innerHTML = '';
      toSelect.innerHTML = '';

      stationList.forEach(st => {
        const optFrom = document.createElement('option');
        optFrom.value = st.id;
        optFrom.textContent = getStationUiName(st.id);
        fromSelect.appendChild(optFrom);

        const optTo = document.createElement('option');
        optTo.value = st.id;
        optTo.textContent = getStationUiName(st.id);
        toSelect.appendChild(optTo);
      });

      // デフォルト選択値の決定:
      const deptSt = resolveStation(document.getElementById('route-dept-input'));
      const destSt = resolveStation(document.getElementById('route-dest-input'));
      const preset = determineDefaultPreset(stationList, deptSt, destSt);

      if (preset) {
        fromSelect.value = preset.from.id;
        toSelect.value = preset.to.id;
      } else if (stationList.length >= 2) {
        fromSelect.value = stationList[0].id;
        toSelect.value = stationList[stationList.length - 1].id;
      }
    } else {
      if (currentFromVal && stationList.some(s => s.id === currentFromVal)) {
        fromSelect.value = currentFromVal;
      }
      if (currentToVal && stationList.some(s => s.id === currentToVal)) {
        toSelect.value = currentToVal;
      }
    }

    refreshShinkansenSelectorDistance();
  }

  // 選択中新幹線区間の営業キロ・路線名をリアルタイム再計算
  function refreshShinkansenSelectorDistance() {
    const fromSelect = document.getElementById('shinkansen-from-select');
    const toSelect = document.getElementById('shinkansen-to-select');
    const distEl = document.getElementById('shinkansen-select-dist');
    const lineEl = document.getElementById('shinkansen-select-line');
    const addBtn = document.getElementById('btn-add-shinkansen-select');
    if (!fromSelect || !toSelect || !distEl || !lineEl || !addBtn) return;

    if (fromSelect.disabled || toSelect.disabled) {
      addBtn.disabled = true;
      return;
    }

    const fromId = fromSelect.value;
    const toId = toSelect.value;

    if (!fromId || !toId || fromId === toId) {
      distEl.textContent = '0.0km';
      distEl.style.background = '#f1f5f9';
      distEl.style.borderColor = '#cbd5e1';
      distEl.style.color = '#64748b';
      lineEl.textContent = fromId === toId ? '(同一駅)' : '';
      addBtn.disabled = true;
      return;
    }

    const distInfo = calcShinkansenDistance(fromId, toId);
    if (distInfo && distInfo.km > 0) {
      distEl.textContent = `${distInfo.km}km`;
      distEl.style.background = '#e0f2fe';
      distEl.style.borderColor = '#bae6fd';
      distEl.style.color = '#0284c7';
      lineEl.textContent = distInfo.line || '新幹線';
      addBtn.disabled = false;
    } else {
      distEl.textContent = '-(km)';
      distEl.style.background = '#fef2f2';
      distEl.style.borderColor = '#fecaca';
      distEl.style.color = '#ef4444';
      lineEl.textContent = '(直通・接続新幹線なし)';
      addBtn.disabled = true;
    }
  }

  // 互換性ブリッジ (他所からの updateShinkansenCandidateChips 呼び出しを新セレクタへ接続)
  function updateShinkansenCandidateChips() {
    updateShinkansenSelectors();
  }

  function renderShinkansenSegmentsList() {
    const listEl = document.getElementById('shinkansen-segments-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    const segs = ROUTE_STATE.shinkansenSegments || [];
    if (segs.length === 0) {
      listEl.style.display = 'none';
      return;
    }
    listEl.style.display = 'flex';
    segs.forEach((seg, idx) => {
      const tag = document.createElement('span');
      tag.className = 'shinkansen-seg-tag';
      tag.innerHTML = `
        <span>🚄 ${seg.fromName} → ${seg.toName}</span>
        <button type="button" class="btn-swap-seg" aria-label="向き反転" title="乗車駅と降車駅の向きを反転">⇄</button>
        <button type="button" class="btn-del-seg" aria-label="削除" title="削除">✕</button>
      `;
      tag.querySelector('.btn-swap-seg').addEventListener('click', (e) => {
        e.stopPropagation();
        swapShinkansenSegment(idx);
      });
      tag.querySelector('.btn-del-seg').addEventListener('click', (e) => {
        e.stopPropagation();
        removeShinkansenSegment(idx);
      });
      listEl.appendChild(tag);
    });
  }

  function initRouteEngineUI() {
    if (!window.JR_ROUTE_ENGINE) {
      console.warn('JR_ROUTE_ENGINE is not loaded.');
      return;
    }

    // グラフ構築 (STATIONS と LINES から)
    ROUTE_ENGINE_GRAPH = window.JR_ROUTE_ENGINE.buildGraph(STATIONS, LINES);

    // ヘッダーのトグルボタン
    const toggleBtn = document.getElementById('btn-toggle-route');
    const closeBtn = document.getElementById('btn-close-route');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        toggleRoutePanel();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        const panel = document.getElementById('route-panel');
        if (panel && panel.classList.contains('is-editing') && panel.classList.contains('has-result')) {
          panel.classList.remove('is-editing');
          return;
        }
        toggleRoutePanel(false);
      });
    }

    // 発駅入力サジェスト
    const deptInput = document.getElementById('route-dept-input');
    const deptSuggest = document.getElementById('route-dept-suggest');
    if (deptInput) attachStationGhostOverlay(deptInput);
    setupStationSuggest(deptInput, deptSuggest, (st) => {
      setStationInputValue(deptInput, st);
      updateShinkansenCandidateChips();
      markInputChanged();
    });

    // 着駅入力サジェスト (同名駅は発駅からの直線距離を優先)
    const destInput = document.getElementById('route-dest-input');
    const destSuggest = document.getElementById('route-dest-suggest');
    if (destInput) attachStationGhostOverlay(destInput);
    setupStationSuggest(destInput, destSuggest, (st) => {
      setStationInputValue(destInput, st);
      updateShinkansenCandidateChips();
      markInputChanged();
    }, () => getDeptStation());

    // 発着駅入れ替えボタン (⇅)
    const swapStationsBtn = document.getElementById('btn-swap-stations');
    if (swapStationsBtn && deptInput && destInput) {
      swapStationsBtn.addEventListener('click', () => {
        swapStationInputs(deptInput, destInput);
        markInputChanged();
        updateShinkansenCandidateChips();
      });
    }

    // 各入力フィールドのクリアボタン (✕)
    document.querySelectorAll('.btn-input-clear').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const targetInput = document.getElementById(targetId);
        if (targetInput) {
          clearStationInputValue(targetInput);
          targetInput.focus();
          updateShinkansenCandidateChips();
          markInputChanged();
        }
      });
    });

    // 経由駅追加ボタン (＋ 経由駅追加: クリックまたは Enter/Space で追加し即フォーカス)
    const addViaBtn = document.getElementById('btn-add-via-field');
    if (addViaBtn) {
      const handleAddVia = (e) => {
        if (e && e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
        if (e) e.preventDefault();
        const newRow = addViaStationRow();
        markInputChanged();
        if (newRow) {
          const inp = newRow.querySelector('.route-via-input');
          if (inp) inp.focus();
        }
      };
      addViaBtn.addEventListener('click', handleAddVia);
      addViaBtn.addEventListener('keydown', handleAddVia);
    }

    // 探索モード切り替えボタン (最短経路 / 重複区間なし)
    // ※クリック時は即時計算せず、モード切り替えのみ行う
    const modeBtns = document.querySelectorAll('.route-mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-mode') || 'shortest';
        ROUTE_STATE.searchMode = mode;
        markInputChanged();
      });
    });

    // 新幹線利用チェックボックス
    const shinkansenChk = document.getElementById('chk-use-shinkansen');
    if (shinkansenChk) {
      shinkansenChk.addEventListener('change', (e) => {
        ROUTE_STATE.useShinkansen = e.target.checked;
        markInputChanged();
      });
    }

    // 特定区間新幹線指定パネルのトグル
    const toggleShinkansenSegsBtn = document.getElementById('btn-toggle-shinkansen-segments');
    const shinkansenSegsPanel = document.getElementById('shinkansen-segments-panel');
    if (toggleShinkansenSegsBtn && shinkansenSegsPanel) {
      toggleShinkansenSegsBtn.addEventListener('click', () => {
        const isOpen = shinkansenSegsPanel.style.display !== 'none';
        shinkansenSegsPanel.style.display = isOpen ? 'none' : 'flex';
        toggleShinkansenSegsBtn.textContent = isOpen ? '特定区間新幹線指定 ▼' : '特定区間新幹線指定 ▲';
      });
    }

    // 新幹線区間の乗車駅・降車駅サジェスト
    const shFromInput = document.getElementById('shinkansen-from-input');
    const shFromSuggest = document.getElementById('shinkansen-from-suggest');
    const shToInput = document.getElementById('shinkansen-to-input');
    const shToSuggest = document.getElementById('shinkansen-to-suggest');
    if (shFromInput) attachStationGhostOverlay(shFromInput);
    if (shToInput) attachStationGhostOverlay(shToInput);
    if (shFromInput && shFromSuggest) {
      setupStationSuggest(shFromInput, shFromSuggest, (st) => {
        setStationInputValue(shFromInput, st);
        markInputChanged();
      }, () => getDeptStation());
    }
    if (shToInput && shToSuggest) {
      setupStationSuggest(shToInput, shToSuggest, (st) => {
        setStationInputValue(shToInput, st);
        markInputChanged();
      }, () => getDeptStation());
    }

    // 新幹線区間の乗車駅・降車駅入れ替えボタン (⇄)
    const swapShInputsBtn = document.getElementById('btn-swap-shinkansen-inputs');
    if (swapShInputsBtn && shFromInput && shToInput) {
      swapShInputsBtn.addEventListener('click', () => {
        swapStationInputs(shFromInput, shToInput);
        markInputChanged();
        shFromInput.focus();
      });
    }

    // 新幹線区間セレクタ連動
    const shFromSelect = document.getElementById('shinkansen-from-select');
    const shToSelect = document.getElementById('shinkansen-to-select');
    const swapShSelectBtn = document.getElementById('btn-swap-shinkansen-select');
    const addShSelectBtn = document.getElementById('btn-add-shinkansen-select');

    if (shFromSelect) {
      shFromSelect.addEventListener('change', () => {
        refreshShinkansenSelectorDistance();
      });
    }
    if (shToSelect) {
      shToSelect.addEventListener('change', () => {
        refreshShinkansenSelectorDistance();
      });
    }
    if (swapShSelectBtn) {
      swapShSelectBtn.addEventListener('click', () => {
        if (!shFromSelect || !shToSelect) return;
        const temp = shFromSelect.value;
        shFromSelect.value = shToSelect.value;
        shToSelect.value = temp;
        refreshShinkansenSelectorDistance();
      });
    }
    if (addShSelectBtn) {
      addShSelectBtn.addEventListener('click', () => {
        if (!shFromSelect || !shToSelect) return;
        const fromSt = STATIONS[shFromSelect.value];
        const toSt = STATIONS[shToSelect.value];
        if (!fromSt || !toSt) {
          showRouteError('乗車駅と降車駅を選択してください。');
          return;
        }
        if (fromSt.id === toSt.id) {
          showRouteError('乗車駅と降車駅は別の駅を指定してください。');
          return;
        }
        addShinkansenSegment(fromSt, toSt);
      });
    }

    // 新幹線区間手動追加ボタン
    const addShSegBtn = document.getElementById('btn-add-shinkansen-seg');
    if (addShSegBtn) {
      addShSegBtn.addEventListener('click', () => {
        const deptSt = getDeptStation();
        const fromSt = resolveStation(shFromInput, deptSt);
        const toSt = resolveStation(shToInput, deptSt);
        if (!fromSt || !toSt) {
          showRouteError('新幹線の乗車駅と降車駅を両方入力してください。');
          return;
        }
        if (fromSt.id === toSt.id) {
          showRouteError('新幹線の乗車駅と降車駅は別の駅を指定してください。');
          return;
        }
        addShinkansenSegment(fromSt, toSt);
        clearStationInputValue(shFromInput);
        clearStationInputValue(shToInput);
        markInputChanged();
      });
    }

    // 経路探索ボタン
    const searchBtn = document.getElementById('btn-search-route');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        executeRouteSearch();
      });
    }

    // クリアボタン
    const clearBtn = document.getElementById('btn-clear-route');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        clearRouteEngineUI();
      });
    }

    // 運賃種別切り替えボタン (大人 / 小児 / 学割)
    const fareBtns = document.querySelectorAll('.fare-type-btn');
    fareBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        fareBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        ROUTE_STATE.currentFareType = btn.getAttribute('data-type') || 'adult';
        if (ROUTE_STATE.lastResult) {
          renderMarsTicket(ROUTE_STATE.lastResult);
        }
      });
    });

    // 乗車日日付入力
    const dateInput = document.getElementById('ticket-date-input');
    if (dateInput) {
      dateInput.value = ROUTE_STATE.ticketDate;
      dateInput.addEventListener('change', (e) => {
        ROUTE_STATE.ticketDate = e.target.value || getLocalISODate();
        if (ROUTE_STATE.lastResult) {
          renderMarsTicket(ROUTE_STATE.lastResult);
        }
      });
    }


    // 券面テキストコピーボタン
    const copyBtn = document.getElementById('btn-copy-ticket');
    const copyToast = document.getElementById('copy-toast');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        if (!ROUTE_STATE.lastResult) return;
        const text = buildTicketCopyText(ROUTE_STATE.lastResult);
        const triggerToast = () => {
          if (copyToast) {
            copyToast.style.display = 'inline-block';
            copyToast.classList.add('show');
            setTimeout(() => {
              copyToast.classList.remove('show');
              setTimeout(() => { copyToast.style.display = 'none'; }, 300);
            }, 1800);
          }
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            triggerToast();
          }).catch(() => {
            copyFallback(text, copyBtn);
            triggerToast();
          });
        } else {
          copyFallback(text, copyBtn);
          triggerToast();
        }
      });
    }

    // 駅詳細シート内のアクションボタン (発駅設定 / 経由追加 / 着駅設定)
    const setDeptBtn = document.getElementById('btn-set-dept');
    if (setDeptBtn) {
      setDeptBtn.addEventListener('click', () => {
        if (!STATE.selectedStationId) return;
        const st = STATIONS[STATE.selectedStationId];
        if (!st) return;
        setStationInputValue(deptInput, st);
        markInputChanged();
        toggleRoutePanel(true);
      });
    }

    const addViaActionBtn = document.getElementById('btn-add-via');
    if (addViaActionBtn) {
      addViaActionBtn.addEventListener('click', () => {
        if (!STATE.selectedStationId) return;
        const st = STATIONS[STATE.selectedStationId];
        if (!st) return;
        addViaStationRow(st);
        markInputChanged();
        toggleRoutePanel(true);
      });
    }

    const setDestBtn = document.getElementById('btn-set-dest');
    if (setDestBtn) {
      setDestBtn.addEventListener('click', () => {
        if (!STATE.selectedStationId) return;
        const st = STATIONS[STATE.selectedStationId];
        if (!st) return;
        setStationInputValue(destInput, st);
        markInputChanged();
        toggleRoutePanel(true);
      });
    }
  }

  function copyFallback(text, copyBtn) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = 'コピー済';
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 1500);
    } catch (e) {
      console.warn('Copy failed', e);
    }
    document.body.removeChild(ta);
  }

  // マルス普通乗車券テキストコピー用のテキストを構築
  function buildTicketCopyText(result) {
    if (!result) return '';
    const fr = result.fareRules || {};
    const fareType = ROUTE_STATE.currentFareType || 'adult';
    let fareTypeName = '大人';
    let displayFare = fr.adultFare || fr.baseFare || 0;
    const isStudentEligible = fr.isStudentEligible !== undefined ? fr.isStudentEligible : ((fr.fareBasisKm || result.totalKm) > 100.0);
    if (fareType === 'child') {
      fareTypeName = '小児';
      displayFare = fr.childFare !== undefined ? fr.childFare : Math.floor(displayFare / 2 / 10) * 10;
    } else if (fareType === 'student') {
      fareTypeName = '学割';
      displayFare = (isStudentEligible && fr.studentFare !== undefined) ? fr.studentFare : (fr.adultFare || fr.baseFare || 0);
    }

    const deptMars = getStationMarsName(result.deptId || result.deptName);
    const destMars = getStationMarsName(result.destId || result.destName);
    const deptPrint = fr.deptZoneApplied ? fr.displayDeptName : deptMars;
    const destPrint = fr.destZoneApplied ? fr.displayDestName : destMars;
    const deptUi = getStationUiName(result.deptId || result.deptName);
    const destUi = getStationUiName(result.destId || result.destName);
    const hasDeptSub = fr.deptZoneApplied && deptPrint !== deptUi;
    const hasDestSub = fr.destZoneApplied && destPrint !== destUi;
    const subRouteStr = (hasDeptSub || hasDestSub) ? `（実乗車：${deptUi} → ${destUi}）\n` : '';

    const act = (result.actualKm !== undefined ? result.actualKm : result.totalKm);
    const effectiveKm = (result.totalKm !== undefined ? result.totalKm : act);
    const actualKmStr = (act > effectiveKm) ? `${effectiveKm.toFixed(1)} km (実乗 ${act.toFixed(1)} km)` : `${act.toFixed(1)} km`;
    const fareKm = (fr.fareKm !== undefined ? fr.fareKm : result.totalKm).toFixed(1);
    const marsCount = fr.marsRouteCount || (result.sections ? result.sections.length : 1);
    const isMars = fr.isMarsIssuable !== false && marsCount <= 16;

    let validityStr = '';
    const dateStr = ROUTE_STATE.ticketDate || getLocalISODate();
    const [y, m, d] = dateStr.split('-').map(Number);
    const validDays = fr.validityDays || 1;
    if (fr.isSuburbanOnly || validDays === 1) {
      validityStr = '発売当日限り有効';
    } else {
      const sDate = new Date(y, m - 1, d);
      const eDate = new Date(sDate);
      eDate.setDate(sDate.getDate() + validDays - 1);
      validityStr = `${m}月${d}日から ${validDays}日間有効 (${eDate.getMonth() + 1}月${eDate.getDate()}日まで有効)`;
    }
    const stopoverStr = fr.stopoverAllowed ? '途中下車可能' : '下車前途無効';

    return [
      '======================================',
      'JR普通乗車券（片道）',
      '--------------------------------------',
      `区間：${deptPrint} → ${destPrint}`,
      subRouteStr ? subRouteStr.trim() : null,
      `経由：${result.marsString || '(直通)'}`,
      `営業キロ：${actualKmStr}（運賃計算キロ：${fareKm} km）`,
      `有効期間：${validityStr}（${stopoverStr}）`,
      `運賃：￥${displayFare.toLocaleString()}（${fareTypeName}）`,
      `経路数：${marsCount} / 16経路（${isMars ? 'マルス発券可' : '出札補充券'}）`,
      '======================================'
    ].filter(Boolean).join('\n');
  }

  // 本格マルス券面 & 内訳カードの描画
  function renderMarsTicket(result) {
    if (!result) return;
    const fr = result.fareRules || {};
    const fareType = ROUTE_STATE.currentFareType || 'adult';

    // 1. 券タイトル
    const typeLabel = document.getElementById('ticket-type-label');
    if (typeLabel) {
      if (fr && !fr.isAvailable) {
        typeLabel.textContent = '普通乗車券 (発売不可)';
      } else if (result.isLoopRoute) {
        typeLabel.textContent = '乗　車　券 (一周片道)';
      } else {
        typeLabel.textContent = '乗　車　券';
      }
    }

    // 2. 発着駅表示（特定都区市内・山手線内ゾーン名優先、それ以外はマルス正式略号）
    const deptNameEl = document.getElementById('ticket-dept-name');
    const deptSubEl = document.getElementById('ticket-dept-sub');
    const destNameEl = document.getElementById('ticket-dest-name');
    const destSubEl = document.getElementById('ticket-dest-sub');

    const displayDept = fr.deptZoneApplied ? fr.displayDeptName : getStationMarsName(result.deptId || result.deptName);
    const displayDest = fr.destZoneApplied ? fr.displayDestName : getStationMarsName(result.destId || result.destName);

    if (deptNameEl) deptNameEl.textContent = displayDept;
    if (destNameEl) destNameEl.textContent = displayDest;

    const deptUi = getStationUiName(result.deptId || result.deptName);
    const destUi = getStationUiName(result.destId || result.destName);

    if (deptSubEl) {
      if (fr.deptZoneApplied && displayDept !== deptUi) {
        deptSubEl.textContent = `実乗車: ${deptUi}`;
        deptSubEl.style.display = 'block';
      } else {
        deptSubEl.textContent = '';
        deptSubEl.style.display = 'none';
      }
    }

    if (destSubEl) {
      if (fr.destZoneApplied && displayDest !== destUi) {
        destSubEl.textContent = `実乗車: ${destUi}`;
        destSubEl.style.display = 'block';
      } else {
        destSubEl.textContent = '';
        destSubEl.style.display = 'none';
      }
    }

    // 4. 経由印字
    const viaTextEl = document.getElementById('ticket-via-text');
    if (viaTextEl) {
      viaTextEl.textContent = result.marsString || '(直通)';
    }

    // 5. 運賃計算とバッジ表示（大人・小児・学割）
    const adultFare = fr.adultFare || fr.baseFare || 0;
    const childFare = fr.childFare !== undefined ? fr.childFare : Math.floor(adultFare / 2 / 10) * 10;
    const isStudentEligible = fr.isStudentEligible !== undefined ? fr.isStudentEligible : ((fr.fareBasisKm || result.totalKm) > 100.0);
    const studentFare = isStudentEligible ? (fr.studentFare !== undefined ? fr.studentFare : Math.floor(adultFare * 0.8 / 10) * 10) : adultFare;

    let displayFare = adultFare;
    if (fareType === 'child') displayFare = childFare;
    else if (fareType === 'student') displayFare = studentFare;

    const baseFareEl = document.getElementById('ticket-base-fare');
    if (baseFareEl) {
      if (fr && !fr.isAvailable) {
        baseFareEl.textContent = '0 (発売不可)';
      } else {
        baseFareEl.textContent = displayFare.toLocaleString();
      }
    }

    const childBadge = document.getElementById('ticket-child-badge');
    if (childBadge) {
      childBadge.style.display = (fareType === 'child') ? 'inline-flex' : 'none';
    }

    const studentBadge = document.getElementById('ticket-student-badge');
    if (studentBadge) {
      studentBadge.style.display = (fareType === 'student') ? 'inline-block' : 'none';
    }

    const studentNote = document.getElementById('ticket-student-note');
    if (studentNote) {
      if (fareType === 'student') {
        studentNote.style.display = 'block';
        if (!isStudentEligible) {
          studentNote.textContent = '※100km以下のため学割対象外（大人運賃適用）';
          studentNote.style.color = '#b91c1c';
        } else {
          studentNote.textContent = '※学生割引（大人運賃の2割引・10円未満切捨）';
          studentNote.style.color = '#047857';
        }
      } else {
        studentNote.style.display = 'none';
      }
    }

    // 6. 有効期間・途中下車印字 (マルス券面仕様: 途中下車可能時は無印字、不可時のみ「下車前途無効」)
    const dateStr = ROUTE_STATE.ticketDate || getLocalISODate();
    const [y, m, d] = dateStr.split('-').map(Number);
    const validDays = fr.validityDays || 1;
    const validityTextEl = document.getElementById('ticket-validity-text');
    if (validityTextEl) {
      if (fr.isSuburbanOnly || validDays === 1) {
        validityTextEl.textContent = '発売当日限り有効';
      } else {
        validityTextEl.textContent = `${m}月${d}日から ${validDays}日間有効`;
      }
    }

    const stopoverTextEl = document.getElementById('ticket-stopover-text');
    if (stopoverTextEl) {
      if (fr.stopoverAllowed) {
        stopoverTextEl.textContent = '';
        stopoverTextEl.style.display = 'none';
      } else {
        stopoverTextEl.textContent = '下車前途無効';
        stopoverTextEl.style.display = 'block';
      }
    }

    // 7. 券サイズ（85mm / 120mm / 出札補充券）自動判定
    const marsCount = fr.marsRouteCount || (result.sections ? result.sections.length : 1);
    const marsStrLen = (result.marsString || '').length;
    const isMarsIssuable = fr.isMarsIssuable !== false && marsCount <= 16;
    const is120mm = (marsCount >= 7 || marsStrLen >= 28 || !isMarsIssuable);

    const ticketCard = document.getElementById('mars-ticket-card');
    if (ticketCard) {
      if (is120mm) ticketCard.classList.add('is-120mm');
      else ticketCard.classList.remove('is-120mm');

      if (!isMarsIssuable) ticketCard.classList.add('is-hojyu');
      else ticketCard.classList.remove('is-hojyu');
    }

    // きっぷ詳細カード側: サイズ・自動改札可否バッジ
    const gateBadge = document.getElementById('ticket-gate-badge');
    if (gateBadge) {
      if (!fr.isAvailable) {
        gateBadge.textContent = '発売不可 / 自動改札不可';
        gateBadge.className = 'ticket-gate-badge gate-unavailable';
      } else if (!is120mm && isMarsIssuable) {
        gateBadge.textContent = '85mm券 / 自動改札可';
        gateBadge.className = 'ticket-gate-badge gate-auto';
      } else if (isMarsIssuable) {
        gateBadge.textContent = '120mm券 / 有人改札';
        gateBadge.className = 'ticket-gate-badge gate-manual';
      } else {
        gateBadge.textContent = '出札補充券 / 有人改札';
        gateBadge.className = 'ticket-gate-badge gate-manual';
      }
    }

    // 8. 券面フッター (発売日のみ)
    const issueDateEl = document.getElementById('ticket-issue-date');
    if (issueDateEl) {
      const mStr = m < 10 ? `-${m}` : `${m}`;
      const dStr = d < 10 ? `-${d}` : `${d}`;
      issueDateEl.textContent = `${y}.${mStr}.${dStr}`;
    }

    const validityBadge = document.getElementById('route-validity-badge');
    if (validityBadge) {
      if (result.isOneWayTrip) {
        validityBadge.textContent = result.isLoopRoute ? '一周一筆書き成立' : '一筆書き成立';
        validityBadge.className = 'ticket-status-badge';
        validityBadge.style.cursor = 'default';
        validityBadge.onclick = null;
        validityBadge.title = '重複のない片道一筆書き経路です';
      } else {
        validityBadge.textContent = '※重複区間あり (クリックで移動)';
        validityBadge.className = 'ticket-status-badge badge-overlap';
        validityBadge.style.cursor = 'pointer';
        validityBadge.title = 'クリックすると地図上の重複区間へズームします';
        validityBadge.onclick = () => {
          focusDuplicateSections(result);
        };
      }
    }

    // 9. きっぷ詳細・内訳カード
    const marsCountBadge = document.getElementById('ticket-mars-count-badge');
    if (marsCountBadge) {
      if (marsCount <= 12) {
        marsCountBadge.textContent = `${marsCount} / 16 経路`;
        marsCountBadge.className = 'mars-count-pill';
      } else if (marsCount <= 16) {
        marsCountBadge.textContent = `${marsCount} / 16 経路`;
        marsCountBadge.className = 'mars-count-pill pill-warning';
      } else {
        marsCountBadge.textContent = `${marsCount} / 16 経路 (補充券)`;
        marsCountBadge.className = 'mars-count-pill pill-danger';
      }
    }

    const actualKmEl = document.getElementById('spec-actual-km');
    if (actualKmEl) {
      const act = result.actualKm !== undefined ? result.actualKm : result.totalKm;
      const effectiveKm = result.totalKm !== undefined ? result.totalKm : act;
      if (act > effectiveKm) {
        actualKmEl.textContent = `${effectiveKm.toFixed(1)} km (実乗 ${act.toFixed(1)} km)`;
      } else {
        actualKmEl.textContent = `${act.toFixed(1)} km`;
      }
    }

    const fareKm = fr.fareKm !== undefined ? fr.fareKm : result.totalKm;
    const fareKmEl = document.getElementById('spec-fare-km');
    if (fareKmEl) {
      fareKmEl.textContent = `${fareKm.toFixed(1)} km`;
    }

    // 路線区分（幹線 / 地方交通線）
    const linesBreakdownItem = document.getElementById('spec-lines-breakdown-item');
    const linesBreakdownEl = document.getElementById('spec-lines-breakdown');
    if (linesBreakdownItem && linesBreakdownEl) {
      linesBreakdownItem.style.display = 'flex';
      if (fr.localKm && fr.localKm > 0) {
        linesBreakdownEl.textContent = `幹線 ${(fr.trunkKm || 0).toFixed(1)}km / 地方 ${fr.localKm.toFixed(1)}km`;
      } else {
        linesBreakdownEl.textContent = '幹線のみ';
      }
    }

    // 会社別キロ
    const compKmEl = document.getElementById('spec-company-km');
    if (compKmEl) {
      const compParts = [];
      if (fr.eastKm > 0) compParts.push(`東: ${fr.eastKm.toFixed(1)}km`);
      if (fr.centralKm > 0) compParts.push(`海: ${fr.centralKm.toFixed(1)}km`);
      if (fr.westKm > 0) compParts.push(`西: ${fr.westKm.toFixed(1)}km`);
      if (fr.hokkaidoKm > 0) compParts.push(`北: ${fr.hokkaidoKm.toFixed(1)}km`);
      if (fr.shikokuKm > 0) compParts.push(`四: ${fr.shikokuKm.toFixed(1)}km`);
      if (fr.kyushuKm > 0) compParts.push(`九: ${fr.kyushuKm.toFixed(1)}km`);
      compKmEl.textContent = compParts.length > 0 ? compParts.join(' / ') : '-';
    }

    // 適用特例タグ群 (.rule-tag + tag-primary / tag-success / tag-accent)
    const ruleTagsContainer = document.getElementById('rule-tags-container');
    if (ruleTagsContainer) {
      ruleTagsContainer.innerHTML = '';
      const tags = [];
      if (fr.isSuburbanOnly) {
        tags.push({ text: '大都市近郊区間完結（下車前途無効・当日限り）', cls: 'tag-accent' });
      }
      if (fr.article69Applied) {
        tags.push({ text: '旅規第69条（特定区間通過）運賃短縮適用', cls: 'tag-primary' });
      }
      if (fr.article70Applied) {
        tags.push({ text: '旅規第70条（東京付近特定区間）最短キロ計算', cls: 'tag-primary' });
      }
      if (fr.deptZoneApplied || fr.destZoneApplied) {
        tags.push({ text: '特定都区市内・山手線内特例適用', cls: 'tag-success' });
      }
      if (fr.hasBranchShortening) {
        tags.push({ text: '特定分岐区間（区間外乗車）適用', cls: 'tag-primary' });
      }
      if (fr.localKm > 0 && (!fr.trunkKm || fr.trunkKm === 0)) {
        tags.push({ text: '地方交通線単独運賃', cls: 'tag-accent' });
      } else if (fr.localKm > 0 && fr.trunkKm > 0) {
        tags.push({ text: '地方交通線換算キロ適用', cls: 'tag-accent' });
      }
      if (fr.isInterCompany) {
        tags.push({ text: 'JR複数社跨ぎ', cls: 'tag-success' });
      }

      tags.forEach(t => {
        const span = document.createElement('span');
        span.className = `rule-tag ${t.cls}`;
        span.textContent = t.text;
        ruleTagsContainer.appendChild(span);
      });
    }

    // 概算距離警告
    const kiloWarnElem = document.getElementById('ticket-kilo-warning');
    if (kiloWarnElem) {
      if (result.hasEstimatedDistance && result.unregisteredLines && result.unregisteredLines.length > 0) {
        const lineNamesStr = result.unregisteredLines.join('、');
        kiloWarnElem.textContent = `※概算距離を含む（未登録路線: ${lineNamesStr}）`;
        kiloWarnElem.style.display = 'inline-block';
      } else {
        kiloWarnElem.textContent = '';
        kiloWarnElem.style.display = 'none';
      }
    }
  }

  function toggleRoutePanel(forceOpen) {
    const panel = document.getElementById('route-panel');
    const toggleBtn = document.getElementById('btn-toggle-route');
    if (!panel) return;

    if (forceOpen === undefined) {
      ROUTE_STATE.isOpen = !ROUTE_STATE.isOpen;
    } else {
      ROUTE_STATE.isOpen = !!forceOpen;
    }

    if (ROUTE_STATE.isOpen) {
      panel.style.display = 'flex';
      if (toggleBtn) toggleBtn.classList.add('active');

      // 新幹線候補チップを最新の入力/探索ルートに合わせて更新
      updateShinkansenCandidateChips();

      // ★UI改善: メニューを開いたら直ちに文字打ちできるよう、発駅（または未入力の着駅）に自動フォーカス
      setTimeout(() => {
        const deptInput = document.getElementById('route-dept-input');
        const destInput = document.getElementById('route-dest-input');
        if (deptInput && !deptInput.value.trim()) {
          deptInput.focus();
        } else if (destInput && !destInput.value.trim()) {
          destInput.focus();
        } else if (deptInput) {
          deptInput.focus();
          deptInput.select();
        }
      }, 50);
    } else {
      panel.style.display = 'none';
      if (toggleBtn) toggleBtn.classList.remove('active');
    }
  }

  function getDeptStation() {
    const deptInput = document.getElementById('route-dept-input');
    if (!deptInput) return null;
    const directId = deptInput.getAttribute('data-id');
    if (directId && STATIONS[directId]) {
      return STATIONS[directId];
    }
    const val = deptInput.value.trim();
    if (!val) return null;
    const matches = searchStations(val, 1);
    return matches.length > 0 ? matches[0] : null;
  }

  function setupStationSuggest(inputEl, dropdownEl, onSelectCallback, getRefStationCallback = null) {
    if (!inputEl || !dropdownEl) return;

    let selectedIndex = -1;
    let currentMatches = [];

    function updateHighlight() {
      const items = dropdownEl.querySelectorAll('.suggest-item');
      items.forEach((item, idx) => {
        if (idx === selectedIndex) {
          item.classList.add('selected');
          item.scrollIntoView({ block: 'nearest' });
        } else {
          item.classList.remove('selected');
        }
      });
    }

    inputEl.addEventListener('input', () => {
      inputEl.removeAttribute('data-id');
      const q = inputEl.value.trim().toLowerCase();
      selectedIndex = -1;
      currentMatches = [];

      if (!q) {
        dropdownEl.style.display = 'none';
        return;
      }

      const refSt = getRefStationCallback ? getRefStationCallback() : null;
      currentMatches = searchStations(q, 8, refSt);

      if (currentMatches.length === 0) {
        dropdownEl.innerHTML = '<div style="padding:8px 12px;color:#94a3b8;font-size:12px;">該当駅なし</div>';
        dropdownEl.style.display = 'block';
        return;
      }

      dropdownEl.innerHTML = '';
      currentMatches.forEach((st, idx) => {
        const item = document.createElement('div');
        item.className = 'suggest-item' + (idx === 0 ? ' selected' : '');
        item.innerHTML = `
          <span class="suggest-st-name">${getStationUiName(st)}</span>
          <span class="suggest-st-meta">${st.pref}・${st.kana}</span>
        `;
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectCallback(st);
          dropdownEl.style.display = 'none';
        });
        dropdownEl.appendChild(item);
      });

      selectedIndex = 0; // 先頭候補をデフォルトで選択状態に
      dropdownEl.style.display = 'block';
      markInputChanged();
    });

    inputEl.addEventListener('keydown', (e) => {
      if (e.isComposing || e.keyCode === 229) return;
      const isDropdownOpen = dropdownEl.style.display !== 'none' && currentMatches.length > 0;

      if (e.key === 'ArrowDown') {
        if (isDropdownOpen) {
          e.preventDefault();
          selectedIndex = (selectedIndex + 1) % currentMatches.length;
          updateHighlight();
        }
      } else if (e.key === 'ArrowUp') {
        if (isDropdownOpen) {
          e.preventDefault();
          selectedIndex = (selectedIndex - 1 + currentMatches.length) % currentMatches.length;
          updateHighlight();
        }
      } else if (e.key === 'Enter') {
        if (isDropdownOpen && selectedIndex >= 0 && selectedIndex < currentMatches.length) {
          e.preventDefault();
          const targetSt = currentMatches[selectedIndex];
          onSelectCallback(targetSt);
          dropdownEl.style.display = 'none';
        } else {
          // ドロップダウン非表示時の Enter: 入力テキストがあれば先頭一致候補を確定
          const val = inputEl.value.trim();
          if (val) {
            const refSt = getRefStationCallback ? getRefStationCallback() : null;
            const matched = findStationByName(val, refSt);
            if (matched) {
              onSelectCallback(matched);
            }
          }
          dropdownEl.style.display = 'none';
          e.preventDefault();

          const deptInput = document.getElementById('route-dept-input');
          const destInput = document.getElementById('route-dest-input');
          const viaInputs = Array.from(document.querySelectorAll('.route-via-input'));

          const hasDept = deptInput && (deptInput.getAttribute('data-id') || deptInput.value.trim());
          const hasDest = destInput && (destInput.getAttribute('data-id') || destInput.value.trim());

          // 発駅と着駅の両方が入力済みであれば、即座に経路探索を実行
          if (hasDept && hasDest) {
            executeRouteSearch();
          } else if (!hasDept && deptInput) {
            deptInput.focus();
          } else if (!hasDest && destInput) {
            destInput.focus();
          } else if (inputEl === deptInput) {
            if (viaInputs.length > 0) {
              viaInputs[0].focus();
            } else if (destInput) {
              destInput.focus();
            }
          } else if (inputEl.classList.contains('route-via-input')) {
            const currentIdx = viaInputs.indexOf(inputEl);
            if (currentIdx >= 0 && currentIdx < viaInputs.length - 1) {
              viaInputs[currentIdx + 1].focus();
            } else if (destInput) {
              destInput.focus();
            }
          }
        }
      } else if (e.key === 'Tab') {
        if (isDropdownOpen && selectedIndex >= 0 && selectedIndex < currentMatches.length) {
          const targetSt = currentMatches[selectedIndex];
          onSelectCallback(targetSt);
          dropdownEl.style.display = 'none';
          // Tabのデフォルト挙動により次の入力欄へ自然にフォーカス移動する
        }
      } else if (e.key === 'Escape') {
        if (isDropdownOpen) {
          e.preventDefault();
          dropdownEl.style.display = 'none';
        }
      }
    });

    document.addEventListener('click', (e) => {
      if (!inputEl.contains(e.target) && !dropdownEl.contains(e.target)) {
        dropdownEl.style.display = 'none';
      }
    });
  }

  let draggedViaRow = null;

  function updateViaStationNumbers() {
    const container = document.getElementById('route-via-container');
    if (!container) return;
    const rows = container.querySelectorAll('.route-input-row.via-row');
    rows.forEach((row, idx) => {
      const icon = row.querySelector('.via-icon');
      if (icon) {
        icon.textContent = rows.length > 1 ? `経${idx + 1}` : '経';
      }
    });
  }

  function addViaStationRow(initialStation = null) {
    const container = document.getElementById('route-via-container');
    if (!container) return;

    const rowId = 'via-row-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const row = document.createElement('div');
    row.className = 'route-input-row via-row';
    row.id = rowId;

    row.innerHTML = `
      <div class="route-drag-handle" title="ドラッグまたは Alt+↑/↓ で並び替え" aria-label="並び替え" draggable="true">⠿</div>
      <span class="route-node-icon via-icon">経</span>
      <div class="route-field-wrapper">
        <input type="text" class="route-station-input route-via-input" placeholder="経由駅名 (例: 熱海)" autocomplete="off">
        <button type="button" class="btn-input-clear" aria-label="消去" tabindex="-1">✕</button>
        <div class="route-suggest-dropdown" style="display:none;"></div>
      </div>
      <button type="button" class="btn-remove-via" title="経由駅削除" aria-label="削除" tabindex="-1">✕</button>
    `;

    const handle = row.querySelector('.route-drag-handle');
    const input = row.querySelector('.route-via-input');
    const dropdown = row.querySelector('.route-suggest-dropdown');
    const clearBtn = row.querySelector('.btn-input-clear');
    const removeBtn = row.querySelector('.btn-remove-via');
    if (input) attachStationGhostOverlay(input);

    clearBtn.addEventListener('click', () => {
      clearStationInputValue(input);
      input.focus();
      markInputChanged();
    });

    removeBtn.addEventListener('click', () => {
      container.removeChild(row);
      updateViaStationNumbers();
      updateShinkansenCandidateChips();
      markInputChanged();
    });

    // キーボード操作: Backspaceで空行削除、Alt+↑/↓で経由駅順序並び替え
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value) {
        e.preventDefault();
        const prevRow = row.previousElementSibling;
        const prevInput = prevRow ? prevRow.querySelector('.route-via-input') : document.getElementById('route-dept-input');
        container.removeChild(row);
        updateViaStationNumbers();
        markInputChanged();
        if (prevInput) {
          prevInput.focus();
        }
      } else if (e.altKey && e.key === 'ArrowUp') {
        // Alt + ArrowUp: 1つ上の経由駅と順序入れ替え
        const prevRow = row.previousElementSibling;
        if (prevRow && prevRow.classList.contains('via-row')) {
          e.preventDefault();
          container.insertBefore(row, prevRow);
          updateViaStationNumbers();
          markInputChanged();
          input.focus();
        }
      } else if (e.altKey && e.key === 'ArrowDown') {
        // Alt + ArrowDown: 1つ下の経由駅と順序入れ替え
        const nextRow = row.nextElementSibling;
        if (nextRow && nextRow.classList.contains('via-row')) {
          e.preventDefault();
          container.insertBefore(nextRow, row);
          updateViaStationNumbers();
          markInputChanged();
          input.focus();
        }
      }
    });

    // ドラッグ＆ドロップ (ドラッグハンドルから開始)
    handle.addEventListener('dragstart', (e) => {
      draggedViaRow = row;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', row.id);
      setTimeout(() => {
        row.classList.add('is-dragging');
      }, 0);
    });

    handle.addEventListener('dragend', () => {
      row.classList.remove('is-dragging');
      container.querySelectorAll('.via-row').forEach(r => {
        r.classList.remove('drag-over-above', 'drag-over-below', 'is-dragging');
      });
      draggedViaRow = null;
    });

    row.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (!draggedViaRow || draggedViaRow === row) return;

      const rect = row.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) {
        row.classList.add('drag-over-above');
        row.classList.remove('drag-over-below');
      } else {
        row.classList.add('drag-over-below');
        row.classList.remove('drag-over-above');
      }
    });

    row.addEventListener('dragleave', () => {
      row.classList.remove('drag-over-above', 'drag-over-below');
    });

    row.addEventListener('drop', (e) => {
      e.preventDefault();
      row.classList.remove('drag-over-above', 'drag-over-below');
      if (!draggedViaRow || draggedViaRow === row) return;

      const rect = row.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) {
        container.insertBefore(draggedViaRow, row);
      } else {
        container.insertBefore(draggedViaRow, row.nextSibling);
      }

      updateViaStationNumbers();
      markInputChanged();
    });

    setupStationSuggest(input, dropdown, (st) => {
      setStationInputValue(input, st);
      updateShinkansenCandidateChips();
      markInputChanged();
    }, () => getDeptStation());

    if (initialStation) {
      setStationInputValue(input, initialStation);
    }

    container.appendChild(row);
    updateViaStationNumbers();

    if (!initialStation) {
      input.focus();
    }
    return row;
  }

  function resolveStation(inputEl, refSt = null) {
    if (!inputEl) return null;
    const directId = inputEl.getAttribute('data-id');
    if (directId && STATIONS[directId]) {
      return STATIONS[directId];
    }
    const val = inputEl.value.trim();
    if (!val) return null;
    return findStationByName(val, refSt);
  }

  function findStationByName(query, refSt = null) {
    if (!query) return null;
    const q = query.trim();

    // 1. 括弧付き表記からの逆引き (例: "郡山（福島）", "郡山(福島)", "郡山（福島県）")
    const parenMatch = q.match(/^(.+?)[（\(](.+?)[）\)]$/);
    if (parenMatch) {
      const namePart = parenMatch[1].trim();
      const prefPart = parenMatch[2].trim().replace(/[都府県]$/, '');
      for (const id in STATIONS) {
        const st = STATIONS[id];
        if (st.name === namePart) {
          const stPrefAbbr = getPrefAbbr(st.pref);
          if (stPrefAbbr === prefPart || st.pref.includes(prefPart) || prefPart.includes(stPrefAbbr)) {
            return st;
          }
        }
      }
    }

    // 2. STATIONSの完全一致（駅名そのもの）
    const exactMatches = Object.values(STATIONS).filter(s => s.name === q);
    if (exactMatches.length === 1) {
      return exactMatches[0];
    } else if (exactMatches.length > 1) {
      if (refSt && refSt.lat != null && refSt.lng != null) {
        exactMatches.sort((a, b) => {
          const dA = Math.hypot(a.lat - refSt.lat, a.lng - refSt.lng);
          const dB = Math.hypot(b.lat - refSt.lat, b.lng - refSt.lng);
          return dA - dB;
        });
      }
      return exactMatches[0];
    }

    // 3. searchStations によるスコア検索
    const matches = searchStations(query, 1, refSt);
    return matches.length > 0 ? matches[0] : null;
  }

  function executeRouteSearch() {
    const errorMsg = document.getElementById('route-error-msg');
    const resultContainer = document.getElementById('route-result-container');
    errorMsg.style.display = 'none';
    resultContainer.style.display = 'none';

    const deptInput = document.getElementById('route-dept-input');
    const destInput = document.getElementById('route-dest-input');
    const deptSt = resolveStation(deptInput);
    const destSt = resolveStation(destInput, deptSt);

    if (!deptSt) {
      showRouteError('発駅を正しく入力してください。');
      deptInput.focus();
      return;
    }
    if (!destSt) {
      showRouteError('着駅を正しく入力してください。');
      destInput.focus();
      return;
    }

    // 経由駅のリストを取得
    const viaInputs = document.querySelectorAll('.route-via-input');
    const viaStIds = [];
    for (let i = 0; i < viaInputs.length; i++) {
      const vInput = viaInputs[i];
      if (!vInput.value.trim()) continue;
      const vSt = resolveStation(vInput, deptSt);
      if (!vSt) {
        showRouteError(`経由駅「${vInput.value}」が見つかりません。`);
        vInput.focus();
        return;
      }
      viaStIds.push(vSt.id);
    }

    // 発駅と着駅が同一の場合 (一周環状ルート等) の検証
    if (deptSt.id === destSt.id && viaStIds.length === 0) {
      showRouteError('発駅と着駅が同じ場合は、経由駅を1つ以上指定してください（例：一周ルート）。');
      return;
    }

    if (!window.JR_ROUTE_ENGINE) {
      showRouteError('経路探索エンジンが読み込まれていません。');
      return;
    }

    // 特定新幹線区間の設定
    const shSegs = ROUTE_STATE.shinkansenSegments || [];

    const options = {
      useShinkansen: ROUTE_STATE.useShinkansen,
      searchMode: ROUTE_STATE.searchMode,
      shinkansenSegments: shSegs,
      forceShinkansenOnlyInSegments: (shSegs.length > 0)
    };

    const result = window.JR_ROUTE_ENGINE.searchMarsRoute(deptSt.id, viaStIds, destSt.id, options);

    if (!result || !result.success) {
      showRouteError((result && result.error) || '指定された区間のルートが見つかりませんでした。経由駅や新幹線利用の設定をご確認ください。');
      return;
    }

    ROUTE_STATE.lastResult = result;

    // 本格マルス券面 & 内訳カードを描画
    renderMarsTicket(result);

    // 区間一覧を描画
    const sectionsList = document.getElementById('route-sections-list');
    sectionsList.innerHTML = '';
    result.sections.forEach((sec) => {
      const item = document.createElement('div');
      const isDup = sec.isDuplicate;
      item.className = 'route-section-item' + (isDup ? ' is-duplicate' : '');
      item.style.cursor = 'pointer';
      item.title = isDup ? 'クリックで重複区間へ移動' : 'クリックでこの区間を表示';

      item.innerHTML = `
        <div class="route-section-bar" style="background:${isDup ? '#dc2626' : (sec.lineColor || '#0284c7')};"></div>
        <div class="route-section-info">
          <div class="route-section-line-name">
            <span>${sec.lineName}</span>
            <span class="mars-pill ${isDup ? 'pill-duplicate' : ''}">${isDup ? '重複' : sec.marsName}</span>
          </div>
          <div class="route-section-stations">${getStationUiName(sec.from || sec.deptName)} → ${getStationUiName(sec.to || sec.destName)} (${sec.stationCount}駅)</div>
        </div>
        <div class="route-section-kilo" style="${isDup ? 'color:#dc2626;font-weight:800;' : ''}">${sec.km.toFixed(1)} km</div>
      `;

      item.addEventListener('click', () => {
        if (isDup && result.duplicatePolylines && result.duplicatePolylines.length > 0) {
          focusDuplicateSections(result);
          return;
        }
        if (sec.stations && sec.stations.length > 0) {
          let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
          sec.stations.forEach(id => {
            const st = STATIONS[id];
            if (st) {
              if (st.lng < minLng) minLng = st.lng;
              if (st.lng > maxLng) maxLng = st.lng;
              if (st.lat < minLat) minLat = st.lat;
              if (st.lat > maxLat) maxLat = st.lat;
            }
          });
          if (minLng !== Infinity && map) {
            map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: getVisibleMapPadding(60), maxZoom: 13, duration: 800 });
          }
        }
      });
      sectionsList.appendChild(item);
    });

    resultContainer.style.display = 'block';

    // スマホ結果表示モード (ボトムシート Half 展開 & サマリーバー更新)
    const routePanel = document.getElementById('route-panel');
    if (routePanel) {
      if (window.innerWidth <= 768) {
        routePanel.classList.add('has-result', 'mobile-sheet-half');
        routePanel.classList.remove('mobile-sheet-full', 'is-editing');
        const summaryText = document.getElementById('route-summary-text');
        if (summaryText) {
          const viaNames = viaStIds.map(id => STATIONS[id] ? getStationUiName(STATIONS[id]) : '').filter(Boolean);
          let text = `${getStationUiName(deptSt)} → `;
          if (viaNames.length > 0) {
            text += `(${viaNames.join('・')}) → `;
          }
          text += getStationUiName(destSt);
          summaryText.textContent = text;
          summaryText.title = text;
        }
      } else {
        routePanel.classList.remove('has-result', 'mobile-sheet-half', 'mobile-sheet-full', 'is-editing');
      }
    }

    // 地図上にハイライト描画
    drawRouteOnMap(result);

    // 探索ルートに基づいて新幹線候補チップを更新
    updateShinkansenCandidateChips();

    // 結果表示後は入力が変更されるまで経路探索ボタンを非活性 (グレーアウト)
    setSearchButtonEnabled(false);
  }

  function showRouteError(msg) {
    const errorEl = document.getElementById('route-error-msg');
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
    }
    setSearchButtonEnabled(true);
  }

  function clearRouteEngineUI() {
    const deptInput = document.getElementById('route-dept-input');
    const destInput = document.getElementById('route-dest-input');
    if (deptInput) clearStationInputValue(deptInput);
    if (destInput) clearStationInputValue(destInput);

    const viaContainer = document.getElementById('route-via-container');
    if (viaContainer) viaContainer.innerHTML = '';

    const errorMsg = document.getElementById('route-error-msg');
    if (errorMsg) errorMsg.style.display = 'none';

    const resultContainer = document.getElementById('route-result-container');
    if (resultContainer) resultContainer.style.display = 'none';

    // 新幹線区間指定と手動入力のリセット
    ROUTE_STATE.useShinkansen = false;
    ROUTE_STATE.searchMode = 'shortest';
    ROUTE_STATE.shinkansenSegments = [];
    ROUTE_STATE.currentFareType = 'adult';
    ROUTE_STATE.lastResult = null;
    pairReversedMap.clear();

    const shinkansenChk = document.getElementById('chk-use-shinkansen');
    if (shinkansenChk) shinkansenChk.checked = false;

    const shPanel = document.getElementById('shinkansen-segments-panel');
    const shToggleBtn = document.getElementById('btn-toggle-shinkansen-segments');
    if (shPanel) shPanel.style.display = 'none';
    if (shToggleBtn) shToggleBtn.textContent = '特定区間新幹線指定 ▼';

    const fareBtns = document.querySelectorAll('.fare-type-btn');
    fareBtns.forEach(b => {
      if (b.getAttribute('data-type') === 'adult') b.classList.add('active');
      else b.classList.remove('active');
    });

    const deptSub = document.getElementById('ticket-dept-sub');
    if (deptSub) { deptSub.textContent = ''; deptSub.style.display = 'none'; }
    const destSub = document.getElementById('ticket-dest-sub');
    if (destSub) { destSub.textContent = ''; destSub.style.display = 'none'; }
    const studentNote = document.getElementById('ticket-student-note');
    if (studentNote) studentNote.style.display = 'none';
    const studentBadge = document.getElementById('ticket-student-badge');
    if (studentBadge) studentBadge.style.display = 'none';
    const childBadge = document.getElementById('ticket-child-badge');
    if (childBadge) childBadge.style.display = 'none';
    const ruleTags = document.getElementById('rule-tags-container');
    if (ruleTags) ruleTags.innerHTML = '';

    const shFromInput = document.getElementById('shinkansen-from-input');
    const shToInput = document.getElementById('shinkansen-to-input');
    if (shFromInput) clearStationInputValue(shFromInput);
    if (shToInput) clearStationInputValue(shToInput);
    lastStationListIds = '';
    renderShinkansenSegmentsList();
    updateShinkansenCandidateChips();

    document.querySelectorAll('.route-mode-btn').forEach(b => {
      if (b.getAttribute('data-mode') === 'shortest') {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    const routePanel = document.getElementById('route-panel');
    if (routePanel) {
      routePanel.classList.remove('has-result', 'mobile-sheet-half', 'mobile-sheet-full', 'is-editing');
    }

    clearRouteMapLayers();
    setSearchButtonEnabled(true);
  }

  function resetAllMapStyles() {
    if (!map) return;
    if (map.getLayer('conventional-lines')) {
      map.setPaintProperty('conventional-lines', 'line-opacity', 0.95);
    }
    if (map.getLayer('shinkansen-lines-casing')) {
      map.setPaintProperty('shinkansen-lines-casing', 'line-opacity', 1.0);
    }
    if (map.getLayer('shinkansen-lines-dash')) {
      map.setPaintProperty('shinkansen-lines-dash', 'line-opacity', 1.0);
    }
    if (map.getLayer('line-labels')) {
      map.setPaintProperty('line-labels', 'text-opacity', getLineLabelsOpacityExpression());
    }
    [...STATION_DOT_LAYERS, ...STATION_COLLIDER_LAYERS].forEach(id => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', 'visible');
      }
    });
  }

  function clearRouteMapLayers() {
    ROUTE_STATE.lastResult = null;

    // 経路ハイライト GeoJSON をクリア
    const routeSource = map && map.getSource('route-source');
    if (routeSource) {
      routeSource.setData({
        type: 'FeatureCollection',
        features: []
      });
    }

    // 発・経由・着ピン WebGL レイヤーをクリア
    const pinsSource = map && map.getSource('route-pins-source');
    if (pinsSource) {
      pinsSource.setData({
        type: 'FeatureCollection',
        features: []
      });
    }

    // 地図の通常スタイルおよび駅マーカーを復元
    resetAllMapStyles();
  }

  // 重複区間への自動フォーカス (ズーム & パン)
  function focusDuplicateSections(result) {
    if (!result || !map) return;
    const dupCoords = [];
    if (result.duplicatePolylines && result.duplicatePolylines.length > 0) {
      result.duplicatePolylines.forEach(chain => {
        chain.forEach(pt => dupCoords.push([pt[1], pt[0]]));
      });
    }
    if (dupCoords.length === 0 && result.duplicateStationIds && result.duplicateStationIds.length > 0) {
      result.duplicateStationIds.forEach(id => {
        const st = STATIONS[id];
        if (st) dupCoords.push([st.lng, st.lat]);
      });
    }
    if (dupCoords.length > 0) {
      let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
      dupCoords.forEach(pt => {
        const lng = pt[0], lat = pt[1];
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      });
      if (minLng !== Infinity) {
        map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
          padding: getVisibleMapPadding(60),
          maxZoom: 13,
          duration: 800
        });
      }
    }
  }

  function drawRouteOnMap(result) {
    if (!map) return;
    if (!result || !result.geometryLatlngs || result.geometryLatlngs.length === 0) return;

    ROUTE_STATE.lastResult = result;

    // 1. 全路線を薄くフェードアウト
    if (map.getLayer('conventional-lines')) {
      map.setPaintProperty('conventional-lines', 'line-opacity', 0.12);
    }
    if (map.getLayer('shinkansen-lines-casing')) {
      map.setPaintProperty('shinkansen-lines-casing', 'line-opacity', 0.12);
    }
    if (map.getLayer('shinkansen-lines-dash')) {
      map.setPaintProperty('shinkansen-lines-dash', 'line-opacity', 0.12);
    }
    if (map.getLayer('line-labels')) {
      map.setPaintProperty('line-labels', 'text-opacity', 0.25);
    }

    // 背景の通常駅丸印マーカーおよびコライダーを非表示 (ルートピンと駅名ラベルのみ表示)
    [...STATION_DOT_LAYERS, ...STATION_COLLIDER_LAYERS].forEach(id => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', 'none');
      }
    });

    // 2. 経路ポリライン FeatureCollection の構築
    const routeFeatures = [];

    // 通常区間
    const normalCoordsList = result.normalPolylines
      ? result.normalPolylines
      : (result.geometryLatlngs && result.geometryLatlngs.length > 0 ? [result.geometryLatlngs] : []);

    normalCoordsList.forEach(chain => {
      const coords = chain.map(pt => [pt[1], pt[0]]);
      if (coords.length >= 2) {
        routeFeatures.push({
          type: 'Feature',
          properties: { routeType: 'conventional' },
          geometry: { type: 'LineString', coordinates: coords }
        });
      }
    });

    // 新幹線区間
    if (result.shinkansenPolylines && result.shinkansenPolylines.length > 0) {
      result.shinkansenPolylines.forEach(chain => {
        const coords = chain.map(pt => [pt[1], pt[0]]);
        if (coords.length >= 2) {
          routeFeatures.push({
            type: 'Feature',
            properties: { routeType: 'shinkansen' },
            geometry: { type: 'LineString', coordinates: coords }
          });
        }
      });
    }

    // 重複区間
    if (result.duplicatePolylines && result.duplicatePolylines.length > 0) {
      result.duplicatePolylines.forEach(chain => {
        const coords = chain.map(pt => [pt[1], pt[0]]);
        if (coords.length >= 2) {
          routeFeatures.push({
            type: 'Feature',
            properties: { routeType: 'duplicate' },
            geometry: { type: 'LineString', coordinates: coords }
          });
        }
      });
    }

    const routeSource = map.getSource('route-source');
    if (routeSource) {
      routeSource.setData({
        type: 'FeatureCollection',
        features: routeFeatures
      });
    }

    // 3. 発・経由・着ピン (WebGL レイヤー route-pins-source へ登録)
    const pinFeatures = [];

    // 発駅ピン
    const deptSt = STATIONS[result.deptId];
    if (deptSt) {
      pinFeatures.push({
        type: 'Feature',
        properties: {
          pinType: 'dept',
          label: '発',
          title: `発駅: ${deptSt.name}`,
          color: '#16a34a',
          radius: 13,
          stationId: result.deptId
        },
        geometry: {
          type: 'Point',
          coordinates: [deptSt.lng, deptSt.lat]
        }
      });
    }

    // 経由駅ピン
    if (result.viaIds && result.viaIds.length > 0) {
      result.viaIds.forEach((vId, idx) => {
        const vSt = STATIONS[vId];
        if (!vSt) return;
        pinFeatures.push({
          type: 'Feature',
          properties: {
            pinType: 'via',
            label: (idx + 1).toString(),
            title: `経由${idx + 1}: ${vSt.name}`,
            color: '#0284c7',
            radius: 12,
            stationId: vId
          },
          geometry: {
            type: 'Point',
            coordinates: [vSt.lng, vSt.lat]
          }
        });
      });
    }

    // 着駅ピン
    const destSt = STATIONS[result.destId];
    if (destSt) {
      pinFeatures.push({
        type: 'Feature',
        properties: {
          pinType: 'dest',
          label: '着',
          title: `着駅: ${destSt.name}`,
          color: '#dc2626',
          radius: 13,
          stationId: result.destId
        },
        geometry: {
          type: 'Point',
          coordinates: [destSt.lng, destSt.lat]
        }
      });
    }

    const pinsSource = map.getSource('route-pins-source');
    if (pinsSource) {
      pinsSource.setData({
        type: 'FeatureCollection',
        features: pinFeatures
      });
    }

    // 4. 選択経路全体を画面内に自動フォーカス (FitBounds)
    if (result.geometryLatlngs.length >= 2) {
      let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
      result.geometryLatlngs.forEach(pt => {
        const lat = pt[0], lng = pt[1];
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      });
      if (minLng !== Infinity) {
        map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
          padding: getVisibleMapPadding(60),
          maxZoom: 13,
          duration: 800
        });
      }
    }
  }

  if (typeof maplibregl !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  if (typeof window !== 'undefined') {
    window.JR_APP = {
      calcDirectShinkansenDistance,
      calcShinkansenDistance,
      getRelevantShinkansenPairs,
      getRelevantShinkansenStationList,
      determineDefaultPreset,
      isYamanoteZoneStation,
      updateShinkansenSelectors,
      clearRouteEngineUI,
      addShinkansenSegment,
      attachStationGhostOverlay,
      setStationInputValue,
      clearStationInputValue,
      swapStationInputs,
      getRouteState: () => ROUTE_STATE,
      getState: () => STATE,
      selectStation,
      getAdjacentIndex: () => adjacentIndex,
      selectLine,
      closeLineBanner,
      getStationEnName,
      getStationUiName,
      drawRouteOnMap,
      clearRouteMapLayers,
      getMap: () => map,
      getStationMarkers: () => stationMarkers,
      getLinePolylines: () => linePolylines,
      updateStationMarkerSizes,
      updateLabelsVisibility,
      updateLineLabelsVisibility,
      getZoomLayout,
      getZoomLayoutCache: () => new Map(),
      getCanShowAllCircles: () => true,
      isMajorStation
    };
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      calcDirectShinkansenDistance,
      calcShinkansenDistance,
      getRelevantShinkansenPairs,
      getRelevantShinkansenStationList,
      determineDefaultPreset,
      isYamanoteZoneStation,
      attachStationGhostOverlay,
      setStationInputValue,
      clearStationInputValue,
      swapStationInputs
    };
  }
})();
