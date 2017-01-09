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

describe('Socket: subscribe', () => {
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

  it('should send back any changes newer than our revision and the current db revision', (done) => {
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

    db.meta.revision = 4;
    function cb({ succeeded, data }) {
      if (!succeeded) {
        return done(new Error(data.errorMessage));
      }

      try {
        expect(data.changes).to.deep.equal([{
          type: CREATE,
          obj: { foo: 'bar' },
          key: 1,
          table: 'foo',
        }, {
          type: CREATE,
          obj: { foo: 'baz' },
          key: 2,
          table: 'foo',
        }]);
        expect(data.partial).to.equal(false);
        expect(data.currentRevision).to.equal(create2.rev);
        done();
      } catch (e) {
        done(e);
      }
    }

    db.addChangesData(create1)
        .then(() => db.addChangesData(create2))
        .then(() => handler.handleInitialization(connID, { clientIdentity }))
        .then(() => handler.handleSubscribe(connID, { syncedRevision: 1 }, cb))
        .catch((e) => {
          done(e);
        });
  });

  it('should send back any changes newer than our revision and work with syncedRevision null', (done) => {
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

    db.meta.revision = 4;
    function cb({ succeeded, data }) {
      if (!succeeded) {
        return done(new Error(data.errorMessage));
      }

      try {
        expect(data.changes).to.deep.equal([{
          type: CREATE,
          obj: { foo: 'bar' },
          key: 1,
          table: 'foo',
        }, {
          type: CREATE,
          obj: { foo: 'baz' },
          key: 2,
          table: 'foo',
        }]);
        expect(data.partial).to.equal(false);
        expect(data.currentRevision).to.equal(create2.rev);
        done();
      } catch (e) {
        done(e);
      }
    }

    db.addChangesData(create1)
        .then(() => db.addChangesData(create2))
        .then(() => handler.handleInitialization(connID, { clientIdentity }))
        .then(() => handler.handleSubscribe(connID, { syncedRevision: null }, cb))
        .catch((e) => {
          done(e);
        });
  });
});
