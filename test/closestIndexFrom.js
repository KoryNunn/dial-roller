var test = require('tape'),
    closestIndexFrom = require('../closestIndexFrom');

test('simple from 0', function(t){

    t.plan(1);

    t.equal(closestIndexFrom(
        [1,2,3,4],
        2,
        0
    ), 1);
});


test('backwards', function(t){

    t.plan(1);

    t.equal(closestIndexFrom(
        [1,2,3,4],
        3,
        0
    ), 2);
});

test('odd', function(t){

    t.plan(1);

    t.equal(closestIndexFrom(
        [1,2,3,4,5],
        5,
        0
    ), 4);
});

test('duplicates', function(t){

    t.plan(3);

    t.equal(closestIndexFrom(
        [1,2,3,4,5,1,2,3,4,5,1,2,3,4,5],
        1,
        0
    ), 0);

    t.equal(closestIndexFrom(
        [1,2,3,4,5,1,2,3,4,5,1,2,3,4,5],
        5,
        5
    ), 4);

    t.equal(closestIndexFrom(
        [1,2,3,4,5,1,2,3,4,5,1,2,3,4,5],
        3,
        9
    ), 7);
});

test('large backward', function(t){

    t.plan(1);

    t.equal(closestIndexFrom(
        [1,2,3,4,5,1,2,3,4,5,1,2,3,4,5],
        5,
        0
    ), 14);
});