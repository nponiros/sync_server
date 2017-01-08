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
const resolveConflicts = require('./resolve_conflicts');
const applyModifications = require('./apply_modifications');
const { CREATE, UPDATE, DELETE } = require('./types');

// Current revision will be incremented for each change
function applyClientChanges(db, baseRevision, currentRevision, clientChanges, clientIdentity) {
  function handleCreate(change) {
    return db.addData(change.table, change.key, change.obj)
      .then(() => {
        return db.addChangesData({
          rev: ++currentRevision.rev,
          source: clientIdentity,
          type: CREATE,
          table: change.table,
          key: change.key,
          obj: change.obj,
        });
      });
  }

  function handleUpdate(change) {
    return db.getData(change.table, change.key)
      .then((data) => {
        if (data) {
          applyModifications(data, change.mods);
          return db.updateData(change.table, change.key, data)
            .then(() => {
              return db.addChangesData({
                rev: ++currentRevision.rev,
                source: clientIdentity,
                type: UPDATE,
                table: change.table,
                key: change.key,
                mods: change.mods,
              });
            });
        }
        return Promise.resolve();
      });
  }

  function handleDelete(change) {
    return db.getData(change.table, change.key)
      .then((data) => {
        if (data) {
          return db.removeData(change.table, change.key)
            .then(() => {
              return db.addChangesData({
                rev: ++currentRevision.rev,
                source: clientIdentity,
                type: DELETE,
                table: change.table,
                key: change.key,
              });
            });
        }
        return Promise.resolve();
      });
  }

  const actions = {
    [CREATE]: handleCreate,
    [UPDATE]: handleUpdate,
    [DELETE]: handleDelete,
  };

  // ----------------------------------------------
  // HERE COMES THE QUITE IMPORTANT SYNC ALGORITHM!
  //
  // 1. Reduce all server changes (not client changes) that have occurred after given
  //    baseRevision (our changes) to a set (key/value object where key is the combination of table/primaryKey)
  // 2. Check all client changes against reduced server
  //    changes to detect conflict. Resolve conflicts:
  //      If server created an object with same key as client creates, updates or deletes: Always discard client change.
  //      If server deleted an object with same key as client creates, updates or deletes: Always discard client change.
  //      If server updated an object with same key as client updates:
  //        Apply all properties the client updates unless they conflict with server updates
  //      If server updated an object with same key as client creates:
  // Apply the client create but apply the server update on top
  //      If server updated an object with same key as client deletes: Let client win. Deletes always wins over Updates.
  //
  // 3. After resolving conflicts, apply client changes into server database.
  // 4. Send an ack to the client that we have persisted its changes
  // ----------------------------------------------

  return db.getChangesData(baseRevision)
    .then((serverChanges) => reduceChanges(serverChanges))
    .then((reducedServerChangeSet) => resolveConflicts(clientChanges, reducedServerChangeSet))
    .then((resolved) => {
      const promises = resolved
        .map((change) => actions[change.type](change));
      return Promise.all(promises);
    });
}

module.exports = applyClientChanges;
