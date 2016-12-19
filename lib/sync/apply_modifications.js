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

module.exports = function applyModifications(obj, modifications) {
  Object
    .keys(modifications)
    .forEach((keyPath) => {
      setByKeyPath(obj, keyPath, modifications[keyPath]);
    });
  return obj;
};
