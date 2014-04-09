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
        var data = _.map(_.range(1,40,3), function(x){
          return [x, x + 1, x + 2];
        });

      //  console.log('data: %s', util.inspect(data));

        sequence = new FOUR.Sequence({
          capSize: 4, data: data
        });
      });

      it('should only have four records', function(){
        sequence.length().should.eql(4);
      });

      it('should have the same first record as the input', function(){
        sequence.first().v().x.should.eql(1);
      });

      it('should not change after adding at the end', function(){
        sequence.addItem([10, 20, 40]);
        sequence.first().v().x.should.eql(1);
      });

      it('should change after adding at the start', function(){
        sequence.addItem([10, 20, 40], true);
        sequence.first().v().x.should.eql(10);
      });
    })
  });
});