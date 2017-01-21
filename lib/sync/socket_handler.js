'use strict';

const getServerChanges = require('./get_server_changes');
const _handleClientChanges = require('./handle_client_changes');

function initSocketHandler(db, logger, opts, currentDBRevision) {
  // connID to callback
  const subscriptions = new Map();
  const connToClientIdentity = new Map();
  const clientIDToRevision = new Map();

  function initSendChangesBackToClient(cb, clientIdentity) {
    return function sendChangesBackToClient(syncedRevision) {
      return getServerChanges(db, syncedRevision, clientIdentity, opts.partialsThreshold, currentDBRevision)
          .then((data) => {
            // Update client revision to the latest revision
            clientIDToRevision.set(clientIdentity, data.currentRevision);
            // will send 'changes' to the client
            cb({ succeeded: true, data });
            // We had partial data -> try to send the rest to client
            if (data.partial) {
              return sendChangesBackToClient(data.currentRevision);
            }
            const msg = `Send data: clientIdentity: ${clientIdentity}`;
            logger.file.info(msg);
            logger.console.info(msg);
          })
          .catch((err) => {
            // will send 'error' to
            const msg = `clientIdentity: ${clientIdentity}. Error: ${err.name} ${err.message}`;
            logger.file.error(msg, err.stack);
            logger.console.error(msg);
            cb({
              succeeded: false,
              data: {
                errorMessage: err.message,
              },
            });
          });
    };
  }

  function sendChangesBackToClients(currentClientIdentity) {
    const entries = connToClientIdentity.entries();
        // Don't send changes back to the client which actually caused the changes
    [...entries]
        .filter(([connID, clientIdentity]) => clientIdentity !== currentClientIdentity)
        .forEach(([connID, clientIdentity]) => {
          subscriptions.get(connID)(clientIDToRevision.get(clientIdentity));
        });
  }

  // will send 'clientIdentity' to the client
  function handleInitialization(connID, { clientIdentity }) {
    let promise;
    if (clientIdentity) {
      promise = Promise.resolve(clientIdentity);
    } else {
      promise = db.getNextClientID();
    }

    return promise.then((clientID) => {
      connToClientIdentity.set(connID, clientID);
      return {
        succeeded: true,
        data: { clientIdentity: clientID },
      };
    });
  }

  function handleSubscribe(connID, { syncedRevision }, cb) {
    const clientIdentity = connToClientIdentity.get(connID);
    const sendChangesToClient = initSendChangesBackToClient(cb, clientIdentity);
    subscriptions.set(connID, sendChangesToClient);

    // Syncable sends null the first time. We can't use default parameters for this
    syncedRevision = syncedRevision || 0;

    const msg = `Subscribe: clientIdentity: ${clientIdentity}`;
    logger.file.info(msg);
    logger.console.info(msg);

    return sendChangesToClient(syncedRevision);
  }

  function handleClientChanges(connID, { baseRevision, changes, partial = false, requestId }) {
    const clientIdentity = connToClientIdentity.get(connID);

    // Syncable sends null the first time. We can't use default parameters for this
    baseRevision = baseRevision || 0;

    const msg = `clientIdentity: ${clientIdentity}. requestId: ${requestId}`;
    logger.file.info(msg);
    logger.console.info(msg);

    // Will send 'ack' to client
    return _handleClientChanges(db, baseRevision, currentDBRevision, partial, clientIdentity, changes)
        .then(() => {
          sendChangesBackToClients(clientIdentity);
        })
        // will send 'ack' to client
        .then(() => ({
          succeeded: true,
          data: { requestId },
        }))
        .catch((err) => {
          const errorMsg = `clientIdentity: ${clientIdentity}.
requestId: ${requestId}. Error: ${err.name} ${err.message}`;
          logger.file.error(errorMsg);
          logger.console.error(errorMsg);
          // will send 'error' to client
          return {
            succeeded: false,
            data: {
              errorMessage: err.message,
              requestId,
            },
          };
        });
  }

  function handleConnectionClosed(connID) {
    const msg = `Connection closed: clientIdentity: ${connToClientIdentity.get(connID)}`;
    logger.file.info(msg);
    logger.console.info(msg);

    subscriptions.delete(connID);
    connToClientIdentity.delete(connID);
  }

  return {
    handleInitialization,
    handleSubscribe,
    handleClientChanges,
    handleConnectionClosed,
    // Used for testing
    _connToClientIdentity: connToClientIdentity,
    _subscriptions: subscriptions,
    _clientIDToRevision: clientIDToRevision,
  };
}

module.exports = initSocketHandler;
