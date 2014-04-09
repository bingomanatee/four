(function(root, factory) {
    if(typeof exports === 'object') {
        module.exports = factory(require('lodash'), require('fools'), require('three'));
    }
    else if(typeof define === 'function' && define.amd) {
        define('FOUR_D', ['_', 'Fools', 'THREE'], factory);
    }
    else {
        root['FOUR_D'] = factory(root._, root.Fools, root.THREE);
    }
}(this, function(_, Fools, THREE) {

var Vector3 = THREE.Vector3;
var FOUR_D = {

  stat: {

    median: function(data){
      data = _.sortBy(data, _.identity);
      var i = Math.floor(data.length / 2);
      if ((data.length % 2)) {
        return data[i];
      } else {

        var a = data[i];
        var b = data[i - 1];
        return (a + b) / 2;

      }
    }
  }

};
function _ld_type(data) {
  if (!data) {
    return FOUR_D.DT_EMPTY;
  } else if (_.isArray(data)) {
    return FOUR_D.DT_ARRAY;
  } else if (_.isObject(data)) {
    if (_.isFunction(data.getColumnFromMatrix)) {
      return FOUR_D.DT_VECTOR3;
    } else {
      return FOUR_D.DT_OBJECT;
    }
  } else {
    return FOUR_D.DT_EMPTY;
  }
}

FOUR_D.DT_EMPTY = 0;
FOUR_D.DT_ARRAY = 1;
FOUR_D.DT_OBJECT = 2;
FOUR_D.DT_VECTOR3 = 3;

var _recordId = 0;
FOUR_D.Record = function (location, time, direction, meta) {
  this.time = !time ? 0 : ( _.isDate(direction) ? direction.getTime() : (_.isNumber(time) ? time : 0));
  this.location = location;
  this.l_type = _ld_type(location);
  this.direction = direction;
  this.d_type = _ld_type(direction);
  this.meta = meta ? ( _.isObject(meta) ? meta : {id: meta}) : {};
  this.id = this.meta.hasOwnProperty('id') ? meta.id : ++_recordId;
};

FOUR_D.Record.prototype = {

  toString: function () {
    return this.la(true).join(',') + 'd' + this.da().join(',') + 't' + this.time;
  },

  la: function (fast) {
    switch (this.l_type) {
      case FOUR_D.DT_EMPTY:
        return [0, 0, 0];
        break;

      case FOUR_D.DT_ARRAY:
        return fast ? this.location : this.location.slice();
        break;

      case FOUR_D.DT_OBJECT:
        return [this.location.x, this.location.y, this.location.z];
        break;

      case FOUR_D.DT_VECTOR3:
        return [this.location.x, this.location.y, this.location.z];
        break;

      default:
        return [0, 0, 0];
    }
  },

  da: function (fast) {
    switch (this.d_type) {
      case FOUR_D.DT_EMPTY:
        return [0, 0, 0];
        break;

      case FOUR_D.DT_ARRAY:
        return fast ? this.direction : this.direction.slice();
        break;

      case FOUR_D.DT_OBJECT:
        return [this.direction.x, this.direction.y, this.direction.z];
        break;

      case FOUR_D.DT_VECTOR3:
        return [this.direction.x, this.direction.y, this.direction.z];
        break;

      default:
        return [0, 0, 0];
    }
  },

  v: function () {
    if (this.l_type == FOUR_D.DT_VECTOR3) {
      return this.location;
    } else if (!this._v) {
      switch (this.l_type) {
        case FOUR_D.DT_ARRAY:
          this._v = new Vector3(this.location[0], this.location[1], this.location[2]);
          break;

        case FOUR_D.DT_OBJECT:
          this._v = new Vector3();
          this._v.copy(this.location);
          break;

        case FOUR_D.DT_EMPTY:
          this._v = new Vector3();
          break;

        default:
          this._v = new Vector3();
      }
    }

    return this._v;
  },

  distance: function (smoothing) {
    smoothing = smoothing ||  0;
    if (!this.next) {
      return 0;
    }

    return this.smoothLoc(smoothing)
      .distanceTo(this.next.smoothLoc(smoothing));
  },

  tangent: function (smoothing) {
    if (!smoothing) {

    }

    var next = this.next;
    var prev = this.prev;
    var prevSmoothLoc, nextSmoothLoc;
    var sl = this.smoothLoc(smoothing);
    if (next) {
      nextSmoothLoc = next.smoothLoc(smoothing);
      if (prev) {
        prevSmoothLoc = prev.smoothLoc(smoothing);
        return prevSmoothLoc.sub(nextSmoothLoc).normalize();
      } else {
        return sl.sub(nextSmoothLoc).normalize();
      }
    } else if (prev) {
      prevSmoothLoc = prev.smoothLoc(smoothing);
      return prevSmoothLoc.sub(sl).normalize();
    } else {
      return new Vector3();
    }

  },

  speed: function(distance, smoothing){

    var next = this.next;
    var prev = this.prev;

    if (!(next || prev)) {
      return 0;
    }
    next = next || this;
    prev = prev || this;

    while (distance > 1) {
      next = next.next || next;
      prev = prev.prev || prev;
      --distance;
    }
    var time = next.time - prev.time;
    if (time == 0) return 0;
    var travel = 0;
    do {
      travel += prev.distance(smoothing);
      prev = prev.next
    } while(next !== prev);
    return Math.abs(travel /time);
  },

  /**
   * bend is a measure of the difference between the incoming vector and the outcoming vector.
   * It is expressed as a ratio of the distances between two distant points
   * and the difference of the sums of their distance to this point.
   *
   * @param distance {number}
   * @param smoothing
   * @returns {number}
   */
  bend: function (distance, smoothing) {
    distance = Math.max(1, distance);
    smoothing = smoothing || 0;

    var next = this.next;
    var prev = this.prev;

    if (!(next && prev)) {
      return 0;
    }

    while (distance > 1) {
      next = next.next || next;
      prev = prev.prev || prev;
      --distance;
    }

    var prevLoc = prev.smoothLoc(smoothing);
    var nextLoc = next.smoothLoc(smoothing);
    var v = this.v();

    prevLoc = prevLoc.clone().sub(v);
    if (prevLoc.length() == 0) return 0;
    nextLoc = nextLoc.clone().sub(v);
    if (nextLoc.length() == 0) return 0;
    prevLoc.normalize();
    nextLoc.normalize().multiplyScalar(-1);


    var dist = prevLoc.distanceTo(nextLoc);
    var bend =  dist/2;
    return bend * bend;
  },

  smoothLoc: function (smoothing) {
    if ((!this.next) || (!smoothing)) {
      return this.v();
    }

    var index = Math.round(10000 * smoothing).toString();
    if (!this._smooths) {
      this._smooths = {};
    }

    var next = this.next;
    while(next && (!(next._smooths && next._smooths.hasOwnProperty(index)))){
      if (next.next){
        next = next.next;
      }
    }

    while(next !== this){
      if (!next._smooths){
        next._smooths = {};
      }
      if (!next._smooths[index]){
        if (next.next && next.next._smooths && next.next._smooths[index]){
          var base = next.next._smooths[index];
          next._smooths[index] = base.clone().multiplyScalar(1 - smoothing);
          next._smooths[index].add(next.v().clone().multiplyScalar(smoothing));
          next = next === this ? null :  next.prev;
        }
      }
    }

    return this._smooths[index];
  },

  medianLocation: function (spread) {
    var next = this.next;
    var prev = this.prev;
    if (!(next && prev)) {
      return this.v();
    }
    var data = [this];

    while (next && prev && next.next && prev.prev && spread > 0) {
      data.push(next, prev);
      next = next.next;
      prev = prev.prev;
      --spread;
    }

    var xs = [];
    var ys = [];
    var zs = [];

    _.each(data, function (record) {
      var v = record.v();
      xs.push(v.x);
      ys.push(v.y);
      zs.push(v.z);
    });

    return new Vector3(FOUR_D.stat.median(xs), FOUR_D.stat.median(ys), FOUR_D.stat.median(zs));
  },

  /**
   *
   * @param vector {Vector3}
   *
   * @return {Vector3}
   */
  locationToVector: function (vector) {
    vector = vector.clone();
    vector.sub(this.v());
    vector.normalize();
    return vector;
  }

};
var util = require('util');

/**
 * note - Sequence assumes data is in descending order -- i.e.,first record is the most recent.
 *
 */
FOUR_D.Sequence = function (config) {
  this.data = [];
  this.timeInc = 1;
  this.capSize = 0;

  this.autoTime = false;
  if (config) {
    if (config.data || !config.accept_data) {
      var data = config.data;
      delete config.data;
      _.extend(this, config);
      this.addBatch(data);
    } else {
      _.extend(this, config);
    }
  }
};

FOUR_D.Sequence.prototype = {

  DX: 'dx',
  DY: 'dy',
  DZ: 'dz',

  add: function (location, time, direction, meta) {
    if (this.capSize && this.capSize >= this.data.length){
      return null;
    }
    var last = this.last();
    var autoInc = this.autoTime;

    if (!_.isNumber(time)) {
      autoInc = true;
    }

    if (autoInc) {
      time = 0;
      if (last) {
        time = last.time - this.timeInc;
      }
    }

    var record = new FOUR_D.Record(location, time, direction, meta);
    if (this.data.length) {
      last.next = record;
      record.prev = last;
    }
    this.data.push(record);
    return record;
  },

  /**
   * inserts a MORE RECENT record to the TOP of data.
   *
   * @param location
   * @param time
   * @param direction
   * @param meta
   * @returns {FOUR_D.Record}
   */
  insert: function (location, time, direction, meta) {
    var autoInc = this.autoTime;
    var first = this.first();
    if (!_.isNumber(time)) {
      autoInc = true;
    }

    if (autoInc) {
      time = 0;
      if (first) {
        time = first.time + this.timeInc;
      }
    }

    var record = new FOUR_D.Record(location, time, direction, meta);
    if (first) {
      first.prev = record;
      record.next = first;
    }
    this.data.unshift(record);

    if (this.capSize && this.data.length > this.capSize){
      this.cap();
    }
    return record;
  },

  /**
   * the first REORD -- the latest data
   * @returns {Mixed|*}
   */
  first: function () {
    return _.first(this.data);
  },

  /**
   * the last RECORD: the lest recent data
   * @returns {Mixed|*}
   */
  last: function () {
    return _.last(this.data);
  },

  addBatch: function (data) {
    _.each(data, function (item) {
      this.addItem(item);
    }, this);
  },

  addItem: function (item, insert) {
    if (_.isArray(item)) {
      return this.addArray(item, insert);
    } else if (_.isObject(item)) {
      return this.addObject(item, insert);
    } else if (_.isString(item)) {
      if (/^\{/.test(item)) {
        try {
          item = JSON.parse(item);
          return  this.addItem(item, insert);
        } catch (e) {
          return;
        }
      }
    } else {
      return;
    }
  },

  addArray: function (item, insert) {
    var location;
    if (_.isNumber(item[0])) {
      location = item.splice(0, 3);
    } else if (_.isArray(item[0]) || _.isObject(item[0])) {
      location = item.shift();
    } else if (_.isString(item[0])) {
      location = _.mapi(tem.split(','), Number);
    } else {
      return;
    }

    if (item.length > 0) {
      var time = item.unshift();
    }

    var direction;
    if (item.length >= 3) {
      direction = item.splice(0, 3);
    } else if (_.isArray(item[0]) || _.isObject(item[0])) {
      direction = item.shift();
    } else if (_.isNumber(item[0])) {
      direction = item.splice(0, 3);
    }

    var memo = item;

    if (insert) {
      return  this.insert(location, time, direction, memo);
    } else {
      return  this.add(location, time, direction, memo);
    }

  },

  _parseTime: function (time) {
    if (_.isDate(time)) {
      time = time.getTime();
    } else if (_.isString(time)) {
      try {
        time = Date.parse(time);
      } catch (err) {
        time = 0;
      }
    }
    return time;
  },

  addObject: function (item, insert) {
    var autoTime = this.autoTime;
    var location;
    if (item.hasOwnProperty('location')) {
      location = item.location;
    } else if (item.hasOwnProperty('x') && item.hasOwnProperty('y') && item.hasOwnProperty('z')) {
      location = _.pick(item, 'x', 'y', 'z');
      delete item.x;
      delete item.y;
      delete item.z;
    } else {
      return;
    }
    var direction;
    if (item.hasOwnProperty('direction')) {
      direction = item.direction;
      delete item.direction;
    } else if (item.hasOwnProperty(this.DX) && item.hasOwnProperty(this.DY) && item.hasOwnProperty(this.DZ)) {
      direction = {x: item[this.DX], y: item[this.DY], z: item[this.DZ]};
      delete item[this.DX];
      delete item[this.DY];
      delete item[this.DZ];
    }

    var time = null;
    if (!autoTime) {
      if (item.hasOwnProperty('time')) {
        time = item.time;
        delete item.time;
        time = this._parseTime(time);
      } else if (item.hasOwnProperty('date')) {
        time = item.date;
        delete item.date;
        time = this._parseTime(time);
      }
    }

    var memo = item;

    if (insert) {
      return  this.insert(location, time, direction, memo);
    } else {
      return  this.add(location, time, direction, memo);
    }
  },

  toString: function () {
    return this.map('toString').join("\n");
  },

  map: function (name, args, fromIndex, toIndex) {
    if (!args) {
      args = [];
    }

    var data = this.data;

    if (fromIndex > 0 || toIndex > 0) {
      data = data.slice(fromIndex, toIndex);
    }
    return _.map(data, function (record) {
      return record[name].apply(record, args);
    })
  },

  mapSeries: function (reductor, methods, args, fromIndex, toIndex) {
    var series = Fools.all();
    _.each(methods, function (method, index) {
      var argList = [];
      if (args && args[index] && _.isArray(args[index])) {
        argList = args[index];
      }
      series.add(function (record) {
        return record[method].apply(record, argList)
      });
    });

    var data = this.data;

    if (fromIndex > 0 || toIndex > 0) {
      data = data.slice(fromIndex, toIndex);
    }

    return _.map(data, Fools.pipe(series, function (input) {
      return reductor.apply(reductor, input);
    }));
  },

  cap: function (n) {
    if (!n && (!this.capSize)) {
      return;
    } else {
      this.capSize = n;
    }

    if (this.data.length > this.capSize) {
      var last = this.data[this.capSize];

      var crumbs = this.data.slice(this.capSize);
      if (!crumbs.length) {
        return;
      }
      _.each(crumbs, function (c) {
        c.next = c.prev = null;
      });

      this.data = this.data.slice(0, this.capSize);
      this.last().next = null;
      last.prev = null;
    }
  }

};

return FOUR_D;

}));
