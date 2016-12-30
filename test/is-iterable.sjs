/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * Copyright 2016 MarkLogic Corp.                                             *
 *                                                                            *
 * Licensed under the Apache License, Version 2.0 (the "License");            *
 * you may not use this file except in compliance with the License.           *
 * You may obtain a copy of the License at                                    *
 *                                                                            *
 *     http://www.apache.org/licenses/LICENSE-2.0                             *
 *                                                                            *
 * Unless required by applicable law or agreed to in writing, software        *
 * distributed under the License is distributed on an "AS IS" BASIS,          *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   *
 * See the License for the specific language governing permissions and        *
 * limitations under the License.                                             *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
 
'use strict';

const test = require('/mltap/test');

const Iterant = require('../iterant');

test('Arrays are iterable', (assert) => {
  assert.true(Iterant.isIterable([]), 'Empty array');
  assert.true(Iterant.isIterable([], true), 'Ignore strings doesn’t matter');
  assert.true(Iterant.isIterable([], false), 'Ignore strings doesn’t matter');
  assert.end();
});

test('Strings are iterable (unfortunately)', (assert) => {
  assert.true(Iterant.isIterable('asdf'), 'String');
  assert.true(Iterant.isIterable(''), 'Empty string');
  assert.true(Iterant.isIterable('asdf', false), 'Ignore strings explicit false');
  assert.false(Iterant.isIterable('asdf', true), 'Ignore strings');
  assert.end();
});

test('Custom iterable', (assert) => {
  const itr = {
    [Symbol.iterator]: function*() {} // eslint-disable-line no-empty-function
  };
  assert.true(Iterant.isIterable(itr), 'Custom object');
  assert.end();
});

test('Non-iterables', (assert) => {
  assert.false(Iterant.isIterable(null), 'null');
  assert.false(Iterant.isIterable(undefined), 'undefined');
  assert.false(Iterant.isIterable(NaN), 'NaN');
  assert.false(Iterant.isIterable(44.3), 'number');
  assert.false(Iterant.isIterable(true), 'boolean');
  assert.false(Iterant.isIterable(new Error()), 'Error');
  assert.end();
});
