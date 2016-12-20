'use strict';

const chakram = require('chakram');
const expect = chakram.expect;

const combineUpdateAndUpdate = require('../../../lib/sync/combine_update_and_update');

describe('combineUpdateAndUpdate', () => {
  it('should combine the keys of nextChange.mods and prevChange.mods', () => {
    const prevChange = {
      mods: {
        foo: 'bar',
      },
    };
    const nextChange = {
      mods: {
        bar: 'baz',
      },
    };

    const res = combineUpdateAndUpdate(prevChange, nextChange);
    expect(res.mods).to.deep.equal({ foo: 'bar', bar: 'baz' });
  });

  it('should leave the original object untouched', () => {
    const prevChange = {
      mods: {
        foo: 'bar',
      },
    };
    const nextChange = {
      mods: {
        bar: 'baz',
      },
    };

    combineUpdateAndUpdate(prevChange, nextChange);
    expect(prevChange).to.deep.equal({ mods: { foo: 'bar' } });
  });

  it('should overwrite a previous change with the same key', () => {
    const prevChange = {
      mods: {
        foo: 'bar',
      },
    };
    const nextChange = {
      mods: {
        foo: 'baz',
      },
    };

    const res = combineUpdateAndUpdate(prevChange, nextChange);
    expect(res.mods).to.deep.equal({ foo: 'baz' });
  });

  it('should ignore a previous change which changed a parent object of the next change', () => {
    const prevChange = {
      mods: {
        'foo': { bar: 'baz', baz: 'bar' },
      },
    };
    const nextChange = {
      mods: {
        'foo.bar': 'foobar',
      },
    };

    const res = combineUpdateAndUpdate(prevChange, nextChange);
    expect(res).to.deep.equal({ mods: { foo: { bar: 'foobar', baz: 'bar' } } });
  });

  it('should ignore a previous change which changed a sub value of the nextChange', () => {
    const prevChange = {
      mods: {
        'foo.bar': 'foobar',
      },
    };
    const nextChange = {
      mods: {
        'foo': { bar: 'baz' },
      },
    };

    const res = combineUpdateAndUpdate(prevChange, nextChange);
    expect(res).to.deep.equal({ mods: { 'foo': { bar: 'baz' } } });
  });
});
