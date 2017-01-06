'use strict';

const ws = require('nodejs-websocket');

const handlers = require('./handlers');
const printInterfaces = require('../print_interfaces');

const counter = 0;
function getConnectionID() {
  return counter + 1;
}

function startSocketServer({
  logger,
  syncHandler,
  settings,
}) {
  function connect(conn) {
    const socketHandler = syncHandler(sendData);
    conn.id = getConnectionID();

    conn.on('text', (message) => {
      const request = JSON.parse(message);

      if (request.type === 'initialize') {
        handlers.handleInitialization(conn, socketHandler, request);
      } else if (request.type === 'subscribe') {
        handlers.handleSubscribe(conn, socketHandler, request);
      } else if (request.type === 'changes') {
        handlers.handleClientChanges(conn, socketHandler, request);
      }
    });

    conn.on('error', () => {
      // TODO: logging
    });

    conn.on('close', () => {
      // TODO: logging
      socketHandler.handleConnectionClosed();
    });
  }
  ws.createServer(connect).listen(settings.port, () => {
    printInterfaces(logger, settings.protocol, settings.port);
  });
}

module.exports = startSocketServer;


