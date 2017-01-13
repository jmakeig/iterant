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

const IterantArray = require('../iterant-array');
const Iterant = require('../iterant');

test('Factory', assert => {
  const arr = [1, 2, 3, 4, 5, 6];
  const ia = IterantArray(arr);
  assert.true(ia instanceof IterantArray);
  assert.true(ia instanceof Iterant);
  assert.equal(
    Object.prototype.toString.call(ia),
    '[object IterantArray]',
    'toString'
  );
  assert.throws(
    () => IterantArray(new Map()),
    TypeError,
    'Not an array is error'
  );
  assert.throws(() => IterantArray(), TypeError, 'undefined is error');
  assert.end();
});

test('IterantArray.prototype.slice', assert => {
  const arr = [1, 2, 3, 4, 5, 6];
  const ia = IterantArray(arr);

  assert.true(
    ia.slice(0, 1) instanceof IterantArray,
    'slice returns IterantArray'
  );
  assert.notEqual(ia.slice(0, 1), ia, 'slice is immutable');
  assert.deepEqual(
    Array.from(ia.slice(1, 4)),
    arr.slice(1, 4),
    'slice is the same as Array.prototype.slice'
  );
  assert.deepEqual(
    Array.from(ia.slice(-2)),
    arr.slice(-2),
    'slice is the same as Array.prototype.slice'
  );
  assert.end();
});
