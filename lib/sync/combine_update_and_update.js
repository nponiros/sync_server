'use strict';

/*
 * License:
 * The contents of this file were copied from
 * https://github.com/dfahlander/Dexie.js/blob/master/samples/remote-sync/websocket/WebSocketSyncServer.js
 * and are under the Apache 2 License.
 *
 * The code was modified to improve readability.
 */

const setByKeyPath = require('./set_key_path');
const deepClone = require('./deep_clone');

module.exports = function combineUpdateAndUpdate(prevChange, nextChange) {
  // Clone object before modifying since the earlier change in db.changes[] would otherwise be altered.
  const clonedChange = deepClone(prevChange);
  Object
    .keys(nextChange.mods)
    .forEach((keyPath) => {
      // If prev-change was changing a parent path of this keyPath,
      // we must update the parent path rather than adding this keyPath
      let hadParentPath = false;
      Object
        .keys(prevChange.mods)
        .filter((parentPath) => keyPath.indexOf(parentPath + '.') === 0)
        .forEach((parentPath) => {
          setByKeyPath(
            clonedChange.mods[parentPath],
            keyPath.substr(parentPath.length + 1),
            nextChange.mods[keyPath]
          );
          hadParentPath = true;
        });
      if (!hadParentPath) {
        // Add or replace this keyPath and its new value
        clonedChange.mods[keyPath] = nextChange.mods[keyPath];
      }
      // In case prevChange contained sub-paths to the new keyPath,
      // we must make sure that those sub-paths are removed since
      // we must mimic what would happen if applying the two changes after each other:
      Object
        .keys(prevChange.mods)
        .filter((subPath) => subPath.indexOf(keyPath + '.') === 0)
        .forEach((subPath) => {
          Reflect.deleteProperty(clonedChange.mods, subPath);
        });
    });
  return clonedChange;
};
