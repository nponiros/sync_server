'use strict';

const chakram = require('chakram');
const expect = chakram.expect;

const syncHandler = require('../../../../lib/sync/socket_handler');
const Db = require('../../../../lib/db_connectors/NeDB/db');

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

describe('Socket: Connection closed', () => {
  let db;
  let handler;
  const connID = 1;
  const clientIdentity = 10;

  beforeEach((done) => {
    db = new Db({ inMemoryOnly: true }, logger);
    db.init()
        .then(() => {
          handler = syncHandler(db, logger, { partialsThreshold: 1000 });
          done();
        })
        .catch((e) => {
          done(e);
        });
  });

  it('should remove the subscribed function and the connection to client ID mapping', (done) => {
    handler.handleInitialization(connID, { clientIdentity })
        .then(() => handler.handleSubscribe(connID, {}, () => {
        }))
        .then(() => {
          expect(handler._connToClientIdentity.get(connID)).to.equal(clientIdentity);
          expect(handler._subscriptions.get(connID)).to.not.be.undefined;

          handler.handleConnectionClosed(connID);

          expect(handler._connToClientIdentity.has(connID)).to.equal(false);
          expect(handler._subscriptions.has(connID)).to.equal(false);
          done();
        })
        .catch((e) => {
          done(e);
        });
  });
});
