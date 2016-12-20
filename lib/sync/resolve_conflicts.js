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
const { CREATE, UPDATE, DELETE } = require('./types');

module.exports = function resolveConflicts(clientChanges, serverChangeSet) {
  const resolved = [];
  clientChanges
    .forEach((clientChange) => {
      const id = `${clientChange.table}:${clientChange.key}`;
      const serverChange = serverChangeSet[id];
      if (!serverChange) {
        // No server change on same object. Totally conflict free!
        resolved.push(clientChange);
      } else if (serverChange.type === UPDATE) {
        // Server change overlaps.
        // Only if server change is not CREATE or DELETE, we should consider merging in the client change.
        switch (clientChange.type) {
          case CREATE:
            // Server has updated an object with same key as client has recreated.
            // Let the client recreation go through, but also apply server modifications.
            // No need to clone clientChange.obj before applying modifications
            // since no one else refers the clientChanges (it was retrieved from the current request)
            applyModifications(clientChange.obj, serverChange.mods);
            resolved.push(clientChange);
            break;
          case UPDATE:
            // Server and client has updated the same object.
            // Just remove any overlapping keyPaths and only apply non-conflicting parts.
            Object
              .keys(serverChange.mods)
              .forEach((keyPath) => {
                // Remove this property from the client change
                Reflect.deleteProperty(clientChange.mods, keyPath);
                // Also, remove all changes to nested objects under this keyPath from the client change:
                Object
                  .keys(clientChange.mods)
                  .forEach((clientKeyPath) => {
                    if (clientKeyPath.indexOf(keyPath + '.') === 0) {
                      Reflect.deleteProperty(clientChange.mods, clientKeyPath);
                    }
                  });
              });
            // Did we delete all keyPaths in the modification set of the clientChange?
            if (Object.keys(clientChange.mods).length > 0) {
              // No, there were some still there. Let this wing-clipped change be applied:
              resolved.push(clientChange);
            }
            break;
          case DELETE:
            // Delete always win over update. Even client over a server
            resolved.push(clientChange);
            break;
        }
      } // else if serverChange.type is CREATE or DELETE, don't push anything to resolved,
      // because the client change is not of any interest
      // (CREATE or DELETE would eliminate any client change with the same key!)
    });
  return resolved;
};
