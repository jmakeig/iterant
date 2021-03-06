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
module.exports = Iterant;
// Watch out: Circular dependency. The export needs to happen before the require
const IterantArray = require('./iterant-array.js');

/* Inspired by <http://www.benmvp.com/learning-es6-generators-as-iterators/> */
/**
 * [Iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#iterator)
 * is a *protocol* which describes a standard way to produce a sequence of
 * values, typically the values of the Iterable represented by this Iterator.
 *
 * While described by the [ES2015 version of JavaScript](http://www.ecma-international.org/ecma-262/6.0/#sec-iterator-interface)
 * it can be utilized by any version of JavaScript.
 *
 * @typedef {Object} Iterator
 * @template T The type of each iterated value
 * @property {function (): { value: T, done: boolean }} next
 *   A method which produces either the next value in a sequence or a result
 *   where the `done` property is `true` indicating the end of the Iterator.
 */
/**
 * [Iterable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#iterable)
 * is a *protocol* which when implemented allows a JavaScript object to define
 * their iteration behavior, such as what values are looped over in a `for..of`
 * loop or `iterall`'s `forEach` function. Many [built-in types](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#Builtin_iterables)
 * implement the Iterable protocol, including `Array` and `Map`.
 *
 * While described by the [ES2015 version of JavaScript](http://www.ecma-international.org/ecma-262/6.0/#sec-iterable-interface)
 * it can be utilized by any version of JavaScript.
 *
 * @typedef {Object} Iterable
 * @template T The type of each iterated value
 * @property {function (): Iterator<T>} Symbol.iterator
 *   A method which produces an Iterator for this Iterable.
 */
/**
 * Wraps any JavaScript iterable (i.e. an object that has a `Symbol.iterator` property) to
 * provide a common iterface, regardless of the underlying concrete type. Where possible and 
 * apporpriate this interface matches the built-in {@link Array}. Thus,
 * you can call the same {@link Iterant#map} on an `Array`, a
 * MarkLogic `Seqeunce`, or a generator—anything that’s iterable. Type-specific {@link Iterant} 
 * extensions override the built-in methods to provide implementations that delegate to their 
 * wrapped concrete types.
 * 
 * @example
 * Iterant(
 *   cts.collections() // Any iterable, such as Array, Map, generator function, etc.
 * )
 *   .filter(c => true) // Not very discriminating
 *   .map(c => { return { name: c, count: cts.frequency(c) }})
 *   .sort((a, b) => b.count - a.count)
 *   .reduce((prev, item) => prev + '\r' + item.count + ': ' + item.name, '');
 * 
 * @class Iterant
 * @constructs Iterant
 * 
 * @function
 * @param {Iterable} iterable - Any iterable (i.e. something that has a `Symbol.iterator` property)
 * @returns {Iterant} - An new {@link Iterant} instance the wraps the passed in iterable
 * 
 * @see IterantArray
 * @see IterantSequence
 */
function Iterant(iterable) {
  if (!this) {
    return new Iterant(iterable);
  }
  // Call as a factory, 
  // not a constructor
  /** 
   * @memberof Iterant
   * @instance
   * @property {Iterable} _iterable - The wrapped iterable
   * @name _iterable
   * @private 
   */
  Object.defineProperties(this, {
    '_iterable': {
      enumerable: false,
      configurable: false,
      writable: true,
      value: iterable
    },
    /**
     * @memberof Iterant
     * @instance
     * @property {Iterable} iterable - The wrapped {@link Iterable}
     * @readonly
     */
    'iterable': {
      enumerable: true,
      'get': function() {
        return this._iterable;
      }
    }
  });
  return this;
}

/**
 * Whether an object is iterable. Only checks for `Symbol.iterator`. This
 * won’t catch the case where a function implicitly returns a duck-typed
 * iterator. Note that strings are iterable by defintion in the language spec.
 * 
 * @example
 * Iterant.isIterable([1, 2, 3]);        // true
 * Iterant.isIterable('asdf');           // true, unfortunately
 * Iterant.isIterable('asdf', true)      // false
 * Iterant.isIterable((function*(){})()) // true
 * Iterant.isIterable({a: 'A'})          // false
 * 
 * @memberof Iterant
 * 
 * @param {*} obj - Any object, including `null` or `undefined`
 * @param {boolean} [ignoreStrings] - Don’t consider a string iterable. Be careful how you employ this.
 * @returns {boolean} Whether the object is iterable
 */
Iterant.isIterable = function(obj, ignoreStrings) {
  if (null === obj || 'undefined' === typeof obj)
    return false;
  if ('string' === typeof obj && true === ignoreStrings)
    return false;
  return Boolean(obj[Symbol.iterator]);
};
/**
 * Loop over an iterable, executing a function on each item, yielding 
 * an iterable.
 * 
 * @private
 * @memberof Iterant
 * 
 * @param {Iterable} iterable d
 * @param {function} fct - A mapper function 
 * @param {object} [that] - The optional `this` object to which `fct` is bound. Defaults to `null`.
 * @returns {Iterable} Yields mapped items
 * @throws {TypeError}
 */
Iterant.map = function*(iterable, fct, that) {
  if (!Iterant.isIterable(iterable)) {
    throw new TypeError('iterable must be Iterable');
  }
  if ('function' !== typeof fct) {
    throw new TypeError('fct must be a function');
  }
  for (const item of iterable) {
    yield fct.call(that || null, item);
  }
};
/**
 * Same as `Iterant.prototype.map` but delegates to the called generator, 
 * i.e. `yield*` instead of `yield`.
 * 
 * @private
 * @memberof Iterant
 * 
 * @param {Iterable} iterable
 * @param {GeneratorFunction} gen
 * @param {object} [that]
 */
Iterant.delegate = function*(iterable, gen, that) {
  if (!Iterant.isIterable(iterable)) {
    throw new TypeError('iterable must be Iterable');
  }
  if ('function' !== typeof gen) {
    throw new TypeError('gen must be a generator function');
  }
  for (const item of iterable) {
    yield* gen.call(that || null, item);
  }
};
/**
 * 
 * @private
 * @memberof Iterant
 * 
 * @param {Iterable} iterable
 * @param {function} fct - The reducer
 * @param {*} init - The initial value     
 * @returns {*}
 */
Iterant.reduce = function(iterable, fct, init) {
  if (!Iterant.isIterable(iterable)) {
    throw new TypeError('iterable must be Iterable');
  }
  let value = init, index = 0;
  for (const item of iterable) {
    value = fct.call(null, value, item, index++, this);
  }
  return value;
};
/**
 * Yeilds a portion of an iterable between two offsets.
 * 
 * @private
 * @memberof Iterant
 * 
 * @param {Iterable} iterable - Any iterable
 * @param {number} begin - The starting offset (zero-based)
 * @param {number} [end] - The offset before which to stop (*not* the length) or the rest if omitted
 * @returns {Iterable} - Yields an iterable
 * 
 * @example
 * Iterant([1, 2, 3, 4]).slice(1, 3); // [2, 3] 
 */
Iterant.slice = function*(iterable, begin, end) {
  if (!Iterant.isIterable(iterable)) {
    throw new TypeError('iterable must be iterable');
  }
  if ('undefined' === typeof begin) {
    yield* iterable;
    return;
  }
  if ('number' !== typeof begin) {
    throw new TypeError('begin must be a number');
  }
  let index = 0;
  for (const value of iterable) {
    if (index++ >= begin) {
      yield value;
    }
    if (index > end) {
      break;
    }
  }
};

/*
 * Filter predicate
 * @callback Iterant~filterPredicate
 * @param {*} item
 * @param {number} index
 * @param {Array} array
 * @returns {boolean}
 */
/**
 * 
 * @private
 * @memberof Iterant
 * 
 * @param {Iterable} iterable - The {@link Iterable} to filter
 * @param {function} predicate - Called for each `item` at `index`. Return `true` to keep, `false` to ignore
 * @param {*} that - `this` binding of `predicate` call
 */
Iterant.filter = function*(iterable, predicate, that) {
  if (!Iterant.isIterable(iterable)) {
    throw new TypeError('iterable must be iterable');
  }
  if ('function' !== typeof predicate) {
    throw new TypeError('predicate must be a function');
  }
  let index = 0;
  for (const item of iterable) {
    if (predicate.call(that || null, item, index++, iterable)) {
      yield item;
    }
  }
};
Iterant.concat = function*(iterable, ...args) {
  yield* iterable;
  for (const arg of args) {
    yield* arg;
  }
};

/**
 * Gets the iterator associated with the underlying concrete iterable.
 * 
 * @name Symbol.iterator
 * @memberof Iterant
 * @instance
 * @type {Iterator}
 * @readonly
 */
Iterant.prototype[Symbol.iterator] = function*() {
  yield* this._iterable;
};
/**
 * The type name that shows up in {@Obejct#toString}.
 * 
 * @name Symbol.toStringTag
 * @memberof Iterant
 * @instance
 * @type {string}
 * @readonly
 */
Iterant.prototype[Symbol.toStringTag] = 'Iterant';
// Iterant.prototype[Symbol.species] = Iterant;
/**
 * Applys a function to each item of the current iterable and returns a new iterable. 
 * 
 * @param {function} fct - The function to apply
 * @param {*} [that=null] - What `this` should mean when calling `fct` (i.e. the first parameter of `Function.prototype.call`) 
 * @returns {Iterable} - A new {@link Iterable} containing the mapped items
 */
Iterant.prototype.map = function map(fct, that) {
  const Constructor = this._iterable[Symbol.species] || Iterable;

  return Constructor(Iterant.map(this._iterable, fct, that));
};
/**
 * Accumulate an aggregate value over all of an {@link Iterable} instance’s items. 
 * 
 * @example
 * Iterant([1, 2, 3])
 *   .reduce((prev, item) => prev + item, 0);
 * 
 * // First iteration:  (0, 1) => 1
 * // Second iteration: (1, 2) => 3
 * // Third iteration:  (3, 3) => 6
 * // Final result: 6
 * 
 * @param {function} reducer - The function that takes the previous value and the current item and 
 * returns a new value for the next iteration. 
 *   * **`prev`** (`any`) The accumulated value returned from the previous iteration
 *   * **`item`** (`any`) The current item
 *   * **`index`** (`number`) The current index
 *   * **`self`** (<code>{@link Iterant}</code>) 
 * @param {*} init - The initial value
 * @returns {*} - The accumlated value
 */
Iterant.prototype.reduce = function reduce(reducer, init) {
  return Iterant.reduce(this, reducer, init);
};
/**
 * Get a subsection of an {@link Iterant} as an {@link Iterant} as 
 * new {@link Iterant}. The default implementation naïvely loops from 
 * the start of the {@link Iterant} to the `end`. Subclasses delegate to
 * more efficient implementations, delegating to the backing {@Iterable}.
 * 
 * @param {number} begin - The zero-based index where to start
 * @param {number} [end] - The zero-based index before which to stop. Defaults to the rest of the {@Iterant}, which could be infinite. (Don’t do that.)  
 * @returns {Iterant} - A new {@link Iterant}
 */
Iterant.prototype.slice = function slice(begin, end) {
  const Constructor = this._iterable[Symbol.species] || Iterant;

  return Constructor(Iterant.slice(this._iterable, begin, end));
};
/**
 * Evaluates each item using a supplied predicate function. Returns a new 
 * {@Iterant} containing only items for which the predicate returns `true`.
 * 
 * **Warning:** `filter` is almost always better implemented as an upstream query when 
 * you’re working with data from a database. 
 * 
 * @param {function} predicate - A function that is evaluated for each item. 
 * Return `true` to keep the item, `false` to ignore.
 *   * **`item`** (`any`) The current item
 *   * **`index`** (`number`) The current index
 *   * **`self`** (<code>{@link Iterant}</code>) 
 *   * Returns `boolean` - Whether the current `item` matches
 * @param {*} [that]
 * @returns {Iterant} - A new {@link Iterant} with only the matching items
 */
Iterant.prototype.filter = function filter(predicate, that) {
  const Constructor = this._iterable[Symbol.species] || Iterant;

  return Constructor(Iterant.filter(this._iterable, predicate, that));
};
/**
 * Concatenates items onto the end of an {@link Iterant}, returning a new {@link Iterant} instance. 
 * {@link Iterable} instances are flattened. Other types are appended as-is. 
 * 
 * @example
 * Iterant([1, 2, 3])
 *   .concat(4, 5, [6, 7]);
 * // Iterant([1, 2, 3, 4, 5, 6, 7])
 * 
 * @param {...*} items - Items to concatenate
 * @returns {Iterant} - A new {@link Iterant} instance
 */
Iterant.prototype.concat = function concat(...items) {
  const Constructor = this._iterable[Symbol.species] || Iterant;

  return Constructor(Iterant.concat(this._iterable, ...items));
};
/**
 * Sorts the items based on a user-supplied comparator function.
 * 
 * **Warning:** It’s almost always better to sort upstream. The default implementation 
 * eagerly instantiates an {@link Array} and sorts using {@link Array#sort}.
 * 
 * @param {function} [comparator] - A function that compares values pairwise. 
 * The default converts both values to `string` and compares codepoints. 
 *   * **`a`** (`any`) The current item
 *   * **`b`** (`any`) The next item
 *   * Returns `number` - `-1` if `a < b`, `1` if `a > b`, and `0` if they’re equal.
 * @returns {IterantArray} - A sorted {@IterantArray}
 */
Iterant.prototype.sort = function sort(comparator) {
  if (undefined !== comparator && 'function' !== typeof comparator) {
    throw new TypeError('comparator must be a function');
  }
  function defaultComparator(a, b) {
    a = String(a), b = String(b);
    if (a === b)
      return 0;
    if (a < b)
      return -1;
    return 1;
  }
  comparator = comparator || defaultComparator;
  return IterantArray(Array.from(this).sort(comparator));
};
/**
 * Creates a new shallow copy of the {@link Iterant}.
 * 
 * @example
 * const a = Iterant([1, 2, 3]);
 * const b = a.clone();
 * a !== b; // true
 * 
 * @returns {Iterant} - A new {@link Iterant} instance
 */
Iterant.prototype.clone = function clone() {
  return this[Symbol.species](this._iterator);
};
/**
 * Converts an {@link Iterant} to an {@link Array}. 
 * This is a pass-through for {@link Array~from} that’s convenient for chaining.
 * 
 * @example
 * function* gen() { for(let i = 0; i < 10; i++) { yield [String(i), i]; }};
 * Iterant(new Map(gen))
 *   .toArray();
 * 
 * =>
 * [ [ '0', 0 ],
 *   [ '1', 1 ],
 *   [ '2', 2 ],
 *   [ '3', 3 ],
 *   [ '4', 4 ],
 *   [ '5', 5 ],
 *   [ '6', 6 ],
 *   [ '7', 7 ],
 *   [ '8', 8 ],
 *   [ '9', 9 ] ]
 * 
 * @returns {@link Array}
 */
Iterant.prototype.toArray = function toArray() {
  return Array.from(this);
};
