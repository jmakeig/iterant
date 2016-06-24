A wrapper type that abstracts lazy and eager iterables and provides chaining methods, similar to `Array.prototype`.

```
Array.from(
  Iterable(fn.collection())
    .xpath('//*')
    .slice(2, 3)
    .map(x => "Item: " + x)
    .reduce((p, c) => p + '' + c, '')
);

const itr = Iterable([1,2,3,4]);
Array.from(
  itr
    .map(x => x * 2)
    .map(x => x + 1)
    .filter(x => x > 5)
    .slice(1)
);

const itr2 = Iterable(Sequence.from([1,2,3,4]));
itr2
  .slice(1, 3)
  .map(x => x + 7)
  .reduce((p, c) => p + c, 0)

const itr3 =  Iterable([1,2,3,4,5,6,7]);
Array.from(
  itr3
    .slice(2, 5)
    .filter(x => x > 4)
);
```
