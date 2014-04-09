var FOUR = require('./../FOUR');
require('chai').should();
var _ = require('lodash');
var util = require('util');
var THREE = require('three');

describe('FOUR', function () {

  describe('speed x bend', function () {

    var sequence, bends, speeds;
    var expectedBends = require('./maps/expectedBends.json');
    var expectedSpeeds = require('./maps/expectedSpeed.json');
    var bendTimesSpeed = _.map(expectedBends, function (v, i) {
        return v * expectedSpeeds[i];
      }
    );
    var speedArgs = [0, 0];
    var bendArgs = [2, 0];

    function _b(b) {
      return Math.round(b * 1000)
    }

    function _s(b) {
      return Math.round(b)
    }

    before(function () {
      sequence = new FOUR.Sequence({
        autoTime: true,
        timeInc: -0.01,
        data: _.map(_.range(0, 36), function (x, i) {
          var s = Math.sin(Math.PI * x / 10);
          return [Math.sqrt(s), i / 2, 0];

        })});
      bends = sequence.map('bend', bendArgs);
      speeds = sequence.map('speed', speedArgs);
    });

    it('be able to calculate predicted bends', function () {
      _.map(bends, _b).should.eql(expectedBends);
    });

    it('be able to calculate predicted speed', function () {
      _.map(speeds, _s).should.eql(
        expectedSpeeds);
    });

    it('should be able to pipe bends and speed', function () {
      sequence.mapSeries(function (bend, speed) {
        return _b(bend) * _s(speed);
      }, ['bend', 'speed'], [bendArgs, speedArgs]).should.eql(bendTimesSpeed);
    });

    describe('map with limits', function () {
      var expectedBendsLimited = expectedBends.slice(2, 5);
      var expectedSpeedsLimited = expectedSpeeds.slice(2, 5);
      var bends, speeds;
      var bendTimesSpeedLimited = _.map(expectedBendsLimited, function (v, i) {
          return v * expectedSpeedsLimited[i];
        }
      );

      before(function () {
        bends = sequence.map('bend', bendArgs, 2, 5);
        speeds = sequence.map('speed', speedArgs, 2, 5);
      });

      it('should be able to map with a sliced subset of points', function () {
        _.map(bends, _b).should.eql(expectedBendsLimited);
        _.map(speeds, _s).should.eql(expectedSpeedsLimited);
      });

      it('should be able to map a series with a sliced subset of points', function () {

        sequence.mapSeries(function (bend, speed) {
          return _b(bend) * _s(speed);
        }, ['bend', 'speed'], [bendArgs, speedArgs], 2, 5).should.eql(bendTimesSpeedLimited);
      });

    })

  });

});
