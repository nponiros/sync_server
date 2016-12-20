'use strict';

const chakram = require('chakram');
const expect = chakram.expect;

const setByKeyPath = require('../../../lib/sync/set_key_path');

describe('setByKeyPath', () => {
  it('should return undefined if the given object or keyPath are undefined', () => {
    let res = setByKeyPath(undefined, '', 'a');
    expect(res).to.be.undefined;

    res = setByKeyPath({}, undefined, 'a');
    expect(res).to.be.undefined;
  });

  it('should set object keyPath to have the given value', () => {
    const obj1 = {};
    setByKeyPath(obj1, 'foo', 'value');
    expect(obj1).to.deep.equal({ foo: 'value' });

    const obj2 = { foo: 'oldValue' };
    setByKeyPath(obj2, 'foo', 'value2');
    expect(obj2).to.deep.equal({ foo: 'value2' });
  });

  it('should be able to set the value for a nested keyPath', () => {
    const obj1 = {};
    setByKeyPath(obj1, 'foo.bar', 'value');
    expect(obj1).to.deep.equal({ foo: { bar: 'value' } });

    const obj2 = { foo: { bar: 'oldValue' } };
    setByKeyPath(obj2, 'foo.bar', 'value2');
    expect(obj2).to.deep.equal({ foo: { bar: 'value2' } });
  });

  it('should work if the given keyPath ends with a dot', () => {
    const obj1 = {};
    setByKeyPath(obj1, 'foo.bar.', 'value');
    expect(obj1).to.deep.equal({ foo: { bar: 'value' } });

    const obj2 = { foo: { bar: 'oldValue' } };
    setByKeyPath(obj2, 'foo.bar', 'value2');
    expect(obj2).to.deep.equal({ foo: { bar: 'value2' } });
  });
});
