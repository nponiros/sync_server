'use strict';

const chakram = require('chakram');
const expect = chakram.expect;

const applyClientChanges = require('../../../lib/sync/apply_client_changes');
const Db = require('../../../lib/db_connectors/NeDB/db');
const { CREATE, UPDATE, DELETE } = require('../../../lib/sync/types');

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

describe('applyClientChanges', () => {
  let db;

  beforeEach(() => {
    db = new Db({ inMemoryOnly: true }, logger);
  });

  function expectWrapper(done, fn) {
    try {
      fn();
    } catch (e) {
      done(e);
    }
  }

  describe('CREATE', () => {
    it('should add the given client data to the given table', (done) => {
      const create = {
        type: CREATE,
        obj: { foo: 'bar' },
        key: 1,
        table: 'foo',
      };
      db.addData('foo', 3, {})
        .then(() => {
          applyClientChanges(db, 0, 1, [create], 1)
              .then(() => {
                db.getData('foo', 1)
                    .then((data) => {
                      expectWrapper(done, () => {
                        expect(data).to.deep.equal(create.obj);
                        done();
                      });
                    });
              });
        });
    });

    it('should add the change object to the changes table', (done) => {
      const create = {
        type: CREATE,
        obj: { foo: 'bar' },
        key: 1,
        table: 'foo',
      };
      const clientID = 1;
      const nextRevision = 1;
      applyClientChanges(db, 0, nextRevision, [create], clientID)
          .then(() => {
            db.changesTable.store.find({}, (err, data) => {
              if (err) {
                done(err);
              }
              expectWrapper(done, () => {
                expect(data[0].type).to.equal(CREATE);
                expect(data[0].obj).to.deep.equal(create.obj);
                expect(data[0].rev).to.equal(nextRevision);
                expect(data[0].source).to.equal(clientID);
                done();
              });
            });
          });
    });
  });

  describe('UPDATE', () => {
    it('shouldn\'t add a change if the given table does not exist', (done) => {
      const update = {
        type: UPDATE,
        table: 'foo',
        key: 2,
        mods: { foo: 'bar' },
      };
      const clientID = 1;
      const nextRevision = 1;
      applyClientChanges(db, 0, nextRevision, [update], clientID)
          .then(() => {
            db.changesTable.store.count({}, (err, count) => {
              if (err) {
                done(err);
              }
              expectWrapper(done, () => {
                expect(count).to.equal(0);
                done();
              });
            });
          });
    });

    it('shouldn\'t add a change if the given object key does not exist', (done) => {
      const update = {
        type: UPDATE,
        table: 'foo',
        key: 2,
        mods: { foo: 'bar' },
      };
      const clientID = 1;
      const nextRevision = 1;
      // Create table
      db.addData('foo', 3, {})
          .then(() => {
            applyClientChanges(db, 0, nextRevision, [update], clientID)
                .then(() => {
                  db.changesTable.store.count({}, (err, count) => {
                    if (err) {
                      done(err);
                    }
                    expectWrapper(done, () => {
                      expect(count).to.equal(0);
                      done();
                    });
                  });
                });
          });
    });

    it('should merge the given object with the object in the db and save it', (done) => {
      const update = {
        type: UPDATE,
        table: 'foo',
        key: 2,
        mods: { foo: 'bar' },
      };
      const clientID = 1;
      const nextRevision = 1;
      // Create table
      db.addData('foo', 2, { bar: 'bar' })
          .then(() => {
            applyClientChanges(db, 0, nextRevision, [update], clientID)
                .then(() => {
                  db.getData('foo', 2)
                      .then((data) => {
                        expectWrapper(done, () => {
                          expect(data).to.deep.equal({ foo: 'bar', bar: 'bar' });
                          done();
                        });
                      });
                });
          });
    });

    it('should add the change to the changes table', (done) => {
      const update = {
        type: UPDATE,
        table: 'foo',
        key: 2,
        mods: { foo: 'bar' },
      };
      const clientID = 1;
      const nextRevision = 1;
      // Create table
      db.addData('foo', 2, {})
          .then(() => {
            applyClientChanges(db, 0, nextRevision, [update], clientID)
                .then(() => {
                  db.changesTable.store.find({}, (err, data) => {
                    if (err) {
                      done(err);
                    }
                    expectWrapper(done, () => {
                      expect(data.length).to.equal(1);
                      expect(data[0].type).to.equal(UPDATE);
                      expect(data[0].mods).to.deep.equal(update.mods);
                      expect(data[0].rev).to.equal(nextRevision);
                      expect(data[0].source).to.equal(clientID);
                      done();
                    });
                  });
                });
          });
    });
  });

  describe('DELETE', () => {
    it('shouldn\'t add a change if the given table does not exist', (done) => {
      const remove = {
        type: DELETE,
        table: 'foo',
        key: 2,
      };
      const clientID = 1;
      const nextRevision = 1;
      applyClientChanges(db, 0, nextRevision, [remove], clientID)
          .then(() => {
            db.changesTable.store.count({}, (err, count) => {
              if (err) {
                done(err);
              }
              expectWrapper(done, () => {
                expect(count).to.equal(0);
                done();
              });
            });
          });
    });

    it('shouldn\'t add a change if the given object key does not exist', (done) => {
      const remove = {
        type: DELETE,
        table: 'foo',
        key: 2,
      };
      const clientID = 1;
      const nextRevision = 1;
      // Create table
      db.addData('foo', 3, {})
          .then(() => {
            applyClientChanges(db, 0, nextRevision, [remove], clientID)
                .then(() => {
                  db.changesTable.store.count({}, (err, count) => {
                    if (err) {
                      done(err);
                    }
                    expectWrapper(done, () => {
                      expect(count).to.equal(0);
                      done();
                    });
                  });
                });
          });
    });

    it('should delete the given object from the db', (done) => {
      const remove = {
        type: DELETE,
        table: 'foo',
        key: 2,
      };
      const clientID = 1;
      const nextRevision = 1;
      // Create table
      db.addData('foo', 2, { bar: 'bar' })
          .then(() => {
            applyClientChanges(db, 0, nextRevision, [remove], clientID)
                .then(() => {
                  db.getData('foo', 2)
                      .then((data) => {
                        expectWrapper(done, () => {
                          expect(data).to.be.null;
                          done();
                        });
                      });
                });
          });
    });

    it('should add the change to the changes table', (done) => {
      const remove = {
        type: DELETE,
        table: 'foo',
        key: 2,
      };
      const clientID = 1;
      const nextRevision = 1;
      // Create table
      db.addData('foo', 2, {})
          .then(() => {
            applyClientChanges(db, 0, nextRevision, [remove], clientID)
                .then(() => {
                  db.changesTable.store.find({}, (err, data) => {
                    if (err) {
                      done(err);
                    }
                    expectWrapper(done, () => {
                      expect(data.length).to.equal(1);
                      expect(data[0].type).to.equal(DELETE);
                      expect(data[0].rev).to.equal(nextRevision);
                      expect(data[0].source).to.equal(clientID);
                      done();
                    });
                  });
                });
          });
    });
  });
});
