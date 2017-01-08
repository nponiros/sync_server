'use strict';

const chakram = require('chakram');
const expect = chakram.expect;

const syncHandler = require('../../../../lib/sync/socket_handler');
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

describe('Socket: Partial server sync', () => {
  let db;
  let handler;
  const connID1 = 1;
  const connID2 = 2;
  const clientIdentity1 = 10;
  const clientIdentity2 = 12;

  beforeEach(() => {
    db = new Db({ inMemoryOnly: true }, logger);
    handler = syncHandler(db, logger, { partialsThreshold: 1 });
  });

  it('should send any partial changes in multiple calls', (done) => {
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

    let callCounter = 0;

    function cb({ data, succeeded }) {
      if (!succeeded) {
        return done(new Error(data.errorMessage));
      }

      try {
        switch (callCounter) {
          // Call during subscribe
          case 0: callCounter = callCounter + 1; break;
          case 1: {
            expect(data.changes).to.deep.equal([{
              key: create1.key,
              type: create1.type,
              obj: create1.obj,
              table: create1.table,
            }]);
            expect(data.partial).to.equal(true);
            expect(data.currentRevision).to.equal(create1.rev);
            expect(handler._clientIDToRevision.get(clientIdentity2)).to.equal(data.currentRevision);
            callCounter = callCounter + 1;
            break;
          }
          case 2: {
            expect(data.changes).to.deep.equal([{
              key: create2.key,
              type: create2.type,
              obj: create2.obj,
              table: create2.table,
            }]);
            expect(data.partial).to.equal(false);
            expect(data.currentRevision).to.equal(create2.rev);
            done();
            break;
          }
        }
      } catch (e) {
        done(e);
      }
    }

    handler.handleInitialization(connID1, { clientIdentity: clientIdentity1 })
        .then(() => handler.handleInitialization(connID2, { clientIdentity: clientIdentity2 }))
        .then(() => handler.handleSubscribe(connID1, { syncedRevision: 0 }, () => {
        }))
        .then(() => handler.handleSubscribe(connID2, { syncedRevision: 0 }, cb))
        .then(() => db.addChangesData(create1))
        .then(() => db.addChangesData(create2))
        .then(() => handler.handleClientChanges(connID1, { changes: [] }))
        .catch((e) => {
          done(e);
        });
  });
});
