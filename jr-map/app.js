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

  // プリセット座標
  const PRESETS = {
    kanto: { center: [35.6812, 139.7671], zoom: 9 },
    kansai: { center: [34.6937, 135.5023], zoom: 9 },
    tokai: { center: [35.1709, 136.8815], zoom: 9 },
    hokkaido: { center: [43.0687, 141.3508], zoom: 8 },
    tohoku: { center: [38.2682, 140.8694], zoom: 7 },
    chugoku: { center: [34.5, 133.0], zoom: 8 },
    shikoku: { center: [33.8, 133.5], zoom: 8 },
    kyushu: { center: [33.0, 130.8], zoom: 8 },
    japan: { center: [36.2048, 138.2529], zoom: 6 }
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

  let map = null;
  let bordersLayerGroup = null;
  let linesLayerGroup = null;
  let lineLabelsLayerGroup = null;
  let stationsLayerGroup = null;
  let labelsLayerGroup = null;
  let highlightMarker = null;

  // 高速レンダラー (Canvas / SVG)
  let canvasRenderer = null;
  let svgRenderer = null;
  let routeCanvasRenderer = null;

  // 駅名ラベルプール (DOMノード数を最小限に抑え60fpsを維持)
  const LABEL_POOL_SIZE = 160;
  const labelPool = [];

  // キャッシュ・更新抑制用フラグ
  let updateScheduled = false;
  let lastMarkerZoom = null;
  let lastSelectedStationId = null;
  let lastSelectedLineId = null;
  let lastMarkerRouteActive = null;
  let lastLineWeightZoom = null;
  let lastLineWeightRouteActive = null;

  // 参照マップ
  const linePolylines = new Map(); // lineId -> [L.Polyline]
  const stationMarkers = new Map(); // stationId -> L.CircleMarker

  // =======================================================
  // 1. 初期化
  // =======================================================
  function init() {
    if (typeof L === 'undefined') {
      console.error('Leaflet library is not loaded.');
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
    precomputeStationScores();
    initMap();
    initLabelPool();
    buildAdjacentStationsIndex();
    setupEventHandlers();
    initRouteEngineUI();
    drawBorders();
    updateMapLayers();
    updateLabelsVisibility();
    updateLineLabelsVisibility();
  }

  // 検索用インデックスの事前構築 (検索時の文字列生成オーバーヘッドを完全排除)
  function prepareStationSearchIndex() {
    for (const id in STATIONS) {
      const st = STATIONS[id];
      st._nameLower = (st.name || '').toLowerCase();
      st._kanaLower = (st.kana || '').toLowerCase();
      st._enLower = (st.en || '').toLowerCase();
    }
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

  // 地図インスタンスの初期化
  function initMap() {
    const initialView = PRESETS.kanto;
    map = L.map('map', {
      center: initialView.center,
      zoom: initialView.zoom,
      minZoom: 5,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true
    });
    window.JR_MAP = map;

    // 高速 Canvas レンダラーの初期化
    canvasRenderer = L.canvas({ padding: 0.5 });
    svgRenderer = L.svg({ padding: 0.5 });

    // レイヤーグループを下の層から順に追加
    bordersLayerGroup = L.layerGroup().addTo(map);
    linesLayerGroup = L.layerGroup().addTo(map);
    lineLabelsLayerGroup = L.layerGroup().addTo(map);

    // 経路探索ハイライト専用 Pane (通常路線 400 より上でマーカー 600 より前面)
    const routePane = map.createPane('routePane');
    routePane.style.zIndex = '620';
    const pinPane = map.createPane('routePinPane');
    pinPane.style.zIndex = '650';

    routeCanvasRenderer = L.canvas({ pane: 'routePane', padding: 0.5 });

    stationsLayerGroup = L.layerGroup().addTo(map);

    // 駅名ラベル専用 Pane (routePane 620 より手前の 610、ズームアニメーション時は自動非表示)
    const labelsPane = map.createPane('stationLabelsPane');
    labelsPane.style.zIndex = '610';
    labelsPane.classList.add('leaflet-zoom-hide');

    labelsLayerGroup = L.layerGroup().addTo(map);

    // RAFデバウンスで重複する更新処理を1フレームに合流
    function scheduleVisibilityUpdate() {
      if (updateScheduled) return;
      updateScheduled = true;
      requestAnimationFrame(() => {
        updateScheduled = false;
        updateLabelsVisibility();
        updateLineLabelsVisibility();
      });
    }

    // ズーム開始時に駅名ラベルを非表示化し、アニメーション中の置き去り・チラつきを完全解消
    map.on('zoomstart', () => {
      labelsPane.style.opacity = '0';
    });

    map.on('zoomend', () => {
      labelsPane.style.opacity = '1';
      scheduleVisibilityUpdate();
      updateStationMarkerSizes();
      updateLineWeights();
    });

    // ドラッグ中も先回り更新し、長距離ドラッグ時でも駅名表示が遅れないようにする
    let lastMoveUpdateTime = 0;
    map.on('move', () => {
      const now = performance.now();
      if (now - lastMoveUpdateTime > 100) {
        lastMoveUpdateTime = now;
        scheduleVisibilityUpdate();
      }
    });

    map.on('moveend', () => {
      scheduleVisibilityUpdate();
    });

    map.on('click', (e) => {
      if (e.originalEvent && e.originalEvent._handledByElement) return;
      closeStationSheet();
      closeLineBanner();
    });
  }

  // 駅名ラベルプール初期化 (DOM要素を160個に固定し再利用)
  function initLabelPool() {
    labelsLayerGroup.clearLayers();
    labelPool.length = 0;
    for (let i = 0; i < LABEL_POOL_SIZE; i++) {
      const icon = L.divIcon({
        className: 'station-label leaflet-zoom-animated',
        html: '<span></span>',
        iconSize: [110, 16],
        iconAnchor: [-8, 8]
      });
      const marker = L.marker([0, 0], {
        icon: icon,
        pane: 'stationLabelsPane',
        interactive: false
      }).addTo(labelsLayerGroup);
      const el = marker.getElement();
      if (el) el.style.display = 'none';
      labelPool.push({
        marker,
        currentStationId: null,
        currentClass: ''
      });
    }
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
  // 2. リアル行政境界線 & 海岸線の描画 (国土地理院データ - 高速Canvas描画)
  // =======================================================
  function drawBorders() {
    bordersLayerGroup.clearLayers();

    const topo = TOPO || window.JR_TOPO;
    if (!topo || typeof topojson === 'undefined') {
      console.warn('JR_TOPO or topojson-client is not loaded.');
      return;
    }

    // 1. 陸地ポリゴン (全国47都道府県のリアルな陸地輪郭・海岸線)
    const landGeoJSON = topojson.feature(topo, topo.objects.japan);
    L.geoJSON(landGeoJSON, {
      renderer: canvasRenderer,
      style: {
        fillColor: '#ffffff',
        fillOpacity: 0.95,
        color: '#94a3b8',       // 海岸線: リアルな海岸輪郭
        weight: 1.2,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false
      }
    }).addTo(bordersLayerGroup);

    // 2. 都道府県境界線 (内側のリアル県境のみを抽出して破線描画)
    const interiorMesh = topojson.mesh(topo, topo.objects.japan, (a, b) => a !== b);
    L.geoJSON(interiorMesh, {
      renderer: canvasRenderer,
      style: {
        color: '#64748b',       // 県境: リアルな境界線
        weight: 1.2,
        dashArray: '3, 4',      // 破線
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false
      }
    }).addTo(bordersLayerGroup);
  }

  // =======================================================
  // 3. 線路描画 & 並走オフセット処理 (国土交通省公式データ準拠)
  // =======================================================
  // 複々線区間などで線路が重なり合わないよう、法線方向に微小オフセット (並走線路の視覚化)
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

  // =======================================================
  // 4. 路線 & 駅の描画
  // =======================================================
  function updateMapLayers() {
    linesLayerGroup.clearLayers();
    if (lineLabelsLayerGroup) lineLabelsLayerGroup.clearLayers();
    stationsLayerGroup.clearLayers();
    linePolylines.clear();
    stationMarkers.clear();

    initLabelPool();
    drawLines();
    setupLineLabels();
    drawStations();
    updateStationMarkerSizes();
    updateLabelsVisibility();
    updateLineLabelsVisibility();
  }

  // 路線ポリラインの描画 (国土交通省公式実線路ジオメトリ & リアルなカーブ・迂回を忠実に再現 - Canvas描画)
  function drawLines() {
    const TRACKS = window.JR_TRACKS || {};

    LINES.forEach(line => {
      const isShinkansen = line.category === 'shinkansen';
      const defaultWeight = isShinkansen ? 4 : 3;
      const offsetMeters = line.trackOffset || 0;

      let lineCoords = [];

      // 国土交通省公式の鉄道実線路データ (全カーブ・蛇行・専用軌道完全再現)
      if (TRACKS[line.id] && TRACKS[line.id].length > 0) {
        lineCoords = TRACKS[line.id].map(chain => {
          // [lat, lng] への確実な正規化 (pt[0] > 90 の場合は [lng, lat] なので反転)
          const latlngs = chain.map(pt => (pt[0] > 90 ? [pt[1], pt[0]] : pt));
          return offsetMeters !== 0 ? offsetLineMeters(latlngs, offsetMeters) : latlngs;
        });
      } else {
        // フォールバック: 実線路データ未読込時は駅間直線
        const pathStationIds = line.trackPath || line.stations;
        const rawLatlngs = [];
        pathStationIds.forEach(stId => {
          const st = STATIONS[stId];
          if (st) rawLatlngs.push([st.lat, st.lng]);
        });
        if (rawLatlngs.length >= 2) {
          lineCoords = [offsetMeters !== 0 ? offsetLineMeters(rawLatlngs, offsetMeters) : rawLatlngs];
        }
      }

      if (lineCoords.length === 0) return;

      const polyline = L.polyline(lineCoords, {
        renderer: canvasRenderer,
        color: line.color,
        weight: defaultWeight,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: isShinkansen ? '8, 6' : null,
        className: `line-path line-${line.id}`
      });

      polyline.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        e.originalEvent._handledByElement = true;
        selectLine(line.id);
      });

      polyline.on('mouseover', () => {
        if (ROUTE_STATE && ROUTE_STATE.lastResult) return;
        if (!STATE.selectedLineId) {
          polyline.setStyle({ weight: defaultWeight + 2, opacity: 1 });
        }
      });

      polyline.on('mouseout', () => {
        if (ROUTE_STATE && ROUTE_STATE.lastResult) return;
        if (!STATE.selectedLineId) {
          polyline.setStyle({ weight: defaultWeight, opacity: 0.9 });
        }
      });

      polyline.addTo(linesLayerGroup);
      if (isShinkansen) {
        polyline.bringToFront();
      }

      if (!linePolylines.has(line.id)) {
        linePolylines.set(line.id, []);
      }
      linePolylines.get(line.id).push(polyline);
    });
  }

  // 駅マーカーの描画 (Canvas レンダラーで超高速描画)
  function drawStations() {
    Object.values(STATIONS).forEach(st => {
      const isMega = TIER1_MEGA_HUBS.has(st.id) || TIER1_STATION_NAMES.has(st.name);
      const isMajor = TIER2_MAJOR_HUBS.has(st.id) || TIER2_STATION_NAMES.has(st.name);

      const fillColor = '#ffffff';
      const strokeColor = isMega ? '#e11d48' : (isMajor ? '#f59e0b' : '#64748b');

      // 高速サークルマーカー (Canvas)
      const marker = L.circleMarker([st.lat, st.lng], {
        renderer: canvasRenderer,
        radius: isMega ? 5.5 : 3.5,
        fillColor: fillColor,
        fillOpacity: 1,
        color: strokeColor,
        weight: isMega ? 2.5 : 1.5,
        className: `station-node ${isMega ? 'hub-station' : ''}`
      });

      // マウスホバー時に駅名ツールチップを表示
      marker.bindTooltip(st.name, {
        direction: 'top',
        offset: [0, -6],
        className: 'station-hover-tooltip',
        opacity: 0.95
      });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        e.originalEvent._handledByElement = true;
        selectStation(st.id);
      });

      marker.addTo(stationsLayerGroup);
      stationMarkers.set(st.id, marker);
    });
  }

  // ズームレベルに応じた駅マーカーの表示・サイズ動的調整 (ズームアウト時の描画スキップ & 差分更新)
  function updateStationMarkerSizes() {
    const zoom = map.getZoom();
    const routeActive = !!(ROUTE_STATE && ROUTE_STATE.lastResult);

    // 状態が前回と変わっていなければ完全スキップ
    if (lastMarkerZoom === zoom &&
        lastSelectedStationId === STATE.selectedStationId &&
        lastSelectedLineId === STATE.selectedLineId &&
        lastMarkerRouteActive === routeActive) {
      return;
    }
    lastMarkerZoom = zoom;
    lastSelectedStationId = STATE.selectedStationId;
    lastSelectedLineId = STATE.selectedLineId;
    lastMarkerRouteActive = routeActive;

    // ルート探索結果が表示されている場合は、駅マーカーをレイヤーごと非表示
    if (routeActive) {
      if (map.hasLayer(stationsLayerGroup)) {
        map.removeLayer(stationsLayerGroup);
      }
      return;
    }

    // ズームアウト時 (全国・地方広域 zoom <= 9): 駅の◯は完全非表示 (レイヤーごと外して0コスト化)
    if (zoom <= 9 && !STATE.selectedStationId) {
      if (map.hasLayer(stationsLayerGroup)) {
        map.removeLayer(stationsLayerGroup);
      }
      return;
    }

    // zoom >= 10 または駅選択中の場合は表示
    if (!map.hasLayer(stationsLayerGroup)) {
      map.addLayer(stationsLayerGroup);
    }

    stationMarkers.forEach((marker, stId) => {
      const st = STATIONS[stId];
      const isSelected = STATE.selectedStationId === stId;
      const isMega = TIER1_MEGA_HUBS.has(stId) || (st && TIER1_STATION_NAMES.has(st.name));
      const isMajor = TIER2_MAJOR_HUBS.has(stId) || (st && TIER2_STATION_NAMES.has(st.name));
      const belongsToSelectedLine = STATE.selectedLineId && st && st.lines.includes(STATE.selectedLineId);

      let visible = false;
      let radius = 3.5;
      let opacity = 1;

      if (isSelected) {
        visible = true;
        radius = 5.5;
      } else if (zoom <= 9) {
        visible = false;
      } else if (zoom <= 11) {
        if (isMega || (zoom >= 11 && (isMajor || belongsToSelectedLine))) {
          visible = true;
          radius = isMega ? 4.5 : 3.5;
        }
      } else if (zoom <= 12) {
        if (isMega || isMajor || belongsToSelectedLine || (st && st.lines && st.lines.length >= 2)) {
          visible = true;
          radius = isMega ? 5.5 : 4;
        }
      } else {
        visible = true;
        radius = isMega ? 6.5 : (isMajor ? 5 : 3.8);
      }

      if (visible) {
        marker.setRadius(radius);
        marker.setStyle({
          fillOpacity: opacity,
          opacity: opacity,
          weight: isMega ? 2.5 : 1.5
        });
      } else {
        marker.setStyle({
          fillOpacity: 0,
          opacity: 0,
          weight: 0
        });
      }
    });
  }

  // ズームレベル & 確定スコアに応じた動的駅名ラベル表示 (過疎地優遇 & 完全重なり防止 - 高速プール反映)
  // 地図ドラッグ時にもスコアや順序が一切変動しない決定論的アーキテクチャにより、
  // 同一ズーム度におけるチラつき・消去・遅延を完全排除
  function updateLabelsVisibility() {
    if (!map) return;

    const currentZoom = map.getZoom();
    const mapSize = map.getSize();
    const width = mapSize.x;
    const height = mapSize.y;

    // 画面外バッファ (-250px 〜 width + 250px, -200px 〜 height + 200px)
    // 左右にドラッグした際にも、新しく画面内に入る駅名が既に配置されているため、
    // ドラッグ時の駅名表示遅延ゼロ & 滑らかな操作感を実現
    const bufferX = 250;
    const bufferY = 200;
    const minX = -bufferX;
    const maxX = width + bufferX;
    const minY = -bufferY;
    const maxY = height + bufferY;

    // 緯度経度による高速画面外刈り込み (マージン 35% 拡大)
    const bounds = map.getBounds();
    const latSpan = bounds.getNorth() - bounds.getSouth();
    const lngSpan = bounds.getEast() - bounds.getWest();
    const minLat = bounds.getSouth() - latSpan * 0.35;
    const maxLat = bounds.getNorth() + latSpan * 0.35;
    const minLng = bounds.getWest() - lngSpan * 0.35;
    const maxLng = bounds.getEast() + lngSpan * 0.35;

    const routeActive = !!(ROUTE_STATE && ROUTE_STATE.lastResult && ROUTE_STATE.lastResult.allStationIds);
    const routeStationIds = routeActive ? new Set(ROUTE_STATE.lastResult.allStationIds) : null;

    // 1. ズームレベル & 確定的な優先度による候補判定と座標取得
    const candidates = [];
    for (const stId in STATIONS) {
      const st = STATIONS[stId];
      if (st.lat < minLat || st.lat > maxLat || st.lng < minLng || st.lng > maxLng) {
        continue;
      }

      const isSelected = STATE.selectedStationId === stId;
      const belongsToSelectedLine = !!(STATE.selectedLineId && st.lines && st.lines.includes(STATE.selectedLineId));
      const isRouteStation = !!(routeStationIds && routeStationIds.has(stId));

      // ズームレベルに応じた確定的な候補判定:
      // ドラッグや画面ピクセル位置によってスコアや候補可否が絶対に変動しない安定仕様
      let isCandidate = false;
      if (isSelected || belongsToSelectedLine || isRouteStation) {
        isCandidate = true;
      } else if (currentZoom <= 6) {
        isCandidate = (st._baseScore || 0) >= 4500;
      } else if (currentZoom === 7) {
        isCandidate = (st._baseScore || 0) >= 2600;
      } else if (currentZoom === 8) {
        isCandidate = (st._baseScore || 0) >= 1600;
      } else if (currentZoom <= 10) {
        isCandidate = (st._baseScore || 0) >= 800;
      } else if (currentZoom <= 12) {
        isCandidate = (st._baseScore || 0) >= 400;
      } else {
        isCandidate = true; // zoom >= 13: 全駅が候補
      }

      if (!isCandidate) continue;

      const pt = map.latLngToContainerPoint([st.lat, st.lng]);
      if (pt.x < minX || pt.x > maxX || pt.y < minY || pt.y > maxY) {
        continue;
      }

      let score = st._baseScore || 0;
      if (isSelected) {
        score += 1000000; // 選択駅は最優先
      } else if (isRouteStation) {
        score += 500000;
      } else if (belongsToSelectedLine) {
        score += 100000;
      }

      candidates.push({
        stId,
        st,
        pt,
        score,
        isSelected,
        belongsToSelectedLine
      });
    }

    // 2. 確定的なスコア順（主要駅・高優先度順）にソート
    // タイブレークもIDハッシュで確定しているため、ドラッグで順序が入れ替わることは皆無
    candidates.sort((a, b) => b.score - a.score);

    // 3. 衝突判定 (Greedy Collision Detection)
    const placedBoxes = [];
    const placedStations = [];

    for (let c = 0; c < candidates.length; c++) {
      if (placedStations.length >= LABEL_POOL_SIZE) break;
      const cand = candidates[c];

      const isMega = TIER1_MEGA_HUBS.has(cand.stId) || TIER1_STATION_NAMES.has(cand.st.name);
      const isMajor = TIER2_MAJOR_HUBS.has(cand.stId) || TIER2_STATION_NAMES.has(cand.st.name);
      const charWidth = isMega ? 13 : (isMajor ? 12 : 11);
      const textWidth = Math.max(34, cand.st.name.length * charWidth + 8);
      const textHeight = isMega ? 18 : 15;

      // ラベル位置 (マーカー右側にアンカー)
      const box = {
        x1: cand.pt.x + 6 - 3,
        y1: cand.pt.y - 9 - 2,
        x2: cand.pt.x + 6 + textWidth + 3,
        y2: cand.pt.y - 9 + textHeight + 2
      };

      if (cand.isSelected) {
        // 選択駅は衝突判定に関係なく必ず表示し、占有領域として登録
        placedStations.push(cand);
        placedBoxes.push(box);
        placedBoxes.push({
          x1: cand.pt.x - 9,
          y1: cand.pt.y - 9,
          x2: cand.pt.x + 9,
          y2: cand.pt.y + 9
        });
        continue;
      }

      // 既存の配置済みラベルとの重なりをチェック
      let collides = false;
      for (let i = 0; i < placedBoxes.length; i++) {
        const pb = placedBoxes[i];
        if (!(box.x2 < pb.x1 || box.x1 > pb.x2 || box.y2 < pb.y1 || box.y1 > pb.y2)) {
          collides = true;
          break;
        }
      }

      if (!collides) {
        placedStations.push(cand);
        placedBoxes.push(box);
        // 駅マーカー本体の周囲も障害物として登録（路線名ラベルが駅丸印に被らないようにする）
        placedBoxes.push({
          x1: cand.pt.x - 7,
          y1: cand.pt.y - 7,
          x2: cand.pt.x + 7,
          y2: cand.pt.y + 7
        });
      }
    }

    STATE.placedStationBoxes = placedBoxes;

    // 4. プールマーカーへの超高速反映 (DOM要素再利用・最小限のミューテーション)
    const poolLen = labelPool.length;
    const placedCount = placedStations.length;

    for (let i = 0; i < poolLen; i++) {
      const item = labelPool[i];
      if (i < placedCount) {
        const cand = placedStations[i];
        const isMega = TIER1_MEGA_HUBS.has(cand.stId) || TIER1_STATION_NAMES.has(cand.st.name);
        const isMajor = TIER2_MAJOR_HUBS.has(cand.stId) || TIER2_STATION_NAMES.has(cand.st.name);
        const targetClass = `station-label leaflet-zoom-animated ${isMega ? 'hub-label' : (isMajor ? 'major-label' : 'regular-label')}`;

        const el = item.marker.getElement();
        if (el) {
          if (item.currentStationId !== cand.stId) {
            item.marker.setLatLng([cand.st.lat, cand.st.lng]);
            const span = el.querySelector('span');
            if (span) span.textContent = cand.st.name;
            else el.innerHTML = `<span>${cand.st.name}</span>`;
            item.currentStationId = cand.stId;
          }
          if (item.currentClass !== targetClass) {
            el.className = `leaflet-marker-icon ${targetClass}`;
            item.currentClass = targetClass;
          }
          el.style.display = 'block';
          el.style.zIndex = cand.isSelected ? '1000' : '';
        }
      } else {
        if (item.currentStationId !== null) {
          const el = item.marker.getElement();
          if (el) el.style.display = 'none';
          item.currentStationId = null;
        }
      }
    }
  }

  // =======================================================
  // 4.5 路線名マップラベル (Google Maps風・線路曲線追従 SVG TextPath)
  // =======================================================
  const TIER1_SHINKANSEN = new Set([
    'shinkansen-tokaido', 'shinkansen-sanyo', 'shinkansen-tohoku',
    'shinkansen-hokkaido', 'shinkansen-joetsu', 'shinkansen-hokuriku',
    'shinkansen-kyushu', 'shinkansen-nishi-kyushu', 'shinkansen-yamagata', 'shinkansen-akita'
  ]);

  const TIER2_MAJOR_TRUNK = new Set([
    // 東日本・関東
    'yamanote', 'tokaido', 'chuo-main',
    'tohoku-main', 'joban',
    'sobu-main', 'takasaki-line', 'shinetsu-line', 'shinetsu-takasaki',
    // 北海道
    'hokkaido-hakodate', 'hokkaido-chitose', 'hokkaido-muroran',
    // 東海
    'tokai-tokaido', 'tokai-chuo', 'tokai-kansai',
    // 関西
    'osaka-loop', 'tokaido-west', 'sanyo-main', 'hanwa-line', 'kansai-west', 'nara-line', 'hokuriku-main', 'kosei-line',
    // 中国
    'sanin-main', 'hakubi-line', 'seto-ohashi-west',
    // 四国
    'shikoku-yosan', 'shikoku-dosan', 'shikoku-seto-ohashi',
    // 九州
    'kyushu-kagoshima', 'kyushu-nippo', 'kyushu-nagasaki'
  ]);

  const TIER3_REGIONAL_TRUNK = new Set([
    // 東日本・関東
    'negishi-line', 'akabane-line', 'yokosuka-line', 'yokohama-line',
    'musashino', 'keiyo', 'nambu', 'kawagoe-line', 'ome-line', 'itsukaichi-line',
    'uchibo-line', 'sotobo-line', 'narita-line',
    'shinonoi-line', 'joetsu-line', 'echigo-line', 'hakushin-line',
    'ou-main', 'uetsu-main', 'oito-line',
    'senzan-line', 'senseki-line', 'ryomo-line', 'mito-line',
    'banetsu-west', 'banetsu-east', 'suigun-line', 'hachiko-line', 'chuo-tatsuno',
    // 北海道
    'hokkaido-sekisho', 'hokkaido-nemuro', 'hokkaido-soya', 'hokkaido-sekihoku', 'hokkaido-furano', 'hokkaido-sassho',
    // 東海
    'tokai-kisei', 'tokai-takayama', 'tokai-iida', 'tokai-minobu', 'tokai-gotemba', 'tokai-taketoyo',
    // 関西
    'jr-tozai', 'osaka-higashi', 'katamachi-line', 'fukuchiyama-line', 'kanku-line', 'kusatsu-line',
    'wakayama-line', 'kisei-west', 'ako-line', 'bantan-line', 'nanao-line',
    // 中国
    'kure-line', 'kabe-line', 'geibi-line', 'tsuyama-line', 'uno-line', 'yamaguchi-line', 'imbi-line',
    // 四国
    'shikoku-kotoku', 'shikoku-tokushima', 'shikoku-mugi', 'shikoku-uchiko',
    // 九州
    'kyushu-sasebo', 'kyushu-omura', 'kyushu-kyudai', 'kyushu-hohi', 'kyushu-chikuhi',
    'kyushu-sasaguri', 'kyushu-chikuho', 'kyushu-kashii', 'kyushu-nichinan', 'kyushu-ibusuki'
  ]);

  // 路線名から区間名表記（例:「 (高尾〜塩尻)」）を除去し、純粋な路線名のみを抽出
  function cleanLineName(name) {
    return name.replace(/\s*[\(（].*?[\)）]/g, '').trim();
  }

  // 西から東（または南から北）に方向を正規化し、文字の倒立（上下逆さま）を完全に防止
  function normalizeTrackDirection(points) {
    if (!points || points.length < 2) return points;
    const p0 = points[0];
    const pN = points[points.length - 1];
    const dLng = pN[1] - p0[1];
    const dLat = pN[0] - p0[0];
    let reverse = false;
    if (Math.abs(dLng) >= 0.003) {
      if (dLng < 0) reverse = true;
    } else {
      if (dLat < 0) reverse = true;
    }
    return reverse ? points.slice().reverse() : points.slice();
  }

  // ガイドパスを滑らかに補間し、微細な折れ曲がりによる文字の重なりを解消
  function smoothTrackPoints(points, windowSize = 7) {
    if (points.length < windowSize) return points;
    const half = Math.floor(windowSize / 2);
    const n = points.length;
    const smoothed = [];
    for (let i = 0; i < n; i++) {
      const start = Math.max(0, i - half);
      const end = Math.min(n - 1, i + half);
      let sumLat = 0, sumLng = 0, count = 0;
      for (let j = start; j <= end; j++) {
        sumLat += points[j][0];
        sumLng += points[j][1];
        count++;
      }
      smoothed.push([sumLat / count, sumLng / count]);
    }
    return smoothed;
  }

  // 線路上の急カーブ・S字を避け、最も直線的で滑らかな最適ラベル配置地点を探索
  function findSmoothOffsetRatio(points, preferredRatio, searchRange = 0.15) {
    const n = points.length;
    if (n < 10) return preferredRatio;

    const centerIdx = Math.floor(n * preferredRatio);
    const delta = Math.floor(n * searchRange);
    const startIdx = Math.max(5, centerIdx - delta);
    const endIdx = Math.min(n - 6, centerIdx + delta);

    let bestIdx = centerIdx;
    let minCurvature = Infinity;

    for (let i = startIdx; i <= endIdx; i++) {
      let maxAngleDiff = 0;
      for (let j = i - 3; j <= i + 3; j++) {
        const p0 = points[j - 1], p1 = points[j], p2 = points[j + 1];
        const a1 = Math.atan2(p1[0] - p0[0], p1[1] - p0[1]) * 180 / Math.PI;
        const a2 = Math.atan2(p2[0] - p1[0], p2[1] - p1[1]) * 180 / Math.PI;
        let diff = Math.abs(a2 - a1);
        if (diff > 180) diff = 360 - diff;
        if (diff > maxAngleDiff) maxAngleDiff = diff;
      }
      if (maxAngleDiff < minCurvature) {
        minCurvature = maxAngleDiff;
        bestIdx = i;
      }
    }

    return bestIdx / n;
  }

  // 路線名ラベルの構築 (SVG textPath による完全な曲線追従 & 文字重なり防止 & 局所正立化 & 文字欠け防止)
  function setupLineLabels() {
    if (!lineLabelsLayerGroup || !map) return;
    lineLabelsLayerGroup.clearLayers();

    // 既存のSVGテキストグループがあれば破棄
    const oldGroup = document.getElementById('svg-line-labels-group');
    if (oldGroup) oldGroup.remove();

    const overlayPane = map.getPanes().overlayPane;
    const svg = overlayPane.querySelector('svg');
    if (!svg) return;

    // 線路パスの上に重ねて描画されるよう、SVGの末尾にテキストグループを追加
    const labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    labelsGroup.setAttribute('id', 'svg-line-labels-group');
    labelsGroup.setAttribute('class', 'leaflet-line-labels-container');
    svg.appendChild(labelsGroup);

    const TRACKS = window.JR_TRACKS || {};

    LINES.forEach(line => {
      const isShinkansen = line.category === 'shinkansen' || TIER1_SHINKANSEN.has(line.id);
      const isMajorTrunk = TIER2_MAJOR_TRUNK.has(line.id);
      const tier = isShinkansen ? 1 : (isMajorTrunk ? 2 : (TIER3_REGIONAL_TRUNK.has(line.id) ? 3 : 4));
      const cleanName = cleanLineName(line.name);

      // 代表となる最も長い線路チェーンを取得
      const chains = TRACKS[line.id] || [];
      let mainChain = null;
      if (chains.length > 0) {
        mainChain = chains[0];
        for (let i = 1; i < chains.length; i++) {
          if (chains[i].length > mainChain.length) mainChain = chains[i];
        }
      } else {
        const rawLatlngs = [];
        (line.trackPath || line.stations).forEach(stId => {
          const st = STATIONS[stId];
          if (st) rawLatlngs.push([st.lat, st.lng]);
        });
        mainChain = rawLatlngs;
      }

      if (!mainChain || mainChain.length < 2) return;

      const latlngs = mainChain.map(pt => (pt[0] > 90 ? [pt[1], pt[0]] : pt));
      const offsetChain = line.trackOffset ? offsetLineMeters(latlngs, line.trackOffset) : latlngs;

      // 環状線の処理 (大阪環状線は北側主要区間を使用)
      let rawGuidePts = offsetChain;
      if (line.id === 'osaka-loop') {
        rawGuidePts = offsetChain.slice(80, 240);
      }

      const totalPts = rawGuidePts.length;
      if (totalPts < 2) return;

      // 長大路線 (新幹線、または200頂点以上、主要幹線) は田舎や広域で複数箇所見えるよう3〜4箇所配置
      // 中規模路線 (70頂点以上) は2箇所、短い路線は中央1箇所
      const isSuperLong = isShinkansen || totalPts >= 200 || (isMajorTrunk && totalPts >= 120);
      const isMediumLong = !isSuperLong && totalPts >= 70;

      let candidateRatios = [0.50];
      if (isSuperLong) {
        candidateRatios = [0.20, 0.44, 0.68, 0.88];
      } else if (isMediumLong) {
        candidateRatios = [0.35, 0.68];
      }

      const uniqueRatios = [];
      candidateRatios.forEach(r => {
        const smoothRatio = findSmoothOffsetRatio(rawGuidePts, r);
        if (!uniqueRatios.some(u => Math.abs(u - smoothRatio) < 0.14)) {
          uniqueRatios.push(smoothRatio);
        }
      });

      uniqueRatios.forEach((ratio, slotIdx) => {
        const centerIdx = Math.floor(totalPts * ratio);

        // ガイドパス切り出し (SVG textPath の文字欠け「函館本線」→「館本」根本防止):
        // SVG textPath はガイドパスの長さがテキスト幅より短いと両端文字がクリップされる。
        // 固定頂点数だとズームアウト時に数ピクセルしかなくなり文字欠けするため、
        // 中心から実距離で前後最低 30km（合計 60km 以上）、頂点数でも前後 80頂点以上確保する。
        // 路線全体が短い場合は路線全パス（rawGuidePts）を使用する。
        let startIdx = 0;
        let endIdx = totalPts;

        if (totalPts > 100) {
          let dBack = 0;
          let sIdx = centerIdx;
          while (sIdx > 0) {
            sIdx--;
            const p1 = rawGuidePts[sIdx];
            const p2 = rawGuidePts[sIdx + 1];
            const dLat = (p2[0] - p1[0]) * 111;
            const dLng = (p2[1] - p1[1]) * 85;
            dBack += Math.sqrt(dLat * dLat + dLng * dLng);
            if (dBack >= 30 && (centerIdx - sIdx) >= 60) break;
          }
          startIdx = sIdx;

          let dFwd = 0;
          let eIdx = centerIdx;
          while (eIdx < totalPts - 1) {
            eIdx++;
            const p1 = rawGuidePts[eIdx - 1];
            const p2 = rawGuidePts[eIdx];
            const dLat = (p2[0] - p1[0]) * 111;
            const dLng = (p2[1] - p1[1]) * 85;
            dFwd += Math.sqrt(dLat * dLat + dLng * dLng);
            if (dFwd >= 30 && (eIdx - centerIdx) >= 60) break;
          }
          endIdx = Math.min(totalPts, eIdx + 1);
        }

        let slotPts = rawGuidePts.slice(startIdx, endIdx);
        if (slotPts.length < 2) slotPts = rawGuidePts.slice();

        // 局所区間単体で確実に「西から東（左から右）」へ向くよう正規化し、文字の上下逆さま（倒立）を根本防止
        const pStart = slotPts[0];
        const pEnd = slotPts[slotPts.length - 1];
        const dLng = pEnd[1] - pStart[1];
        const dLat = pEnd[0] - pStart[0];
        let shouldReverse = false;
        if (Math.abs(dLng) >= 0.001) {
          if (dLng < 0) shouldReverse = true;
        } else {
          if (dLat < 0) shouldReverse = true;
        }
        if (shouldReverse) {
          slotPts.reverse();
        }

        // 微小な曲がりくねりによる文字潰れを防止するため、滑らか補間
        const smoothed = smoothTrackPoints(slotPts, 5);
        if (smoothed.length < 2) return;

        const centerPt = smoothed[Math.floor(smoothed.length / 2)];
        const guideId = `guide-track-${line.id}-${slotIdx}`;

        // スロット専用の正立ガイドポリラインを作成 (SVG textPath のため SVG レンダラー指定)
        const guidePoly = L.polyline(smoothed, {
          renderer: svgRenderer,
          color: 'transparent',
          weight: 1,
          opacity: 0,
          fill: false,
          interactive: false,
          className: 'leaflet-textpath-guide'
        }).addTo(lineLabelsLayerGroup);

        if (guidePoly._path) {
          guidePoly._path.setAttribute('id', guideId);
        }

        // SVG text & textPath の生成 (Google Maps風・線路カーブ沿いテキスト)
        const textElem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textElem.setAttribute('class', `svg-line-text ${isShinkansen ? 'shinkansen-text' : ''}`);
        textElem.setAttribute('data-line-id', line.id);
        textElem.setAttribute('data-tier', String(tier));
        textElem.setAttribute('data-slot', String(slotIdx));
        textElem.setAttribute('data-lat', String(centerPt[0]));
        textElem.setAttribute('data-lng', String(centerPt[1]));
        textElem.setAttribute('data-name-len', String(cleanName.length));
        textElem.setAttribute('dominant-baseline', 'central');
        textElem.setAttribute('dy', '0.05em');

        const textPathElem = document.createElementNS('http://www.w3.org/2000/svg', 'textPath');
        textPathElem.setAttribute('href', `#${guideId}`);
        textPathElem.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${guideId}`);
        textPathElem.setAttribute('startOffset', '50%'); // ガイドパスの中央に正立配置
        textPathElem.setAttribute('text-anchor', 'middle');
        textPathElem.textContent = cleanName;

        textElem.appendChild(textPathElem);

        // クリックで該当路線を選択・フォーカス
        textElem.addEventListener('click', (e) => {
          e.stopPropagation();
          selectLine(line.id);
        });

        // ホバーで該当路線の線路を強調
        textElem.addEventListener('mouseenter', () => {
          if (!STATE.selectedLineId) {
            const polyList = linePolylines.get(line.id) || [];
            polyList.forEach(p => p.setStyle({ weight: 6, opacity: 1 }));
          }
        });
        textElem.addEventListener('mouseleave', () => {
          if (!STATE.selectedLineId) {
            updateLineWeights();
          }
        });

        labelsGroup.appendChild(textElem);
      });
    });
  }

  // ズームレベル & 衝突判定に応じた動的路線名表示
  // 田舎・過疎エリアは余裕があるため表示を増やし、都会は重なりを回避して空いている場所に表示
  function updateLineLabelsVisibility() {
    const labelsGroup = document.getElementById('svg-line-labels-group');
    if (!labelsGroup || !map) return;

    const zoom = map.getZoom();
    const mapSize = map.getSize();
    const width = mapSize.x;
    const height = mapSize.y;
    const selectedId = STATE.selectedLineId;
    const textElems = Array.from(labelsGroup.querySelectorAll('.svg-line-text'));

    const stationBoxes = STATE.placedStationBoxes || [];
    const placedLineBoxes = [];
    const placedLineIds = new Map(); // lineId -> Array of placed centers for distance check

    // 表示候補のフィルタリング
    const candidates = [];

    textElems.forEach(elem => {
      const lineId = elem.getAttribute('data-line-id');
      const tier = parseInt(elem.getAttribute('data-tier'), 10) || 4;
      const isSelected = selectedId === lineId;
      const lat = parseFloat(elem.getAttribute('data-lat'));
      const lng = parseFloat(elem.getAttribute('data-lng'));
      const nameLen = parseInt(elem.getAttribute('data-name-len'), 10) || 4;

      const slot = parseInt(elem.getAttribute('data-slot'), 10) || 0;

      // ズーム条件の緩和 (田舎の路線をズーム7〜8でも表示可能に)
      let meetsZoom = false;
      if (isSelected) {
        meetsZoom = true;
      } else if (tier === 1) { // 新幹線
        meetsZoom = (zoom >= 5);
      } else if (tier === 2) { // 主要幹線 (函館本線・東北本線・東海道本線・山陽本線等)
        meetsZoom = (zoom >= 7);
      } else if (tier === 3) { // 地域幹線 (宗谷本線・石北本線・根室本線・羽越本線・高山本線等)
        meetsZoom = (zoom >= 8);
      } else { // ローカル線
        meetsZoom = (zoom >= 10);
      }

      if (!meetsZoom || isNaN(lat) || isNaN(lng)) {
        elem.style.display = 'none';
        elem.classList.remove('active-line-text');
        return;
      }

      // 画面上のピクセル位置
      const pt = map.latLngToContainerPoint([lat, lng]);

      // 画面外マージン (-150px 〜 width + 150px)
      if (pt.x < -150 || pt.x > width + 150 || pt.y < -100 || pt.y > height + 100) {
        elem.style.display = 'none';
        return;
      }

      let priority = 0;
      if (isSelected) priority = 10000;
      else if (tier === 1) priority = 500;
      else if (tier === 2) priority = 300;
      else if (tier === 3) priority = 200;
      else priority = 100;

      candidates.push({
        elem,
        lineId,
        tier,
        slot,
        isSelected,
        pt,
        nameLen,
        priority
      });
    });

    // 優先度順（選択路線 > 新幹線 > 主要幹線 > 地域幹線 > ローカル線）に確定ソート
    candidates.sort((a, b) => (b.priority - a.priority) || a.lineId.localeCompare(b.lineId) || (a.slot - b.slot));

    candidates.forEach(cand => {
      const charWidth = cand.tier === 1 ? 13 : 11.5;
      const boxWidth = Math.max(30, cand.nameLen * charWidth + 10);
      const boxHeight = cand.tier === 1 ? 16 : 14;

      // ラベル矩形（中心配置）
      const box = {
        x1: cand.pt.x - boxWidth / 2,
        y1: cand.pt.y - boxHeight / 2,
        x2: cand.pt.x + boxWidth / 2,
        y2: cand.pt.y + boxHeight / 2
      };

      if (cand.isSelected) {
        cand.elem.style.display = '';
        cand.elem.classList.add('active-line-text');
        placedLineBoxes.push(box);
        return;
      }

      cand.elem.classList.remove('active-line-text');

      // 同一路線の近接スロット重複チェック（同一画面内で120px以内に同じ路線名を表示しない）
      const existingCenters = placedLineIds.get(cand.lineId) || [];
      const isTooCloseSameLine = existingCenters.some(cPt => {
        const dist = Math.hypot(cand.pt.x - cPt.x, cand.pt.y - cPt.y);
        return dist < 120;
      });
      if (isTooCloseSameLine) {
        cand.elem.style.display = 'none';
        return;
      }

      // 1. 駅名テキストおよび駅マーカーとの衝突判定
      let collides = false;
      for (let i = 0; i < stationBoxes.length; i++) {
        const sb = stationBoxes[i];
        if (!(box.x2 < sb.x1 || box.x1 > sb.x2 || box.y2 < sb.y1 || box.y1 > sb.y2)) {
          collides = true;
          break;
        }
      }

      // 2. 他の配置済み路線名ラベルとの衝突判定
      if (!collides) {
        for (let i = 0; i < placedLineBoxes.length; i++) {
          const lb = placedLineBoxes[i];
          if (!(box.x2 < lb.x1 || box.x1 > lb.x2 || box.y2 < lb.y1 || box.y1 > lb.y2)) {
            collides = true;
            break;
          }
        }
      }

      if (!collides) {
        cand.elem.style.display = '';
        placedLineBoxes.push(box);
        if (!placedLineIds.has(cand.lineId)) placedLineIds.set(cand.lineId, []);
        placedLineIds.get(cand.lineId).push(cand.pt);
      } else {
        // 重なりあり（都会の密集駅や路線交差部）: 非表示にして可読性を確保
        cand.elem.style.display = 'none';
      }
    });
  }

  // ズームレベルに応じた線幅の調整 (差分更新により不要なsetStyleを完全抑止)
  function updateLineWeights() {
    const zoom = map.getZoom();
    const baseWeight = zoom >= 14 ? 5 : (zoom >= 11 ? 3.5 : (zoom <= 8 ? 2 : 2.5));
    const routeActive = !!(ROUTE_STATE && ROUTE_STATE.lastResult);

    // 線幅区分・選択状態・ルート探索状態が前回と変わっていなければスキップ
    if (lastLineWeightZoom === baseWeight &&
        lastSelectedLineId === STATE.selectedLineId &&
        lastLineWeightRouteActive === routeActive) {
      return;
    }
    lastLineWeightZoom = baseWeight;
    lastSelectedLineId = STATE.selectedLineId;
    lastLineWeightRouteActive = routeActive;

    // ルート探索結果が表示されている場合は、全未選択路線のディムアウト状態を維持
    if (routeActive) {
      LINES.forEach(line => {
        const polylines = linePolylines.get(line.id) || [];
        polylines.forEach(p => {
          p.setStyle({
            weight: 1.8,
            opacity: 0.12
          });
        });
      });
      return;
    }

    LINES.forEach(line => {
      const polylines = linePolylines.get(line.id) || [];
      const isShinkansen = line.category === 'shinkansen';
      const weight = isShinkansen ? baseWeight + 1 : baseWeight;
      const isLineActive = !STATE.selectedLineId || STATE.selectedLineId === line.id;
      const opacity = isLineActive ? 0.9 : 0.15;

      polylines.forEach(p => {
        p.setStyle({
          weight: STATE.selectedLineId === line.id ? weight + 2 : weight,
          opacity: opacity
        });
      });
    });
  }

  // =======================================================
  // 5. インデックス作成 (隣接駅の計算)
  // =======================================================
  const adjacentIndex = new Map();

  function buildAdjacentStationsIndex() {
    LINES.forEach(line => {
      const chains = [line.stations, ...(line.branches || [])];
      chains.forEach(stIds => {
        for (let i = 0; i < stIds.length; i++) {
          const cur = stIds[i];
          if (!adjacentIndex.has(cur)) {
            adjacentIndex.set(cur, {});
          }
          const adj = adjacentIndex.get(cur);

          const prev = i > 0 ? stIds[i - 1] : (line.isLoop ? stIds[stIds.length - 2] : null);
          const next = i < stIds.length - 1 ? stIds[i + 1] : (line.isLoop ? stIds[1] : null);

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
  }

  // =======================================================
  // 6. 路線ハイライト選択
  // =======================================================
  function selectLine(lineId) {
    STATE.selectedLineId = lineId;

    const banner = document.getElementById('line-banner');

    if (!lineId) {
      updateLineWeights();
      banner.style.display = 'none';
      updateStationMarkerSizes();
      updateLabelsVisibility();
      updateLineLabelsVisibility();
      return;
    }

    const line = LINES.find(l => l.id === lineId);
    if (!line) return;

    const badge = document.getElementById('banner-badge');
    badge.textContent = line.code || 'JR';
    badge.style.background = line.color;
    badge.style.color = line.textColor || '#fff';

    document.getElementById('banner-name').textContent = line.name;
    document.getElementById('banner-en').textContent = line.en || '';
    const desc = line.description ? `${line.description} ` : '';
    const totalCount = new Set([...line.stations, ...(line.branches ? line.branches.flat() : [])]).size;
    document.getElementById('banner-desc').textContent = `${desc}(全${totalCount}駅)`;
    banner.style.display = 'flex';

    updateLineWeights();
    updateStationMarkerSizes();
    updateLabelsVisibility();
    updateLineLabelsVisibility();

    const polylines = linePolylines.get(lineId);
    if (polylines && polylines[0]) {
      const bounds = polylines[0].getBounds();
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14, animate: true });
    }
  }

  function closeLineBanner() {
    selectLine(null);
  }

  // =======================================================
  // 7. 駅詳細選択 & ボトムシート
  // =======================================================
  function selectStation(stId, shouldPan = true) {
    const st = STATIONS[stId];
    if (!st) return;

    STATE.selectedStationId = stId;

    if (shouldPan) {
      const targetZoom = Math.max(map.getZoom(), 13);
      map.flyTo([st.lat, st.lng], targetZoom, { duration: 0.6 });
    }

    const sheet = document.getElementById('station-sheet');
    document.getElementById('sheet-pref').textContent = st.pref;
    document.getElementById('sheet-kana').textContent = st.kana;
    document.getElementById('sheet-en').textContent = st.en;
    document.getElementById('sheet-name').textContent = st.name;

    const linesContainer = document.getElementById('sheet-lines');
    linesContainer.innerHTML = '';
    (st.lines || []).forEach(lId => {
      const line = LINES.find(l => l.id === lId);
      if (!line) return;
      const badge = document.createElement('div');
      badge.className = 'line-badge-item';
      badge.style.background = line.color;
      badge.style.color = line.textColor || '#fff';
      badge.innerHTML = `${line.code ? `<span class="line-badge-code">${line.code}</span>` : ''} <span>${line.name}</span>`;
      badge.addEventListener('click', () => {
        selectLine(line.id);
      });
      linesContainer.appendChild(badge);
    });

    const adjContainer = document.getElementById('sheet-adjacents');
    adjContainer.innerHTML = '';
    const adjInfo = adjacentIndex.get(stId) || {};

    let hasAdj = false;
    Object.keys(adjInfo).forEach(lId => {
      const line = LINES.find(l => l.id === lId);
      const info = adjInfo[lId];
      if (!line || !info) return;

      const prevList = Array.isArray(info.prev) ? info.prev : (info.prev ? [info.prev] : []);
      const nextList = Array.isArray(info.next) ? info.next : (info.next ? [info.next] : []);

      if (prevList.length === 0 && nextList.length === 0) return;
      hasAdj = true;

      const prevHtml = prevList
        .map(id => STATIONS[id] ? `<span class="adj-link" data-id="${id}">${STATIONS[id].name}</span>` : '')
        .filter(Boolean)
        .join('・');

      const nextHtml = nextList
        .map(id => STATIONS[id] ? `<span class="adj-link" data-id="${id}">${STATIONS[id].name}</span>` : '')
        .filter(Boolean)
        .join('・');

      const row = document.createElement('div');
      row.className = 'adj-row';
      row.innerHTML = `
        <span style="color:${line.color};font-weight:700;">${line.name}</span>
        <div>
          ${prevHtml ? `← ${prevHtml}` : ''}
          ${prevHtml && nextHtml ? ' / ' : ''}
          ${nextHtml ? `${nextHtml} →` : ''}
        </div>
      `;
      row.querySelectorAll('.adj-link').forEach(link => {
        link.addEventListener('click', (e) => {
          const nextId = e.target.getAttribute('data-id');
          if (nextId) selectStation(nextId);
        });
      });
      adjContainer.appendChild(row);
    });

    if (!hasAdj) {
      adjContainer.innerHTML = '<span style="color:var(--text-muted);font-size:11px;">起点・終点または単独駅です</span>';
    }

    sheet.style.display = 'block';
    updateStationMarkerSizes();
    updateLabelsVisibility();

    if (highlightMarker) {
      map.removeLayer(highlightMarker);
      highlightMarker = null;
    }
    highlightMarker = L.circleMarker([st.lat, st.lng], {
      renderer: canvasRenderer,
      radius: 9,
      fillColor: '#3b82f6',
      fillOpacity: 0.35,
      color: '#2563eb',
      weight: 3,
      dashArray: '3, 3',
      interactive: false
    }).addTo(map);
  }

  function closeStationSheet() {
    STATE.selectedStationId = null;
    document.getElementById('station-sheet').style.display = 'none';
    if (highlightMarker) {
      map.removeLayer(highlightMarker);
      highlightMarker = null;
    }
    updateStationMarkerSizes();
    updateLabelsVisibility();
  }

  // =======================================================
  // 8. 駅名インクリメンタル検索 & スコアリングソート
  // =======================================================
  function searchStations(query, limit = 8, referenceStation = null) {
    if (!query) return [];
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const scored = [];
    for (const id in STATIONS) {
      const st = STATIONS[id];
      const name = st._nameLower || st.name.toLowerCase();
      const kana = st._kanaLower || (st.kana || '').toLowerCase();
      const en = st._enLower || (st.en || '').toLowerCase();

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
            <span class="search-item-name">${st.name}</span>
            <span class="search-item-kana">${st.kana} (${st.en})</span>
          </div>
          <span class="search-item-pref">${st.pref}</span>
        `;
        item.addEventListener('click', () => {
          input.value = st.name;
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
      input.value = '';
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
  function setupEventHandlers() {
    setupSearch();

    document.getElementById('btn-zoom-in').addEventListener('click', () => {
      map.zoomIn();
    });
    document.getElementById('btn-zoom-out').addEventListener('click', () => {
      map.zoomOut();
    });
    document.getElementById('btn-zoom-reset').addEventListener('click', () => {
      const preset = PRESETS[STATE.currentPreset] || PRESETS.kanto;
      map.flyTo(preset.center, preset.zoom, { duration: 0.7 });
    });

    document.getElementById('btn-sheet-close').addEventListener('click', closeStationSheet);

    document.getElementById('btn-focus-station').addEventListener('click', () => {
      if (STATE.selectedStationId) {
        const st = STATIONS[STATE.selectedStationId];
        if (st) map.panTo([st.lat, st.lng]);
      }
    });

    document.getElementById('btn-banner-close').addEventListener('click', closeLineBanner);

    window.addEventListener('resize', () => {
      updateLabelsVisibility();
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
    useShinkansen: true,
    searchMode: 'shortest',
    shinkansenSegments: [], // [{ fromId, toId, fromName, toName, km, lineId }]
    activeRouteLayers: [],
    activePinLayers: [],
    lastResult: null,
    currentFareType: 'adult',    // 'adult' | 'child' | 'student'
    ticketDate: getLocalISODate(),
    ticketSizeMode: 'auto'       // 'auto' | '85' | '120'
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
      ROUTE_STATE.shinkansenSegments.push({
        fromId: fromSt.id,
        toId: toSt.id,
        fromName: fromSt.name,
        toName: toSt.name
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

  // 同一新幹線路線上の営業キロ算出 (完全非再帰・O(1))
  function calcDirectShinkansenDistance(fromId, toId) {
    if (!fromId || !toId || fromId === toId || !LINES) return null;
    const shLines = LINES.filter(l => l.category === 'shinkansen');

    for (const line of shLines) {
      const stIds = line.stations || [];
      const idx1 = stIds.indexOf(fromId);
      const idx2 = stIds.indexOf(toId);
      if (idx1 >= 0 && idx2 >= 0) {
        if (line.stationKilos && line.stationKilos[fromId] !== undefined && line.stationKilos[toId] !== undefined) {
          const k1 = line.stationKilos[fromId];
          const k2 = line.stationKilos[toId];
          const dist = Math.abs(Math.round((k2 - k1) * 10) / 10);
          return { km: dist, line: line.name, lineId: line.id };
        }
      }
    }
    return null;
  }

  // 新幹線駅ペアの高速営業キロ算出 (LINESとofficial-kilosからO(1)で直接計算・非再帰)
  function calcShinkansenDistance(fromId, toId) {
    if (!fromId || !toId || fromId === toId || !LINES) return null;

    // 1. 同一新幹線路線上にある場合 (直通)
    const direct = calcDirectShinkansenDistance(fromId, toId);
    if (direct) return direct;

    // 2. 接続する主要新幹線路線跨ぎ (東海道〜山陽: 新大阪、山陽〜九州: 博多、東北〜北海道: 新青森、東海道〜東北: 東京)
    // 乗り継ぎハブを介して双方が同一路線上にある場合のみ合算 (非再帰)
    const throughBridges = [
      { hub: 'shin-osaka', name: '東海道・山陽新幹線', lineId: 'shinkansen-tokaido' },
      { hub: 'hakata', name: '山陽・九州新幹線', lineId: 'shinkansen-sanyo' },
      { hub: 'shin-aomori', name: '東北・北海道新幹線', lineId: 'shinkansen-tohoku' },
      { hub: 'tokyo', name: '東海道・東北新幹線', lineId: 'shinkansen-tokaido' }
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

  // ルートから関連する新幹線候補ペアを全国動的に抽出 (O(1) 高速版)
  function getRelevantShinkansenPairs(explicitDeptSt, explicitDestSt) {
    const passedStationIds = [];
    const addPassedId = (id) => {
      if (id && !passedStationIds.includes(id)) passedStationIds.push(id);
    };

    if (explicitDeptSt) addPassedId(typeof explicitDeptSt === 'string' ? explicitDeptSt : explicitDeptSt.id);
    if (explicitDestSt) addPassedId(typeof explicitDestSt === 'string' ? explicitDestSt : explicitDestSt.id);

    // 1. 発着駅・経由駅
    const deptInput = document.getElementById('route-dept-input');
    const destInput = document.getElementById('route-dest-input');
    if (deptInput && deptInput.getAttribute('data-id')) addPassedId(deptInput.getAttribute('data-id'));
    document.querySelectorAll('.route-via-input').forEach(inp => {
      if (inp.getAttribute('data-id')) addPassedId(inp.getAttribute('data-id'));
    });
    if (destInput && destInput.getAttribute('data-id')) addPassedId(destInput.getAttribute('data-id'));

    // 入力値の名前からも検索
    if (deptInput && deptInput.value.trim()) {
      const st = findStationByName(deptInput.value.trim());
      if (st) addPassedId(st.id);
    }
    document.querySelectorAll('.route-via-input').forEach(inp => {
      if (inp.value && inp.value.trim()) {
        const st = findStationByName(inp.value.trim());
        if (st) addPassedId(st.id);
      }
    });
    if (destInput && destInput.value.trim()) {
      const st = findStationByName(destInput.value.trim());
      if (st) addPassedId(st.id);
    }

    // 2. 直近の探索結果
    if (ROUTE_STATE.lastResult) {
      if (ROUTE_STATE.lastResult.allStationIds) {
        ROUTE_STATE.lastResult.allStationIds.forEach(id => addPassedId(id));
      }
      if (ROUTE_STATE.lastResult.sections) {
        ROUTE_STATE.lastResult.sections.forEach(sec => {
          if (sec.from) addPassedId(sec.from);
          if (sec.to) addPassedId(sec.to);
        });
      }
    }

    if (passedStationIds.length === 0) {
      return DEFAULT_SHINKANSEN_PAIRS;
    }

    // 新幹線駅の抽出（発着・経由駅を最優先）
    const priorityShIds = [];
    const otherShIds = [];
    const addShId = (stId, isPriority) => {
      if (!stId || !STATIONS[stId]) return;
      const st = STATIONS[stId];
      const isSh = st.lines && st.lines.some(l => l.startsWith('shinkansen-'));
      if (isSh) {
        if (isPriority && !priorityShIds.includes(stId)) {
          priorityShIds.push(stId);
        } else if (!isPriority && !priorityShIds.includes(stId) && !otherShIds.includes(stId)) {
          otherShIds.push(stId);
        }
      }
    };

    // 発着駅・経由駅およびその対応新幹線駅を高優先度として登録
    const endStationIds = [];
    if (explicitDeptSt) endStationIds.push(typeof explicitDeptSt === 'string' ? explicitDeptSt : explicitDeptSt.id);
    if (explicitDestSt) endStationIds.push(typeof explicitDestSt === 'string' ? explicitDestSt : explicitDestSt.id);
    if (deptInput && deptInput.getAttribute('data-id')) endStationIds.push(deptInput.getAttribute('data-id'));
    if (destInput && destInput.getAttribute('data-id')) endStationIds.push(destInput.getAttribute('data-id'));

    endStationIds.forEach(id => {
      addShId(id, true);
      const mapped = CITY_HUB_TO_SHINKANSEN[id];
      if (mapped) mapped.forEach(mid => addShId(mid, true));
    });

    // その他の通過駅
    passedStationIds.forEach(id => {
      if (!endStationIds.includes(id)) {
        addShId(id, false);
        const mapped = CITY_HUB_TO_SHINKANSEN[id];
        if (mapped) mapped.forEach(mid => addShId(mid, false));
      }
    });

    const shinkansenStationIds = [...priorityShIds, ...otherShIds];
    const candidates = [];
    const seenPairs = new Set();

    // 高優先駅同士のペアを最優先で探索
    const searchPairs = (idsList) => {
      for (let i = 0; i < idsList.length; i++) {
        for (let j = 0; j < idsList.length; j++) {
          if (i === j) continue;
          const fromId = idsList[i];
          const toId = idsList[j];
          const pairKey = [fromId, toId].sort().join('--');
          if (seenPairs.has(pairKey)) continue;

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
              lineId: shDist.lineId
            });
            if (candidates.length >= 8) return;
          }
        }
      }
    };

    if (priorityShIds.length >= 2) {
      searchPairs(priorityShIds);
    }
    if (candidates.length < 8 && shinkansenStationIds.length >= 2) {
      searchPairs(shinkansenStationIds);
    }

    // 候補が0件で1駅だけ新幹線駅がある場合、主要ハブとのペアを提案
    if (candidates.length === 0 && shinkansenStationIds.length === 1) {
      const singleId = shinkansenStationIds[0];
      const singleSt = STATIONS[singleId];
      const hubs = ['tokyo', 'ueno', 'omiya', 'sendai', 'morioka', 'shin-osaka', 'nagoya', 'hakata', 'kanazawa', 'takasaki', 'okayama', 'hiroshima'];
      for (const hubId of hubs) {
        if (hubId === singleId || !STATIONS[hubId]) continue;
        const pairKey = [singleId, hubId].sort().join('--');
        if (seenPairs.has(pairKey)) continue;
        const shDist = calcShinkansenDistance(singleId, hubId);
        if (shDist && shDist.km > 0) {
          seenPairs.add(pairKey);
          candidates.push({
            from: singleSt.name,
            to: STATIONS[hubId].name,
            fromId: singleId,
            toId: hubId,
            km: shDist.km,
            line: shDist.line,
            lineId: shDist.lineId
          });
          if (candidates.length >= 4) break;
        }
      }
    }

    return candidates.length > 0 ? candidates.slice(0, 8) : DEFAULT_SHINKANSEN_PAIRS;
  }

  // ルート連動の新幹線候補チップを描画 (向き反転ボタン ⇄ 完備)
  function updateShinkansenCandidateChips() {
    const container = document.getElementById('shinkansen-candidate-chips');
    if (!container) return;
    container.innerHTML = '';

    const candidates = getRelevantShinkansenPairs();
    const activeSegs = ROUTE_STATE.shinkansenSegments || [];

    candidates.forEach(pair => {
      const effPair = getEffectivePair(pair);
      const key = getPairKey(pair);

      // 指定中かどうかの判定 (順方向または逆方向のどちらかが指定中か)
      const activeIdx = activeSegs.findIndex(s =>
        (s.fromId === pair.fromId && s.toId === pair.toId) ||
        (s.fromId === pair.toId && s.toId === pair.fromId)
      );
      const isSelected = activeIdx >= 0;

      // 指定中の場合は、指定されている実際の向きをチップの表示に反映
      let displayFrom = effPair.from;
      let displayTo = effPair.to;
      let displayFromId = effPair.fromId;
      let displayToId = effPair.toId;

      if (isSelected) {
        displayFrom = activeSegs[activeIdx].fromName;
        displayTo = activeSegs[activeIdx].toName;
        displayFromId = activeSegs[activeIdx].fromId;
        displayToId = activeSegs[activeIdx].toId;
      }

      const chip = document.createElement('div');
      chip.className = 'shinkansen-chip' + (isSelected ? ' is-active' : '');

      const mainBtn = document.createElement('span');
      mainBtn.className = 'shinkansen-chip-main';
      mainBtn.innerHTML = `
        <span>🚄 ${displayFrom} → ${displayTo}</span>
        <span class="shinkansen-chip-sub">(${pair.km}km)</span>
      `;
      mainBtn.title = isSelected ? 'クリックで指定解除' : 'クリックで新幹線区間に指定';
      mainBtn.addEventListener('click', () => {
        toggleShinkansenSegment({
          ...pair,
          from: displayFrom,
          to: displayTo,
          fromId: displayFromId,
          toId: displayToId
        });
      });

      // 乗車駅と降車駅の向き反転ボタン (⇄)
      const swapBtn = document.createElement('button');
      swapBtn.type = 'button';
      swapBtn.className = 'shinkansen-chip-swap';
      swapBtn.innerHTML = '⇄';
      swapBtn.title = '乗車駅と降車駅の向きを反転 (⇄)';
      swapBtn.setAttribute('aria-label', '乗車駅と降車駅の向きを反転');
      swapBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isSelected) {
          // 指定中なら向きを反転して再探索
          swapShinkansenSegment(activeIdx);
        } else {
          // 未指定なら表示向きを反転
          const currentRev = !!effPair.isReversed;
          pairReversedMap.set(key, !currentRev);
          updateShinkansenCandidateChips();
          markInputChanged();
        }
      });

      chip.appendChild(mainBtn);
      chip.appendChild(swapBtn);
      container.appendChild(chip);
    });
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
        toggleRoutePanel(false);
      });
    }

    // 発駅入力サジェスト
    const deptInput = document.getElementById('route-dept-input');
    const deptSuggest = document.getElementById('route-dept-suggest');
    setupStationSuggest(deptInput, deptSuggest, (st) => {
      deptInput.value = st.name;
      deptInput.setAttribute('data-id', st.id);
      updateShinkansenCandidateChips();
      markInputChanged();
    });

    // 着駅入力サジェスト (同名駅は発駅からの直線距離を優先)
    const destInput = document.getElementById('route-dest-input');
    const destSuggest = document.getElementById('route-dest-suggest');
    setupStationSuggest(destInput, destSuggest, (st) => {
      destInput.value = st.name;
      destInput.setAttribute('data-id', st.id);
      updateShinkansenCandidateChips();
      markInputChanged();
    }, () => getDeptStation());

    // 各入力フィールドのクリアボタン (✕)
    document.querySelectorAll('.btn-input-clear').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const targetInput = document.getElementById(targetId);
        if (targetInput) {
          targetInput.value = '';
          targetInput.removeAttribute('data-id');
          targetInput.focus();
          updateShinkansenCandidateChips();
          markInputChanged();
        }
      });
    });

    // 経由駅追加ボタン (＋ 経由駅追加)
    const addViaBtn = document.getElementById('btn-add-via-field');
    if (addViaBtn) {
      addViaBtn.addEventListener('click', () => {
        addViaStationRow();
        markInputChanged();
      });
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
    if (shFromInput && shFromSuggest) {
      setupStationSuggest(shFromInput, shFromSuggest, (st) => {
        shFromInput.value = st.name;
        shFromInput.setAttribute('data-id', st.id);
        markInputChanged();
      }, () => getDeptStation());
    }
    if (shToInput && shToSuggest) {
      setupStationSuggest(shToInput, shToSuggest, (st) => {
        shToInput.value = st.name;
        shToInput.setAttribute('data-id', st.id);
        markInputChanged();
      }, () => getDeptStation());
    }

    // 新幹線区間の乗車駅・降車駅入れ替えボタン (⇄)
    const swapShInputsBtn = document.getElementById('btn-swap-shinkansen-inputs');
    if (swapShInputsBtn && shFromInput && shToInput) {
      swapShInputsBtn.addEventListener('click', () => {
        const fromVal = shFromInput.value;
        const fromId = shFromInput.getAttribute('data-id');
        const toVal = shToInput.value;
        const toId = shToInput.getAttribute('data-id');

        shFromInput.value = toVal;
        if (toId) shFromInput.setAttribute('data-id', toId);
        else shFromInput.removeAttribute('data-id');

        shToInput.value = fromVal;
        if (fromId) shToInput.setAttribute('data-id', fromId);
        else shToInput.removeAttribute('data-id');

        markInputChanged();
        shFromInput.focus();
      });
    }

    // 新幹線区間追加ボタン
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
        shFromInput.value = '';
        shFromInput.removeAttribute('data-id');
        shToInput.value = '';
        shToInput.removeAttribute('data-id');
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

    // 券種サイズ切り替えボタン (自動 / 85mm / 120mm)
    const sizeBtns = document.querySelectorAll('.size-btn');
    sizeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sizeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        ROUTE_STATE.ticketSizeMode = btn.getAttribute('data-size') || 'auto';
        if (ROUTE_STATE.lastResult) {
          renderMarsTicket(ROUTE_STATE.lastResult);
        }
      });
    });

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
        deptInput.value = st.name;
        deptInput.setAttribute('data-id', st.id);
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
        destInput.value = st.name;
        destInput.setAttribute('data-id', st.id);
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

    const deptPrint = fr.displayDeptName || result.deptName;
    const destPrint = fr.displayDestName || result.destName;
    const hasDeptSub = fr.deptZoneApplied && deptPrint !== result.deptName;
    const hasDestSub = fr.destZoneApplied && destPrint !== result.destName;
    const subRouteStr = (hasDeptSub || hasDestSub) ? `（実乗車：${result.deptName} → ${result.destName}）\n` : '';

    const actualKm = (result.actualKm !== undefined ? result.actualKm : result.totalKm).toFixed(1);
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
      `営業キロ：${actualKm} km（運賃計算キロ：${fareKm} km）`,
      `有効期間：${validityStr}（${stopoverStr}）`,
      `運賃：￥${displayFare.toLocaleString()}（${fareTypeName}）`,
      `経路数：${marsCount} / 16経路（${isMars ? 'マルス発券可' : '出札補充券'}）`,
      '======================================'
    ].filter(Boolean).join('\n');
  }

  // 会社記号の解決
  function getCompanySymbol(result) {
    let comp = null;
    if (result.deptId && STATIONS[result.deptId] && STATIONS[result.deptId].company) {
      comp = STATIONS[result.deptId].company;
    }
    if (!comp && result.sections && result.sections.length > 0) {
      const firstSec = result.sections[0];
      if (window.JR_FARE_ENGINE && window.JR_FARE_ENGINE.getLineCompany) {
        comp = window.JR_FARE_ENGINE.getLineCompany(
          firstSec.lineId,
          firstSec.lineName,
          firstSec.from || firstSec.deptId,
          firstSec.to || firstSec.destId,
          STATIONS
        );
      }
    }
    if (!comp && result.fareRules) {
      comp = result.fareRules.primaryCompany;
    }
    const symbols = {
      east: '[東]',
      central: '[海]',
      west: '[西]',
      hokkaido: '[北]',
      shikoku: '[四]',
      kyushu: '[九]'
    };
    return (comp && symbols[comp]) || '[東]';
  }
  if (typeof window !== 'undefined') {
    window.getCompanySymbol = getCompanySymbol;
  }

  // 本格マルス券面 & 内訳カードの描画
  function renderMarsTicket(result) {
    if (!result) return;
    const fr = result.fareRules || {};
    const fareType = ROUTE_STATE.currentFareType || 'adult';

    // 1. 会社記号
    const compSymbolEl = document.getElementById('ticket-company-symbol');
    if (compSymbolEl) {
      compSymbolEl.textContent = getCompanySymbol(result);
    }

    // 2. 券タイトル
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

    // 3. 発着駅表示（特定都区市内・山手線内）
    const deptNameEl = document.getElementById('ticket-dept-name');
    const deptSubEl = document.getElementById('ticket-dept-sub');
    const destNameEl = document.getElementById('ticket-dest-name');
    const destSubEl = document.getElementById('ticket-dest-sub');

    const displayDept = fr.displayDeptName || result.deptName;
    const displayDest = fr.displayDestName || result.destName;

    if (deptNameEl) deptNameEl.textContent = displayDept;
    if (destNameEl) destNameEl.textContent = displayDest;

    if (deptSubEl) {
      if (fr.deptZoneApplied && displayDept !== result.deptName) {
        deptSubEl.textContent = `実乗車: ${result.deptName}`;
        deptSubEl.style.display = 'block';
      } else {
        deptSubEl.textContent = '';
        deptSubEl.style.display = 'none';
      }
    }

    if (destSubEl) {
      if (fr.destZoneApplied && displayDest !== result.destName) {
        destSubEl.textContent = `実乗車: ${result.destName}`;
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
      childBadge.style.display = (fareType === 'child') ? 'inline-block' : 'none';
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

    // 6. 有効期間・途中下車印字
    const dateStr = ROUTE_STATE.ticketDate || getLocalISODate();
    const [y, m, d] = dateStr.split('-').map(Number);
    const validDays = fr.validityDays || 1;
    const validityTextEl = document.getElementById('ticket-validity-text');
    if (validityTextEl) {
      if (fr.isSuburbanOnly || validDays === 1) {
        validityTextEl.textContent = '発売当日限り有効';
      } else {
        const sDate = new Date(y, m - 1, d);
        const eDate = new Date(sDate);
        eDate.setDate(sDate.getDate() + validDays - 1);
        validityTextEl.textContent = `${m}月${d}日から ${validDays}日間有効 (${eDate.getMonth() + 1}月${eDate.getDate()}日まで有効)`;
      }
    }

    const stopoverTextEl = document.getElementById('ticket-stopover-text');
    if (stopoverTextEl) {
      stopoverTextEl.textContent = fr.stopoverAllowed ? '途中下車可能' : '下車前途無効';
    }

    // 7. 券サイズ（85mm / 120mm / 出札補充券）および自動改札マーク
    const marsCount = fr.marsRouteCount || (result.sections ? result.sections.length : 1);
    const marsStrLen = (result.marsString || '').length;
    const isMarsIssuable = fr.isMarsIssuable !== false && marsCount <= 16;

    let is120mm = false;
    if (ROUTE_STATE.ticketSizeMode === '120') {
      is120mm = true;
    } else if (ROUTE_STATE.ticketSizeMode === '85') {
      is120mm = false;
    } else {
      // auto: 経由7経路以上、または経由文字列28文字以上、または16経路超過
      is120mm = (marsCount >= 7 || marsStrLen >= 28 || !isMarsIssuable);
    }

    const ticketCard = document.getElementById('mars-ticket-card');
    if (ticketCard) {
      if (is120mm) ticketCard.classList.add('is-120mm');
      else ticketCard.classList.remove('is-120mm');

      if (!isMarsIssuable) ticketCard.classList.add('is-hojyu');
      else ticketCard.classList.remove('is-hojyu');
    }

    const sizeIndicator = document.getElementById('ticket-size-indicator');
    if (sizeIndicator) {
      if (!isMarsIssuable) {
        sizeIndicator.textContent = '出札補充券';
      } else if (is120mm) {
        sizeIndicator.textContent = '120mm券';
      } else {
        sizeIndicator.textContent = '85mm券';
      }
    }

    const gateSymbol = document.getElementById('ticket-gate-symbol');
    if (gateSymbol) {
      if (!fr.isAvailable) {
        gateSymbol.textContent = '×';
        gateSymbol.title = '発売不可（自動改札利用不可）';
        gateSymbol.style.color = '#b91c1c';
      } else if (!is120mm && isMarsIssuable) {
        gateSymbol.textContent = '□';
        gateSymbol.title = '自動改札対応';
        gateSymbol.style.color = '#1e3a8a';
      } else {
        gateSymbol.textContent = '×';
        gateSymbol.title = '自動改札非対応（有人改札専用）';
        gateSymbol.style.color = '#b91c1c';
      }
    }

    // 8. 券面メタフッター (1桁の月日のみハイフンを付けるマルス発売日仕様: 例 2026.-3.-9, 2026.11.22)
    const issueDateEl = document.getElementById('ticket-issue-date');
    if (issueDateEl) {
      const mStr = m < 10 ? `-${m}` : `${m}`;
      const dStr = d < 10 ? `-${d}` : `${d}`;
      issueDateEl.textContent = `${y}.${mStr}.${dStr}`;
    }

    const issueStEl = document.getElementById('ticket-issue-station');
    if (issueStEl) {
      issueStEl.textContent = `${result.deptName}駅＃１`;
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

    // 9. 内訳カード（fare-details-card）
    const marsCountBadge = document.getElementById('ticket-mars-count-badge');
    if (marsCountBadge) {
      if (marsCount <= 12) {
        marsCountBadge.textContent = `${marsCount} / 16 経路 (マルス可)`;
        marsCountBadge.className = 'mars-count-pill';
      } else if (marsCount <= 16) {
        marsCountBadge.textContent = `${marsCount} / 16 経路 (残少)`;
        marsCountBadge.className = 'mars-count-pill pill-warning';
      } else {
        marsCountBadge.textContent = `${marsCount} / 16 経路 (出札補充券扱い)`;
        marsCountBadge.className = 'mars-count-pill pill-danger';
      }
    }

    const actualKmEl = document.getElementById('spec-actual-km');
    if (actualKmEl) {
      const act = result.actualKm !== undefined ? result.actualKm : result.totalKm;
      actualKmEl.textContent = `${act.toFixed(1)} km`;
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
      if ((fr.trunkKm && fr.trunkKm > 0) || (fr.localKm && fr.localKm > 0)) {
        linesBreakdownItem.style.display = 'flex';
        linesBreakdownEl.textContent = `幹線 ${(fr.trunkKm || 0).toFixed(1)}km / 地通 ${(fr.localKm || 0).toFixed(1)}km`;
      } else {
        linesBreakdownItem.style.display = 'none';
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
          <span class="suggest-st-name">${st.name}</span>
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

          // 次マスへフォーカス移動 (勝手に探索は実行せず、手動の経路探索ボタンに任せる)
          e.preventDefault();
          const deptInput = document.getElementById('route-dept-input');
          const destInput = document.getElementById('route-dest-input');
          const viaInputs = Array.from(document.querySelectorAll('.route-via-input'));
          const searchBtn = document.getElementById('btn-search-route');

          if (inputEl === deptInput) {
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
          } else if (inputEl === destInput) {
            // 着駅の次は経路探索ボタンへフォーカス移動
            if (searchBtn && !searchBtn.disabled) {
              searchBtn.focus();
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

    clearBtn.addEventListener('click', () => {
      input.value = '';
      input.removeAttribute('data-id');
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
      input.value = st.name;
      input.setAttribute('data-id', st.id);
      updateShinkansenCandidateChips();
      markInputChanged();
    }, () => getDeptStation());

    if (initialStation) {
      input.value = initialStation.name;
      input.setAttribute('data-id', initialStation.id);
    }

    container.appendChild(row);
    updateViaStationNumbers();

    if (!initialStation) {
      input.focus();
    }
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
          <div class="route-section-stations">${sec.deptName} → ${sec.destName} (${sec.stationCount}駅)</div>
        </div>
        <div class="route-section-kilo" style="${isDup ? 'color:#dc2626;font-weight:800;' : ''}">${sec.km.toFixed(1)} km</div>
      `;

      item.addEventListener('click', () => {
        if (isDup && result.duplicatePolylines && result.duplicatePolylines.length > 0) {
          focusDuplicateSections(result);
          return;
        }
        if (sec.stations && sec.stations.length > 0) {
          const latlngs = sec.stations.map(id => {
            const st = STATIONS[id];
            return st ? [st.lat, st.lng] : null;
          }).filter(Boolean);
          if (latlngs.length > 0) {
            const b = L.latLngBounds(latlngs);
            map.fitBounds(b, { padding: [60, 60], maxZoom: 13, animate: true, duration: 0.8 });
          }
        }
      });
      sectionsList.appendChild(item);
    });

    resultContainer.style.display = 'block';

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
    if (deptInput) {
      deptInput.value = '';
      deptInput.removeAttribute('data-id');
    }
    if (destInput) {
      destInput.value = '';
      destInput.removeAttribute('data-id');
    }

    const viaContainer = document.getElementById('route-via-container');
    if (viaContainer) viaContainer.innerHTML = '';

    const errorMsg = document.getElementById('route-error-msg');
    if (errorMsg) errorMsg.style.display = 'none';

    const resultContainer = document.getElementById('route-result-container');
    if (resultContainer) resultContainer.style.display = 'none';

    // 新幹線区間指定と手動入力のリセット
    ROUTE_STATE.searchMode = 'shortest';
    ROUTE_STATE.shinkansenSegments = [];
    ROUTE_STATE.currentFareType = 'adult';
    ROUTE_STATE.ticketSizeMode = 'auto';

    const fareBtns = document.querySelectorAll('.fare-type-btn');
    fareBtns.forEach(b => {
      if (b.getAttribute('data-type') === 'adult') b.classList.add('active');
      else b.classList.remove('active');
    });

    const sizeBtns = document.querySelectorAll('.size-btn');
    sizeBtns.forEach(b => {
      if (b.getAttribute('data-size') === 'auto') b.classList.add('active');
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
    if (shFromInput) {
      shFromInput.value = '';
      shFromInput.removeAttribute('data-id');
    }
    if (shToInput) {
      shToInput.value = '';
      shToInput.removeAttribute('data-id');
    }
    renderShinkansenSegmentsList();
    updateShinkansenCandidateChips();

    document.querySelectorAll('.route-mode-btn').forEach(b => {
      if (b.getAttribute('data-mode') === 'shortest') {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    clearRouteMapLayers();
    setSearchButtonEnabled(true);
  }

  function resetAllMapStyles() {
    // 既存路線ポリラインのスタイルを完全に元通りに復元
    LINES.forEach(line => {
      const isShinkansen = line.category === 'shinkansen';
      const defaultWeight = isShinkansen ? 4 : 3;
      const pls = linePolylines.get(line.id);
      if (pls) {
        pls.forEach(pl => {
          pl.setStyle({
            color: line.color,
            weight: defaultWeight,
            opacity: 0.9,
            dashArray: isShinkansen ? '8, 6' : null
          });
        });
      }
    });

    // 駅マーカーのスタイルを元通りに復元
    lastMarkerZoom = null;
    lastLineWeightZoom = null;
    updateStationMarkerSizes();
  }

  function clearRouteMapLayers() {
    ROUTE_STATE.lastResult = null;

    // 経路ハイライトポリライン（通常・新幹線・重複区間）を確実に削除
    if (ROUTE_STATE.activeRouteLayers && ROUTE_STATE.activeRouteLayers.length > 0) {
      ROUTE_STATE.activeRouteLayers.forEach(layer => {
        try {
          map.removeLayer(layer);
        } catch (e) {
          console.warn('Failed to remove route layer:', e);
        }
      });
    }
    ROUTE_STATE.activeRouteLayers = [];

    // 発・経由・着ピンマーカーを確実に削除
    if (ROUTE_STATE.activePinLayers && ROUTE_STATE.activePinLayers.length > 0) {
      ROUTE_STATE.activePinLayers.forEach(layer => {
        try {
          map.removeLayer(layer);
        } catch (e) {
          console.warn('Failed to remove pin layer:', e);
        }
      });
    }
    ROUTE_STATE.activePinLayers = [];

    // 地図の通常スタイルおよびラベルを復元
    resetAllMapStyles();
    updateLineWeights();
    updateStationMarkerSizes();
    updateLabelsVisibility();
    updateLineLabelsVisibility();
  }

  // 重複区間への自動フォーカス (ズーム & パン)
  function focusDuplicateSections(result) {
    if (!result) return;
    const dupCoords = [];
    if (result.duplicatePolylines && result.duplicatePolylines.length > 0) {
      result.duplicatePolylines.forEach(chain => {
        dupCoords.push(...chain);
      });
    }
    if (dupCoords.length === 0 && result.duplicateStationIds && result.duplicateStationIds.length > 0) {
      result.duplicateStationIds.forEach(id => {
        const st = STATIONS[id];
        if (st) dupCoords.push([st.lat, st.lng]);
      });
    }
    if (dupCoords.length > 0) {
      const bounds = L.latLngBounds(dupCoords);
      map.fitBounds(bounds, {
        padding: [80, 80],
        maxZoom: 13,
        animate: true,
        duration: 0.8
      });
    }
  }

  function drawRouteOnMap(result) {
    // 既存のルート用レイヤーとピンを除去
    ROUTE_STATE.activeRouteLayers.forEach(layer => map.removeLayer(layer));
    ROUTE_STATE.activeRouteLayers = [];
    ROUTE_STATE.activePinLayers.forEach(layer => map.removeLayer(layer));
    ROUTE_STATE.activePinLayers = [];

    if (!result || !result.geometryLatlngs || result.geometryLatlngs.length === 0) return;

    // ★重要: ルート探索結果を状態に保持 (ズーム時や移動時にハイライトが消えないようにする)
    ROUTE_STATE.lastResult = result;

    // 1. 全路線を薄くフェードアウト (選択されたルートを際立たせる)
    LINES.forEach(line => {
      const pls = linePolylines.get(line.id);
      if (pls) {
        pls.forEach(pl => {
          pl.setStyle({
            opacity: 0.12,
            weight: 1.8
          });
        });
      }
    });

    // 経路ハイライト時は通常の駅丸印マーカーを非表示 (レイヤーごと外して0コスト化)
    if (map.hasLayer(stationsLayerGroup)) {
      map.removeLayer(stationsLayerGroup);
    }

    // 2. 選択経路の通常区間: 極太ハイライト (幅広グロー + コアライン + 芯線)
    const normalCoordsList = (result.normalPolylines && result.normalPolylines.length > 0)
      ? result.normalPolylines
      : (result.geometryLatlngs.length > 0 ? [result.geometryLatlngs] : []);

    normalCoordsList.forEach(coords => {
      // 外側ワイド発光グロー (太さ 16px、シアン発光)
      const glow = L.polyline(coords, {
        renderer: routeCanvasRenderer,
        color: '#00ffff',
        weight: 16,
        opacity: 0.6,
        lineCap: 'round',
        lineJoin: 'round',
        pane: 'routePane',
        className: 'route-glow-path',
        interactive: false
      }).addTo(map);

      // 中間メインコアライン (太さ 9px の力強い鮮烈ブルー)
      const core = L.polyline(coords, {
        renderer: routeCanvasRenderer,
        color: '#0284c7',
        weight: 9,
        opacity: 1.0,
        lineCap: 'round',
        lineJoin: 'round',
        pane: 'routePane',
        interactive: false
      }).addTo(map);

      // 最上面ハイライト光沢芯線 (太さ 3px の白水色)
      const shine = L.polyline(coords, {
        renderer: routeCanvasRenderer,
        color: '#e0f2fe',
        weight: 3,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        pane: 'routePane',
        interactive: false
      }).addTo(map);

      ROUTE_STATE.activeRouteLayers.push(glow, core, shine);
    });

    // 2-B. 選択経路の新幹線区間: 新幹線専用ハイライト (ロイヤルブルーグロー + 濃紺メインコア + 白高速ダッシュ破線ストライプ)
    if (result.shinkansenPolylines && result.shinkansenPolylines.length > 0) {
      result.shinkansenPolylines.forEach(coords => {
        // 外側ロイヤルブルーワイドグロー (太さ 16px)
        const shGlow = L.polyline(coords, {
          renderer: routeCanvasRenderer,
          color: '#3b82f6',
          weight: 16,
          opacity: 0.65,
          lineCap: 'round',
          lineJoin: 'round',
          pane: 'routePane',
          className: 'route-shinkansen-glow',
          interactive: false
        }).addTo(map);

        // 新幹線メインコアライン (太さ 10px の力強い濃紺ロイヤルネイビー #003399)
        const shCore = L.polyline(coords, {
          renderer: routeCanvasRenderer,
          color: '#003399',
          weight: 10,
          opacity: 1.0,
          lineCap: 'round',
          lineJoin: 'round',
          pane: 'routePane',
          className: 'route-shinkansen-core',
          interactive: false
        }).addTo(map);

        // 新幹線シンボル: 白の高速ストライプ破線 (太さ 3.5px、ダッシュ '9, 7')
        const shStripe = L.polyline(coords, {
          renderer: routeCanvasRenderer,
          color: '#ffffff',
          weight: 3.5,
          opacity: 0.95,
          dashArray: '9, 7',
          lineCap: 'butt',
          lineJoin: 'round',
          pane: 'routePane',
          className: 'route-shinkansen-stripe',
          interactive: false
        }).addTo(map);

        ROUTE_STATE.activeRouteLayers.push(shGlow, shCore, shStripe);
      });
    }

    // 3. 重複区間: 極太警告ハイライト (太さ 10px の警告レッド + 白ストライプ破線)
    if (result.duplicatePolylines && result.duplicatePolylines.length > 0) {
      result.duplicatePolylines.forEach(coords => {
        // 赤色ワイドグロー (太さ 18px)
        const dupGlow = L.polyline(coords, {
          renderer: routeCanvasRenderer,
          color: '#ef4444',
          weight: 18,
          opacity: 0.7,
          lineCap: 'round',
          lineJoin: 'round',
          pane: 'routePane',
          className: 'route-duplicate-path',
          interactive: false
        }).addTo(map);

        // 赤色メインコア (太さ 10px の深紅)
        const dupCore = L.polyline(coords, {
          renderer: routeCanvasRenderer,
          color: '#dc2626',
          weight: 10,
          opacity: 1.0,
          lineCap: 'round',
          lineJoin: 'round',
          pane: 'routePane',
          className: 'route-duplicate-core',
          interactive: false
        }).addTo(map);

        // 中央ストライプ破線 (太さ 3.5px のホワイト破線)
        const dupStripe = L.polyline(coords, {
          renderer: routeCanvasRenderer,
          color: '#ffffff',
          weight: 3.5,
          opacity: 0.95,
          dashArray: '7, 7',
          lineCap: 'butt',
          lineJoin: 'round',
          pane: 'routePane',
          interactive: false
        }).addTo(map);

        ROUTE_STATE.activeRouteLayers.push(dupGlow, dupCore, dupStripe);
      });
    }

    // 4. 発駅ピン
    const deptSt = STATIONS[result.deptId];
    if (deptSt) {
      const deptIcon = L.divIcon({
        className: 'route-map-pin dept-pin',
        html: '発',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      const deptMarker = L.marker([deptSt.lat, deptSt.lng], { icon: deptIcon, pane: 'routePinPane', zIndexOffset: 2000 })
        .addTo(map)
        .bindTooltip(`発駅: ${deptSt.name}`, { direction: 'top', offset: [0, -14] });
      ROUTE_STATE.activePinLayers.push(deptMarker);
    }

    // 5. 経由駅ピン
    if (result.viaIds && result.viaIds.length > 0) {
      result.viaIds.forEach((vId, idx) => {
        const vSt = STATIONS[vId];
        if (!vSt) return;
        const viaIcon = L.divIcon({
          className: 'route-map-pin via-pin',
          html: (idx + 1).toString(),
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });
        const viaMarker = L.marker([vSt.lat, vSt.lng], { icon: viaIcon, pane: 'routePinPane', zIndexOffset: 1900 })
          .addTo(map)
          .bindTooltip(`経由${idx + 1}: ${vSt.name}`, { direction: 'top', offset: [0, -13] });
        ROUTE_STATE.activePinLayers.push(viaMarker);
      });
    }

    // 6. 着駅ピン
    const destSt = STATIONS[result.destId];
    if (destSt) {
      const destIcon = L.divIcon({
        className: 'route-map-pin dest-pin',
        html: '着',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      const destMarker = L.marker([destSt.lat, destSt.lng], { icon: destIcon, pane: 'routePinPane', zIndexOffset: 2000 })
        .addTo(map)
        .bindTooltip(`着駅: ${destSt.name}`, { direction: 'top', offset: [0, -14] });
      ROUTE_STATE.activePinLayers.push(destMarker);
    }

    // 7. 選択経路全体を画面内に自動フォーカス (FitBounds)
    if (result.geometryLatlngs.length >= 2) {
      const bounds = L.latLngBounds(result.geometryLatlngs);
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 13,
        animate: true,
        duration: 0.8
      });
    }

    // 8. ルート通過駅の駅名ラベルを優先表示
    updateLabelsVisibility();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
