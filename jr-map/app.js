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

  // 参照マップ
  const linePolylines = new Map(); // lineId -> [L.Polyline]
  const stationMarkers = new Map(); // stationId -> L.CircleMarker
  const stationLabels = new Map(); // stationId -> L.Marker (DivIcon)

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

    normalizeStationPrefectures();
    initMap();
    buildAdjacentStationsIndex();
    renderCategoryTabs();
    renderLineChips();
    setupEventHandlers();
    initRouteEngineUI();
    drawBorders();
    updateMapLayers();
    updateLabelsVisibility();
    updateLineLabelsVisibility();
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
      attributionControl: true
    });

    // レイヤーグループを下の層から順に追加
    bordersLayerGroup = L.layerGroup().addTo(map);
    linesLayerGroup = L.layerGroup().addTo(map);
    lineLabelsLayerGroup = L.layerGroup().addTo(map);
    stationsLayerGroup = L.layerGroup().addTo(map);
    labelsLayerGroup = L.layerGroup().addTo(map);

    map.on('zoomend', () => {
      updateLabelsVisibility();
      updateLineLabelsVisibility();
      updateStationMarkerSizes();
      updateLineWeights();
    });

    map.on('moveend', () => {
      updateLabelsVisibility();
      updateLineLabelsVisibility();
    });

    map.on('click', (e) => {
      if (e.originalEvent && e.originalEvent._handledByElement) return;
      closeStationSheet();
      closeLineBanner();
    });
  }

  // =======================================================
  // 1.5 駅都道府県データの自動補正 (国土地理院 行政界ポリゴン判定)
  // =======================================================
  function normalizeStationPrefectures() {
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
  // 2. リアル行政境界線 & 海岸線の描画 (国土地理院データ)
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
    labelsLayerGroup.clearLayers();
    linePolylines.clear();
    stationMarkers.clear();
    stationLabels.clear();

    drawLines();
    setupLineLabels();
    drawStations();
    updateStationMarkerSizes();
    updateLabelsVisibility();
    updateLineLabelsVisibility();
  }

  // 路線ポリラインの描画 (国土交通省公式実線路ジオメトリ & リアルなカーブ・迂回を忠実に再現)
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

  // 駅マーカー & テキストラベルの描画
  function drawStations() {
    Object.values(STATIONS).forEach(st => {
      const isMega = TIER1_MEGA_HUBS.has(st.id) || TIER1_STATION_NAMES.has(st.name);
      const isMajor = TIER2_MAJOR_HUBS.has(st.id) || TIER2_STATION_NAMES.has(st.name);

      const fillColor = '#ffffff';
      const strokeColor = isMega ? '#e11d48' : (isMajor ? '#f59e0b' : '#64748b');

      // サークルマーカー
      const marker = L.circleMarker([st.lat, st.lng], {
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

      // 駅名テキストラベル (DivIcon)
      const labelIcon = L.divIcon({
        className: `station-label ${isMega ? 'hub-label' : 'regular-label'}`,
        html: `<span>${st.name}</span>`,
        iconSize: [110, 16],
        iconAnchor: [-8, 8]
      });

      const labelMarker = L.marker([st.lat, st.lng], {
        icon: labelIcon,
        interactive: false
      });

      labelMarker.addTo(labelsLayerGroup);
      stationLabels.set(st.id, labelMarker);
    });
  }

  // ズームレベルに応じた駅マーカーの表示・サイズ動的調整 (ズームアウト時の駅丸印非表示)
  function updateStationMarkerSizes() {
    const zoom = map.getZoom();

    // ルート探索結果が表示されている場合は、通過駅・未通過駅のスタイルを維持
    if (ROUTE_STATE && ROUTE_STATE.lastResult) {
      const passedStationSet = new Set(ROUTE_STATE.lastResult.allStationIds || []);
      const dupStationSet = new Set(ROUTE_STATE.lastResult.duplicateStationIds || []);
      stationMarkers.forEach((marker, stId) => {
        if (passedStationSet.has(stId)) {
          const isDup = dupStationSet.has(stId);
          marker.setStyle({
            color: isDup ? '#ef4444' : '#0284c7',
            weight: 2.5,
            opacity: 1.0,
            fillColor: '#ffffff',
            fillOpacity: 1.0,
            radius: isDup ? 5.5 : 4.5
          });
          marker.bringToFront();
        } else {
          marker.setStyle({
            opacity: 0.1,
            fillOpacity: 0.08
          });
        }
      });
      return;
    }

    stationMarkers.forEach((marker, stId) => {
      const el = marker.getElement();
      const st = STATIONS[stId];
      const isSelected = STATE.selectedStationId === stId;
      const isMega = TIER1_MEGA_HUBS.has(stId) || (st && TIER1_STATION_NAMES.has(st.name));
      const isMajor = TIER2_MAJOR_HUBS.has(stId) || (st && TIER2_STATION_NAMES.has(st.name));
      const belongsToSelectedLine = STATE.selectedLineId && st && st.lines.includes(STATE.selectedLineId);

      // ズームアウト時の駅マーカー表示判定 (Google Maps風・ズームアウト時は駅◯を完全排除)
      let visible = false;
      let radius = 3.5;
      let opacity = 1;

      if (isSelected) {
        visible = true;
        radius = 5.5;
      } else if (zoom <= 9) {
        // ズームアウト時 (全国・地方広域 zoom <= 9): 駅の◯は完全非表示
        visible = false;
      } else if (zoom <= 11) {
        // 中域 (zoom 10〜11): 主要ハブ駅または選択路線の駅のみ控えめに表示
        if (isMega || (zoom >= 11 && (isMajor || belongsToSelectedLine))) {
          visible = true;
          radius = isMega ? 4.5 : 3.5;
        } else {
          visible = false;
        }
      } else if (zoom <= 12) {
        // 都市圏 (zoom 12): 主要駅・乗換駅・選択路線の駅を表示
        if (isMega || isMajor || belongsToSelectedLine || (st && st.lines && st.lines.length >= 2)) {
          visible = true;
          radius = isMega ? 5.5 : 4;
        } else {
          visible = false;
        }
      } else {
        // ズームイン (zoom >= 13): 全駅を表示
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

      if (el) {
        el.style.display = visible ? '' : 'none';
      }
    });
  }

  // ズームレベル & 画面内衝突判定に応じた動的駅名ラベル表示 (完全重なり防止)
  function updateLabelsVisibility() {
    if (!map) return;

    const currentZoom = map.getZoom();
    const mapSize = map.getSize();
    const width = mapSize.x;
    const height = mapSize.y;

    // 画面外マージン (-30px 〜 width + 30px)
    const minX = -30;
    const maxX = width + 30;
    const minY = -20;
    const maxY = height + 20;

    // ズームレベルに応じた最低優先度スコアの動的設定
    // ズームアウト時は全国・広域の主要駅のみ、ズームインするにつれて全駅が対象に
    let minScore = 0;
    if (currentZoom <= 6) {
      minScore = 180; // 全国新幹線: 超主要ハブのみ
    } else if (currentZoom <= 8) {
      minScore = 110; // 広域: 主要ハブターミナル
    } else if (currentZoom <= 10) {
      minScore = 50;  // 関東全域: 乗換駅・主要駅
    } else if (currentZoom <= 12) {
      minScore = 25;  // 中域都市部: 拠点駅
    } else {
      minScore = 0;   // ズームイン(13以上): 全駅が候補（重ならない限りすべて表示）
    }

    // 画面内にある候補駅を収集してスコア計算
    const candidates = [];

    stationLabels.forEach((labelMarker, stId) => {
      const st = STATIONS[stId];
      if (!st) return;

      const isSelected = STATE.selectedStationId === stId;
      const belongsToSelectedLine = STATE.selectedLineId && st.lines.includes(STATE.selectedLineId);

      // 画面上のピクセル座標を取得
      const pt = map.latLngToContainerPoint([st.lat, st.lng]);

      // 画面外の駅は即座に非表示
      if (pt.x < minX || pt.x > maxX || pt.y < minY || pt.y > maxY) {
        const el = labelMarker.getElement();
        if (el) el.style.display = 'none';
        return;
      }

      // 駅の優先度スコア計算
      let score = 0;
      if (isSelected) {
        score += 10000; // 選択駅は最優先
      } else {
        if (belongsToSelectedLine) {
          score += 500; // 選択路線上の駅を優先
        }
        if (TIER1_MEGA_HUBS.has(stId) || TIER1_STATION_NAMES.has(st.name)) {
          score += 200;
        } else if (TIER2_MAJOR_HUBS.has(stId) || TIER2_STATION_NAMES.has(st.name)) {
          score += 120;
        } else if (TIER3_LOCAL_HUBS.has(stId)) {
          score += 70;
        } else if (st.hub) {
          score += 40;
        }
        // 乗り入れ路線数が多い駅ほど優先
        score += (st.lines ? st.lines.length : 1) * 8;
      }

      // 選択中または選択路線所属ならスコア基準に関係なく表示候補に
      if (isSelected || belongsToSelectedLine || score >= minScore) {
        candidates.push({
          stId,
          st,
          labelMarker,
          pt,
          score,
          isSelected
        });
      } else {
        const el = labelMarker.getElement();
        if (el) el.style.display = 'none';
      }
    });

    // 優先度が高い順にソート (主要駅を優先して配置)
    candidates.sort((a, b) => b.score - a.score);

    // 画面上の配置済みバウンディングボックス一覧
    const placedBoxes = [];

    // 衝突判定と表示・非表示の適用
    candidates.forEach(cand => {
      const el = cand.labelMarker.getElement();
      if (!el) return;

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
        el.style.display = 'block';
        el.style.zIndex = '1000';
        placedBoxes.push(box);
        placedBoxes.push({
          x1: cand.pt.x - 9,
          y1: cand.pt.y - 9,
          x2: cand.pt.x + 9,
          y2: cand.pt.y + 9
        });
        return;
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
        // 重なりなし: ラベルを表示し、バウンディングボックスを登録
        el.style.display = 'block';
        placedBoxes.push(box);
        // 駅マーカー本体の周囲も障害物として登録（路線名ラベルが駅丸印に被らないようにする）
        placedBoxes.push({
          x1: cand.pt.x - 7,
          y1: cand.pt.y - 7,
          x2: cand.pt.x + 7,
          y2: cand.pt.y + 7
        });
      } else {
        // 重なりあり: 非表示にして可読性を確保
        el.style.display = 'none';
      }
    });

    STATE.placedStationBoxes = placedBoxes;
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

  // 路線名ラベルの構築 (SVG textPath による完全な曲線追従 & 文字重なり防止 & 局所正立化)
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
      const tier = isShinkansen ? 1 : (TIER2_MAJOR_TRUNK.has(line.id) ? 2 : (TIER3_REGIONAL_TRUNK.has(line.id) ? 3 : 4));
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

      // 長大路線 (新幹線または100頂点以上) は広域・地域双方で見えるよう2箇所に配置、他は中央1箇所
      const isLongLine = isShinkansen || totalPts >= 100;
      const candidateRatios = isLongLine
        ? [findSmoothOffsetRatio(rawGuidePts, 0.35), findSmoothOffsetRatio(rawGuidePts, 0.68)]
        : [findSmoothOffsetRatio(rawGuidePts, 0.50)];

      const uniqueRatios = [];
      candidateRatios.forEach(r => {
        if (!uniqueRatios.some(u => Math.abs(u - r) < 0.15)) {
          uniqueRatios.push(r);
        }
      });

      uniqueRatios.forEach((ratio, slotIdx) => {
        const centerIdx = Math.floor(totalPts * ratio);

        // 各ラベルスロット地点を中心として十分な長さ（前後25頂点）の局所区間を抽出
        const halfWindow = Math.min(25, Math.floor(totalPts / 2));
        const startIdx = Math.max(0, centerIdx - halfWindow);
        const endIdx = Math.min(totalPts, centerIdx + halfWindow);
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

        // スロット専用の正立ガイドポリラインを作成
        const guidePoly = L.polyline(smoothed, {
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

  // ズームレベル & 衝突判定に応じた動的路線名表示 (Google Maps仕様)
  // zoom <= 8: 新幹線のみ
  // zoom 9〜10: 新幹線 + 主要幹線
  // zoom 11〜12: 新幹線 + 主要幹線 + 地域幹線
  // zoom >= 13: 全路線 (ローカル線・支線を含む全線)
  // 駅名ラベル・駅マーカーおよび他路線名との完全矩形衝突判定により重なりを100%防止
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

    // 表示候補のフィルタリング
    const candidates = [];

    textElems.forEach(elem => {
      const lineId = elem.getAttribute('data-line-id');
      const tier = parseInt(elem.getAttribute('data-tier'), 10) || 4;
      const isSelected = selectedId === lineId;
      const lat = parseFloat(elem.getAttribute('data-lat'));
      const lng = parseFloat(elem.getAttribute('data-lng'));
      const nameLen = parseInt(elem.getAttribute('data-name-len'), 10) || 4;

      let meetsZoom = false;
      if (isSelected) {
        meetsZoom = true;
      } else if (tier === 1) { // 新幹線
        meetsZoom = (zoom >= 5);
      } else if (tier === 2) { // 主要幹線
        meetsZoom = (zoom >= 9);
      } else if (tier === 3) { // 地域幹線
        meetsZoom = (zoom >= 11);
      } else { // ローカル線
        meetsZoom = (zoom >= 13);
      }

      if (!meetsZoom || isNaN(lat) || isNaN(lng)) {
        elem.style.display = 'none';
        elem.classList.remove('active-line-text');
        return;
      }

      // 画面上のピクセル位置
      const pt = map.latLngToContainerPoint([lat, lng]);

      // 画面外マージン (-40px 〜 width + 40px)
      if (pt.x < -40 || pt.x > width + 40 || pt.y < -30 || pt.y > height + 30) {
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
        isSelected,
        pt,
        nameLen,
        priority
      });
    });

    // 優先度順（選択路線 > 新幹線 > 主要幹線 > 地域幹線 > ローカル線）にソート
    candidates.sort((a, b) => b.priority - a.priority);

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
      } else {
        cand.elem.style.display = 'none';
      }
    });
  }

  // ズームレベルに応じた線幅の調整
  function updateLineWeights() {
    const zoom = map.getZoom();
    const baseWeight = zoom >= 14 ? 5 : (zoom >= 11 ? 3.5 : (zoom <= 8 ? 2 : 2.5));

    // ルート探索結果が表示されている場合は、全未選択路線のディムアウト状態を維持
    if (ROUTE_STATE && ROUTE_STATE.lastResult) {
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
  // 6. カテゴリー & 路線フィルター
  // =======================================================
  function renderCategoryTabs() {
    const container = document.getElementById('category-tabs');
    if (!container) return;
    container.innerHTML = '';

    CATEGORIES.forEach(cat => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `cat-tab ${cat.id === STATE.currentCategory ? 'active' : ''}`;
      btn.innerHTML = `${cat.icon ? `<span>${cat.icon}</span> ` : ''}<span>${cat.name}</span>`;
      btn.addEventListener('click', () => {
        setCategory(cat.id);
      });
      container.appendChild(btn);
    });
  }

  function renderLineChips() {
    const container = document.getElementById('line-chips');
    if (!container) return;
    container.innerHTML = '';

    const linesToDisplay = STATE.currentCategory === 'all'
      ? LINES
      : LINES.filter(l => l.category === STATE.currentCategory);

    if (STATE.selectedLineId) {
      const clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'line-chip active';
      clearBtn.innerHTML = `<span>✕ 選択解除</span>`;
      clearBtn.addEventListener('click', () => {
        selectLine(null);
      });
      container.appendChild(clearBtn);
    }

    linesToDisplay.forEach(line => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `line-chip ${line.id === STATE.selectedLineId ? 'active' : ''}`;
      btn.style.setProperty('--chip-color', line.color);
      btn.innerHTML = `<span class="line-color-dot" style="background:${line.color}"></span> <span>${line.name}</span>`;
      btn.addEventListener('click', () => {
        if (STATE.selectedLineId === line.id) {
          selectLine(null);
        } else {
          selectLine(line.id);
        }
      });
      container.appendChild(btn);
    });
  }

  function setCategory(catId) {
    STATE.currentCategory = catId;
    renderCategoryTabs();
    renderLineChips();
  }

  // 路線ハイライト選択
  function selectLine(lineId) {
    STATE.selectedLineId = lineId;
    renderLineChips();

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
  // 8. 駅名インクリメンタル検索
  // =======================================================
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

      const matches = Object.values(STATIONS).filter(st => {
        return (
          st.name.includes(q) ||
          st.kana.includes(q) ||
          st.en.toLowerCase().includes(q)
        );
      }).slice(0, 8);

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

    document.querySelectorAll('.btn-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const viewKey = btn.getAttribute('data-view');
        if (PRESETS[viewKey]) {
          STATE.currentPreset = viewKey;
          map.flyTo(PRESETS[viewKey].center, PRESETS[viewKey].zoom, { duration: 0.8 });
        }
      });
    });

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

  // =======================================================
  // 9. マルス経路探索 UI & 地図連携
  // =======================================================
  const ROUTE_STATE = {
    isOpen: false,
    useShinkansen: true,
    searchMode: 'shortest',
    activeRouteLayers: [],
    activePinLayers: [],
    lastResult: null
  };

  function initRouteEngineUI() {
    if (!window.JR_ROUTE_ENGINE) {
      console.warn('JR_ROUTE_ENGINE is not loaded.');
      return;
    }

    // グラフ構築 (STATIONS と LINES から)
    window.JR_ROUTE_ENGINE.buildGraph(STATIONS, LINES);

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
    });

    // 着駅入力サジェスト
    const destInput = document.getElementById('route-dest-input');
    const destSuggest = document.getElementById('route-dest-suggest');
    setupStationSuggest(destInput, destSuggest, (st) => {
      destInput.value = st.name;
      destInput.setAttribute('data-id', st.id);
    });

    // 各入力フィールドのクリアボタン (✕)
    document.querySelectorAll('.btn-input-clear').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const targetInput = document.getElementById(targetId);
        if (targetInput) {
          targetInput.value = '';
          targetInput.removeAttribute('data-id');
          targetInput.focus();
        }
      });
    });

    // 経由駅追加ボタン (＋ 経由駅追加)
    const addViaBtn = document.getElementById('btn-add-via-field');
    if (addViaBtn) {
      addViaBtn.addEventListener('click', () => {
        addViaStationRow();
      });
    }

    // 探索モード切り替えボタン (最短経路 / 重複区間なし)
    const modeBtns = document.querySelectorAll('.route-mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-mode') || 'shortest';
        ROUTE_STATE.searchMode = mode;
        const deptInput = document.getElementById('route-dept-input');
        const destInput = document.getElementById('route-dest-input');
        if (deptInput && deptInput.value.trim() && destInput && destInput.value.trim()) {
          executeRouteSearch();
        }
      });
    });

    // 新幹線利用チェックボックス
    const shinkansenChk = document.getElementById('chk-use-shinkansen');
    if (shinkansenChk) {
      shinkansenChk.addEventListener('change', (e) => {
        ROUTE_STATE.useShinkansen = e.target.checked;
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

    // コピーボタン
    const copyBtn = document.getElementById('btn-copy-ticket');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        if (!ROUTE_STATE.lastResult || !ROUTE_STATE.lastResult.marsString) return;
        const text = ROUTE_STATE.lastResult.marsString;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'コピー済';
            setTimeout(() => {
              copyBtn.textContent = originalText;
            }, 1500);
          }).catch(() => {
            copyFallback(text, copyBtn);
          });
        } else {
          copyFallback(text, copyBtn);
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
    } else {
      panel.style.display = 'none';
      if (toggleBtn) toggleBtn.classList.remove('active');
    }
  }

  function setupStationSuggest(inputEl, dropdownEl, onSelectCallback) {
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

      currentMatches = Object.values(STATIONS).filter(st => {
        return (
          st.name.includes(q) ||
          st.kana.includes(q) ||
          st.en.toLowerCase().includes(q)
        );
      }).slice(0, 8);

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
    });

    inputEl.addEventListener('keydown', (e) => {
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
          // ドロップダウン非表示時の Enter: 次マスへ移動、または即座に経路探索を実行
          e.preventDefault();
          const deptInput = document.getElementById('route-dept-input');
          const destInput = document.getElementById('route-dest-input');
          const viaInputs = Array.from(document.querySelectorAll('.route-via-input'));

          if (inputEl === deptInput) {
            // 発駅: 経由駅があれば最初の経由駅、なければ着駅へ移動（両方入力済なら探索）
            if (destInput && destInput.value.trim()) {
              executeRouteSearch();
            } else if (viaInputs.length > 0) {
              viaInputs[0].focus();
            } else if (destInput) {
              destInput.focus();
            }
          } else if (inputEl.classList.contains('route-via-input')) {
            // 経由駅: 次の経由駅、なければ着駅へ移動（着駅入力済なら探索）
            const currentIdx = viaInputs.indexOf(inputEl);
            if (currentIdx >= 0 && currentIdx < viaInputs.length - 1) {
              viaInputs[currentIdx + 1].focus();
            } else if (destInput && !destInput.value.trim()) {
              destInput.focus();
            } else {
              executeRouteSearch();
            }
          } else if (inputEl === destInput) {
            // 着駅: 即座に経路探索を実行
            executeRouteSearch();
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
    });

    removeBtn.addEventListener('click', () => {
      container.removeChild(row);
      updateViaStationNumbers();
      const deptInput = document.getElementById('route-dept-input');
      const destInput = document.getElementById('route-dest-input');
      if (deptInput && deptInput.value.trim() && destInput && destInput.value.trim()) {
        executeRouteSearch();
      }
    });

    // キーボード操作: Backspaceで空行削除、Alt+↑/↓で経由駅順序並び替え
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value) {
        e.preventDefault();
        const prevRow = row.previousElementSibling;
        const prevInput = prevRow ? prevRow.querySelector('.route-via-input') : document.getElementById('route-dept-input');
        container.removeChild(row);
        updateViaStationNumbers();
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
          input.focus();
          const deptInput = document.getElementById('route-dept-input');
          const destInput = document.getElementById('route-dest-input');
          if (deptInput && deptInput.value.trim() && destInput && destInput.value.trim()) {
            executeRouteSearch();
          }
        }
      } else if (e.altKey && e.key === 'ArrowDown') {
        // Alt + ArrowDown: 1つ下の経由駅と順序入れ替え
        const nextRow = row.nextElementSibling;
        if (nextRow && nextRow.classList.contains('via-row')) {
          e.preventDefault();
          container.insertBefore(nextRow, row);
          updateViaStationNumbers();
          input.focus();
          const deptInput = document.getElementById('route-dept-input');
          const destInput = document.getElementById('route-dest-input');
          if (deptInput && deptInput.value.trim() && destInput && destInput.value.trim()) {
            executeRouteSearch();
          }
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

      // 並び替え完了後に自動再探索
      const deptInput = document.getElementById('route-dept-input');
      const destInput = document.getElementById('route-dest-input');
      if (deptInput && deptInput.value.trim() && destInput && destInput.value.trim()) {
        executeRouteSearch();
      }
    });

    setupStationSuggest(input, dropdown, (st) => {
      input.value = st.name;
      input.setAttribute('data-id', st.id);
    });

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

  function resolveStation(inputEl) {
    if (!inputEl) return null;
    const directId = inputEl.getAttribute('data-id');
    if (directId && STATIONS[directId]) {
      return STATIONS[directId];
    }
    const val = inputEl.value.trim();
    if (!val) return null;
    return findStationByName(val);
  }

  function findStationByName(query) {
    if (!query) return null;
    const q = query.trim().toLowerCase();
    const exact = Object.values(STATIONS).find(st =>
      st.name === q || st.id === q || st.kana === q || st.en.toLowerCase() === q
    );
    if (exact) return exact;

    const prefix = Object.values(STATIONS).find(st =>
      st.name.startsWith(q) || st.kana.startsWith(q) || st.en.toLowerCase().startsWith(q)
    );
    if (prefix) return prefix;

    return Object.values(STATIONS).find(st =>
      st.name.includes(q) || st.kana.includes(q)
    ) || null;
  }

  function executeRouteSearch() {
    const errorMsg = document.getElementById('route-error-msg');
    const resultContainer = document.getElementById('route-result-container');
    errorMsg.style.display = 'none';
    resultContainer.style.display = 'none';

    const deptInput = document.getElementById('route-dept-input');
    const destInput = document.getElementById('route-dest-input');
    const deptSt = resolveStation(deptInput);
    const destSt = resolveStation(destInput);

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
      const vSt = resolveStation(vInput);
      if (!vSt) {
        showRouteError(`経由駅「${vInput.value}」が見つかりません。`);
        vInput.focus();
        return;
      }
      viaStIds.push(vSt.id);
    }

    if (!window.JR_ROUTE_ENGINE) {
      showRouteError('経路探索エンジンが読み込まれていません。');
      return;
    }

    const options = {
      useShinkansen: ROUTE_STATE.useShinkansen,
      searchMode: ROUTE_STATE.searchMode
    };

    const result = window.JR_ROUTE_ENGINE.searchMarsRoute(deptSt.id, viaStIds, destSt.id, options);

    if (!result || !result.success) {
      showRouteError((result && result.error) || '指定された区間のルートが見つかりませんでした。経由駅や新幹線利用の設定をご確認ください。');
      return;
    }

    ROUTE_STATE.lastResult = result;

    // 券面・結果を描画
    document.getElementById('ticket-dept-name').textContent = result.deptName;
    document.getElementById('ticket-dest-name').textContent = result.destName;
    document.getElementById('ticket-via-text').textContent = result.marsString || '(直通)';
    document.getElementById('ticket-total-kilo').textContent = `営業キロ: ${result.totalKm.toFixed(1)} km`;

    // 概算距離（未登録路線フォールバック）警告表示
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

    const validityBadge = document.getElementById('route-validity-badge');
    if (result.isOneWayTrip) {
      validityBadge.textContent = '一筆書き成立';
      validityBadge.className = 'ticket-status-badge';
      validityBadge.style.cursor = 'default';
      validityBadge.onclick = null;
      validityBadge.title = '重複のない一筆書き経路です';
    } else {
      validityBadge.textContent = '※重複区間あり (クリックで移動)';
      validityBadge.className = 'ticket-status-badge badge-overlap';
      validityBadge.style.cursor = 'pointer';
      validityBadge.title = 'クリックすると地図上の重複区間へズームします';
      validityBadge.onclick = () => {
        focusDuplicateSections(result);
      };
    }

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
  }

  function showRouteError(msg) {
    const errorEl = document.getElementById('route-error-msg');
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
    }
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

    ROUTE_STATE.searchMode = 'shortest';
    document.querySelectorAll('.route-mode-btn').forEach(b => {
      if (b.getAttribute('data-mode') === 'shortest') {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    clearRouteMapLayers();
    ROUTE_STATE.lastResult = null;
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
    stationMarkers.forEach((marker, stId) => {
      const isMega = TIER1_MEGA_HUBS.has(stId) || (STATIONS[stId] && TIER1_STATION_NAMES.has(STATIONS[stId].name));
      const isMajor = TIER2_MAJOR_HUBS.has(stId) || (STATIONS[stId] && TIER2_STATION_NAMES.has(STATIONS[stId].name));
      const strokeColor = isMega ? '#e11d48' : (isMajor ? '#f59e0b' : '#64748b');
      marker.setStyle({
        radius: isMega ? 5.5 : 3.5,
        color: strokeColor,
        weight: isMega ? 2.5 : 1.5,
        opacity: 1,
        fillColor: '#ffffff',
        fillOpacity: 1
      });
    });
  }

  function clearRouteMapLayers() {
    resetAllMapStyles();

    ROUTE_STATE.activeRouteLayers.forEach(layer => {
      map.removeLayer(layer);
    });
    ROUTE_STATE.activeRouteLayers = [];

    ROUTE_STATE.activePinLayers.forEach(layer => {
      map.removeLayer(layer);
    });
    ROUTE_STATE.activePinLayers = [];
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
    clearRouteMapLayers();
    if (!result || !result.geometryLatlngs || result.geometryLatlngs.length === 0) return;

    // 1. 選択されていない箇所（全路線・全駅）を薄くフェードアウト
    LINES.forEach(line => {
      const pls = linePolylines.get(line.id);
      if (pls) {
        pls.forEach(pl => {
          pl.setStyle({
            opacity: 0.12, // 未選択路線を極薄にして背景化
            weight: 1.8
          });
        });
      }
    });

    const passedStationSet = new Set(result.allStationIds || []);
    const dupStationSet = new Set(result.duplicateStationIds || []);
    stationMarkers.forEach((marker, stId) => {
      if (passedStationSet.has(stId)) {
        const isDup = dupStationSet.has(stId);
        // 通過駅: クッキリ前面表示 (重複訪問駅は赤枠で強調)
        marker.setStyle({
          color: isDup ? '#ef4444' : '#0284c7',
          weight: 2.5,
          opacity: 1.0,
          fillColor: '#ffffff',
          fillOpacity: 1.0,
          radius: isDup ? 5.5 : 4.5
        });
        marker.bringToFront();
      } else {
        // 未通過駅: 薄くフェードアウト
        marker.setStyle({
          opacity: 0.1,
          fillOpacity: 0.08
        });
      }
    });

    // 2. 選択経路の通常区間: 極太ハイライト (幅広グロー + コアライン + 芯線)
    const normalCoordsList = (result.normalPolylines && result.normalPolylines.length > 0)
      ? result.normalPolylines
      : (result.geometryLatlngs.length > 0 ? [result.geometryLatlngs] : []);

    normalCoordsList.forEach(coords => {
      // 外側ワイド発光グロー (太さ 15px)
      const glow = L.polyline(coords, {
        color: '#00ffff',
        weight: 15,
        opacity: 0.45,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'route-glow-path',
        interactive: false
      }).addTo(map);

      // 中間メインコアライン (太さ 8.5px の力強い鮮烈ブルー)
      const core = L.polyline(coords, {
        color: '#0284c7',
        weight: 8.5,
        opacity: 1.0,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false
      }).addTo(map);

      // 最上面ハイライト光沢芯線 (太さ 2.5px)
      const shine = L.polyline(coords, {
        color: '#bae6fd',
        weight: 2.5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false
      }).addTo(map);

      glow.bringToFront();
      core.bringToFront();
      shine.bringToFront();
      ROUTE_STATE.activeRouteLayers.push(glow, core, shine);
    });

    // 3. 重複区間: 極太警告ハイライト (太さ 9.5px の警告レッド + 白ストライプ破線)
    if (result.duplicatePolylines && result.duplicatePolylines.length > 0) {
      result.duplicatePolylines.forEach(coords => {
        // 赤色ワイドグロー (太さ 17px)
        const dupGlow = L.polyline(coords, {
          color: '#ef4444',
          weight: 17,
          opacity: 0.65,
          lineCap: 'round',
          lineJoin: 'round',
          className: 'route-duplicate-path',
          interactive: false
        }).addTo(map);

        // 赤色メインコア (太さ 9.5px の深紅)
        const dupCore = L.polyline(coords, {
          color: '#dc2626',
          weight: 9.5,
          opacity: 1.0,
          lineCap: 'round',
          lineJoin: 'round',
          className: 'route-duplicate-core',
          interactive: false
        }).addTo(map);

        // 中央ストライプ破線 (太さ 3.5px のホワイト破線)
        const dupStripe = L.polyline(coords, {
          color: '#ffffff',
          weight: 3.5,
          opacity: 0.95,
          dashArray: '7, 7',
          lineCap: 'butt',
          lineJoin: 'round',
          interactive: false
        }).addTo(map);

        dupGlow.bringToFront();
        dupCore.bringToFront();
        dupStripe.bringToFront();
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
      const deptMarker = L.marker([deptSt.lat, deptSt.lng], { icon: deptIcon, zIndexOffset: 2000 })
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
        const viaMarker = L.marker([vSt.lat, vSt.lng], { icon: viaIcon, zIndexOffset: 1900 })
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
      const destMarker = L.marker([destSt.lat, destSt.lng], { icon: destIcon, zIndexOffset: 2000 })
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
