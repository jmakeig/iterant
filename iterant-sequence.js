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
module.exports = IterantSequence;
const Iterant = require('./iterant');

/**
 * An {@link IterantSequence} extends {@link Iterant} with functionality 
 * specific to MarkLogic {@link Sequence} instances.
 * 
 * @class IterantSequence
 * @augments Iterant
 * @borrows Iterant#map
 * @borrows Iterant#reduce
 * @borrows Iterant#filter
 * 
 * 
 * @constructs IterantSequence
 * @function
 * @param {Sequence} sequence  - A MarkLogic {@link Sequence}
 * @returns {IterantSequence} - A new {@link IterantSequence}
 * @throws {TypeError} - If `seqeuence` is not a {@link Sequence}
 */
function IterantSequence(sequence) {
  if (!(sequence instanceof Sequence)) {
    throw new TypeError('Can only wrap a Sequence');
  }
  if (!this) {
    return new IterantSequence(sequence);
  }
  return Iterant.call(this, sequence);
}

// Inherit from Iterant
IterantSequence.prototype = Object.create(Iterant.prototype);

IterantSequence.prototype[Symbol.toStringTag] = 'IterantSequence';
IterantSequence.prototype[Symbol.species] = IterantSequence;

/**
 * Returns a shallow copy of a portion of the {@link Iterant} into a new 
 * {@link IterantSequence} object selected from `begin` to `end`, not including `end`. 
 * `slice` does not modify the original {@link IterantSequence}.
 * 
 * The implementation delegates to {@link https://docs.marklogic.com/fn.subsequence fn.subsequence()} under the covers.
 * 
 * @example
 * const seq = xdmp.databases();      // Sequence<xs.unsignedLong>
 * const itr = IterantSequence(seq); // IterantSequence<Sequence<xs.unsignedLong>>
 * itr
 *  .slice(2, 4)                      // IterantSequence<xs.unsignedLong>
 *  .map(xdmp.databaseName)           // Iterant<Generator<string>>
 *  .toArray()                        // Array<string>
 * 
 * // ["Meters" , "Triggers"]
 * 
 * @override
 * 
 * @param {number} [begin] Zero-based start index. Only positive integers are supported.
 * @param {number} [end]  Zero-based end index, not inclusive.
 * @returns {IterantSequence} A shallow copy of the sliced {@link Sequence}
 */
IterantSequence.prototype.slice = function(begin, end) {
  let seq;
  if (undefined === begin) {
    return IterantSequence(this._iterable);
  }
  if ('number' !== typeof begin || begin < 0 || 0 !== begin % 1) {
    throw new TypeError('begin must be a positive integer');
  }
  if (end) {
    if ('number' !== typeof end || end < 0 || 0 !== end % 1 || end < begin) {
      throw new TypeError(
        'end must be a positive integer greater than begin (' + String(begin) +
          ')'
      );
    }
    seq = fn.subsequence(this._iterable, begin + 1, end - begin);
  } else {
    seq = fn.subsequence(this._iterable, begin + 1);
  }
  return IterantSequence(seq);
};
// map(mapper, that) { },
// reduce(reducer, init) { },
// filter(predicate, that) { },
IterantSequence.prototype.concat = function(...args) {
  if (0 === args.length) {
    return IterantSequence(this._iterable);
  }
  return IterantSequence(new Sequence(
    this._iterable,
    ...args.map(
      item =>
        Iterant.isIterable(item, true)
          ? Sequence.from(item)
          : new Sequence(item)
    )
  ));
};
IterantSequence.prototype.sort = function(comparator) {
  if (console && 'function' === typeof console.warn) {
    console.warn(
      'Sort in the database query where possible. This won’t scale for large Sequences.'
    );
  }
  return Iterant.prototype.sort.call(this, comparator);
};
// FIXME: This doesn't depend on Sequence. Might want to do XPath on any type of iterable, no?
IterantSequence.prototype.xpath = function(path, bindings) {
  if (null === path || 'undefined' === typeof path) {
    throw new TypeError('path must be a string of XPath');
  }
  return Iterant(
    Iterant.delegate(this._iterable, function*(item) {
      if (
        item instanceof Node || item instanceof Document ||
          'function' === typeof item.xpath
      ) {
        yield* item.xpath(path, bindings);
      }
    })
  );
};
