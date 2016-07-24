<<<<<<< HEAD
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

module.exports = IterableArray;
=======
'use strict';

>>>>>>> Addresses #8. Refactors type-specific implementations of Iterable into their own modules.
const Iterable = require('./iterable');

function IterableArray(array) {
  if(!Array.isArray(array)) { 
    throw new TypeError('Can only wrap an Array'); 
  }
  if(!this) { return new IterableArray(array); }
  return Iterable.call(this, array); 
}

IterableArray.prototype = Object.assign(
  Object.create(Iterable.prototype), {
<<<<<<< HEAD
    [Symbol.toStringTag]: 'IterableArray',
=======
>>>>>>> Addresses #8. Refactors type-specific implementations of Iterable into their own modules.
    slice(begin, end) { 
      return IterableArray(this._iterable.slice(begin, end));
    },
    map(mapper, that) {
      return IterableArray(this._iterable.map(mapper, that));
    },
    reduce(reducer, init) {
      return this._iterable.reduce(reducer, init);
    },
    filter(predicate, that) {
      return IterableArray(this._iterable.filter(predicate, that));
    },
    concat(...args) {
      return IterableArray(this._iterable.concat(...args));
    },
    sort(comparator) {
      return IterableArray(this._iterable.sort(comparator));
    },
});
<<<<<<< HEAD
=======

module.exports = IterableArray;
>>>>>>> Addresses #8. Refactors type-specific implementations of Iterable into their own modules.
