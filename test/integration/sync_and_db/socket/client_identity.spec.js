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

describe('Socket: clientIdentity', () => {
  let db;
  let handler;
  const connID = 1;

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

  it('should define a clientIdentity if none was given', (done) => {
    handler.handleInitialization(connID, {})
        .then(({ data: dataToSend }) => {
          expect(dataToSend.clientIdentity).to.equal(db.meta.nextClientID - 1);
          expect(handler._connToClientIdentity.get(connID)).to.equal(db.meta.nextClientID - 1);
          done();
        })
        .catch((e) => {
          done(e);
        });
  });

  it('should leave the clientIdentity as is if a clientIdentity was give', (done) => {
    handler.handleInitialization(connID, { clientIdentity: 10 })
        .then(({ data: dataToSend }) => {
          expect(dataToSend.clientIdentity).to.equal(10);
          expect(handler._connToClientIdentity.get(connID)).to.equal(10);
          done();
        })
        .catch((e) => {
          done(e);
        });
  });
});
