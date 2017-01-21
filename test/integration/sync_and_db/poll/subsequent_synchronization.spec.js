'use strict';

const chakram = require('chakram');
const expect = chakram.expect;

const syncHandler = require('../../../../lib/sync/poll_handler');
const Db = require('../../../../lib/db_connectors/NeDB/db');
const { CREATE, UPDATE, DELETE } = require('../../../../lib/sync/types');

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

describe('Poll: Subsequent Synchronization', () => {
  let db;
  let handler;

  beforeEach((done) => {
    db = new Db({ inMemoryOnly: true }, logger);
    db.init()
        .then(() => {
          handler = syncHandler(db, logger, { partialsThreshold: 1000 }, { rev: 2 });
          done();
        })
        .catch((e) => {
          done(e);
        });
  });

  it('should not return server changes to the client when those have the same clientIdentity', (done) => {
    const create = {
      rev: 1,
      type: CREATE,
      obj: { foo: 'bar' },
      key: 1,
      table: 'foo',
      source: 1,
    };
    db.addChangesData(create)
        .then(() => handler({ changes: [], requestId: 1, clientIdentity: 1 }))
        .then((dataToSend) => {
          if (!dataToSend.success) {
            throw new Error(dataToSend.errorMessage);
          }
          expect(dataToSend.changes.length).to.equal(0);
          done();
        })
        .catch((e) => {
          done(e);
        });
  });

  it('should ignore changes on the server which are older than the given syncedRevision', (done) => {
    const create1 = {
      rev: 1,
      type: CREATE,
      obj: { foo: 'bar' },
      key: 1,
      table: 'foo',
      source: 2,
    };
    const create2 = {
      rev: 2,
      type: CREATE,
      obj: { bar: 'baz' },
      key: 2,
      table: 'foo',
      source: 2,
    };
    db.addChangesData(create1)
        .then(() => db.addChangesData(create2))
        .then(() => handler({
          changes: [],
          requestId: 1,
          clientIdentity: 1,
          syncedRevision: 1,
        }))
        .then((dataToSend) => {
          if (!dataToSend.success) {
            throw new Error(dataToSend.errorMessage);
          }
          expect(dataToSend.changes.length).to.equal(1);
          expect(dataToSend.changes[0]).to.deep.equal({
            type: create2.type,
            obj: create2.obj,
            key: create2.key,
            table: create2.table,
          });
          done();
        })
        .catch((e) => {
          done(e);
        });
  });

  it('should send again the same changes if the client syncedRevision did not change', (done) => {
    const create1 = {
      rev: 1,
      type: CREATE,
      obj: { foo: 'bar' },
      key: 1,
      table: 'foo',
      source: 2,
    };
    const create2 = {
      rev: 2,
      type: CREATE,
      obj: { bar: 'baz' },
      key: 2,
      table: 'foo',
      source: 2,
    };
    db.addChangesData(create1)
        .then(() => db.addChangesData(create2))
        .then(() => handler({
          changes: [],
          requestId: 1,
          clientIdentity: 1,
          syncedRevision: 1,
        }))
        .then((dataToSend) => {
          if (!dataToSend.success) {
            throw new Error(dataToSend.errorMessage);
          }
          expect(dataToSend.changes.length).to.equal(1);
          expect(dataToSend.changes[0]).to.deep.equal({
            type: create2.type,
            obj: create2.obj,
            key: create2.key,
            table: create2.table,
          });

          return handler({
            changes: [],
            requestId: 1,
            clientIdentity: 1,
            syncedRevision: 1,
          });
        })
        .then((dataToSend) => {
          if (!dataToSend.success) {
            throw new Error(dataToSend.errorMessage);
          }
          expect(dataToSend.changes.length).to.equal(1);
          expect(dataToSend.changes[0]).to.deep.equal({
            type: create2.type,
            obj: create2.obj,
            key: create2.key,
            table: create2.table,
          });
          done();
        }).catch((e) => {
          done(e);
        });
  });

  it('should not error out if a client resends a CREATE change for an object updated by another client', (done) => {
    const create = {
      type: CREATE,
      obj: { foo: 'more than once' },
      key: 1,
      table: 'foo',
    };
    const update = {
      type: UPDATE,
      mods: { foo: 'updating it' },
      key: 1,
      table: 'foo',
    };
    // Client baseRevision matches server revision
    const createRequest = { changes: [create], requestId: 1, clientIdentity: 1, syncedRevision: 2, baseRevision: 2 };
    // Use baseRevision 3. We started with db revision 2 and added one change
    const updateRequest = { changes: [update], requestId: 1, clientIdentity: 2, syncedRevision: 3, baseRevision: 3 };
    handler(createRequest)
      .then((dataToSend) => {
        if (!dataToSend.success) {
          throw new Error(dataToSend.errorMessage);
        }
        return db.getData('foo', 1);
      })
      .then((data) => {
        expect(data).to.deep.equal({ foo: 'more than once' });
        return handler(updateRequest);
      })
      .then((dataToSend) => {
        if (!dataToSend.success) {
          throw new Error(dataToSend.errorMessage);
        }
        return db.getData('foo', 1);
      })
      .then((data) => {
        expect(data).to.deep.equal({ foo: 'updating it' });
        return handler(createRequest);
      })
      .then((dataToSend) => {
        if (!dataToSend.success) {
          throw new Error(dataToSend.errorMessage);
        }
        return db.getData('foo', 1);
      })
      .then((data) => {
        expect(data).to.deep.equal({ foo: 'updating it' });
        return new Promise((resolve, reject) => {
          db.changesTable.store.find({ key: 1 }, (err, data) => {
            if (err) {
              return reject(err);
            }
            resolve(data);
          });
        });
      })
      .then((changeData) => {
        // CREATE and UPDATE change
        expect(changeData.length).to.equal(2);
        done();
      })
      .catch((e) => {
        done(e);
      });
  });

  it('should not error out if a client resends a CREATE change for an object deleted by another client', (done) => {
    const create = {
      type: CREATE,
      obj: { foo: 'more than once' },
      key: 1,
      table: 'foo',
    };
    const update = {
      type: DELETE,
      mods: { foo: 'updating it' },
      key: 1,
      table: 'foo',
    };
    // Client baseRevision matches server revision
    const createRequest = { changes: [create], requestId: 1, clientIdentity: 1, syncedRevision: 2, baseRevision: 2 };
    // Use baseRevision 3. We started with db revision 2 and added one change
    const updateRequest = { changes: [update], requestId: 1, clientIdentity: 2, syncedRevision: 3, baseRevision: 3 };
    handler(createRequest)
        .then((dataToSend) => {
          if (!dataToSend.success) {
            throw new Error(dataToSend.errorMessage);
          }
          return db.getData('foo', 1);
        })
        .then((data) => {
          expect(data).to.deep.equal({ foo: 'more than once' });
          return handler(updateRequest);
        })
        .then((dataToSend) => {
          if (!dataToSend.success) {
            throw new Error(dataToSend.errorMessage);
          }
          return db.getData('foo', 1);
        })
        .then((data) => {
          expect(data).to.equal(null);
          return handler(createRequest);
        })
        .then((dataToSend) => {
          if (!dataToSend.success) {
            throw new Error(dataToSend.errorMessage);
          }
          return db.getData('foo', 1);
        })
        .then((data) => {
          expect(data).to.equal(null);
          return new Promise((resolve, reject) => {
            db.changesTable.store.find({ key: 1 }, (err, data) => {
              if (err) {
                return reject(err);
              }
              resolve(data);
            });
          });
        })
        .then((changeData) => {
          // CREATE and DELETE change
          expect(changeData.length).to.equal(2);
          done();
        })
        .catch((e) => {
          done(e);
        });
  });
});
