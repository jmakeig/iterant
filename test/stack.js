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

const test = require('tape');

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
