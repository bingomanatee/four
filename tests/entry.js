require('chai').should();
var FOUR = require('./../FOUR');

describe('FOUR', function () {

  describe('#Sequence', function () {

    describe('#next', function () {
      var sequence = new FOUR.Sequence();
      it('should increment time', function () {
        sequence.add([1,2,3]).time.should.equal(0);
      });
    });

    describe('addBatch', function () {
      describe('array entry', function () {
        describe('position only', function () {
          var sequence;

          before(function () {
            var data = [
              [1, 2, 3],
              [4, 5, 6]
            ];
            sequence = new FOUR.Sequence({data: data});
          });

          it('should import arrays of position', function () {
            sequence.toString().should.equal("1,2,3d0,0,0t0\n4,5,6d0,0,0t-1");
          });
          it('should allow post-creation addition of array data', function () {
            sequence.addItem([7, 8, 9]);
            sequence.toString().should.equal("1,2,3d0,0,0t0\n4,5,6d0,0,0t-1\n7,8,9d0,0,0t-2");
          });
        });

        describe('position and direction', function () {
          var sequence;
          before(function () {
            var data = [
              [1, 2, 3, 10, 20, 30],
              [4, 5, 6, 40, 50, 60]
            ];
            sequence = new FOUR.Sequence({data: data, autoTime: true});
          });
          it('should allow importing of position and direction arrays', function () {
            sequence.toString().should.equal("1,2,3d10,20,30t0\n4,5,6d40,50,60t-1");
          });
        });
      });
    });

    describe('object entry', function () {
      describe('position only', function () {
        var sequence;

        before(function () {
          var data = [
            {x: 1, y: 2, z: 3},
            {x: 4, y: 5, z: 6}
          ];
          sequence = new FOUR.Sequence({data: data});
        });

        it('should allow importing of object data', function () {
          sequence.toString().should.equal("1,2,3d0,0,0t0\n4,5,6d0,0,0t-1");
        });

        it('should allow extra object data to be added after creation', function () {
          sequence.addItem({x: 7, y: 8, z: 9});
          sequence.toString().should.equal("1,2,3d0,0,0t0\n4,5,6d0,0,0t-1\n7,8,9d0,0,0t-2");
        });
      });

      describe ('position and direction', function(){
        var sequence;

        before(function(){
          var data = [
            {x: 1, y: 2, z: 3, i: 10, j: 20, k: 30},
            {x: 4, y: 5, z: 6, i: 40, j: 50, k: 60}
          ];

          sequence = new FOUR.Sequence({data: data, DX: 'i', DY: 'j', DZ: 'k'});
        });

        it('should allow importing of object location and direction', function(){
          sequence.toString().should.equal("1,2,3d10,20,30t0\n4,5,6d40,50,60t-1");
        });

        it('should allow importing of objects after creation', function(){

          sequence.addItem({x: 7, y: 8, z: 9, i: 70, j: 80, k: 90});
          sequence.toString().should.equal("1,2,3d10,20,30t0\n4,5,6d40,50,60t-1\n7,8,9d70,80,90t-2");
        });
      });
    });

    describe('distance analysis', function(){

      var sequence;

      before(function(){
          sequence = new FOUR.Sequence({data: [
            [0, 0, 0],
            [0, 10, 0],
            [10, 10, 0],
            [40, 10, 0]
          ]})
      });

      it('should be able to analyze distances over an array of data', function(){
        sequence.map('distance').should.eql([10, 10, 30, 0]);
      });
    });
  });
});

