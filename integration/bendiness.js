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

var sequence = new FOUR.Sequence({autoTime: true , timeInc: 0.001});

fs.createReadStream(__dirname + '/points.csv').pipe(csvStream).on('error', function(err){
  console.log(err);
}).on('data', function(point){
  sequence.insert(point);

  if (sequence.data.length > 10){
    var v = sequence.data[4];
    var smooth50 = v.smoothLoc(0.50);
    var bend = v.bend(8, 0.50);

    console.log([v.time].concat(_.reduce([v.v(), smooth50], function(o, p){
      o.push(p.x, p.y, p.z);
      return o;

    }, [])).concat([bend, v.speed(8, 0.50)/1000]).join(','));

    sequence.cap(10);
  }
});

