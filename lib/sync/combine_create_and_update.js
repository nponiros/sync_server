'use strict';

/*
 * License:
 * The contents of this file were copied from
 * https://github.com/dfahlander/Dexie.js/blob/master/samples/remote-sync/websocket/WebSocketSyncServer.js
 * and are under the Apache 2 License.
 *
 * The code was modified to improve readability.
 */

const applyModifications = require('./apply_modifications');
const deepClone = require('./deep_clone');

module.exports = function combineCreateAndUpdate(prevChange, nextChange) {
  // Clone object before modifying since the earlier change in db.changes[] would otherwise be altered.
  const clonedChange = deepClone(prevChange);
  applyModifications(clonedChange.obj, nextChange.mods); // Apply modifications to existing object.
  return clonedChange;
};
