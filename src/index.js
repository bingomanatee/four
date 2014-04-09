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