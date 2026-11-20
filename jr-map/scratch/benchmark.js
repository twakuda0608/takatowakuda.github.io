const fs = require('fs');
global.window = global;
const topoCode = fs.readFileSync('C:/takatowakuda.github.io/jr-map/topojson-client.min.js', 'utf8');
const vm = require('vm');
const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(topoCode, sandbox);
const topojson = sandbox.topojson || sandbox.window.topojson;

const borders = fs.readFileSync('C:/takatowakuda.github.io/jr-map/data/borders.js', 'utf8');
vm.runInContext(borders, sandbox);
const buildData = fs.readFileSync('C:/takatowakuda.github.io/jr-map/data/build-data.js', 'utf8');
vm.runInContext(buildData, sandbox);

console.log('STATIONS loaded:', Object.keys(sandbox.window.JR_STATIONS).length);

console.time('normalizeStationPrefectures');
const STATIONS = sandbox.window.JR_STATIONS;
const TOPO = sandbox.window.JR_TOPO;
const geojson = topojson.feature(TOPO, TOPO.objects.japan);

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
  if (geom.type === 'Polygon') return pointInPoly(x, y, geom.coordinates);
  if (geom.type === 'MultiPolygon') {
    for (let p = 0; p < geom.coordinates.length; p++) {
      if (pointInPoly(x, y, geom.coordinates[p])) return true;
    }
  }
  return false;
}

const prefList = geojson.features.map(f => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const updateBBox = (ring) => {
    for (let i = 0; i < ring.length; i++) {
      const x = ring[i][0], y = ring[i][1];
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  };
  if (f.geometry.type === 'Polygon') f.geometry.coordinates.forEach(updateBBox);
  else if (f.geometry.type === 'MultiPolygon') f.geometry.coordinates.forEach(poly => poly.forEach(updateBBox));
  return { name: f.properties.nam_ja, minX, minY, maxX, maxY, geom: f.geometry };
});

const unassigned = [];
for (const stId in STATIONS) {
  const st = STATIONS[stId];
  const x = st.lng, y = st.lat;
  let matched = false;
  for (let i = 0; i < prefList.length; i++) {
    const p = prefList[i];
    if (x < p.minX || x > p.maxX || y < p.minY || y > p.maxY) continue;
    if (pointInGeom(x, y, p.geom)) { st.pref = p.name; matched = true; break; }
  }
  if (!matched) unassigned.push(st);
}
console.timeEnd('normalizeStationPrefectures');
console.log('Unassigned count:', unassigned.length);
