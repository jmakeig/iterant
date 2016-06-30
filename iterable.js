/******************************************************************************
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
 ******************************************************************************/
 
'use strict';

/* Inspired by <http://www.benmvp.com/learning-es6-generators-as-iterators/> */
function Iterable(iterable) {
  if(!this) { return new Iterable(iterable); } // Call as a factory, not a constructor
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
   * @param {object} obj              Any object, including `null` or `undefined`
   * @param {[boolean]} ignoreStrings Don’t consider a string iterable. 
   *                                  Be careful how you employ this.
   * @return {boolean} Whether the object is iterable
   */
  isIterable: function(obj, ignoreStrings) {
    if(null === obj || 'undefined' === typeof obj) return false;
    if('string' === typeof obj && true === ignoreStrings) return false;
    return Boolean(obj[Symbol.iterator]);
  },
  /**
   * Loop over an iterable, executing a function on each item, yielding an iterable.
   *
   * @param {iterable} iterable d
   * @param {function} fct      A function 
   * @param {[object]} that     The optional `this` object to which `fct` is bound. 
   *                            Defaults to `null`.
   */
  map: function*(iterable, fct, that) {
    if(!Iterable.isIterable(iterable)) { throw new TypeError('iterable must be iterable'); }
    if('function' !== typeof fct) { throw new TypeError('fct must be a function'); }
    for(let item of iterable) {
      yield fct.call(that || null, item);
    }
  },
  /**
   * Same as `Iterable.prototype.map` but delegates to the called generator, i.e. `yield*` 
   * instead of `yield`.
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
  reduce: function(iterable, fct, init) {
    if(!Iterable.isIterable(iterable)) { throw new TypeError('iterable must be iterable'); }
    let value = init, index = 0;
    for(let item of iterable) {
      value = fct.call(null, value, item, index++, this);
    }
    return value;
  },
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
  forEach: function*(iterable, fct, that) {
    if(!Iterable.isIterable(iterable)) { throw new TypeError('iterable must be iterable'); }
    if('function' !== typeof fct) { throw new TypeError('predicate must be a function'); }
    for(let item of iterable) {
      yield item.call(that || null);
    }
  },
});

Object.assign(Iterable.prototype, {
  [Symbol.iterator]: function*() { yield* this._iterable; },
  map: function(fct, that) {
    if(Array.isArray(this._iterable)) {
      this._iterable = this._iterable.map(fct, that);
    } else {
      this._iterable = Iterable.map(this._iterable, fct, that);
    }
    return this;
  },
  // TODO: What if the reducer returns an iterable?
  reduce: function(fct, init) {
    if(Array.isArray(this._iterable)) {
      return this._iterable.reduce(fct, init);
    } else {
      return Iterable.reduce(this, fct, init);
    }
  },
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
   */
  filter: function(predicate, that) {
    if(Array.isArray(this._iterable)) {
      this._iterable = this._iterable.filter(predicate, that);
    } else {
      this._iterable = Iterable.filter(this._iterable, predicate, that);
    }
    return this;
  },
  sort: function(comparator) {
    // DON'T USE THIS ON ANYTHING LARGE
    this._iterable = Array.from(this._iterable).sort(comparator);
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

/** MarkLogic-specific **/
Object.assign(Iterable.prototype, {
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