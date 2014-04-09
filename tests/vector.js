var FOUR_D = require('./../4d');
require('chai').should();
var _ = require('lodash');
var util = require('util');
var THREE = require('three');

function xyz(p) {
  return _.pick(p, 'x', 'y', 'z');
}

describe('4D', function () {
  describe('tangents and median location', function () {

    describe('medianLocation', function () {

      var sequence;

      before(function () {
        sequence = new FOUR_D.Sequence({data: [
          [0, 0, 0],
          [1, 1, 1],
          [2, 10, 2],
          [3, 3, 3],
          [4, 4, 4]
        ]});
      });

      it('should be able to generate median locations for each point', function () {
        var record = sequence.first();
        var loc = record.medianLocation();
        xyz(loc).should.eql({x: 0, y: 0, z: 0});
        loc = record.medianLocation(1);
        xyz(loc).should.eql({x: 0, y: 0, z: 0});
        loc = record.medianLocation(2);
        xyz(loc).should.eql({x: 0, y: 0, z: 0});

        record = record.next;
        loc = record.medianLocation();
        xyz(loc).should.eql({x: 1, y: 1, z: 1});
        loc = record.medianLocation(1);
        xyz(loc).should.eql({x: 1, y: 1, z: 1});
        loc = record.medianLocation(2);
        xyz(loc).should.eql({x: 1, y: 1, z: 1});

        record = record.next;
        loc = record.medianLocation();
        xyz(loc).should.eql({x: 2, y: 10, z: 2});
        loc = record.medianLocation(1);
        xyz(loc).should.eql({x: 2, y: 3, z: 2});
        loc = record.medianLocation(2);
        xyz(loc).should.eql({x: 2, y: 3, z: 2});

        record = record.next;
        loc = record.medianLocation();
        xyz(loc).should.eql({x: 3, y: 3, z: 3});
        loc = record.medianLocation(1);
        xyz(loc).should.eql({x: 3, y: 3, z: 3});
        loc = record.medianLocation(2);
        xyz(loc).should.eql({x: 3, y: 3, z: 3});

        record = record.next;
        loc = record.medianLocation();
        xyz(loc).should.eql({x: 4, y: 4, z: 4});
        loc = record.medianLocation(1);
        xyz(loc).should.eql({x: 4, y: 4, z: 4});
        loc = record.medianLocation(2);
        xyz(loc).should.eql({x: 4, y: 4, z: 4});
      });
    });

    describe('locationToVector', function () {
      var record;

      before(function () {
        record = new FOUR_D.Record({x: 1, y: 1, z: 1});

        it('should be able to get a normal vector from locationToVector', function () {

          var vector = record.locationToVector({x: 2, y: 2, z: 2});
          var exp = new THREE.Vector3(1, 1, 1);
          exp.normalize();

          xyz(vector).should.eql(_.pick(vector, 'x', 'y', 'z'));

          vector = record.locationToVector({x: 3, y: 3, z: 3});

          xyz(vector).should.eql(_.pick(vector, 'x', 'y', 'z'))
        })
      })


    });


    describe('tangents', function () {

      var sequence;

      before(function () {
        sequence = new FOUR_D.Sequence({data: [
          [0, 0, 0],
          [1, 1, 1],
          [2, 10, 2],
          [3, 3, 3],
          [4, 4, 4]
        ]});
      });

      it('should be able to generate tangents to each point', function () {

        var record = sequence.last();

        xyz(record.tangent(0)).should.eql(xyz(new THREE.Vector3(-1, -1, -1).normalize()));
        xyz(record.tangent(0.5)).should.eql(xyz(new THREE.Vector3(-1, -1, -1).normalize()));

        record = record.prev;
        xyz(record.tangent(0)).should.eql(xyz(new THREE.Vector3(2 - 4, 10 - 4, 2 - 4).normalize()));
        xyz(record.tangent(0.5)).should.eql(xyz(new THREE.Vector3(2.75 - 4, 6.75 - 4, 2.75 - 4).normalize()));

        record = record.prev;
        xyz(record.tangent(0)).should.eql(xyz(new THREE.Vector3(-2, -2, -2).normalize()));
        xyz(record.tangent(0.5)).should.eql(xyz(new THREE.Vector3(1.875 - 3.5, 3.875 - 3.5, 1.875 - 3.5).normalize()));

        record = record.prev;
        xyz(record.tangent(0)).should.eql(xyz(new THREE.Vector3(-2, -10, -2).normalize()));
        xyz(record.tangent(0.5)).should.eql(xyz(new THREE.Vector3(0.9375 - 2.75, 1.9375 - 6.75, 0.9375 - 2.75).normalize()));

        record = record.prev;
        xyz(record.tangent(0)).should.eql(xyz(new THREE.Vector3(-1, -1, -1).normalize()));
        xyz(record.tangent(0.5)).should.eql(xyz(new THREE.Vector3(-0.9375, -1.9375, -0.9375).normalize()));

      });
    });

    describe('bend', function () {

      var sequence;

      before(function () {
        sequence = new FOUR_D.Sequence({data: _.map(_.range(0, 36), function (x, i) {

          return [Math.sin(Math.PI * x / 10), i / 2, 0];

        })});
      });

      it('should be able to calculate the bend of the line', function () {
        var bends = sequence.map('bend', [2, 0]);

        _.map(bends, function (b) {
          return Math.round(b * 1000)
        }).should.eql([0, 2, 8, 19, 30, 35, 30, 19, 8, 2, 0, 2, 8, 19, 30, 35, 30, 19, 8, 2, 0, 2, 8, 19, 30, 35, 30, 19, 8, 2, 0, 2, 8, 19, 16, 0]);


      });

    });

    describe('speed', function () {
      var sequence;
      var sequence2;
      before(function () {

        sequence = new FOUR_D.Sequence({
          autoInc: true,
          data: [
            [0, 0, 0],
            [10, 0, 0],
            [20, 0, 0],
            [30, 0, 0],
            [40, 0, 0]
          ]

        });
        sequence2 = new FOUR_D.Sequence({
          autoInc: true,
          data: [
            [0, 0, 0],
            [3, 4, 0],
            [6, 8, 0],
            [9, 12, 0],
            [12, 16, 0]
          ]

        });
      });

      it('should be able to track speed of sequence in one dimension', function () {
        var speeds = sequence.map('speed', [0, 0]);
        speeds.should.eql([ 10, 10, 10, 10, 10 ])
      });

      it('should be able to track speed of sequence in two dimensions', function () {
        var speeds = sequence2.map('speed', [0, 0]);
        speeds.should.eql([ 5, 5, 5, 5, 5 ])
      });

    });

    describe('smoothing', function () {

      var sequence;

      before(function () {
        sequence = new FOUR_D.Sequence({data: [
          [0, 0, 0],
          [1, 1, 1],
          [2, 10, 2],
          [3, 3, 3],
          [4, 4, 4]
        ]});
      });

      it('should be able to generate smooth locations at each point', function () {
        var record = sequence.last();
        xyz(record.smoothLoc(0)).should.eql({x: 4, y: 4, z: 4});
        xyz(record.smoothLoc(0.5)).should.eql({x: 4, y: 4, z: 4});
        xyz(record.smoothLoc(0.25)).should.eql({x: 4, y: 4, z: 4});

        record = record.prev;
        xyz(record.smoothLoc(0)).should.eql({x: 3, y: 3, z: 3});
        xyz(record.smoothLoc(0.5)).should.eql({x: 3.5, y: 3.5, z: 3.5});
        xyz(record.smoothLoc(0.25)).should.eql({x: 3.25, y: 3.25, z: 3.25});

        record = record.prev;
        xyz(record.smoothLoc(0)).should.eql({x: 2, y: 10, z: 2});
        xyz(record.smoothLoc(0.5)).should.eql({x: 2.75, y: 6.75, z: 2.75});
        xyz(record.smoothLoc(0.25)).should.eql({x: 2.3125, y: 8.3125, z: 2.3125});

        record = record.prev;
        xyz(record.smoothLoc(0)).should.eql({x: 1, y: 1, z: 1});
        xyz(record.smoothLoc(0.5)).should.eql({x: 1.875, y: 3.875, z: 1.875});
        xyz(record.smoothLoc(0.25)).should.eql({x: 1.328125, y: 2.828125, z: 1.328125});

        record = record.prev;
        xyz(record.smoothLoc(0)).should.eql({x: 0, y: 0, z: 0});
        xyz(record.smoothLoc(0.5)).should.eql({x: 0.9375, y: 1.9375, z: 0.9375});
        xyz(record.smoothLoc(0.25)).should.eql({x: 0.33203125, y: 0.70703125, z: 0.33203125});
      });
    });

    // because of caching we have to make sure it works no matter which order you go in
    describe('smoothing - other order', function () {

      var sequence;

      before(function () {
        sequence = new FOUR_D.Sequence({data: [
          [0, 0, 0],
          [1, 1, 1],
          [2, 10, 2],
          [3, 3, 3],
          [4, 4, 4]
        ]});
      });

      it('should be able to smooth locations at each point', function () {

        var record = sequence.first();
        xyz(record.smoothLoc(0)).should.eql({x: 0, y: 0, z: 0});
        xyz(record.smoothLoc(0.5)).should.eql({x: 0.9375, y: 1.9375, z: 0.9375});
        xyz(record.smoothLoc(0.25)).should.eql({x: 0.33203125, y: 0.70703125, z: 0.33203125});

        record = record.next;
        xyz(record.smoothLoc(0)).should.eql({x: 1, y: 1, z: 1});
        xyz(record.smoothLoc(0.5)).should.eql({x: 1.875, y: 3.875, z: 1.875});
        xyz(record.smoothLoc(0.25)).should.eql({x: 1.328125, y: 2.828125, z: 1.328125});

        record = record.next;
        xyz(record.smoothLoc(0)).should.eql({x: 2, y: 10, z: 2});
        xyz(record.smoothLoc(0.5)).should.eql({x: 2.75, y: 6.75, z: 2.75});
        xyz(record.smoothLoc(0.25)).should.eql({x: 2.3125, y: 8.3125, z: 2.3125});

        record = record.next;
        xyz(record.smoothLoc(0)).should.eql({x: 3, y: 3, z: 3});
        xyz(record.smoothLoc(0.5)).should.eql({x: 3.5, y: 3.5, z: 3.5});
        xyz(record.smoothLoc(0.25)).should.eql({x: 3.25, y: 3.25, z: 3.25});

        record = record.next;
        xyz(record.smoothLoc(0)).should.eql({x: 4, y: 4, z: 4});
        xyz(record.smoothLoc(0.5)).should.eql({x: 4, y: 4, z: 4});
        xyz(record.smoothLoc(0.25)).should.eql({x: 4, y: 4, z: 4});
      });
    });
  });
});