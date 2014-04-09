require('chai').should();
var FOUR_D = require('./../4d');
var _ = require('lodash');

describe('4d', function(){

  describe('stat', function(){

    it("should be able to calculate the median of an odd number of elements", function(){

      FOUR_D.stat.median(_.shuffle([1, 2, 3, 4, 5])).should.equal(3);
      FOUR_D.stat.median(_.shuffle([1, 2, 3, 4, 500])).should.equal(3);
      FOUR_D.stat.median(_.shuffle([-1000, 2, 3, 4, 5])).should.equal(3);
    });

    it('should be able to calculate the median of an odd number of elements', function(){
      FOUR_D.stat.median(_.shuffle([1, 2, 3, 4])).should.equal(2.5);
      FOUR_D.stat.median(_.shuffle([1, 2, 3, 4000])).should.equal(2.5);
      FOUR_D.stat.median(_.shuffle([-1000, 2, 3, 4])).should.equal(2.5);
    });

  });

});