'use strict';

const test = require('/mltap/test');

const IterableArray = require('../iterable-array');
const Iterable = require('../iterable');

test('Factory', (assert) => {
  const arr = [1, 2, 3, 4, 5, 6];
  const ia = IterableArray(arr);
  assert.true(ia instanceof IterableArray);
  assert.true(ia instanceof Iterable);
  assert.equal(Object.prototype.toString.call(ia), '[object IterableArray]', 'toString');
  assert.throws(function(){
    IterableArray(new Map());
  }, TypeError, 'Not an array is error');
  assert.throws(function(){
    IterableArray();
  }, TypeError, 'undefined is error');
  assert.end();
});

test('IterableArray.prototype.slice', (assert) => {
  const arr = [1, 2, 3, 4, 5, 6];
  const ia = IterableArray(arr);

  assert.true(ia.slice(0,1) instanceof IterableArray, 'slice returns IterableArray');
  assert.notEqual(ia.slice(0, 1), ia, 'slice is immutable');
  assert.deepEqual(Array.from(ia.slice(1, 4)), arr.slice(1, 4), 'slice is the same as Array.prototype.slice');
  assert.deepEqual(Array.from(ia.slice(-2)), arr.slice(-2), 'slice is the same as Array.prototype.slice');
  assert.end();
});