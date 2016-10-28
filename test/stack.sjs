'use strict';

const test = require('/mltap/test');

const IterableArray = require('../iterable-array');

test('Stack frames', (assert) => {
  const iterable = IterableArray([1, 2, 3]);
  try {
    iterable
      .map((item) => { throw new Error(); });
    Array.from(iterable);
  } catch (error) {
    const frames = error.stack ? error.stack.split('\n') : undefined;
    assert.true(/^\s+at Array.map/.test(frames[2]), frames[2]);
    assert.true(/^\s+at IterableArray.map/.test(frames[3]), frames[3]);
  }
  assert.end();
});
