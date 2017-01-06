'use strict';

/*
 * License:
 * The contents of this file were copied from
 * https://github.com/dfahlander/Dexie.js/blob/master/samples/remote-sync/websocket/WebSocketSyncServer.js
 * and are under the Apache 2 License.
 *
 * The code was modified to improve readability and to make it work with an asynchronous database.
 */

const applyClientChanges = require('./apply_client_changes');
const getServerChanges = require('./get_server_changes');

function initPollHandler(db, logger, opts) {
  return function handler({
      baseRevision = 0,
      changes,
      clientIdentity,
      syncedRevision = 0,
      requestId,
      partial = false,
  }) {
    const nextRevision = db.getRevision() + 1;
    db.setRevision(nextRevision);

    let clientID = clientIdentity;
    if (!clientID) {
      clientID = db.getNextClientID();
    }

    if (partial) {
      return db.uncommittedChanges
          .update(clientID, changes)
          .then(() => {
            return getServerChanges(db, syncedRevision, nextRevision, clientID, opts.partialsThreshold);
          })
          .then((changesToSend) => {
            db.setClientRevision(clientID, nextRevision);
            return Object.assign({}, changesToSend, { success: true, requestId });
          })
          .catch((err) => {
            logger.file.error(err.name, err.message);
            logger.console.error(err.name, err.message);
            return {
              success: false,
              requestId,
              errorMessage: err.message,
            };
          });
    }
    return db.uncommittedChanges
        .get(clientIdentity)
        .then((uncommittedChangesObj) => {
          return applyClientChanges(
              db,
              baseRevision,
              nextRevision,
              [...uncommittedChangesObj.changes, ...changes],
              clientID
          );
        })
        .then(() => {
          return getServerChanges(db, syncedRevision, nextRevision, clientID, opts.partialsThreshold);
        })
        .then(({ changes, partial }) => ({
          changes,
          partial,
          // Notice the current revision of the database.
          // We want to send it to client so it knows what to ask for next time.
          currentRevision: nextRevision,
          clientIdentity: clientID,
        }))
        .then((changesToSend) => {
          db.setClientRevision(clientID, nextRevision);
          return Object.assign({}, changesToSend, { success: true, requestId });
        })
        .catch((err) => {
          logger.file.error(err.name, err.message);
          logger.console.error(err.name, err.message);
          return {
            success: false,
            requestId,
            errorMessage: err.message,
          };
        });
  };
}

module.exports = initPollHandler;
