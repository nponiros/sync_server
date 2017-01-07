'use strict';

const initPollHandler = require('./poll_handler');
const initSocketHandler = require('./socket_handler');

function initHandler(db, logger, opts) {
  const pollHandler = initPollHandler(db, logger, opts);
  const socketHandler = initSocketHandler(db, logger, opts);

  return {
    pollHandler,
    socketHandler,
  };
}

module.exports = initHandler;
