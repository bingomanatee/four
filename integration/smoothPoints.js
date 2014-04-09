var FOUR = require('./../FOUR');
var csv = require('csv-stream');
var fs = require('fs');
var util = require('util');
var _ = require('lodash');
// All of these arguments are optional.
var options = {
  delimiter : ',', // default is ,
  columns : ['x', 'y', 'z'], // by default read the first line and use values found as columns
  escapeChar : '"', // default is an empty string
  enclosedChar : '"' // default is an empty string
};

var csvStream = csv.createStream(options);

var sequence = new FOUR.Sequence();

fs.createReadStream(__dirname + '/points.csv').pipe(csvStream).on('error', function(err){
  console.log(err);
}).on('data', function(point){
  sequence.insert(point);
  var smooth25 = sequence.first().smoothLoc(0.25);
  var smooth50 = sequence.first().smoothLoc(0.50);
  var smooth75 = sequence.first().smoothLoc(0.75);
  if (sequence.data.length > 5){
    var v = sequence.first().v();

    console.log(_.reduce([v, smooth25, smooth50,smooth75], function(o, p){
      o.push(p.x, p.y, p.z);
      return o;

    }, []).join(','));

    sequence.cap(10);
  }
});

