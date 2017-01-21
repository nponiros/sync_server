'use strict';

const chakram = require('chakram');
const expect = chakram.expect;

const syncHandler = require('../../../../lib/sync/poll_handler');
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

describe('Poll: Initial synchronization', () => {
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

  it('should leave the tables unchanged if no data was sent', (done) => {
    const request = { changes: [], requestId: 1, baseRevision: null, syncedRevision: null };
    handler(request)
        .then((dataToSend) => {
          if (!dataToSend.success) {
            throw new Error(dataToSend.errorMessage);
          }
          return new Promise((resolve, reject) => {
            db.changesTable.store.count({}, (err, count) => {
              if (err) {
                reject(err);
              }
              resolve(count);
            });
          });
        })
        .then((count) => {
          expect(count).to.equal(0);
          done();
        })
        .catch((e) => {
          done(e);
        });
  });

  it('should not try to send any changes if no changes were made', (done) => {
    handler({ changes: [], requestId: 1, baseRevision: null, syncedRevision: null })
        .then((dataToSend) => {
          if (!dataToSend.success) {
            throw new Error(dataToSend.errorMessage);
          }
          expect(dataToSend.changes).to.deep.equal([]);
          done();
        })
        .catch((e) => {
          done(e);
        });
  });

  it('should add the changes from the client to the specified tables and the changes table', (done) => {
    const create = {
      type: CREATE,
      obj: { foo: 'bar' },
      key: 1,
      table: 'foo',
    };
    handler({ changes: [create], requestId: 1, baseRevision: null, syncedRevision: null })
        .then((dataToSend) => {
          if (!dataToSend.success) {
            throw new Error(dataToSend.errorMessage);
          }
          // We received no server changes but we got the latest db.revision
          // for the next sync call
          expect(dataToSend.currentRevision).to.equal(1);
          expect(db.meta.tables).to.deep.equal(['foo']);

          return new Promise((resolve, reject) => {
            db.changesTable.store.find({}, (err, docs) => {
              if (err) {
                reject(err);
              }
              resolve(docs);
            });
          });
        })
        .then((docs) => {
          expect(docs.length).to.equal(1);
          expect(docs[0].rev).to.equal(1);
          expect(docs[0].obj).to.deep.equal({ foo: 'bar' });

          return new Promise((resolve, reject) => {
            db.tables.get('foo').store.find({}, (err, docs) => {
              if (err) {
                reject(err);
              }
              resolve(docs);
            });
          });
        })
        .then((docs) => {
          expect(docs.length).to.equal(1);
          expect(docs[0]).to.deep.equal({ foo: 'bar', _id: 1 });
          done();
        })
        .catch((e) => {
          done(e);
        });
  });

  it('should return all server changes to the client when no revision is given', (done) => {
    const create = {
      rev: 1,
      type: CREATE,
      obj: { foo: 'bar' },
      key: 1,
      table: 'foo',
    };
    db.addChangesData(create)
        .then(() => handler({ changes: [], requestId: 1, baseRevision: null, syncedRevision: null }))
        .then((dataToSend) => {
          if (!dataToSend.success) {
            throw new Error(dataToSend.errorMessage);
          }
          expect(dataToSend.changes.length).to.equal(1);
          expect(dataToSend.changes[0]).to.deep.equal({
            type: create.type,
            obj: create.obj,
            key: create.key,
            table: create.table,
          });
          done();
        })
        .catch((e) => {
          done(e);
        });
  });
});
