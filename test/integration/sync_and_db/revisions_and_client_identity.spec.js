'use strict';

const chakram = require('chakram');
const expect = chakram.expect;

const syncHandler = require('../../../lib/sync/handler');
const Db = require('../../../lib/db_connectors/NeDB/db');

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

describe('DB revisions and clientIdentity', () => {
  let db;
  let handler;

  beforeEach(() => {
    db = new Db({ inMemoryOnly: true }, logger);
    handler = syncHandler(db, logger);
  });

  function expectWrapper(done, fn) {
    try {
      fn();
    } catch (e) {
      done(e);
    }
  }

  it('should define a clientIdentity if none was given and save it with the current revision', (done) => {
    handler({
      changes: [],
      requestId: 1,
    }).then((dataToSend) => {
      expectWrapper(done, () => {
        expect(dataToSend.clientIdentity).to.equal(db.meta.nextClientID - 1);
        expect(db.meta.clients[dataToSend.clientIdentity]).to.deep.equal({ revision: 1 });
        done();
      });
    });
  });

  it('should leave the clientIdentity as is and update the revision if a clientIdentity was give', (done) => {
    const currentClientID = db.meta.nextClientID;
    db.meta.clients = { '10': { revision: 0 } };
    handler({
      changes: [],
      requestId: 1,
      clientIdentity: 10,
    }).then((dataToSend) => {
      expectWrapper(done, () => {
        expect(db.meta.nextClientID).to.equal(currentClientID);
        expect(dataToSend.clientIdentity).to.equal(10);
        expect(db.meta.clients['10']).to.deep.equal({ revision: 1 });
        done();
      });
    });
  });

  it('should update the revision for each request', (done) => {
    handler({
      changes: [],
      requestId: 1,
    }).then((dataToSend1) => {
      expectWrapper(done, () => {
        expect(db.meta.revision).to.equal(1);
        expect(dataToSend1.currentRevision).to.equal(1);
      });
      handler({
        changes: [],
        request: 1,
      }).then((dataToSend2) => {
        expectWrapper(done, () => {
          expect(db.meta.revision).to.equal(2);
          expect(dataToSend2.currentRevision).to.equal(2);
          done();
        });
      });
    });
  });
});
