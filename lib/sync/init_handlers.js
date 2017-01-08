'use strict';

const initPollHandler = require('./poll_handler');
const initSocketHandler = require('./socket_handler');

function initHandler(db, logger, opts) {
  return db.getRevision()
      .then((rev) => ({ rev }))
      .then((currentDBRevision) => {
        const pollHandler = initPollHandler(db, logger, opts, currentDBRevision);
        const socketHandler = initSocketHandler(db, logger, opts, currentDBRevision);

        return {
          pollHandler,
          socketHandler,
        };
      });
}

module.exports = initHandler;
