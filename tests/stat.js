require('chai').should();
var FOUR = require('./../FOUR');
var _ = require('lodash');

describe('FOUR', function(){

  describe('stat', function(){

    it("should be able to calculate the median of an odd number of elements", function(){

      FOUR.stat.median(_.shuffle([1, 2, 3, 4, 5])).should.equal(3);
      FOUR.stat.median(_.shuffle([1, 2, 3, 4, 500])).should.equal(3);
      FOUR.stat.median(_.shuffle([-1000, 2, 3, 4, 5])).should.equal(3);
    });

    it('should be able to calculate the median of an odd number of elements', function(){
      FOUR.stat.median(_.shuffle([1, 2, 3, 4])).should.equal(2.5);
      FOUR.stat.median(_.shuffle([1, 2, 3, 4000])).should.equal(2.5);
      FOUR.stat.median(_.shuffle([-1000, 2, 3, 4])).should.equal(2.5);
    });

  });

});