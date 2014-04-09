var _ = require('lodash');

module.exports = function xyz(p) {
  var point = {};
  _.each('x,y,z'.split(','), function (k) {
    point[k] = Math.floor(p[k] * 100000) / 100000;
  });
  return point;
};