'use strict';

/*
 * License:
 * The contents of this file were copied from
 * https://github.com/dfahlander/Dexie.js/blob/master/samples/remote-sync/websocket/WebSocketSyncServer.js
 * and are under the Apache 2 License.
 *
 * The code was modified to improve readability and to make it work with an asynchronous database.
 */

const getServerChanges = require('./get_server_changes');
const handleClientChanges = require('./handle_client_changes');

function initPollHandler(db, logger, opts, currentDBRevision) {
  return function handler({
      baseRevision = 0,
      changes,
      clientIdentity,
      syncedRevision = 0,
      requestId,
      partial = false,
  }) {
    let promise;
    if (clientIdentity) {
      promise = Promise.resolve(clientIdentity);
    } else {
      promise = db.getNextClientID();
    }

    return promise.then((clientID) => {
      logger.file.info(`clientIdentity: ${clientID}, requestId: ${requestId}`);
      logger.console.info(`clientIdentity: ${clientID}, requestId: ${requestId}`);

      return handleClientChanges(db, baseRevision, currentDBRevision, partial, clientID, changes)
          .then(() => getServerChanges(db, syncedRevision, clientID, opts.partialsThreshold))
          .then(({ changes, partial, currentRevision }) => ({
            changes,
            partial,
            currentRevision,
            clientIdentity: clientID,
            success: true,
            requestId,
          }))
          .catch((err) => {
            const msg = `clientIdentity: ${clientID}. requestId: ${requestId}. Error: ${err.name} ${err.message}`;
            logger.file.error(msg);
            logger.console.error(msg);
            return {
              success: false,
              requestId,
              errorMessage: err.message,
            };
          });
    });
  };
}

module.exports = initPollHandler;
