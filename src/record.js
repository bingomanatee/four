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