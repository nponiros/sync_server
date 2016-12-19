'use strict';

const chakram = require('chakram');
const expect = chakram.expect;

const getServerChanges = require('../../../lib/sync/get_server_changes');
const { CREATE, UPDATE, DELETE } = require('../../../lib/sync/types');

describe('getServerChanges', () => {
  const promise = function(data) {
    return {
      then(cb) {
        return promise(cb(data));
      }
    };
  };

  const create1 = {
    rev: 1,
    type: CREATE,
    table: 'foo',
    key: 1,
    obj: { foo: 'bar' },
  };
  const create2 = {
    rev: 1,
    type: CREATE,
    table: 'foo',
    key: 2,
    obj: { foo: 'bar' },
  };
  const update1 = {
    rev: 2,
    type: UPDATE,
    table: 'foo',
    key: 2,
    mods: { foo: 'baz' },
  };
  const serverChanges = [create1, create2, update1];

  const db = {
    getChangesData() {
      return promise(serverChanges);
    },
  };

  it('should return the changes for the client', () => {
    getServerChanges(db, 0, 2, 2)
      .then((dataToSend) => {
        expect(dataToSend.changes).to.deep.equal([
          create1,
          {
            rev: 1,
            type: CREATE,
            table: 'foo',
            key: 2,
            obj: { foo: 'baz' },
          }
        ]);
        expect(dataToSend.clientIdentity).to.equal(2);
        expect(dataToSend.currentRevision).to.equal(2)
      });
  });
});
