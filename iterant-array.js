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
module.exports = IterantArray;
const Iterant = require('./iterant');

/**
 * An {@link IterantArray} extends {@link Iterant} with functionality 
 * specific to built-in JavaScript {@link Array} instances.
 * 
 * @class IterantArray
 * @augments Iterant
 * 
 * @constructs IterantArray
 * @function
 * @param {Array} array  - An {@link Array}
 * @returns {IterantArray} - A new {@link IterantArray}
 * @throws {TypeError} - If `array` is not an {@link Array}
 */
function IterantArray(array) {
  if (!Array.isArray(array)) {
    throw new TypeError('Can only wrap an Array');
  }
  if (!this) {
    return new IterantArray(array);
  }
  return Iterant.call(this, array);
}
// Inherit from Iterant
IterantArray.prototype = Object.create(Iterant.prototype);

IterantArray.prototype[Symbol.toStringTag] = 'IterantArray';

/**
 * Delegates to {@link Array#slice} and returns a new {@link IterantArray}.
 * 
 * @param {number} [begin]
 * @param {number} [end]
 * @returns {IterantArray}
 * 
 * @see Array#slice
 */
IterantArray.prototype.slice = function slice(begin, end) {
  return IterantArray(this._iterable.slice(begin, end));
};
/**
 * 
 * 
 * @param {function} mapper
 * @param {object} that
 * @returns {IterantArray}
 */
IterantArray.prototype.map = function(mapper, that) {
  return IterantArray(this._iterable.map(mapper, that));
};
IterantArray.prototype.reduce = function(reducer, init) {
  return this._iterable.reduce(reducer, init);
};
IterantArray.prototype.filter = function(predicate, that) {
  return IterantArray(this._iterable.filter(predicate, that));
};
IterantArray.prototype.concat = function(...args) {
  return IterantArray(this._iterable.concat(...args));
};
IterantArray.prototype.sort = function(comparator) {
  return IterantArray(this._iterable.sort(comparator));
};
