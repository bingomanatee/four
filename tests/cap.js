var FOUR = require('./../FOUR');
require('chai').should();
var _ = require('lodash');
var util = require('util');
var THREE = require('three');

describe('FOUR', function () {

  describe('cap', function () {
    describe('cap size in constructor', function(){

      var sequence;
      before(function(){

        sequence = new FOUR.Sequence({
          capSize: 4, data: _.map(_.range(1,40,3), function(x){
            return [x, x + 1, x + 2];
          })
        })
      });

      it('should only have four records', function(){

        sequence.length().should.eql(4);

      })

    })
  });
});