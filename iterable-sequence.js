'use strict';

const Iterable = require('./iterable');

function IterableSequence(sequence) {
  if(!(sequence instanceof Sequence)) { 
    throw new TypeError('Can only wrap a Sequence'); 
  }
  if(!this) { return new IterableSequence(sequence); }
  return Iterable.call(this, sequence); 
}
//IterableSequence[Symbol.species] = () => 

IterableSequence.prototype = Object.assign(
  Object.create(Iterable.prototype), {
    slice(begin, end) { 
      let seq;
      if(end) {
        seq = fn.subsequence(this._iterable, begin + 1, end - begin);
      } else {
        seq = fn.subsequence(this._iterable, begin);
      }
      return IterableSequence(seq);
    },
    //map(mapper, that) { },
    //reduce(reducer, init) { },
    //filter(predicate, that) { },
    concat(...args) {
      return IterableSequence(
        new Sequence(...args)
      );
    },
    //sort(comparator) { },
    // FIXME: This doesn't depend on Sequence. Might want to do XPath on any type of iterable, no?
    xpath(path, bindings, that) {
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
    }
});

module.exports = IterableSequence;