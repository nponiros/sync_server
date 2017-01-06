function sendData(data) {
  conn.sendText(JSON.stringify(data));
}

/*
 * Inform other clients when we get a change from some client
 */
function reactToChanges(conn) {
  return function (data) {
    sendData(
      conn,
      Object.assign({}, data, {type: 'changes'})
    );
  }
}

function handleSubscribe(conn, socketHandler, request) {
  // 'subscribe' event with syncedRevision. Return 'changes' with server changes
  socketHandler
    .handleSubscribe(conn.id, request, reactToChanges(conn))
    .then((data) => {
      return sendData(
          conn,
          Object.assign({}, data, {type: 'changes'})
      );
    })
    .catch((e) => {
      // TODO need handling for this
      console.error(e);
    });
}

function handleInitialization(conn, socketHandler, request) {
  socketHandler
    .handleInitialization(conn.id, request)
    .then((data) => {
      return sendData(
          conn,
          Object.assign({}, data, {type: 'initialization'})
      );
    })
    .catch((e) => {
      // TODO need handling for this
      console.error(e);
    });
}

function handleClientChanges(conn, socketHandler, request) {
  socketHandler
    .handleClientChanges(conn.id, request)
    .then((data) => {
      return sendData(
          conn,
          Object.assign({}, data, {type: 'ack'})
      );
    })
    .catch((e) => {
      // TODO need handling for this
      console.error(e);
    });
}

module.exports = {
  handleInitialization,
  handleClientChanges,
  handleSubscribe,
};
