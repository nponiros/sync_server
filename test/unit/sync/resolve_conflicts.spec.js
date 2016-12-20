'use strict';

const chakram = require('chakram');
const expect = chakram.expect;

const resolveConflicts = require('../../../lib/sync/resolve_conflicts');
const { CREATE, UPDATE, DELETE } = require('../../../lib/sync/types');

describe('resolveConflicts', () => {
  it('should take the client change if no server changes was found with the same key', () => {
    const clientChanges = [{
      type: CREATE,
      key: 1,
      table: 'foo',
      obj: {},
    }];
    const serverChanges = {};

    const res = resolveConflicts(clientChanges, serverChanges);
    expect(res).to.deep.equal([clientChanges[0]]);
  });

  it('should not resolve anything if the server change was a CREATE', () => {
    const clientChanges = [{
      type: UPDATE,
      key: 1,
      table: 'foo',
      obj: {},
    }];
    const serverChanges = {
      'foo:1': { type: CREATE },
    };

    const res = resolveConflicts(clientChanges, serverChanges);
    expect(res).to.deep.equal([]);
  });

  it('should not resolve anything if the server change was a DELETE', () => {
    const clientChanges = [{
      type: UPDATE,
      key: 1,
      table: 'foo',
      obj: {},
    }];
    const serverChanges = {
      'foo:1': { type: DELETE },
    };

    const res = resolveConflicts(clientChanges, serverChanges);
    expect(res).to.deep.equal([]);
  });

  describe('server change type is UPDATE', () => {
    it('should take the client change and merge those with the server change if client type was CREATE', () => {
      const clientChanges = [{
        type: CREATE,
        obj: { foo: 'bar', foobar: 'foobar' },
        key: 1,
        table: 'foo',
      }];
      const serverChanges = {
        'foo:1': {
          type: UPDATE,
          key: 1,
          table: 'foo',
          mods: { foo: 'baz', bar: 'bar' },
        },
      };

      const res = resolveConflicts(clientChanges, serverChanges);
      expect(res).to.deep.equal([{
        type: CREATE,
        key: 1,
        table: 'foo',
        obj: { foo: 'baz', bar: 'bar', foobar: 'foobar' },
      }]);
    });

    it('should take the client change if the type was DELETE', () => {
      const clientChanges = [{
        type: DELETE,
        key: 1,
        table: 'foo',
      }];
      const serverChanges = {
        'foo:1': {
          type: UPDATE,
          key: 1,
          table: 'foo',
          mods: { foo: 'baz', bar: 'bar' },
        },
      };

      const res = resolveConflicts(clientChanges, serverChanges);
      expect(res).to.deep.equal([clientChanges[0]]);
    });

    it(`should discard the change if the client and server paths to update
are the same and client type is UPDATE`, () => {
      const clientChanges = [{
        type: UPDATE,
        mods: { foo: 'bar' },
        key: 1,
        table: 'foo',
      }];
      const serverChanges = {
        'foo:1': {
          type: UPDATE,
          key: 1,
          table: 'foo',
          mods: { foo: 'baz' },
        },
      };

      const res = resolveConflicts(clientChanges, serverChanges);
      expect(res).to.deep.equal([]);
    });

    it(`should discard the change if the client nested path conflicts
with a server parent path and client type is UPDATE`, () => {
      const clientChanges = [{
        type: UPDATE,
        mods: { 'foo.bar': 'bar' },
        key: 1,
        table: 'foo',
      }];
      const serverChanges = {
        'foo:1': {
          type: UPDATE,
          key: 1,
          table: 'foo',
          mods: { foo: 'baz' },
        },
      };

      const res = resolveConflicts(clientChanges, serverChanges);
      expect(res).to.deep.equal([]);
    });

    it(`should accept the client change if it has key paths not conflicting
with server changes and client type is UPDATE`, () => {
      const clientChanges = [{
        type: UPDATE,
        mods: { foo: 'bar', foobar: 'foobar' },
        key: 1,
        table: 'foo',
      }];
      const serverChanges = {
        'foo:1': {
          type: UPDATE,
          key: 1,
          table: 'foo',
          mods: { foo: 'baz', bar: 'bar' },
        },
      };

      const res = resolveConflicts(clientChanges, serverChanges);
      expect(res).to.deep.equal([{
        type: UPDATE,
        key: 1,
        table: 'foo',
        mods: { foobar: 'foobar' },
      }]);
    });

    it(`should accept the client change if it changes a parent path and the server changes
the nested path and client type is UPDATE`, () => {
      const clientChanges = [{
        type: UPDATE,
        mods: { foo: 'bar' },
        key: 1,
        table: 'foo',
      }];
      const serverChanges = {
        'foo:1': {
          type: UPDATE,
          key: 1,
          table: 'foo',
          mods: { 'foo.bar': 'baz' },
        },
      };

      const res = resolveConflicts(clientChanges, serverChanges);
      expect(res).to.deep.equal([{
        type: UPDATE,
        key: 1,
        table: 'foo',
        mods: { foo: 'bar' },
      }]);
    });
  });
});
