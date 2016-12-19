'use strict';

const chakram = require('chakram');
const expect = chakram.expect;

const reduceChanges = require('../../../lib/sync/reduce_changes');
const { CREATE, UPDATE, DELETE } = require('../../../lib/sync/types');

describe('reduceChanges', () => {
  it('should just add the change if there is no other change for this key in the given table', () => {
    const create = {
      rev: 0,
      key: 1,
      table: 'foo',
      obj: {},
      type: CREATE,
    };
    const update = {
      rev: 1,
      key: 2,
      table: 'foo',
      obj: {},
      type: UPDATE,
    };
    const remove = {
      rev: 1,
      key: 1,
      table: 'bar',
      type: DELETE,
    };
    const changes = [create, update, remove];
    const res = reduceChanges(changes);
    expect(res).to.deep.equal({
      'foo:1': create,
      'foo:2': update,
      'bar:1': remove,
    });
  });

  // Tests for if a key exists multiple times in a table
  describe('prev change was CREATE', () => {
    it('should just take the latest CREATE change', () => {
      const create1 = {
        rev: 0,
        key: 1,
        table: 'foo',
        obj: {},
        type: CREATE,
      };
      const create2 = {
        rev: 1,
        key: 1,
        table: 'foo',
        obj: { foo: 'bar' },
        type: CREATE,
      };
      const changes = [create1, create2];
      const res = reduceChanges(changes);
      expect(res).to.deep.equal({
        'foo:1': create2,
      });
    });

    it('should take the latest DELETE change', () => {
      const create = {
        rev: 0,
        key: 1,
        table: 'foo',
        obj: {},
        type: CREATE,
      };
      const remove = {
        rev: 1,
        key: 1,
        table: 'foo',
        type: DELETE,
      };
      const changes = [create, remove];
      const res = reduceChanges(changes);
      expect(res).to.deep.equal({
        'foo:1': remove,
      });
    });

    it('should combine the CREATE and UPDATE change and keep rev and type of CREATE', () => {
      const create = {
        rev: 0,
        key: 1,
        table: 'foo',
        obj: {
          foo: 'baz',
        },
        type: CREATE,
      };
      const update = {
        rev: 1,
        key: 1,
        table: 'foo',
        mods: {
          title: 'bar',
        },
        type: UPDATE,
      };
      const changes = [create, update];
      const res = reduceChanges(changes);
      expect(res).to.deep.equal({
        'foo:1': {
          rev: 0,
          key: 1,
          table: 'foo',
          obj: {
            title: 'bar',
            foo: 'baz',
          },
          type: CREATE,
        },
      });
    });
  });

  describe('prev change was UPDATE', () => {
    it('should just take the latest CREATE change', () => {
      const update = {
        rev: 0,
        key: 1,
        table: 'foo',
        mods: { foo: 'bar' },
        type: UPDATE,
      };
      const create = {
        rev: 1,
        key: 1,
        table: 'foo',
        obj: { foo: 'bar baz' },
        type: CREATE,
      };
      const changes = [update, create];
      const res = reduceChanges(changes);
      expect(res).to.deep.equal({
        'foo:1': create,
      });
    });

    it('should take the latest DELETE change', () => {
      const update = {
        rev: 0,
        key: 1,
        table: 'foo',
        mods: { foo: 'bar' },
        type: UPDATE,
      };
      const remove = {
        rev: 1,
        key: 1,
        table: 'foo',
        type: DELETE,
      };
      const changes = [update, remove];
      const res = reduceChanges(changes);
      expect(res).to.deep.equal({
        'foo:1': remove,
      });
    });

    it('should combine two UPDATE changes and keep rev and type of the latest UPDATE', () => {
      const update1 = {
        rev: 0,
        key: 1,
        table: 'foo',
        mods: {
          foo: 'baz',
        },
        type: UPDATE,
      };
      const update2 = {
        rev: 1,
        key: 1,
        table: 'foo',
        mods: {
          title: 'bar',
        },
        type: UPDATE,
      };
      const changes = [update1, update2];
      const res = reduceChanges(changes);
      expect(res).to.deep.equal({
        'foo:1': {
          rev: 0,
          key: 1,
          table: 'foo',
          mods: {
            title: 'bar',
            foo: 'baz',
          },
          type: UPDATE,
        },
      });
    });
  });

  describe('prev change was DELETE', () => {
    it('should recreate a change if the latest was CREATE and a DELETE previously', () => {
      const remove = {
        rev: 0,
        key: 1,
        table: 'foo',
        type: DELETE,
      };
      const create = {
        rev: 1,
        key: 1,
        table: 'foo',
        obj: { foo: 'bar' },
        type: CREATE,
      };
      const changes = [remove, create];
      const res = reduceChanges(changes);
      expect(res).to.deep.equal({
        'foo:1': create,
      });
    });

    it('should still DELETE if the latest was a DELETE', () => {
      const remove1 = {
        rev: 0,
        key: 1,
        table: 'foo',
        type: DELETE,
      };
      const remove2 = {
        rev: 1,
        key: 1,
        table: 'foo',
        type: DELETE,
      };
      const changes = [remove1, remove2];
      const res = reduceChanges(changes);
      expect(res).to.deep.equal({
        'foo:1': remove1,
      });
    });

    it('should still DELETE if the latest was an UPDATE', () => {
      const remove = {
        rev: 0,
        key: 1,
        table: 'foo',
        type: DELETE,
      };
      const update = {
        rev: 1,
        key: 1,
        table: 'foo',
        mods: { foo: 'bar' },
        type: UPDATE,
      };
      const changes = [remove, update];
      const res = reduceChanges(changes);
      expect(res).to.deep.equal({
        'foo:1': remove,
      });
    });
  });
});
