'use strict';

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

module.exports = IterableArray;