const fs = require('fs');

// Leaflet スタブ
const mockMap = {
  center: [35, 139],
  zoom: 9,
  on: () => {},
  setView: () => {},
  fitBounds: () => {},
  flyTo: () => {},
  panTo: () => {},
  zoomIn: () => {},
  zoomOut: () => {},
  getSize: () => ({ x: 1000, y: 800 }),
  getZoom: () => 9,
  latLngToContainerPoint: () => ({ x: 100, y: 100 }),
  getPanes: () => ({ overlayPane: { querySelector: () => null } }),
  addLayer: () => {},
  removeLayer: () => {}
};

class LayerGroup {
  constructor() { this.layers = []; }
  addTo(map) { return this; }
  clearLayers() { this.layers = []; }
  addLayer(l) { this.layers.push(l); }
  getLayers() { return this.layers; }
}

globalThis.L = {
  map: () => mockMap,
  layerGroup: () => new LayerGroup(),
  polyline: () => ({
    addTo: () => ({ bringToFront: () => {} }),
    on: () => {},
    setStyle: () => {},
    bringToFront: () => {}
  }),
  circleMarker: () => ({
    bindTooltip: () => ({}),
    addTo: () => ({}),
    on: () => {},
    setStyle: () => {},
    getElement: () => null
  }),
  marker: () => ({
    addTo: () => ({ bindTooltip: () => ({}) }),
    bindTooltip: () => ({}),
    getElement: () => null
  }),
  divIcon: () => ({}),
  geoJSON: () => ({
    addTo: () => ({})
  }),
  DomEvent: { stopPropagation: () => {} }
};

// HTML読み込み & 簡易DOM
const html = fs.readFileSync('jr-map/index.html', 'utf8');

class Element {
  constructor(tag, id = '', className = '') {
    this.tagName = tag;
    this.id = id;
    this.className = className;
    this.children = [];
    this.style = {};
    this.attributes = {};
  }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k] || (k === 'id' ? this.id : null); }
  removeAttribute(k) { delete this.attributes[k]; }
  addEventListener() {}
  appendChild(c) { this.children.push(c); }
  removeChild(c) { this.children = this.children.filter(x => x !== c); }
  classList = {
    add: () => {},
    remove: () => {},
    contains: () => false
  };
}

const elementsById = new Map();
const idMatches = html.matchAll(/id=["']([^"']+)["']/g);
for (const m of idMatches) {
  elementsById.set(m[1], new Element('div', m[1]));
}

globalThis.document = {
  getElementById: (id) => {
    return elementsById.get(id) || null;
  },
  querySelectorAll: (selector) => {
    return [];
  },
  querySelector: (selector) => {
    return null;
  },
  createElement: (tag) => new Element(tag),
  addEventListener: () => {},
  readyState: 'complete'
};

globalThis.window = globalThis;
globalThis.addEventListener = () => {};
globalThis.window.addEventListener = () => {};

// データ読み込み
console.log('Loading topojson...');
// topojson-client stub
globalThis.topojson = {
  feature: () => ({ features: [] }),
  mesh: () => ({ type: 'MultiLineString', coordinates: [] })
};

console.log('Loading borders...');
eval(fs.readFileSync('jr-map/data/borders.js', 'utf8'));
console.log('Loading build-data...');
eval(fs.readFileSync('jr-map/data/build-data.js', 'utf8'));
console.log('Loading tracks...');
eval(fs.readFileSync('jr-map/data/tracks.js', 'utf8'));
console.log('Loading route-engine...');
eval(fs.readFileSync('jr-map/route-engine.js', 'utf8'));
console.log('Loading app.js...');

try {
  const appCode = fs.readFileSync('jr-map/app.js', 'utf8');
  eval(appCode);
  console.log('[SUCCESS] app.js executed without throwing error!');
} catch (e) {
  console.error('[CRASH] Error executing app.js:', e);
}
