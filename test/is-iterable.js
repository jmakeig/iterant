'use strict';

const test = require('tape');

const Iterable = require('../iterable');

test('Arrays are iterable', (assert) => {
  assert.true(Iterable.isIterable([]), 'Empty array');
  assert.true(Iterable.isIterable([], true), 'Ignore strings doesn’t matter');
  assert.true(Iterable.isIterable([], false), 'Ignore strings doesn’t matter');
  assert.end();
});

test('Strings are iterable (unfortunately)', (assert) => {
  assert.true(Iterable.isIterable('asdf'), 'String');
  assert.true(Iterable.isIterable(''), 'Empty string');
  assert.true(Iterable.isIterable('asdf', false), 'Ignore strings explicit false');
  assert.false(Iterable.isIterable('asdf', true), 'Ignore strings');
  assert.end();
});

test('Custom iterable', (assert) => {
  const itr = {
    [Symbol.iterator]: function*() {}
  };
  assert.true(Iterable.isIterable(itr), 'Custom object')
  assert.end();
});

test('Non-iterables', (assert) => {
  assert.false(Iterable.isIterable(null), 'null');
  assert.false(Iterable.isIterable(undefined), 'undefined');
  assert.false(Iterable.isIterable(NaN), 'NaN');
  assert.false(Iterable.isIterable(44.3), 'number');
  assert.false(Iterable.isIterable(true), 'boolean');
  assert.false(Iterable.isIterable(new Error()), 'Error');
  assert.end();
});