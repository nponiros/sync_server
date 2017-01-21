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

  beforeEach((done) => {
    db = new Db({ inMemoryOnly: true }, logger);
    db.init()
        .then(() => {
          handler = syncHandler(db, logger, { partialsThreshold: 1 }, { rev: 0 });
          done();
        })
        .catch((e) => {
          done(e);
        });
  });

  it('should send any partial changes in multiple calls', (done) => {
    const create1 = {
      type: CREATE,
      obj: { foo: 'bar' },
      key: 1,
      table: 'foo',
    };
    const create2 = {
      type: CREATE,
      obj: { foo: 'baz' },
      key: 2,
      table: 'foo',
    };

    let callCounter = 0;

    function cb({ data, succeeded }) {
      const thisData = Object.assign({}, data);
      if (!succeeded) {
        return done(new Error(data.errorMessage));
      }
      try {
        switch (callCounter) {
          // Call during subscribe
          case 0: {
            // Equal current db revision
            expect(data.currentRevision).to.equal(0);
            callCounter = callCounter + 1;
            break;
          }
          case 1: {
            callCounter = callCounter + 1;
            // Make sure we have 1 change. We don't know which change as we don't know the order
            // in which the changes are written to the changesTable
            expect(data.changes.length).to.equal(1);
            expect(thisData.partial).to.equal(true);
            expect(data.currentRevision).to.equal(1); // First change has rev 1
            expect(handler._clientIDToRevision.get(clientIdentity2)).to.equal(data.currentRevision);
            break;
          }
          case 2: {
            // Make sure we have 1 change. We don't know which change as we don't know the order
            // in which the changes are written to the changesTable
            expect(data.changes.length).to.equal(1);
            expect(data.partial).to.equal(false);
            expect(data.currentRevision).to.equal(2); // Second change has rev 2
            expect(handler._clientIDToRevision.get(clientIdentity2)).to.equal(data.currentRevision);
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
        .then(() => handler.handleSubscribe(connID1, { syncedRevision: 2 }, () => {
        }))
        .then(() => handler.handleSubscribe(connID2, { syncedRevision: 0 }, cb))
        .then(() => handler.handleClientChanges(connID1, { changes: [create1, create2] }))
        .catch((e) => {
          done(e);
        });
  });
});
