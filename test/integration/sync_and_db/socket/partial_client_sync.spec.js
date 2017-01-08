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

describe('Socket: Partial client synchronization', () => {
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

  it('should add the partial data to the uncommittedChanges table', (done) => {
    const create = {
      type: CREATE,
      obj: { foo: 'bar' },
      key: 1,
      table: 'foo',
    };
    handler
        .handleInitialization(connID, { clientIdentity })
        .then(() => handler.handleSubscribe(connID, {}, () => {}))
        .then(() => handler.handleClientChanges(connID, { changes: [create], partial: true }))
        .then(() => db.uncommittedChanges.get(clientIdentity))
        .then((uncommittedChanges) => {
          expect(uncommittedChanges.changes).to.deep.equal([create]);
          done();
        })
        .catch((e) => {
          done(e);
        });
  });

  it(`should add the data to the given tables and clear uncommittedChanges table
after we received partial = false`, (done) => {
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

    handler
        .handleInitialization(connID, { clientIdentity })
        .then(() => handler.handleSubscribe(connID, {}, () => {
        }))
        .then(() => handler.handleClientChanges(connID, { changes: [create1], partial: true }))
        .then(() => handler.handleClientChanges(connID, { changes: [create2], partial: false }))
        .then(() => db.uncommittedChanges.get(clientIdentity))
        .then((uncommittedChanges) => {
          expect(uncommittedChanges.changes).to.deep.equal([]);
          return db.getData('foo', 1);
        })
        .then((data) => {
          expect(data.foo).to.equal('bar');
          return db.getData('foo', 2);
        })
        .then((data) => {
          expect(data.foo).to.equal('baz');
          done();
        })
        .catch((e) => {
          done(e);
        });
  });
});
