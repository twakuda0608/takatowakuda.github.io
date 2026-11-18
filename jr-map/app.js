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

    initMap();
    buildAdjacentStationsIndex();
    renderCategoryTabs();
    renderLineChips();
    setupEventHandlers();
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
        if (!STATE.selectedLineId) {
          polyline.setStyle({ weight: defaultWeight + 2, opacity: 1 });
        }
      });

      polyline.on('mouseout', () => {
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
