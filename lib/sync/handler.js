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

function initHandler(db, logger) {
  return function handler({
      baseRevision = 0,
      changes,
      clientIdentity,
      syncedRevision = 0,
      requestId,
  }) {
    const nextRevision = db.getRevision() + 1;
    db.setRevision(nextRevision);

    let clientID = clientIdentity;
    if (!clientID) {
      clientID = db.getNextClientID();
    }

    return applyClientChanges(db, baseRevision, nextRevision, changes, clientID)
      .then(() => {
        return getServerChanges(db, syncedRevision, nextRevision, clientID);
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
  };
}

module.exports = initHandler;