'use strict';

const chakram = require('chakram');
const expect = chakram.expect;

const combineCreateAndUpdate = require('../../../lib/sync/combine_create_and_update');

describe('combineCreateAndUpdate', () => {
  it('should get a create change and update change and return a combined object', () => {
    const createChange = {
      obj: {
        foo: 'value',
      },
    };
    const updateChange = {
      mods: {
        foo: 'value2',
        bar: 'new Value',
      },
    };

    const res = combineCreateAndUpdate(createChange, updateChange);
    expect(res.obj).to.deep.equal({ foo: 'value2', bar: 'new Value' });
  });

  it('should not change the original createObject', () => {
    const createChange = {
      obj: {
        foo: 'value',
      },
    };
    const updateChange = {
      mods: {
        foo: 'value2',
        bar: 'new Value',
      },
    };

    combineCreateAndUpdate(createChange, updateChange);
    expect(createChange.obj).to.deep.equal({ foo: 'value' });
  });
});
