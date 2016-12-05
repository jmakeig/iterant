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
const Iterable = require('./iterable');

/**
 * An {@link IterableArray} extends {@link Iterable} with functionality 
 * specific to built-in JavaScript {@link Array} instances.
 * 
 * @class IterableArray
 * @augments Iterable
 * 
 * @constructs IterableArray
 * @function
 * @param {Array} array  - An {@link Array}
 * @returns {IterableArray} - A new {@link IterableArray}
 * @throws {TypeError} - If `array` is not an {@link Array}
 */
function IterableArray(array) {
  if(!Array.isArray(array)) { 
    throw new TypeError('Can only wrap an Array'); 
  }
  if(!this) { return new IterableArray(array); }
  return Iterable.call(this, array); 
}
// Inherit from Iterable
IterableArray.prototype = Object.create(Iterable.prototype);

IterableArray.prototype[Symbol.toStringTag] = 'IterableArray';

/**
 * Delegates to {@link Array#slice} and returns a new {@link IterableArray}.
 * 
 * @param {number} [begin]
 * @param {number} [end]
 * @returns {IterableArray}
 * 
 * @see Array#slice
 */
IterableArray.prototype.slice = function slice(begin, end) { 
  return IterableArray(this._iterable.slice(begin, end));
};
/**
 * 
 * 
 * @param {function} mapper
 * @param {object} that
 * @returns {IterableArray}
 */
IterableArray.prototype.map = function(mapper, that) {
  return IterableArray(this._iterable.map(mapper, that));
};
IterableArray.prototype.reduce = function(reducer, init) {
  return this._iterable.reduce(reducer, init);
};
IterableArray.prototype.filter = function(predicate, that) {
  return IterableArray(this._iterable.filter(predicate, that));
};
IterableArray.prototype.concat = function(...args) {
  return IterableArray(this._iterable.concat(...args));
};
IterableArray.prototype.sort = function(comparator) {
  return IterableArray(this._iterable.sort(comparator));
};
