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

module.exports = Iterable;
// Watch out: Circular dependency. The export needs to happen before the require
const IterableArray = require('./iterable-array.js');

/* Inspired by <http://www.benmvp.com/learning-es6-generators-as-iterators/> */

/**
 * Wraps any iterable (i.e. an object that has a `Symbol.iterator` property) to
 * provide a common iterface, regardless of the underlying concrete type. Thus,
 * you can call the same <code>{@link Iterable#map}</code> on an `Array`, a
 * MarkLogic `Seqeunce`, or a generator. Where possible, `Iterable` delegates to
 * the underlying implementation. For example, <code>{@link
 * Iterable#slice}</code> uses <code>fn.subsequence</code> when it’s slicing a
 * MarkLogic `Sequence`, `Array.prototype.slice` when it‘s operating on an
 * `Array`, and steps the iterator for a generator.
 * 
 * @example
 * Iterable(
 *   cts.collections()
 * )
 *   .filter(c => true) // Not very discriminating
 *   .map(c => { return { name: c, count: cts.frequency(c) }})
 *   .sort((a, b) => b.count - a.count)
 *   .reduce((prev, item) => prev + '\r' + item.count + ': ' + item.name, '');
 * 
 * @example
 * const ns = { bt: 'http://example.com/bug-tracker' };
 * // The first step is to wrap any iterable as an Iterable. (Capitalization 
 * // is important here.) Iterable—capital “I”—abstracts away many of the 
 * // differences between the underlying iterables.
 * Iterable(
 *   // Unpath (implementation elided for clarity) evaluates XPath against 
 *   // a MarkLogic database. It returns a Sequence, MarkLogic’s core 
 *   // iterable interface for lazy evaluation. Iterable could just as easily 
 *   // have wrapped an Array or a Generator without downstream changes.  
 *   unpath('/bt:bug-holder', ns) // Naïve implementation of xdmp:unpath()
 * )
 *   // Get the first 10. Delegates to fn.subsequence when possible.
 *   .slice(0, 10)   
 *   // For each, yeild matching nodes based on the XPath
 *   .xpath('//bt:bug-number', ns)   
 *   // Cast each item as a decimal number. 
 *   // (Yes, I could have done this in the XPath above.)
 *   // Uses a generator where possible to maintain lazy evaluation.
 *   .map(node => parseInt(node.textContent, 10))
 *   // Sort the values. Eagerly instantiates an array. That's OK because 
 *   // the slice above is finite and small. 
 *   .sort((a, b) => a - b)
 *   // Cast/project as another iterable type, lazily where possible. 
 *   .toSequence(); // Lazy if the wrapper iterable is (and Sequence.from() is)
 *   // or .toArray()
 *   // or for…of becuase Iterable is iterable (Zing!)
 * 
 * @module 
 * @exports Iterable
 */

/**
 * Factory that constructs an `Iterable` instance from an *iterable*.
 * 
 * @constructs Iterable
 * @function
 * @param {Array|Sequence|iterable.<*>} iterable Any iterable (i.e. something 
 * that has a `Symbol.iterator` property)
 * @returns {Iterable} - An new `Iterable` instance the wraps the passed in 
 * iterable
 */
function Iterable(iterable) {
  if(!this) { return new Iterable(iterable); } // Call as a factory, 
                                               // not a constructor
  /** 
   * @memberof Iterable
   * @instance
   * @property {iterable.<*>} _iterable - The wrapped iterable
   * @name _iterable
   * @private 
   */
  Object.defineProperty(this, '_iterable', {
    enumerable: false,
    configurable: false,
    writable: true,
    value: iterable
  });
  return this;
}

Object.assign(Iterable, {
  /**
   * Whether an object is iterable. Only checks for `Symbol.iterator`. This
   * won’t catch the case where a function implicitly returns a duck-typed
   * iterator. Note that strings are iterable by defintion in the language spec.
   * 
   * @memberof Iterable
   * 
   * @param {*} obj - Any object, including `null` or `undefined`
   * @param {[boolean]} ignoreStrings - Don’t consider a string iterable. Be careful how you employ this.
   * @return {boolean} Whether the object is iterable
   */
  isIterable: function(obj, ignoreStrings) {
    if(null === obj || 'undefined' === typeof obj) return false;
    if('string' === typeof obj && true === ignoreStrings) return false;
    return Boolean(obj[Symbol.iterator]);
  },
  /**
   * Loop over an iterable, executing a function on each item, yielding 
   * an iterable.
   * 
   * @private
   * @memberof Iterable
   * 
   * @param {iterable} iterable d
   * @param {function} fct - A mapper function 
   * @param {[object]} that - The optional `this` object to which `fct` is bound. Defaults to `null`.
   * @returns {iterable.<*>} Yields mapped items
   * @throws {TypeError}
   */
  map: function*(iterable, fct, that) {
    if(!Iterable.isIterable(iterable)) { 
      throw new TypeError('iterable must be iterable'); 
    }
    if('function' !== typeof fct) { 
      throw new TypeError('fct must be a function'); 
    }
    for(let item of iterable) {
      yield fct.call(that || null, item);
    }
  },
  /**
   * Same as `Iterable.prototype.map` but delegates to the called generator, 
   * i.e. `yield*` instead of `yield`.
   * 
   * @private
   * @memberof Iterable
   * 
   * @param {iterable} iterable
   * @param {GeneratorFunction} gen
   * @param {[object]} that
   */
  delegate: function*(iterable, gen, that) {
    if(!Iterable.isIterable(iterable)) { throw new TypeError('iterable must be iterable'); }
    if('function' !== typeof gen) { throw new TypeError('gen must be a generator function'); }
    for(let item of iterable) {
      yield* gen.call(that || null, item);
    }
  },
  /**
   * 
   * @private
   * @memberof Iterable
   * 
   * @param {Iterable} iterable
   * @param {function} fct - 
   * @param {*} init        
   * @returns 
   */
  reduce: function(iterable, fct, init) {
    if(!Iterable.isIterable(iterable)) { 
      throw new TypeError('iterable must be iterable'); 
    }
    let value = init, index = 0;
    for(let item of iterable) {
      value = fct.call(null, value, item, index++, this);
    }
    return value;
  },
  /**
   * Yeilds a portion of an iterable between two offsets.
   * 
   * @private
   * @memberof Iterable
   * 
   * @param {iterable.<*>} iterable - Any iterable
   * @param {number} begin - The starting offset (zero-based)
   * @param {[number]} end - The offset before which to stop (*not* the length) or the rest if omitted
   * @returns {iterable.<*>} - Yields an iterable
   * 
   * @example
   * Iterable([1, 2, 3, 4]).slice(1, 3); // [2, 3] 
   */
  slice: function*(iterable, begin, end) {
    if(!Iterable.isIterable(iterable)) { 
      throw new TypeError('iterable must be iterable'); 
    }
    if('undefined' === typeof begin) { 
      yield* iterable; return;
    }
    if('number' !== typeof begin) { 
      throw new TypeError('begin must be a number'); 
    }
    let index = 0;
    for(let value of iterable) {
      if(index++ >= begin) {
        yield value;  
      }
      if(index > end) { break; }
    }
  },
  /**
   * 
   * @private
   * @memberof Iterable
   * 
   * @param {iterable.<*>} iterable
   * @param {function} predicate
   * @param {*} that
   */
  filter: function*(iterable, predicate, that) {
    if(!Iterable.isIterable(iterable)) { 
      throw new TypeError('iterable must be iterable'); 
    }
    if('function' !== typeof predicate) { 
      throw new TypeError('predicate must be a function'); 
    }
    let index = 0;
    for(let item of iterable) {
      if(predicate.call(that || null, item, index++, iterable)) {
        yield item;
      }
    }
  },
  concat: function*(iterable, ...args) {
    yield* iterable;
    for(let arg of args) {
      yield* arg;
    }
  }
});

Object.assign(Iterable.prototype, {
  /**
   * Gets the iterator associated with the underlying concrete iterable.
   * 
   * @name Symbol.iterator
   * @memberof Iterable
   * @instance
   * @returns {*} Yields from the wrapped iterable
   */
  [Symbol.iterator]: function*() { yield* this._iterable; },
  /**
   * Applys a function to each item of the current iterable and returns a new iterable. 
   * 
   * 
   * @memberof Iterable
   * @instance
   * 
   * @param {function} fct - The function to apply
   * @param {*} that - What `this` should mean when calling `fct` (i.e. the first parameter of `Function.prototype.call`) 
   * @returns {Iterable<*>} 
   */
  map: function(fct, that) {
    return Iterable(
      Iterable.map(this._iterable, fct, that)
    );
  },
  /**
   * Calculate an aggregate value over all of an `Iterable` instance’s items. 
   * 
   * @memberof Iterable
   * @instance
   * 
   * @param {function} fct - The function that takes the previous value and the current item and returns a new value for the next iteration.
   * @param {*} init - The initial value
   * @returns
   */
  reduce: function(fct, init) {
    return Iterable.reduce(this, fct, init);
  },
  /**
   * Get a subsection of an {@link Iterable} as an {@link Iterable}. Delegates to the underlying concrete implementation where possible. Maintains lazy evaluation, where possible. For example, `slice` on MarkLogic `Sequence` will use the lazy <code>{@link https://docs.marklogic.com/fn.subsequence fn.subsequence}</code> while wrapped `Array` instances will default to `Array.prototype.slice`. 
   * 
   * @memberof Iterable
   * @instance
   * 
   * @param {number} begin - The zero-based index where to start
   * @param {number} [end] - The zero-based index before which to stop. Defaults to the rest of the iterable.  
   * @returns {Iterable<*>}
   */
  slice: function(begin, end) {
    return Iterable(
      Iterable.slice(this._iterable, begin, end)
    );
  },
  /**
   * `filter` is almost always better implemented as an upstream query when 
   * you’re working with data from a database. 
   * 
   * @memberof Iterable
   * @instance
   * 
   * @param {function} predicate
   * @param {*} [that]
   * @returns {Iterable<*>}
   */
  filter: function(predicate, that) {
    return Iterable(
      Iterable.filter(this._iterable, predicate, that)
    );
  },
  // TODO: Does this need to be backed by a Generator? Sequence is already lazy 
  //       (assuming `new Sequence()` is lazy).
  concat(...args) {
    return Iterable(
      Iterable.concat(this._iterable, ...args)
    );
  },
  sort(comparator) {
    if('function' !== typeof comparator) {
      throw new TypeError('comparator must be a function');
    }
    return IterableArray(
      Array.from(this).sort(comparator)
    );
  },
  toArray: function() {
    return Array.from(this);
  },
});

