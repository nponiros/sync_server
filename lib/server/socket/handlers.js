'use strict';

function sendData(conn, data) {
  conn.sendText(JSON.stringify(data));
}

/*
 * Inform other clients when we get a change from some client
 */
function reactToChanges(conn) {
  return function ({ succeeded, data }) {
    const type = { type: succeeded ? 'changes' : 'error' };
    sendData(conn, Object.assign({}, data, type));
  };
}

function handleSubscribe(conn, socketHandler, request) {
  // 'subscribe' event with syncedRevision. Return 'changes' with server changes
  socketHandler
    .handleSubscribe(conn.id, request, reactToChanges(conn));
}

function handleInitialization(conn, socketHandler, request) {
  socketHandler
    .handleInitialization(conn.id, request)
    .then(({ succeeded, data }) => {
      const type = { type: succeeded ? 'clientIdentity' : 'error' };
      return sendData(conn, Object.assign({}, data, type));
    });
}

function handleClientChanges(conn, socketHandler, request) {
  socketHandler
    .handleClientChanges(conn.id, request)
    .then(({ succeeded, data }) => {
      const type = { type: succeeded ? 'ack' : 'error' };
      return sendData(conn, Object.assign({}, data, type));
    });
}

module.exports = {
  handleInitialization,
  handleClientChanges,
  handleSubscribe,
};
