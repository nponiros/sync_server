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

// Server reply for a successful change application
// syncedRevision: Used when sending changes to client.
// Only send changes above syncedRevision since client is already in sync with syncedRevision.
function getServerChanges(db, syncedRevision, nextRevision, clientIdentity) {
  // Get all changes after syncedRevision that was not performed by the client we're talking to.
  return db.getChangesData(syncedRevision, clientIdentity)
    // Compact changes so that multiple changes on same object are merged into a single change.
    .then((changes) => reduceChanges(changes))
    // Convert the reduced set into an array again.
    .then((reducedChangeSet) => Object.keys(reducedChangeSet).map((key) => reducedChangeSet[key]))
    .then((reducedArray) => ({
      changes: reducedArray,
      // Notice the current revision of the database.
      // We want to send it to client so it knows what to ask for next time.
      currentRevision: nextRevision,
      clientIdentity,
    }));
}

module.exports = getServerChanges;
