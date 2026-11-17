const fs = require('fs');

const tracksContent = fs.readFileSync('jr-map/data/tracks.js', 'utf8');
const dataContent = fs.readFileSync('jr-map/data/build-data.js', 'utf8');

const window = {};
eval(tracksContent);
eval(dataContent);

const TRACKS = window.JR_TRACKS || {};
const LINES = window.JR_LINES;
const STATIONS = window.JR_STATIONS;

// 簡易 Web Mercator 投影（ピクセル座標変換）
function project(lat, lng, zoom) {
  const sin = Math.sin(lat * Math.PI / 180);
  const x = 256 * (0.5 + lng / 360) * Math.pow(2, zoom);
  const y = 256 * (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * Math.pow(2, zoom);
  return { x, y };
}

// 東京中心 (lat: 35.6812, lng: 139.7671) のビューポート (幅1200, 高800)
function runZoomTest(zoom) {
  const centerLat = 35.6812, centerLng = 139.7671;
  const centerPt = project(centerLat, centerLng, zoom);
  const vpWidth = 1200, vpHeight = 800;
  const minX = centerPt.x - vpWidth / 2;
  const maxX = centerPt.x + vpWidth / 2;
  const minY = centerPt.y - vpHeight / 2;
  const maxY = centerPt.y + vpHeight / 2;

  // 1. 駅名ラベルの配置判定
  const placedStationBoxes = [];
  const stationCandidates = [];

  Object.values(STATIONS).forEach(st => {
    const pt = project(st.lat, st.lng, zoom);
    if (pt.x < minX - 30 || pt.x > maxX + 30 || pt.y < minY - 20 || pt.y > maxY + 20) return;

    let score = 0;
    if (['tokyo', 'shinjuku', 'shibuya', 'shinagawa', 'ueno', 'ikebukuro', 'yokohama', 'omiya'].includes(st.id)) {
      score += 200;
    } else if (st.hub) {
      score += 80;
    }
    score += (st.lines ? st.lines.length : 1) * 8;

    let minScore = zoom <= 6 ? 180 : (zoom <= 8 ? 110 : (zoom <= 10 ? 50 : (zoom <= 12 ? 25 : 0)));
    if (score >= minScore) {
      stationCandidates.push({ st, pt, score });
    }
  });

  stationCandidates.sort((a, b) => b.score - a.score);

  stationCandidates.forEach(cand => {
    const textWidth = Math.max(34, cand.st.name.length * 12 + 8);
    const box = {
      x1: cand.pt.x + 3,
      y1: cand.pt.y - 11,
      x2: cand.pt.x + 3 + textWidth,
      y2: cand.pt.y - 11 + 16
    };

    let collides = false;
    for (let i = 0; i < placedStationBoxes.length; i++) {
      const pb = placedStationBoxes[i];
      if (!(box.x2 < pb.x1 || box.x1 > pb.x2 || box.y2 < pb.y1 || box.y1 > pb.y2)) {
        collides = true;
        break;
      }
    }
    if (!collides) {
      placedStationBoxes.push(box);
      // 駅丸印周囲
      placedStationBoxes.push({
        x1: cand.pt.x - 7,
        y1: cand.pt.y - 7,
        x2: cand.pt.x + 7,
        y2: cand.pt.y + 7
      });
    }
  });

  // 2. 路線名ラベルの配置判定
  const lineCandidates = [];
  LINES.forEach(line => {
    const isShinkansen = line.category === 'shinkansen';
    const tier = isShinkansen ? 1 : (['yamanote', 'chuo-main', 'tokaido-main', 'tohoku-main', 'sobu-main', 'joban-line'].includes(line.id) ? 2 : 3);

    let meetsZoom = false;
    if (tier === 1) meetsZoom = (zoom >= 5);
    else if (tier === 2) meetsZoom = (zoom >= 9);
    else if (tier === 3) meetsZoom = (zoom >= 11);
    else meetsZoom = (zoom >= 13);

    if (!meetsZoom) return;

    const chains = TRACKS[line.id] || [];
    let mainChain = chains[0] || [];
    for (let i = 1; i < chains.length; i++) {
      if (chains[i].length > mainChain.length) mainChain = chains[i];
    }
    if (!mainChain || mainChain.length < 2) return;

    const centerIdx = Math.floor(mainChain.length * 0.5);
    const centerPtCoord = mainChain[centerIdx];
    const pt = project(centerPtCoord[0], centerPtCoord[1], zoom);

    if (pt.x < minX - 40 || pt.x > maxX + 40 || pt.y < minY - 30 || pt.y > maxY + 30) return;

    lineCandidates.push({
      line,
      tier,
      pt,
      name: line.name,
      priority: tier === 1 ? 500 : (tier === 2 ? 300 : 100)
    });
  });

  lineCandidates.sort((a, b) => b.priority - a.priority);

  const placedLineBoxes = [];
  const acceptedLines = [];
  const rejectedCollisions = [];

  lineCandidates.forEach(cand => {
    const boxWidth = Math.max(30, cand.name.length * 12 + 10);
    const box = {
      x1: cand.pt.x - boxWidth / 2,
      y1: cand.pt.y - 7,
      x2: cand.pt.x + boxWidth / 2,
      y2: cand.pt.y + 7
    };

    // 駅名との重なり
    let collides = false;
    for (let i = 0; i < placedStationBoxes.length; i++) {
      const sb = placedStationBoxes[i];
      if (!(box.x2 < sb.x1 || box.x1 > sb.x2 || box.y2 < sb.y1 || box.y1 > sb.y2)) {
        collides = true;
        break;
      }
    }
    // 路線名同士の重なり
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
      placedLineBoxes.push(box);
      acceptedLines.push(cand.name);
    } else {
      rejectedCollisions.push(cand.name);
    }
  });

  console.log(`\n--- Zoom ${zoom} Simulation ---`);
  console.log(`Placed Stations: ${placedStationBoxes.length / 2}`);
  console.log(`Candidate Lines: ${lineCandidates.length}`);
  console.log(`Accepted Lines: ${acceptedLines.length} (${acceptedLines.slice(0, 5).join(', ')}...)`);
  console.log(`Filtered out to prevent collision: ${rejectedCollisions.length} (${rejectedCollisions.slice(0, 5).join(', ')})`);
}

[6, 8, 10, 12, 14].forEach(runZoomTest);
