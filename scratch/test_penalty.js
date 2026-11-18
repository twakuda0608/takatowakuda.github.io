const data = require('C:/takatowakuda.github.io/jr-map/data/build-data.js');
const kilosMod = require('C:/takatowakuda.github.io/jr-map/data/official-kilos.js');
kilosMod.applyOfficialKilos(data.JR_LINES);

function findLegTest(graph, startId, endId, options = {}) {
  const allowShinkansen = (options.useShinkansen !== undefined) ? options.useShinkansen : (options.allowShinkansen !== false);
  const forbiddenStations = options.forbiddenStations || new Set();

  const dist = new Map();
  const prev = new Map();
  const pq = [{ id: startId, marsName: '', isShinkansen: false, d: 0 }];
  dist.set(startId + '::', 0);

  let bestEndState = null;

  while (pq.length > 0) {
    pq.sort((a, b) => a.d - b.d);
    const curr = pq.shift();
    const currKey = curr.id + '::' + curr.marsName;

    if (curr.id === endId) {
      bestEndState = currKey;
      break;
    }

    if (curr.d > dist.get(currKey)) continue;

    const neighbors = graph.get(curr.id) || [];
    for (const edge of neighbors) {
      if (!allowShinkansen && edge.isShinkansen) continue;
      if (forbiddenStations.has(edge.to) && edge.to !== endId) continue;

      let transferPenalty = 0;
      if (curr.marsName && (curr.marsName !== edge.marsName)) {
        if (curr.isShinkansen !== edge.isShinkansen) {
          transferPenalty = 40.0;
        } else {
          transferPenalty = 10.0;
        }
      }

      // 新幹線優先モード時、新幹線の速達性・優先利用を考慮し探索重みを設定 (実際の営業キロ dist は変化なし)
      const edgeWeight = (allowShinkansen && edge.isShinkansen) ? (edge.dist * 0.85) : edge.dist;
      const nextD = curr.d + edgeWeight + transferPenalty;
      const nextKey = edge.to + '::' + edge.marsName;

      if (!dist.has(nextKey) || nextD < dist.get(nextKey)) {
        dist.set(nextKey, nextD);
        prev.set(nextKey, {
          fromId: curr.id,
          fromMars: curr.marsName,
          edge: edge
        });
        pq.push({ id: edge.to, marsName: edge.marsName, isShinkansen: edge.isShinkansen, d: nextD });
      }
    }
  }

  if (!bestEndState) return null;

  const segments = [];
  let currKey = bestEndState;
  while (true) {
    const p = prev.get(currKey);
    if (!p) break;
    segments.unshift({
      from: p.fromId,
      to: p.edge.to,
      lineId: p.edge.lineId,
      lineName: p.edge.lineName,
      marsName: p.edge.marsName,
      color: p.edge.color,
      isShinkansen: p.edge.isShinkansen,
      dist: p.edge.dist,
      isEstimated: !!p.edge.isEstimated
    });
    currKey = p.fromId + '::' + p.fromMars;
  }
  return segments;
}

const RouteEngine = require('C:/takatowakuda.github.io/jr-map/route-engine.js');
const graph = RouteEngine.buildGraph(data.JR_LINES, data.JR_STATIONS);
const leg = findLegTest(graph, 'shin-osaka', 'hakata', { useShinkansen: true });
console.log('Leg segments count:', leg.length);
const totalKm = leg.reduce((sum, s) => sum + Math.round(s.dist * 10), 0) / 10;
console.log('TotalKm:', totalKm);
console.log('Lines:', Array.from(new Set(leg.map(s => s.lineName))).join(', '));
