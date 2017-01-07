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

describe('Socket: DB clientIdentity', () => {
  let db;
  let handler;
  const connID = 1;

  beforeEach(() => {
    db = new Db({ inMemoryOnly: true }, logger);
    handler = syncHandler(db, logger, { partialsThreshold: 1000 });
  });

  it('should define a clientIdentity if none was given', (done) => {
    handler.handleInitialization(connID, {})
        .then((dataToSend) => {
          expect(dataToSend.clientIdentity).to.equal(db.meta.nextClientID - 1);
          expect(handler._connToClientIdentity.get(connID)).to.equal(db.meta.nextClientID - 1);
          done();
        })
        .catch((e) => {
          done(e);
        });
  });

  it('should leave the clientIdentity as is if a clientIdentity was give', (done) => {
    const currentClientID = db.meta.nextClientID;
    handler.handleInitialization(connID, { clientIdentity: 10 })
        .then((dataToSend) => {
          expect(db.meta.nextClientID).to.equal(currentClientID);
          expect(dataToSend.clientIdentity).to.equal(10);
          expect(handler._connToClientIdentity.get(connID)).to.equal(10);
          done();
        })
        .catch((e) => {
          done(e);
        });
  });
});
