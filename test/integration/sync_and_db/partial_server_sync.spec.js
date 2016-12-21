'use strict';

const chakram = require('chakram');
const expect = chakram.expect;

const syncHandler = require('../../../lib/sync/handler');
const Db = require('../../../lib/db_connectors/NeDB/db');
const { CREATE } = require('../../../lib/sync/types');

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

describe('Partial server sync', () => {
  let db;
  let handler;

  beforeEach(() => {
    db = new Db({ inMemoryOnly: true }, logger);
    handler = syncHandler(db, logger, { partialsThreshold: 1 });
  });

  function expectWrapper(done, fn) {
    try {
      fn();
    } catch (e) {
      done(e);
    }
  }

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
      .then(() => {
        return db.addChangesData(create2);
      })
      .then(() => {
        return handler({
          requestId: 1,
          changes: [],
        });
      })
      .then((dataToSend) => {
        expectWrapper(done, () => {
          expect(dataToSend.changes).to.deep.equal([create1]);
          expect(dataToSend.partial).to.equal(true);
        });
        return db.partialChanges.get(dataToSend.clientIdentity);
      })
      .then((data) => {
        expectWrapper(done, () => {
          expect(data.changes).to.deep.equal([create2]);
          done();
        });
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
        .then(() => {
          return db.addChangesData(create2);
        })
        .then(() => {
          return handler({
            requestId: 1,
            changes: [],
            clientIdentity: 1,
          });
        })
        .then((dataToSend) => {
          expectWrapper(done, () => {
            expect(dataToSend.changes).to.deep.equal([create1]);
            expect(dataToSend.partial).to.equal(true);
          });
          return handler({
            requestId: 2,
            changes: [],
            clientIdentity: 1,
            baseRevision: 3,
            syncedRevision: 3, // Make sure that we will get the changes independent of the revision
          });
        })
        .then((dataToSend) => {
          expectWrapper(done, () => {
            expect(dataToSend.changes).to.deep.equal([create2]);
            expect(dataToSend.partial).to.equal(false);
          });
          return db.partialChanges.get(1);
        })
        .then((data) => {
          expectWrapper(done, () => {
            // We should not have any partial changes anymore
            expect(data.changes).to.deep.equal([]);
            done();
          });
        });
  });
});
