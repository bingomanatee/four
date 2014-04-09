FOUR is a generalized library for time/space analysis. It allows you to build an array of time/space data and analyze it
for patterns.

Each record in a series is linked with a prev/next reference, and there are methods for speed, bend (change in direction),
median sampling around a given point, and more.

## Benefits of FOUR

FOUR allows you to easily extract a set of similar properties, and even use Fools methods
to pipe those properties into a reductor. It allows you to operate in multiple levels of
data smoothing to zero in on the appropriate smoothness settings. In the absence
of explicit time data, you can set what level of smoothed data you operate on.

It has a couple of useful methods such as tangent, speed, distance, all of which can be
tuned to be based on smoothed data or to reach out a few points ahead and behind.

Also each point is given a next/prev reference for easy relative comparison.

It has the ability to cap series of points, which culls the next/prev reference appropriately.
The smoothing even preserves smoothing cache based on previous smoothing history.

## Smoothed location parameter

Smoothing -- or exponential smoothing --- basically adds momentum to the location over time
to minimize the impact of abberant data. The data will "lag" behind the original source points
but will have less bumps and jags.

Smoothing as a parameter is a float between 0 and 1. 0 will give you true to life results
based on the source data. 0.5 will give you a nicely smoothed set of values to calculate on.
Values over 0.666 or so are not advised.

Smoothing is an incremental value -- it calculates based on the previous record; so, the first time a
a smoothed record is requested, a series of back-calculations are run over the previous history.

## Records

Records are built to accept a range of input including
* location
* time
* direction
* any other metadata you want to attach

In the absence of native data, adding records to a series will inject a time value.

### Properties

#### time {int}
the time the record is entered; no assumption is made on time scale.

#### location {various}
the x,y.z coordinates of the point. This is the raw input value and so can be
a number of formats. The `v()` or `smoothLoc()` methods will always return a Vector3
value for location and so are the preferred sources of truth for location.

#### direction{various}
the x, y, z euler angles of the direction. Not currently exploited.

### Methods

Many methods have a "smoothing" value. Smoothed location uses an (exponential smoothing)[http://en.wikipedia.org/wiki/Exponential_smoothing]
interpretation of location. Smoothing values of zero will base calculations on the original locations.

Most of these methods only work when Records are injected into series as they require neighbors.

Methods include:

### *constructor*(location, time, direction, meta)
location and direction may be THREE.Vector3's, naked {x, y, z} objects, or arrays.
time can be a Date or a number. It is stored as a number in either case.

#### v() {THREE.Vector3}
the location of the original entry

#### smoothLoc(smoothing) {THREE.Vector3}
The exponentially smoothed location

#### tangent(smoothing) {THREE.Vector3}
the average direction between the point and its immediate neighbors.

#### distance(smoothing) {float}
the distance to the next point.

#### speed(distance, smoothing) {float}
The sum of the distances of points +/- distance from this point
divided by the duration between the first and last point in the series.

#### bend(distance, smoothing) {float} 0..1
the change in tangent between points at + and - distance from the record.

#### medianLocation(spread) {Vector3}
the median location of the x, y and z values within +/- spread of this point.

#### locationToVector(point) {Vector3}
returns a normalized vector between the passed-in point and the record.

## Sequence
Location records are kept in Series objects. The data is stored in *descending* time order.

Sequences accept a range of configurations and optionally, data, as an array.
It can parse a wide variety of data input formats including objects, long arrays, and JSON strings.

note that if a sequences' autoTime property is true, OR the data has no time value,
adding data to a sequence will OVERRIDE and automatically
set the time of all entries based on an internal counter and increment (`timeInc`) values.

### Methods

#### addItem(item {various}, insert {boolean}) {Record}
adds a record from data input as array, object or string source.
By default appends the record to the end of the data array (in descending order);
if insert is true, prepends it.

#### addBatch(data {array})
Adds all records from the data into the sequence.

#### cap (n {int} optional)
removes all but `n` records from the list. Also reorients all prev/next references.
**WARNING**: if you set a cap and add or addBatch a series of records, only as many records
will be preserved (or added at all) as your cap number allows. You can `insert` as many
records as you want to a capped sequence - this will push old data down to the end of the sequence.

#### add (location, time, direction, meta)
#### insert (location, time, direction, meta)
Adds a record to the data, linking prev and next. insert adds the record *before*
the existing data; add adds the record *after* the existing data.

#### first() {Record}
#### last() {Record}

returns the first or last record in the dataset.