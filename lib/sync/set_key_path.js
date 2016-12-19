'use strict';

/*
 * License:
 * The contents of this file were copied from
 * https://github.com/dfahlander/Dexie.js/blob/master/samples/remote-sync/websocket/WebSocketSyncServer.js
 * and are under the Apache 2 License.
 *
 * The code was modified to improve readability.
 */

module.exports = function setByKeyPath(obj, keyPath, value) {
  if (!obj || typeof keyPath !== 'string') {
    return;
  }
  const period = keyPath.indexOf('.');
  if (period !== -1) {
    const currentKeyPath = keyPath.substr(0, period);
    const remainingKeyPath = keyPath.substr(period + 1);
    if (remainingKeyPath === '') {
      obj[currentKeyPath] = value;
    } else {
      let innerObj = obj[currentKeyPath];
      if (!innerObj) {
        innerObj = (obj[currentKeyPath] = {});
      }
      setByKeyPath(innerObj, remainingKeyPath, value);
    }
  } else {
    obj[keyPath] = value;
  }
};
