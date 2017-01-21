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

  beforeEach((done) => {
    db = new Db({ inMemoryOnly: true }, logger);
    db.init()
        .then(() => {
          handler = syncHandler(db, logger, { partialsThreshold: 1 });
          done();
        })
        .catch((e) => {
          done(e);
        });
  });

  it('should send partial changes', (done) => {
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
    let currentRevision;
    db.addChangesData(create1)
        .then(() => db.addChangesData(create2))
        .then(() => handler({ requestId: 1, changes: [], clientIdentity: 1 }))
        .then((dataToSend) => {
          if (!dataToSend.success) {
            throw new Error(dataToSend.errorMessage);
          }
          expect(dataToSend.changes).to.deep.equal([{
            key: create1.key,
            type: create1.type,
            obj: create1.obj,
            table: create1.table,
          }]);
          expect(dataToSend.partial).to.equal(true);
          expect(dataToSend.currentRevision).to.equal(create1.rev);
          currentRevision = dataToSend.currentRevision;
          return handler({
            requestId: 2,
            changes: [],
            clientIdentity: 1,
            baseRevision: 3,
            syncedRevision: currentRevision,
          });
        })
        .then((dataToSend) => {
          if (!dataToSend.success) {
            throw new Error(dataToSend.errorMessage);
          }
          expect(dataToSend.changes).to.deep.equal([{
            key: create2.key,
            type: create2.type,
            obj: create2.obj,
            table: create2.table,
          }]);
          expect(dataToSend.partial).to.equal(false);
          expect(dataToSend.currentRevision).to.equal(create2.rev);
          done();
        })
        .catch((e) => {
          done(e);
        });
  });
});
