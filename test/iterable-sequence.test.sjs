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

const Iterable = require('../iterable');
const IterableSequence = require('../iterable-sequence');

function seqEqual(actual, expected, msg) {
  this.deepEqual(Array.from(actual), Array.from(expected), msg);
}

test('IterableSequence factory', (assert) => {
  const seq = Sequence.from(['a', 'b', 'c']);
  const iterable = IterableSequence(seq);
  assert.notEqual(iterable, undefined, 'Factory constructor');
  assert.true(iterable instanceof IterableSequence, 'instanceof IterableSequence');
  assert.true(iterable instanceof Iterable, 'instanceof Iterable');
  assert.equal(typeof iterable.xpath, 'function', 'xpath method is a function');
  assert.equal(Object.prototype.toString.call(iterable), '[object IterableSequence]');
  assert.end();
});

test('IterableSequence.prototype.slice', (assert) => {
  assert.seqEqual = seqEqual;
  const seq = Sequence.from(['a', 'b', 'c', 'd', 'e', 'f']);
  const iterable = IterableSequence(seq);
  assert.notEqual(iterable.slice(), iterable, 'slice() returns a new instance');
  assert.seqEqual(
    iterable.slice(), 
    IterableSequence(Sequence.from(['a', 'b', 'c', 'd', 'e', 'f']))
  );
  assert.seqEqual(iterable.slice(1), ['b', 'c', 'd', 'e', 'f'], 'only begin param');
  assert.seqEqual(iterable.slice(3, 5), ['d', 'e'], 'begin and end');
  assert.seqEqual(iterable.slice(3, 3), [], 'begin equals end');
  assert.seqEqual(iterable.slice(3, 1000), ['d', 'e', 'f'], 'end is larger than rest');

  assert.throws(() => {
    iterable.slice('a')
  }, TypeError, 'non-number begin');
  assert.throws(() => {
    iterable.slice(-1)
  }, TypeError, 'negative begin');
  assert.throws(() => {
    iterable.slice(44.44)
  }, TypeError, 'non-integer begin');

  assert.throws(() => {
    iterable.slice(1, 'a')
  }, TypeError, 'non-number end');
  assert.throws(() => {
    iterable.slice(1, -1)
  }, TypeError, 'negative end');
  assert.throws(() => {
    iterable.slice(1, 44.44)
  }, TypeError, 'non-integer end');
  assert.throws(() => { 
    iterable.slice(11, 10)
  }, TypeError, 'end < begin');

  assert.end();
});

test('IterableSequence.prototype.sort', (assert) => {
  assert.seqEqual = seqEqual;
  const seq = Sequence.from(['b', 'a', 'f', 'd', 'c', 'e']);
  const iterable = IterableSequence(seq);
  assert.seqEqual(iterable.sort(), ['a', 'b', 'c', 'd', 'e', 'f'], 'default sort');
  assert.seqEqual(iterable.sort((a, b) => a < b), ['f', 'e', 'd', 'c', 'b', 'a'], 'custom comparator');
  assert.notEqual(iterable.sort(), iterable, 'returns a new instance');
  assert.end();
});

test('IterableSequence.prototype.concat', (assert) => {
  assert.seqEqual = seqEqual;
  const seq = Sequence.from(['a', 'b', 'c', 'd', 'e', 'f']);
  const iterable = IterableSequence(seq);
  assert.seqEqual(iterable.concat(['g', 'h', 'i']), ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'], 'flat concat');
  assert.seqEqual(iterable.concat(['g', 'h', ['i']]), ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', ['i']], 'keep nested concat');
  assert.seqEqual(iterable.concat(), ['a', 'b', 'c', 'd', 'e', 'f'], 'undefined concat');
  assert.notEqual(iterable.concat(), iterable, 'undefined concat');
  assert.end();
});