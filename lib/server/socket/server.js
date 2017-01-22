'use strict';

const ws = require('nodejs-websocket');

const handlers = require('./handlers');
const printInterfaces = require('../print_interfaces');

const readCertificates = require('../read_certificates');

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
      logger.file.error(conn.id, err.name, err.message, err.stack);
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

    // { secure: true } needed by nodejs-websocket
    const wssOptions = Object.assign({ secure: true }, wssSettings, readCertificates(dataPath, wssSettings));

    ws.createServer(connect, wssOptions).listen(settings.port, () => {
      printInterfaces(logger, settings.protocol, settings.port);
    });
  }
}

module.exports = startSocketServer;

