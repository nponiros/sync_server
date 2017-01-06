'use strict';

const getServerChanges = require('./get_server_changes');
const applyClientChanges = require('./apply_client_changes');

const subscriptions = new Map();
const connToClientIdentity = new Map();

function initSocketHandler(db, logger, opts) {
  // TODO: revisions are messed up

  // TODO: syncedRevision
  // TODO: what to do if getServerChanges returns partial = true
  // TODO: poll server probably has to update clientRevision after we get the next request -> now we just assume that applying worked and that the client got changes
  function iniSendChangesBackToClient(cb, clientIdentity) {
    return function sendChangesBackToClient() {
      /*
       type: "changes",
       changes: reducedArray,
       currentRevision: currentRevision,
       partial: false
       */
      getServerChanges(db, syncedRevision, clientIdentity, opts.partialsThreshold)
          .then(({changes, partial}) => ({
            changes,
            partial,
          }))
          .then((data) => {
            // will send 'changes' to the client
            cb(data);
          });
    }
  }

  function sendChangesBackToClients(currentClientIdentity) {
    subscriptions
        .keys()
        // Don't send changes back to the client which actually caused the changes
        .filter((key) => key !== currentClientIdentity)
        .forEach(() => {
          subscriptions.get(key)();
        });
  }

  // will send 'initialize' to the client
  function handleInitialization(connID, { clientIdentity }) {
    let clientID = clientIdentity;
    if (!clientID) {
      clientID = db.getNextClientID();
    }
    connToClientIdentity.set(connID, clientID);

    return Promise.resolve(clientID);
  }

  // TODO: syncedRevision
  function handleSubscribe(connID, { syncedRevision }, cb) {
    const clientIdentity = connToClientIdentity.get(connID);
    const sendChangesToClient = iniSendChangesBackToClient(cb, clientIdentity);
    subscriptions.set(connID, sendChangesToClient);
    sendChangesToClient();
  }

  // TODO: add client partial support
  // TODO: fix server partial support -> need to recall getServerChanges
  function handleClientChanges(connID, { baseRevision, changes, partial, requestId }) {
    const nextRevision = db.getRevision() + 1;
    db.setRevision(nextRevision);

    const clientIdentity = connToClientIdentity.get(connID);

    // Will send 'ack' to client
    return applyClientChanges(db, baseRevision, nextRevision, changes, clientIdentity)
      .then(() => {
        sendChangesBackToClients(clientIdentity);
      })
      .then(() => ({
        requestId,
      }));
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
  };
}

module.exports = initSocketHandler;
