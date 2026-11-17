const fs = require('fs');

// 1. データの読み込み
const bordersContent = fs.readFileSync('jr-map/data/borders.js', 'utf8');
const tracksContent = fs.readFileSync('jr-map/data/tracks.js', 'utf8');
const dataContent = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const appContent = fs.readFileSync('jr-map/app.js', 'utf8');

// 2. ブラウザ環境 (DOM & Leaflet) の完全モック
class MockElement {
  constructor(tag, id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.style = {
      setProperty: (k, v) => { this.style[k] = v; }
    };
    this.classList = {
      add: () => {},
      remove: () => {},
      contains: () => false
    };
    this.children = [];
    this._attrs = {};
    this._listeners = {};
  }
  setAttribute(k, v) { this._attrs[k] = String(v); }
  getAttribute(k) { return this._attrs[k] || null; }
  setAttributeNS(ns, k, v) { this.setAttribute(k, v); }
  appendChild(child) { this.children.push(child); return child; }
  remove() {}
  addEventListener(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  }
  querySelector(sel) {
    if (sel === 'svg') return new MockElement('svg');
    return null;
  }
  querySelectorAll(sel) {
    const results = [];
    function walk(el) {
      if (sel === '.svg-line-text' && el._attrs['class'] && el._attrs['class'].includes('svg-line-text')) {
        results.push(el);
      }
      if (sel === '.station-label' && el._attrs['class'] && el._attrs['class'].includes('station-label')) {
        results.push(el);
      }
      el.children.forEach(walk);
    }
    walk(this);
    return results;
  }
}

const mockDoc = {
  getElementById: (id) => {
    if (id === 'app' || id === 'map') return new MockElement('div', id);
    if (id === 'svg-line-labels-group') return global._mockSvgLineLabelsGroup || null;
    return new MockElement('div', id);
  },
  createElement: (tag) => new MockElement(tag),
  createElementNS: (ns, tag) => {
    const el = new MockElement(tag);
    if (tag === 'g') global._mockSvgLineLabelsGroup = el;
    return el;
  },
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// Leaflet モック
class MockLayerGroup {
  constructor() { this.layers = []; }
  clearLayers() { this.layers = []; }
  addTo() { return this; }
}

class MockPolyline {
  constructor(latlngs, options) {
    this.latlngs = latlngs;
    this.options = options || {};
    this._path = new MockElement('path');
  }
  addTo(group) {
    if (group && group.layers) group.layers.push(this);
    return this;
  }
  setStyle() {}
  bringToFront() {}
  on() {}
}

class MockCircleMarker {
  constructor(latlng, options) {
    this.latlng = latlng;
    this.options = options || {};
    this._el = new MockElement('path');
  }
  addTo(group) { return this; }
  bindTooltip() { return this; }
  on() { return this; }
  setRadius(r) { this.options.radius = r; }
  setStyle(s) { Object.assign(this.options, s); }
  getElement() { return this._el; }
}

class MockMarker {
  constructor(latlng, options) {
    this.latlng = latlng;
    this.options = options || {};
    this._el = new MockElement('div');
  }
  addTo(group) { return this; }
  getElement() { return this._el; }
}

class MockMap {
  constructor() {
    this._zoom = 9;
    this._center = [35.6812, 139.7671];
    this._listeners = {};
    this._panes = {
      overlayPane: new MockElement('div'),
      markerPane: new MockElement('div')
    };
    this._panes.overlayPane.appendChild(new MockElement('svg'));
  }
  getZoom() { return this._zoom; }
  setZoom(z) {
    this._zoom = z;
    if (this._listeners['zoomend']) {
      this._listeners['zoomend'].forEach(fn => fn());
    }
  }
  getSize() { return { x: 1200, y: 800 }; }
  getCenter() { return this._center; }
  getPanes() { return this._panes; }
  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  }
  fire(event) {
    if (this._listeners[event]) {
      this._listeners[event].forEach(fn => fn());
    }
  }
  latLngToContainerPoint(ll) {
    // 簡易ピクセル変換
    return {
      x: (ll[1] - 139.0) * 800,
      y: (36.0 - ll[0]) * 800
    };
  }
}

const mockL = {
  map: () => new MockMap(),
  layerGroup: () => new MockLayerGroup(),
  polyline: (pts, opts) => new MockPolyline(pts, opts),
  circleMarker: (ll, opts) => new MockCircleMarker(ll, opts),
  marker: (ll, opts) => new MockMarker(ll, opts),
  divIcon: (opts) => opts,
  geoJSON: () => new MockLayerGroup(),
  DomEvent: { stopPropagation: () => {} }
};

// グローバルスコープのセットアップ
global.window = global;
global.window.addEventListener = () => {};
global.document = mockDoc;
global.document.readyState = 'complete';
global.L = mockL;
global.topojson = {
  feature: () => ({ type: 'FeatureCollection', features: [] }),
  mesh: () => ({ type: 'MultiLineString', coordinates: [] })
};

// データのロード
eval(bordersContent);
eval(tracksContent);
eval(dataContent);

console.log('Data loaded successfully. Evaluating app.js...');

try {
  let createdMap = null;
  const origMap = mockL.map;
  mockL.map = () => {
    createdMap = new MockMap();
    return createdMap;
  };

  eval(appContent);
  console.log('app.js evaluated and init() executed successfully!');

  if (createdMap) {
    console.log('Testing zoom operations...');
    [5, 8, 10, 12, 14, 16].forEach(z => {
      console.log(`Setting zoom to ${z}...`);
      createdMap.setZoom(z);
    });

    console.log('Testing moveend operation...');
    createdMap.fire('moveend');

    console.log('ALL TESTS PASSED WITH ZERO ERRORS!');
  } else {
    console.warn('Map was not created during init.');
  }
} catch (e) {
  console.error('RUNTIME ERROR:', e);
  process.exit(1);
}
