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

module.exports = IterableSequence;
const Iterable = require('./iterable');

function IterableSequence(sequence) {
  if(!(sequence instanceof Sequence)) { 
    throw new TypeError('Can only wrap a Sequence'); 
  }
  if(!this) { return new IterableSequence(sequence); }
  return Iterable.call(this, sequence); 
}

// Inherit from Iterable
IterableSequence.prototype = Object.create(Iterable.prototype); 

IterableSequence.prototype[Symbol.toStringTag] = 'IterableSequence';
IterableSequence.prototype[Symbol.species] = IterableSequence;
IterableSequence.prototype.slice = function(begin, end) { 
  let seq;
  if(undefined === begin) {
    return IterableSequence(this._iterable);
  }
  if('number' !== typeof begin || begin < 0 || 0 !== begin % 1) { 
    throw new TypeError('begin must be a positive integer'); 
  }
  if(end) {
    if('number' !== typeof end || end < 0 || 0 !== end % 1 || end < begin) { 
      throw new TypeError('end must be a positive integer greater than begin (' + String(begin) + ')'); 
    }
    seq = fn.subsequence(this._iterable, begin + 1, end - begin);
  } else {
    seq = fn.subsequence(this._iterable, begin + 1);
  }
  return IterableSequence(seq);
};
//map(mapper, that) { },
//reduce(reducer, init) { },
//filter(predicate, that) { },
IterableSequence.prototype.concat = function(...args) {
  if(0 === args.length) {
    return IterableSequence(this._iterable);
  }
  return IterableSequence(
    new Sequence(this._iterable, ...args.map((item) => Sequence.from(item)))
  );
};
IterableSequence.prototype.sort = function(comparator) { 
  if(console && 'function' === typeof console.warn) {
    console.warn('Sort in the database query where possible. This won’t scale for large Sequences.');
  }
  return Iterable.prototype.sort.call(this, comparator);
};
// FIXME: This doesn't depend on Sequence. Might want to do XPath on any type of iterable, no?
IterableSequence.prototype.xpath = function(path, bindings, that) {
  if(null === path || 'undefined' === typeof path) { 
    throw new TypeError('path must be a string of XPath'); 
  }
  return Iterable(
    Iterable.delegate(
      this._iterable, 
      function*(item){
        if(item instanceof Node 
          || item instanceof Document 
          || 'function' === typeof item.xpath) {
          yield* item.xpath(path, bindings);
        }
      }
    )
  );
};
