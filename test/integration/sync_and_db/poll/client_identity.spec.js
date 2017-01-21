'use strict';

const chakram = require('chakram');
const expect = chakram.expect;

const syncHandler = require('../../../../lib/sync/poll_handler');
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

describe('Poll: clientIdentity', () => {
  let db;
  let handler;

  beforeEach((done) => {
    db = new Db({ inMemoryOnly: true }, logger);
    db.init()
        .then(() => {
          handler = syncHandler(db, logger, { partialsThreshold: 1000 }, { rev: 0 });
          done();
        })
        .catch((e) => {
          done(e);
        });
  });

  it('should define a clientIdentity if none was given', (done) => {
    handler({ changes: [], requestId: 1 })
        .then((dataToSend) => {
          if (!dataToSend.success) {
            throw new Error(dataToSend.errorMessage);
          }
          expect(dataToSend.clientIdentity).to.equal(db.meta.nextClientID - 1);
          done();
        })
        .catch((e) => {
          done(e);
        });
  });

  it('should leave the clientIdentity as is if a clientIdentity was give', (done) => {
    const currentClientID = db.meta.nextClientID;
    handler({ changes: [], requestId: 1, clientIdentity: 10 })
        .then((dataToSend) => {
          if (!dataToSend.success) {
            throw new Error(dataToSend.errorMessage);
          }
          expect(db.meta.nextClientID).to.equal(currentClientID);
          expect(dataToSend.clientIdentity).to.equal(10);
          done();
        })
        .catch((e) => {
          done(e);
        });
  });
});
