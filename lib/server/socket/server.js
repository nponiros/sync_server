'use strict';

const ws = require('nodejs-websocket');
const fs = require('fs');
const path = require('path');

const handlers = require('./handlers');
const printInterfaces = require('../print_interfaces');

let counter = 0;
function getConnectionID() {
  counter = counter + 1;
  return counter;
}

function startSocketServer({
  logger,
  syncHandler,
  settings,
  dataPath,
}) {
  function connect(conn) {
    const socketHandler = syncHandler;
    conn.id = getConnectionID();
    logger.file.info(`New connection. Connection ID ${conn.id}`);
    logger.console.info(`New connection. Connection ID ${conn.id}`);

    conn.on('text', (message) => {
      const request = JSON.parse(message);

      if (request.type === 'clientIdentity') {
        handlers.handleInitialization(conn, socketHandler, request);
      } else if (request.type === 'subscribe') {
        handlers.handleSubscribe(conn, socketHandler, request);
      } else if (request.type === 'changes') {
        handlers.handleClientChanges(conn, socketHandler, request);
      }
    });

    conn.on('error', (err) => {
      logger.file.error(conn.id, err.name, err.message);
      logger.console.error(conn.id, err.name, err.message);
    });

    conn.on('close', (code, reason) => {
      socketHandler.handleConnectionClosed(conn.id);
      logger.file.info(conn.id, reason);
      logger.console.info(conn.id, code, reason);
    });
  }

  if (settings.protocol === 'ws') {
    ws.createServer(connect).listen(settings.port, () => {
      printInterfaces(logger, settings.protocol, settings.port);
    });
  } else {
    const wssSettings = settings.wss;
    if (!wssSettings) {
      throw new Error('WSS configuration is missing');
    }
    const wssOptions = Object
        .keys(wssSettings)
        .reduce((opts, key) => Object.assign(
            opts,
            { secure: true }, // needed by nodejs-websocket
            { [key]: fs.readFileSync(path.join(dataPath, wssSettings[key])) }
        ));

    ws.createServer(connect, wssOptions).listen(settings.port, () => {
      printInterfaces(logger, settings.protocol, settings.port);
    });
  }
}

module.exports = startSocketServer;

