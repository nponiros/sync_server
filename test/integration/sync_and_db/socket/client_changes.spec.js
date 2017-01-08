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

describe('Socket: Handle client changes', () => {
  let db;
  let handler;
  const connID1 = 1;
  const connID2 = 2;
  const clientIdentity1 = 11;
  const clientIdentity2 = 12;

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

  it('should get back the given requestId', (done) => {
    const requestId = 0;
    handler.handleInitialization(connID1, { clientIdentity: clientIdentity1 })
        .then(() => handler.handleSubscribe(connID1, { syncedRevision: 0 }, () => {
        }))
        .then(() => handler.handleClientChanges(connID1, { changes: [], requestId }))
        .then(({ data, succeeded }) => {
          if (!succeeded) {
            throw new Error(data.errorMessage);
          }
          expect(data.requestId).to.equal(requestId);
          done();
        })
        .catch((e) => {
          done(e);
        });
  });

  it('should get back any existing server changes', (done) => {
    const create = {
      rev: 1,
      type: CREATE,
      obj: { foo: 'bar' },
      key: 1,
      table: 'foo',
    };

    function cb({ data, succeeded }) {
      if (!succeeded) {
        return done(new Error(data.errorMessage));
      }

      try {
        expect(data.changes).to.deep.equal([{
          key: create.key,
          type: create.type,
          obj: create.obj,
          table: create.table,
        }]);
        expect(data.partial).to.equal(false);
        done();
      } catch (e) {
        done(e);
      }
    }

    db.addChangesData(create)
        .then(() => handler.handleInitialization(connID1, { clientIdentity: clientIdentity1 }))
        .then(() => handler.handleSubscribe(connID1, { syncedRevision: 0 }, cb))
        .then(() => handler.handleClientChanges(connID1, { changes: [] }))
        .catch((e) => {
          done(e);
        });
  });

  it('should trigger getServerChanges for other connections', (done) => {
    const create = {
      type: CREATE,
      obj: { foo: 'bar' },
      key: 1,
      table: 'fooa',
    };

    let callCounter1 = 0;

    function cb1() {
      // Make sure that the client that caused the changes gets not triggered
      if (callCounter1 === 1) {
        try {
          expect(false).to.equal(true);
        } catch (e) {
          done(e);
        }
      } else {
        callCounter1 = callCounter1 + 1;
      }
    }

    let callCounter2 = 0;

    function cb2({ succeeded, data }) {
      if (!succeeded) {
        return done(new Error(data.errorMessage));
      }

      if (callCounter2 === 1) {
        try {
          expect(data.changes).to.deep.equal([{
            key: create.key,
            type: create.type,
            obj: create.obj,
            table: create.table,
          }]);
          expect(data.partial).to.equal(false);
          done();
        } catch (e) {
          done(e);
        }
      } else {
        callCounter2 = callCounter2 + 1;
      }
    }

    handler.handleInitialization(connID1, { clientIdentity: clientIdentity1 })
        .then(() => handler.handleInitialization(connID2, { clientIdentity: clientIdentity2 }))
        .then(() => handler.handleSubscribe(connID1, { syncedRevision: 0 }, cb1))
        .then(() => handler.handleSubscribe(connID2, { syncedRevision: 0 }, cb2))
        .then(() => handler.handleClientChanges(connID1, { changes: [create] }))
        .catch((e) => {
          done(e);
        });
  });
});
