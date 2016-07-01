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

/* Inspired by <http://www.benmvp.com/learning-es6-generators-as-iterators/> */

/**
 * Wraps any iterable (i.e. an object that has a `Symbol.iterator` property) to provide a common iterface, regardless of the underlying concrete type. Thus, you can call the same <code>{@link Iterable#map}</code> on an `Array`, a MarkLogic `Seqeunce`, or a generator. Where possible, `Iterable` delegates to the underlying implementation. For example, <code>{@link Iterable#slice}</code> uses <code>fn.subsequence</code> when it’s slicing a MarkLogic `Sequence`, `Array.prototype.slice` when it‘s operating on an `Array`, and steps the iterator for a generator. 
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
 * const ns = {bt: 'http://cerisent.com/bugtrack' };
 * Iterable( // Wraps any iterable
 *   unpath('/bt:bug-holder', ns) // Naïve implementation of xdmp:unpath()
 * )
 *   .slice(0, 10)   // delegates to fn.subsequence when possible
 *   .xpath('//bt:bug-number', ns)   // may yield more than once per document
 *   .map(node => parseInt(node.textContent, 10)) // Lazy using a generator. (Yes, I could have done this in the XPath above.)
 *   .sort((a, b) => a - b) // Eagerly instantiates an array. That's OK because of the slice above.
 *   .toSequence(); // Lazy if the wrapper iterable is (and Sequence.from() is)
 * 
 * @module iterable.js
 * @exports Iterable  
 */

/**
 * Factory that constructs an `Iterable` instance from an *iterable*.  
 * 
 * @constructs Iterable
 * @param {Array|Sequence|iterable.<*>} iterable Any iterable (i.e. something that has a `Symbol.iterator` property)
 * @returns {Iterable} - An new `Iterable` instance the wraps the passed in iterable
 */
function Iterable(iterable) {
  if(!this) { return new Iterable(iterable); } // Call as a factory, not a constructor
  /** 
   * @memberof Iterable
   * @instance
   * @property {iterable.<*>} _iterable - The wrapped iterable
   * @name _iterable
   * @protected 
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
   * @memberof Iterable
   * 
   * @param {iterable} iterable d
   * @param {function} fct - A mapper function 
   * @param {[object]} that - The optional `this` object to which `fct` is bound. Defaults to `null`.
   * @returns {iterable.<*>} Yields mapped items
   * @throws {TypeError}
   */
  map: function*(iterable, fct, that) {
    if(!Iterable.isIterable(iterable)) { throw new TypeError('iterable must be iterable'); }
    if('function' !== typeof fct) { throw new TypeError('fct must be a function'); }
    for(let item of iterable) {
      yield fct.call(that || null, item);
    }
  },
  /**
   * Same as `Iterable.prototype.map` but delegates to the called generator, 
   * i.e. `yield*` instead of `yield`.
   * 
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
   * 
   * @memberof Iterable
   * 
   * @param {Iterable} iterable
   * @param {function} fct - 
   * @param {*} init        
   * @returns 
   */
  reduce: function(iterable, fct, init) {
    if(!Iterable.isIterable(iterable)) { throw new TypeError('iterable must be iterable'); }
    let value = init, index = 0;
    for(let item of iterable) {
      value = fct.call(null, value, item, index++, this);
    }
    return value;
  },
  /**
   * 
   * @memberof Iterable
   * 
   * @param {*} iterable
   * @param {*} begin
   * @param {*} end
   * @returns
   */
  slice: function*(iterable, begin, end) {
    if(!Iterable.isIterable(iterable)) { throw new TypeError('iterable must be iterable'); }
    if('undefined' === typeof begin) { yield* iterable; return;}
    if('number' !== typeof begin) { throw new TypeError('begin must be a number'); }
    // Shortcut to the underlying Sequence implementation
    if(iterable instanceof Sequence) {
      if(end) {
        yield* fn.subsequence(iterable, begin + 1, end - begin);
      } else {
        yield* fn.subsequence(iterable, begin);
      }
    } else if(Array.isArray(iterable)) {
      yield* iterable.slice(begin, end);
    } else {
      let index = 0;
      for(let value of iterable) {
        if(index++ >= begin) {
          yield value;  
        }
        if(index > end) { break; }
      }
    }
  },
  /**
   * 
   * @memberof Iterable
   * 
   * @param {*} iterable
   * @param {*} predicate
   * @param {*} that
   */
  filter: function*(iterable, predicate, that) {
    if(!Iterable.isIterable(iterable)) { throw new TypeError('iterable must be iterable'); }
    if('function' !== typeof predicate) { throw new TypeError('predicate must be a function'); }
    let index = 0;
    for(let item of iterable) {
      if(predicate.call(that || null, item, index++, iterable)) {
        yield item;
      }
    }
  },
  /**
   * 
   * @memberof Iterable
   * 
   * @param {*} iterable
   * @param {*} fct
   * @param {*} that
   */
  forEach: function*(iterable, fct, that) {
    if(!Iterable.isIterable(iterable)) { throw new TypeError('iterable must be iterable'); }
    if('function' !== typeof fct) { throw new TypeError('predicate must be a function'); }
    for(let item of iterable) {
      yield item.call(that || null);
    }
  },
});

Object.assign(Iterable.prototype, {
  /**
   * @name Symbol.iterator
   * @memberof Iterable
   * @instance
   * @returns {*} Yields to the wrapped iterable
   */
  [Symbol.iterator]: function*() { yield* this._iterable; },
  /**
   * 
   * @memberof Iterable
   * @instance
   * 
   * @param {function} fct
   * @param {*} that
   * @returns
   */
  map: function(fct, that) {
    if(Array.isArray(this._iterable)) {
      this._iterable = this._iterable.map(fct, that);
    } else {
      this._iterable = Iterable.map(this._iterable, fct, that);
    }
    return this;
  },
  /**
   * 
   * @memberof Iterable
   * @instance
   * 
   * @param {*} fct
   * @param {*} init
   * @returns
   */
  reduce: function(fct, init) {
    if(Array.isArray(this._iterable)) {
      return this._iterable.reduce(fct, init);
    } else {
      return Iterable.reduce(this, fct, init);
    }
  },
  /**
   * 
   * @memberof Iterable
   * @instance
   * 
   * @param {*} begin
   * @param {*} end
   * @returns
   */
  slice: function(begin, end) {
    if(Array.isArray(this._iterable)) {
      this._iterable = this._iterable.slice(begin, end);
    } else {
      this._iterable = Iterable.slice(this._iterable, begin, end);
    }
    return this;
  },
  /**
   * `filter` is almost always better implemented as an upstream query when 
   * you’re working with data from a database. 
   * 
   * @memberof Iterable
   * @instance
   * 
   * @param {*} predicate
   * @param {*} that
   * @returns
   */
  filter: function(predicate, that) {
    if(Array.isArray(this._iterable)) {
      this._iterable = this._iterable.filter(predicate, that);
    } else {
      this._iterable = Iterable.filter(this._iterable, predicate, that);
    }
    return this;
  },
  /**
   * 
   * @memberof Iterable
   * @instance
   * 
   * @param {*} comparator
   * @returns
   */
  sort: function(comparator) {
    // DON'T USE THIS ON ANYTHING LARGE
    this._iterable = Array.from(this._iterable).sort(comparator);
    return this;
  },
  // TODO: Does this need to be backed by a Generator? Sequence is already lazy 
  //       (assuming `new Sequence()` is lazy).
  concat: function(...args) {
    if(this._iterable instanceof Sequence) {
      this._iterable = new Sequence(...args);
    } else if(Array.isArray(this._iterable)) {
      this._iterable.concat(...args);
    }
    return this;
  },
  forEach: function(fct, that) {
   if(Array.isArray(this._iterable)) {
      this._iterable = this._iterable.filter(predicate, that);
    } else {
      this._iterable = Iterable.filter(this._iterable, predicate, that);
    }
    return this;
  },
  toArray: function() {
    return Array.from(this);
  },
  toSequence: function() {
    return Sequence.from(this);
  }
});

/* MarkLogic-specific */
Object.assign(Iterable.prototype, {
  /**
   * @memberof Iterable
   * @instance
   * 
   * @param {*} path
   * @param {*} bindings
   * @param {*} that
   * @returns
   */
  xpath: function(path, bindings, that) {
    if(null === path || 'undefined' === typeof path) { throw new TypeError('path must be a string of XPath'); }
    this._iterable = Iterable.delegate(
      this._iterable, 
      function*(item){
        if(item instanceof Node || item instanceof Document || 'function' === typeof item.xpath) {
          yield* item.xpath(path, bindings);
        }
      }
    );
    return this;
  }
});

module.exports = Iterable;