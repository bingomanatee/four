require('chai').should();
var FOUR = require('./../FOUR');
var csv = require('csv-stream');
var fs = require('fs');
var xyz = require('./xyz');
var util = require('util');

describe('FOUR', function () {
  describe('smoothing', function () {

    describe('smoothing forward', function () {

      var expectations = [];

      var sequence;

      before(function (done) {
        sequence = new FOUR.Sequence({data: [
          [0, 0, 0],
          [1, 1, 1],
          [2, 10, 2],
          [3, 3, 3],
          [4, 4, 4]
        ]});


        var options = {
        };
        var csvStream = csv.createStream(options);

        fs.createReadStream(__dirname + '/smoothing/expSmooth.csv')
          .pipe(csvStream).on('error', function (err) {
            console.log(err);
          }).on('data', function (point) {

            var original = xyz({x: point.X, y: point.Y, z: point.Z});
            var smooth25 = xyz({x: point.x25, y: point.y25, z: point.z25});
            var smooth50 = xyz({x: point.x50, y: point.y50, z: point.z50});
            expectations.push({
              original: original, smooth25: smooth25, smooth50: smooth50});
          }).on('end', function () {
            done();
          });

      });

      it('should be able to generate smooth locations at each point', function (done) {

        var record = sequence.last();
        xyz(record.smoothLoc(0)).should.eql(expectations[4].original);
        xyz(record.smoothLoc(0.5)).should.eql(expectations[4].smooth50);
        xyz(record.smoothLoc(0.25)).should.eql(expectations[4].smooth25);

        record = record.prev;
        xyz(record.smoothLoc(0)).should.eql(expectations[3].original);
        xyz(record.smoothLoc(0.5)).should.eql(expectations[3].smooth50);
        xyz(record.smoothLoc(0.25)).should.eql(expectations[3].smooth25);

        record = record.prev;
        xyz(record.smoothLoc(0)).should.eql(expectations[2].original);
        xyz(record.smoothLoc(0.5)).should.eql(expectations[2].smooth50);
        xyz(record.smoothLoc(0.25)).should.eql(expectations[2].smooth25);

        record = record.prev;
        xyz(record.smoothLoc(0)).should.eql(expectations[1].original);
        xyz(record.smoothLoc(0.5)).should.eql(expectations[1].smooth50);
        xyz(record.smoothLoc(0.25)).should.eql(expectations[1].smooth25);

        record = record.prev;
        xyz(record.smoothLoc(0)).should.eql(expectations[0].original);
        xyz(record.smoothLoc(0.5)).should.eql(expectations[0].smooth50);
        xyz(record.smoothLoc(0.25)).should.eql(expectations[0].smooth25);
        done();
      });
    });

// because of caching we have to make sure it works no matter which order you go in

    describe('smoothing reverse', function () {

      var sequence;
      var expectations = [];

      before(function (done) {
        sequence = new FOUR.Sequence({data: [
          [0, 0, 0],
          [1, 1, 1],
          [2, 10, 2],
          [3, 3, 3],
          [4, 4, 4]
        ]});


        var options = {
        };
        var csvStream = csv.createStream(options);

        fs.createReadStream(__dirname + '/smoothing/expSmooth.csv')
          .pipe(csvStream).on('error', function (err) {
            console.log(err);
          }).on('data', function (point) {

            var original = xyz({x: point.X, y: point.Y, z: point.Z});
            var smooth25 = xyz({x: point.x25, y: point.y25, z: point.z25});
            var smooth50 = xyz({x: point.x50, y: point.y50, z: point.z50});
            expectations.push({
              original: original, smooth25: smooth25, smooth50: smooth50});
          }).on('end', function () {
            done();
          });

      });

      it('should be able to generate smooth locations at each point', function (done) {

        var record = sequence.first();
        xyz(record.smoothLoc(0)).should.eql(expectations[0].original);
        xyz(record.smoothLoc(0.5)).should.eql(expectations[0].smooth50);
        xyz(record.smoothLoc(0.25)).should.eql(expectations[0].smooth25);

        record = record.next;
        xyz(record.smoothLoc(0)).should.eql(expectations[1].original);
        xyz(record.smoothLoc(0.5)).should.eql(expectations[1].smooth50);
        xyz(record.smoothLoc(0.25)).should.eql(expectations[1].smooth25);

        record = record.next;
        xyz(record.smoothLoc(0)).should.eql(expectations[2].original);
        xyz(record.smoothLoc(0.5)).should.eql(expectations[2].smooth50);
        xyz(record.smoothLoc(0.25)).should.eql(expectations[2].smooth25);

        record = record.next;
        xyz(record.smoothLoc(0)).should.eql(expectations[3].original);
        xyz(record.smoothLoc(0.5)).should.eql(expectations[3].smooth50);
        xyz(record.smoothLoc(0.25)).should.eql(expectations[3].smooth25);

        record = record.next;
        xyz(record.smoothLoc(0)).should.eql(expectations[4].original);
        xyz(record.smoothLoc(0.5)).should.eql(expectations[4].smooth50);
        xyz(record.smoothLoc(0.25)).should.eql(expectations[4].smooth25);
        done();
      });
    });
  });
});