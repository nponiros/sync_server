'use strict';

/*
 * License:
 * The contents of this file were copied from
 * https://github.com/dfahlander/Dexie.js/blob/master/samples/remote-sync/websocket/WebSocketSyncServer.js
 * and are under the Apache 2 License.
 *
 * The code was modified to improve readability.
 */

const { CREATE, UPDATE, DELETE } = require('./types');
const combineCreateAndUpdate = require('./combine_create_and_update');
const combineUpdateAndUpdate = require('./combine_update_and_update');

function reduceCreateChange(prevChange, nextChange) {
  switch (nextChange.type) {
    case CREATE:
      return nextChange; // Another CREATE replaces previous CREATE.
    case UPDATE:
      return combineCreateAndUpdate(prevChange, nextChange); // Apply nextChange.mods into prevChange.obj
    case DELETE:
      // Object created and then deleted. If it wasn't for that we MUST handle resent changes,
      // we would skip the entire change here. But what if the CREATE was sent earlier,
      // and then CREATE/DELETE at a later stage?
      // It would become a ghost object in the DB. Therefore, we MUST keep the delete change!
      // If object doesn't exist, it wont harm!
      return nextChange;
  }
}

function reduceUpdateChange(prevChange, nextChange) {
  switch (nextChange.type) {
    case CREATE:
      return nextChange; // Another CREATE replaces previous update.
    case UPDATE:
      // Add the additional modifications to existing modification map.
      return combineUpdateAndUpdate(prevChange, nextChange);
    case DELETE:
      return nextChange; // Only send the delete change. What was updated earlier is no longer of interest.
  }
}

function reduceDeleteChange(prevChange, nextChange) {
  switch (nextChange.type) {
    case CREATE:
      return nextChange; // A resurrection occurred. Only create change is of interest.
    case UPDATE:
      return prevChange; // Nothing to do. We cannot update an object that doesn't exist. Leave the delete change there.
    case DELETE:
      return prevChange; // Still a delete change. Leave as is.
  }
}

const actions = {
  [CREATE]: reduceCreateChange,
  [UPDATE]: reduceUpdateChange,
  [DELETE]: reduceDeleteChange,
};

module.exports = function reduceChanges(changes) {
  // Converts an Array of change objects to a set of change objects based on its unique combination of (table ":" key).
  // If several changes were applied to the same object, the resulting set will only contain one change for that object.
  return changes.reduce((map, nextChange) => {
    const id = `${nextChange.table}:${nextChange.key}`;
    const prevChange = map[id];
    if (!prevChange) {
      // This is the first change on this key.
      map[id] = nextChange;
    } else {
      // Merge the oldchange with the new change
      map[id] = actions[prevChange.type](prevChange, nextChange);
    }
    return map;
  }, {});
};
