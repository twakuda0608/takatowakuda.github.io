const { minDistanceToPolylineMeters } = require('./test_helpers.js') || {};
const { JR_STATIONS } = require('../data/build-data.js');

const umishibauraChain = [
  [ 35.49728, 139.69570 ],
  [ 35.49650, 139.69680 ],
  [ 35.49500, 139.69800 ],
  [ 35.49350, 139.69920 ],
  [ 35.49192, 139.70013 ],
  [ 35.49000, 139.70030 ],
  [ 35.48800, 139.70050 ],
  [ 35.48613, 139.70067 ]
];

const okawaChain = [
  [ 35.49982, 139.70125 ],
  [ 35.50050, 139.70350 ],
  [ 35.50150, 139.70550 ],
  [ 35.50193, 139.70653 ],
  [ 35.50050, 139.70800 ],
  [ 35.49850, 139.70950 ],
  [ 35.49680, 139.71070 ],
  [ 35.49541, 139.71138 ]
];

console.log('umishibaura length:', umishibauraChain.length);
console.log('okawa length:', okawaChain.length);
