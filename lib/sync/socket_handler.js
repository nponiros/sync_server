'use strict';

const getServerChanges = require('./get_server_changes');
const _handleClientChanges = require('./handle_client_changes');

function initSocketHandler(db, logger, opts) {
  // connID to callback
  const subscriptions = new Map();
  const connToClientIdentity = new Map();

  function initSendChangesBackToClient(cb, clientIdentity) {
    return function sendChangesBackToClient(syncedRevision) {
      return getServerChanges(db, syncedRevision, clientIdentity, opts.partialsThreshold)
          .then(({ changes, partial }) => ({
            changes,
            partial,
            currentRevision: db.getRevision(),
          }))
          .then((data) => {
            // Update client revision to the latest revision
            db.setClientRevision(clientIdentity, data.currentRevision);
            // will send 'changes' to the client
            cb({ succeeded: true, data });
            // We had partial data -> try to send the rest to client
            if (data.partial) {
              return sendChangesBackToClient(syncedRevision);
            }
          })
          .catch((err) => {
            // will send 'error' to client
            logger.file.error(err.name, err.message);
            logger.console.error(err.name, err.message);
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
          subscriptions.get(connID)(db.getClientRevision(clientIdentity));
        });
  }

  // will send 'clientIdentity' to the client
  function handleInitialization(connID, { clientIdentity }) {
    let clientID = clientIdentity;
    if (!clientID) {
      clientID = db.getNextClientID();
    }

    connToClientIdentity.set(connID, clientID);

    return Promise.resolve({ clientIdentity: clientID });
  }

  function handleSubscribe(connID, { syncedRevision = 0 }, cb) {
    const clientIdentity = connToClientIdentity.get(connID);
    const sendChangesToClient = initSendChangesBackToClient(cb, clientIdentity);
    subscriptions.set(connID, sendChangesToClient);
    return sendChangesToClient(syncedRevision);
  }

  function handleClientChanges(connID, { baseRevision = 0, changes, partial = false, requestId }) {
    // Any client changes updates the db revision
    const nextRevision = db.getRevision() + 1;
    db.setRevision(nextRevision);

    const clientIdentity = connToClientIdentity.get(connID);

    // Will send 'ack' to client
    return _handleClientChanges(db, baseRevision, nextRevision, partial, clientIdentity, changes)
        .then(() => {
          sendChangesBackToClients(clientIdentity);
        })
        // will send 'ack' to client
        .then(() => ({
          succeeded: true,
          data: { requestId },
        }))
        .catch((err) => {
          // will send 'error' to client
          logger.file.error(err.name, err.message);
          logger.console.error(err.name, err.message);
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
  };
}

module.exports = initSocketHandler;
