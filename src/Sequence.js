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