'use strict';

const chakram = require('chakram');
const expect = chakram.expect;

const syncHandler = require('../../../../lib/sync/poll_handler');
const Db = require('../../../../lib/db_connectors/NeDB/db');
const { CREATE } = require('../../../../lib/sync/types');

const logger = {
  file: {
    info() {
    },
    error() {
    },
  },
  console: {
    info() {
    },
    error() {
    },
  },
};

describe('Poll: Partial server sync', () => {
  let db;
  let handler;

  beforeEach(() => {
    db = new Db({ inMemoryOnly: true }, logger);
    handler = syncHandler(db, logger, { partialsThreshold: 1 });
  });

  it('should add changes which we couldn\'t send to the partialChanges table', (done) => {
    const create1 = {
      rev: 2,
      type: CREATE,
      obj: { foo: 'bar' },
      key: 1,
      table: 'foo',
    };
    const create2 = {
      rev: 3,
      type: CREATE,
      obj: { foo: 'baz' },
      key: 2,
      table: 'foo',
    };
    db.addChangesData(create1)
      .then(() => db.addChangesData(create2))
      .then(() => handler({ requestId: 1, changes: [] }))
      .then((dataToSend) => {
        expect(dataToSend.changes).to.deep.equal([{
          key: create1.key,
          table: create1.table,
          obj: create1.obj,
          type: create1.type,
        }]);
        expect(dataToSend.partial).to.equal(true);
        return db.partialChanges.get(dataToSend.clientIdentity);
      })
      .then((data) => {
        expect(data.changes).to.deep.equal([{
          key: create2.key,
          table: create2.table,
          obj: create2.obj,
          type: create2.type,
        }]);
        done();
      })
        .catch((e) => {
          done(e);
        });
  });

  it('should send any partial changes we have saved independent of the given revision', (done) => {
    const create1 = {
      rev: 1,
      type: CREATE,
      obj: { foo: 'bar' },
      key: 1,
      table: 'foo',
    };
    const create2 = {
      rev: 2,
      type: CREATE,
      obj: { foo: 'baz' },
      key: 2,
      table: 'foo',
    };
    db.addChangesData(create1)
        .then(() => db.addChangesData(create2))
        .then(() => handler({ requestId: 1, changes: [], clientIdentity: 1 }))
        .then((dataToSend) => {
          expect(dataToSend.changes).to.deep.equal([{
            key: create1.key,
            type: create1.type,
            obj: create1.obj,
            table: create1.table,
          }]);
          expect(dataToSend.partial).to.equal(true);
          return handler({
            requestId: 2,
            changes: [],
            clientIdentity: 1,
            baseRevision: 3,
            syncedRevision: 3, // Make sure that we will get the changes independent of the revision
          });
        })
        .then((dataToSend) => {
          expect(dataToSend.changes).to.deep.equal([{
            key: create2.key,
            type: create2.type,
            obj: create2.obj,
            table: create2.table,
          }]);
          expect(dataToSend.partial).to.equal(false);
          return db.partialChanges.get(1);
        })
        .then((data) => {
            // We should not have any partial changes anymore
          expect(data.changes).to.deep.equal([]);
          done();
        })
        .catch((e) => {
          done(e);
        });
  });
});
