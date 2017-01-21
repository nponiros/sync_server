'use strict';

/*
 * License:
 * The contents of this file were copied from
 * https://github.com/dfahlander/Dexie.js/blob/master/samples/remote-sync/websocket/WebSocketSyncServer.js
 * and are under the Apache 2 License.
 *
 * The code was modified to improve readability and to make it work with an asynchronous database.
 */

const reduceChanges = require('./reduce_changes');

// Attention: the changes array myst be sorted ascending by revision
function getServerChanges(db, syncedRevision, clientIdentity, partialsThreshold, currentDBRevision) {
  // Get all changes after syncedRevision that was not performed by the client we're talking to.
  return db.getChangesData(syncedRevision, clientIdentity)
      // Compact changes so that multiple changes on same object are merged into a single change.
      .then((changes) => reduceChanges(changes))
      // Convert the reduced set into an array again.
      .then((reducedChangeSet) => Object.keys(reducedChangeSet).map((key) => reducedChangeSet[key]))
      .then((reducedArray) => {
        if (reducedArray.length > partialsThreshold) {
          const changesToSend = reducedArray.slice(0, partialsThreshold);
          return {
            changes: changesToSend,
            partial: true,
          };
        }
        return {
          changes: reducedArray,
          partial: false,
        };
      })
      .then(({ changes, partial }) => ({
        changes,
        partial,
        // Save the last revision for which the client will receive changes
        // so the the next time it gets changes with a larger revision
        // If we have no new changes the return the current db revision
        // This allows use to skip our changes the next time we try to apply client changes
        currentRevision: changes[changes.length - 1] ? changes[changes.length - 1].rev : currentDBRevision.rev,
      }))
      .then(({ changes, partial, currentRevision }) => ({
        changes: changes.map((change) => {
          // Don't send 'rev' back to client
          Reflect.deleteProperty(change, 'rev');
          return change;
        }),
        partial,
        currentRevision,
      }));
}

module.exports = getServerChanges;
