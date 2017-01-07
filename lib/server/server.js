const startPollServer = require('./poll/server');
const startSocketServer = require('./socket/server');

function startServer({
    logger,
    syncHandler,
    settings,
    dataPath,
}) {
  if (settings.protocol === 'http' || settings.protocol === 'https') {
    startPollServer({
      logger,
      syncHandler: syncHandler.pollHandler,
      settings,
      dataPath,
    });
  } else if (settings.protocol === 'ws') {
    startSocketServer({
      logger,
      syncHandler: syncHandler.socketHandler,
      settings,
      dataPath,
    });
  } else {
    throw new Error(`Protocol: ${settings.protocol} not supported`);
  }
}

module.exports = startServer;
