'use strict';

const chakram = require('chakram');
const expect = chakram.expect;

const applyModifications = require('../../../lib/sync/apply_modifications');

describe('applyModifications', () => {
  it('should take all values of the modifications object and set them on the given object', () => {
    const modificationsObject = { foo: 'value', bar: 'otherValue' };
    const object = { foo: 'oldValue' };
    const res = applyModifications(object, modificationsObject);

    expect(res).to.deep.equal({ foo: 'value', bar: 'otherValue' });
    expect(object).to.deep.equal({ foo: 'value', bar: 'otherValue' });
  });
});
