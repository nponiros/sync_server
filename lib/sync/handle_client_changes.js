const applyClientChanges = require('./apply_client_changes');

function handleClientChanges(db, baseRevision, nextRevision, partial, clientID, changes) {
  if (partial) {
    return db.uncommittedChanges.update(clientID, changes);
  }
  return db.uncommittedChanges
      .get(clientID)
      .then((uncommittedChangesObj) => {
        return applyClientChanges(
            db,
            baseRevision,
            nextRevision,
            [...uncommittedChangesObj.changes, ...changes],
            clientID
        );
      });
}

module.exports = handleClientChanges;
