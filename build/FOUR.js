// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var domain;

function EventEmitter() {
    EventEmitter.init.call(this);
}

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.usingDomains = false;

EventEmitter.prototype.domain = undefined;
EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

EventEmitter.init = function() {
    this.domain = null;
    if (EventEmitter.usingDomains) {
        // if there is an active domain, then attach to it.
        domain = domain || require('domain');
        if (domain.active && !(this instanceof domain.Domain)) {
            this.domain = domain.active;
        }
    }
    this._events = this._events || {};
    this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
    if (!_.isNumber(n) || n < 0 || isNaN(n))
        throw TypeError('n must be a positive number');
    this._maxListeners = n;
    return this;
};

EventEmitter.prototype.emit = function(type) {
    var er, handler, len, args, i, listeners;

    if (!this._events)
        this._events = {};

    // If there is no 'error' event listener then throw.
    if (type === 'error' && !this._events.error) {
        er = arguments[1];
        if (this.domain) {
            if (!er)
                er = new Error('Uncaught, unspecified "error" event.');
            er.domainEmitter = this;
            er.domain = this.domain;
            er.domainThrown = false;
            this.domain.emit('error', er);
        } else if (er instanceof Error) {
            throw er; // Unhandled 'error' event
        } else {
            throw Error('Uncaught, unspecified "error" event.');
        }
        return false;
    }

    handler = this._events[type];

    if (_.isUndefined(handler))
        return false;

    if (this.domain && this !== process)
        this.domain.enter();

    if (_.isFunction(handler)) {
        switch (arguments.length) {
            // fast cases
            case 1:
                handler.call(this);
                break;
            case 2:
                handler.call(this, arguments[1]);
                break;
            case 3:
                handler.call(this, arguments[1], arguments[2]);
                break;
            // slower
            default:
                len = arguments.length;
                args = new Array(len - 1);
                for (i = 1; i < len; i++)
                    args[i - 1] = arguments[i];
                handler.apply(this, args);
        }
    } else if (_.isObject(handler)) {
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
            args[i - 1] = arguments[i];

        listeners = handler.slice();
        len = listeners.length;
        for (i = 0; i < len; i++)
            listeners[i].apply(this, args);
    }

    if (this.domain && this !== process)
        this.domain.exit();

    return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
    var m;

    if (!_.isFunction(listener))
        throw TypeError('listener must be a function');

    if (!this._events)
        this._events = {};

    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (this._events.newListener)
        this.emit('newListener', type,
            _.isFunction(listener.listener) ?
                listener.listener : listener);

    if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
        this._events[type] = listener;
    else if (_.isArray(this._events[type]))
    // If we've already got an array, just append.
        this._events[type].push(listener);
    else
    // Adding the second element, need to change to array.
        this._events[type] = [this._events[type], listener];

    // Check for listener leak
    if (_.isObject(this._events[type]) && !this._events[type].warned) {
        var m;
        if (!_.isUndefined(this._maxListeners)) {
            m = this._maxListeners;
        } else {
            m = EventEmitter.defaultMaxListeners;
        }

        if (m && m > 0 && this._events[type].length > m) {
            this._events[type].warned = true;
            console.error('(node) warning: possible EventEmitter memory ' +
                'leak detected. %d listeners added. ' +
                'Use emitter.setMaxListeners() to increase limit.',
                this._events[type].length);
            console.trace();
        }
    }

    return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
    if (!_.isFunction(listener))
        throw TypeError('listener must be a function');

    var fired = false;

    function g() {
        this.removeListener(type, g);

        if (!fired) {
            fired = true;
            listener.apply(this, arguments);
        }
    }

    g.listener = listener;
    this.on(type, g);

    return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
    var list, position, length, i;

    if (!_.isFunction(listener))
        throw TypeError('listener must be a function');

    if (!this._events || !this._events[type])
        return this;

    list = this._events[type];
    length = list.length;
    position = -1;

    if (list === listener ||
        (_.isFunction(list.listener) && list.listener === listener)) {
        delete this._events[type];
        if (this._events.removeListener)
            this.emit('removeListener', type, listener);

    } else if (_.isObject(list)) {
        for (i = length; i-- > 0;) {
            if (list[i] === listener ||
                (list[i].listener && list[i].listener === listener)) {
                position = i;
                break;
            }
        }

        if (position < 0)
            return this;

        if (list.length === 1) {
            list.length = 0;
            delete this._events[type];
        } else {
            list.splice(position, 1);
        }

        if (this._events.removeListener)
            this.emit('removeListener', type, listener);
    }

    return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
    var key, listeners;

    if (!this._events)
        return this;

    // not listening for removeListener, no need to emit
    if (!this._events.removeListener) {
        if (arguments.length === 0)
            this._events = {};
        else if (this._events[type])
            delete this._events[type];
        return this;
    }

    // emit removeListener for all listeners on all events
    if (arguments.length === 0) {
        for (key in this._events) {
            if (key === 'removeListener') continue;
            this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = {};
        return this;
    }

    listeners = this._events[type];

    if (_.isFunction(listeners)) {
        this.removeListener(type, listeners);
    } else if (Array.isArray(listeners)) {
        // LIFO order
        while (listeners.length)
            this.removeListener(type, listeners[listeners.length - 1]);
    }
    delete this._events[type];

    return this;
};

EventEmitter.prototype.listeners = function(type) {
    var ret;
    if (!this._events || !this._events[type])
        ret = [];
    else if (_.isFunction(this._events[type]))
        ret = [this._events[type]];
    else
        ret = this._events[type].slice();
    return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
    var ret;
    if (!emitter._events || !emitter._events[type])
        ret = 0;
    else if (_.isFunction(emitter._events[type]))
        ret = 1;
    else
        ret = emitter._events[type].length;
    return ret;
};
var Vector3 = THREE.Vector3;
var FOUR = {

  inherits: function (ctor, superCtor) { // taken from node.js
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  },

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
    return FOUR.DT_EMPTY;
  } else if (_.isArray(data)) {
    return FOUR.DT_ARRAY;
  } else if (_.isObject(data)) {
    if (_.isFunction(data.getColumnFromMatrix)) {
      return FOUR.DT_VECTOR3;
    } else {
      return FOUR.DT_OBJECT;
    }
  } else {
    return FOUR.DT_EMPTY;
  }
}

FOUR.DT_EMPTY = 0;
FOUR.DT_ARRAY = 1;
FOUR.DT_OBJECT = 2;
FOUR.DT_VECTOR3 = 3;

function _smoothIndex(number) {
  return Math.floor(number * 10000) + '';
}

var _recordId = 0;
FOUR.Record = function (location, time, direction, meta) {
  this.time = !time ? 0 : ( _.isDate(direction) ? direction.getTime() : (_.isNumber(time) ? time : 0));
  this.location = location;
  this.l_type = _ld_type(location);
  this.direction = direction;
  this.d_type = _ld_type(direction);
  this.meta = meta ? ( _.isObject(meta) ? meta : {id: meta}) : {};
  this.id = this.meta.hasOwnProperty('id') ? meta.id : ++_recordId;
  this._smooths = {};
};

FOUR.Record.prototype = {

  toString: function () {
    return this.la(true).join(',') + 'd' + this.da().join(',') + 't' + this.time;
  },

  la: function (fast) {
    switch (this.l_type) {
      case FOUR.DT_EMPTY:
        return [0, 0, 0];
        break;

      case FOUR.DT_ARRAY:
        return fast ? this.location : this.location.slice();
        break;

      case FOUR.DT_OBJECT:
        return [this.location.x, this.location.y, this.location.z];
        break;

      case FOUR.DT_VECTOR3:
        return [this.location.x, this.location.y, this.location.z];
        break;

      default:
        return [0, 0, 0];
    }
  },

  da: function (fast) {
    switch (this.d_type) {
      case FOUR.DT_EMPTY:
        return [0, 0, 0];
        break;

      case FOUR.DT_ARRAY:
        return fast ? this.direction : this.direction.slice();
        break;

      case FOUR.DT_OBJECT:
        return [this.direction.x, this.direction.y, this.direction.z];
        break;

      case FOUR.DT_VECTOR3:
        return [this.direction.x, this.direction.y, this.direction.z];
        break;

      default:
        return [0, 0, 0];
    }
  },

  v: function () {
    if (this.l_type == FOUR.DT_VECTOR3) {
      return this.location;
    } else if (!this._v) {
      switch (this.l_type) {
        case FOUR.DT_ARRAY:
          this._v = new Vector3(this.location[0], this.location[1], this.location[2]);
          break;

        case FOUR.DT_OBJECT:
          this._v = new Vector3();
          this._v.copy(this.location);
          break;

        case FOUR.DT_EMPTY:
          this._v = new Vector3();
          break;

        default:
          this._v = new Vector3();
      }
    }

    return this._v;
  },

  distance: function (smoothing) {
    smoothing = smoothing || 0;
    if (!this.next) {
      return 0;
    }

    return this.smoothLoc(smoothing)
      .distanceTo(this.next.smoothLoc(smoothing));
  },

  tangent: function (smoothing) {

    var next = this.next;
    var prev = this.prev;
    var prevSmoothLoc, nextSmoothLoc;
    var sl = this.smoothLoc(smoothing).clone();
    if (next) {
      nextSmoothLoc = next.smoothLoc(smoothing).clone();
      if (prev) {
        prevSmoothLoc = prev.smoothLoc(smoothing).clone();
        return prevSmoothLoc.sub(nextSmoothLoc).normalize();
      } else {
        return sl.sub(nextSmoothLoc).normalize();
      }
    } else if (prev) {
      prevSmoothLoc = prev.smoothLoc(smoothing).clone();
      return prevSmoothLoc.sub(sl).normalize();
    } else {
      return new Vector3();
    }

  },

  speed: function (distance, smoothing) {

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
    } while (next !== prev);
    return Math.abs(travel / time);
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
    var bend = dist / 2;
    return bend * bend;
  },

  smoothLoc: function (smoothing) {
    if (smoothing == 0) {
      return this.v();
    }
    var index = _smoothIndex(smoothing);

    if (this._smooths[index]){
      return this._smooths[index];
    }

    var next = this;
    while (next.next && (!next._smooths.hasOwnProperty(index))
      ) {
      next = next.next;
    }

    if (!next) {
      debugger;
    }

    while(next && !next._smooths[index]) {
      next._smooth(smoothing, index);
      next = next.prev;
    }

    if (!this._smooths[index]) {
      this._smooth(smoothing, index);
    }
    return this._smooths[index];
  },

  _smooth: function (smoothing, index) {
    if (!index) {
      index = _smoothIndex(smoothing);
    }

    if (!this._smooths.hasOwnProperty(index)) {
      if (this.next) {
        if (this.next._smooths[index]) {

          var basis = this.next._smooths[index].clone().multiplyScalar(smoothing);
          basis.add(this.v().clone().multiplyScalar(1 - smoothing));
        }

        this._smooths[index] = basis;

      } else {
        this._smooths[index] = this.v().clone();
      }
    }
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

    return new Vector3(FOUR.stat.median(xs), FOUR.stat.median(ys), FOUR.stat.median(zs));
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
/**
 * note - Sequence assumes data is in descending order -- i.e.,first record is the most recent.
 *
 */
FOUR.Sequence = function (config) {
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


FOUR.inherits(FOUR.Sequence, EventEmitter);

_.extend(
FOUR.Sequence.prototype, {

  DX: 'dx',
  DY: 'dy',
  DZ: 'dz',

  add: function (location, time, direction, meta) {
    if (this.capSize && this.capSize <= this.data.length){
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

    var record = new FOUR.Record(location, time, direction, meta);
    if (this.data.length) {
      last.next = record;
      record.prev = last;
    }
    this.data.push(record);
    this.emit('record', record, 'insert');
    return record;
  },

  /**
   * inserts a MORE RECENT record to the TOP of data.
   *
   * @param location
   * @param time
   * @param direction
   * @param meta
   * @returns {FOUR.Record}
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

    var record = new FOUR.Record(location, time, direction, meta);
    if (first) {
      first.prev = record;
      record.next = first;
    }
    this.data.unshift(record);

    if (this.capSize && this.data.length > this.capSize){
      this.cap();
    }
    this.emit('record', record, 'insert');
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

  length: function(){
    return this.data.length;
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
    return this.capSize;
  }

});