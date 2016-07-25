'use strict';

const test = require('tape-catch');

const IterableArray = require('../iterable-array');

test('Factory', (assert) => {
  const arr = [1, 2, 3, 4, 5, 6];
  const ia = IterableArray(arr);
  assert.equal(Object.prototype.toString.call(ia), '[object IterableArray]', 'toString');
  assert.throws(function(){
    IterableArray(false);
  }, TypeError);
  assert.throws(function(){
    IterableArray(new Map());
  }, TypeError);

  // slice
  assert.true(ia.slice(0,1) instanceof IterableArray, 'slice returns IterableArray');
  assert.notEqual(ia.slice(0, 1), ia, 'slice is immutable');
  assert.deepEqual(Array.from(ia.slice(1, 4)), arr.slice(1, 4), 'slice is the same as Array.prototype.slice');
  assert.end();
});
