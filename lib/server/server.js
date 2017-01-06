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
      syncHandler,
      settings,
      dataPath,
    });
  } else if (settings.protocol === 'ws') {
    startSocketServer({
      logger,
      syncHandler,
      settings,
      dataPath,
    });
  } else {
    throw new Error(`Protocol: ${settings.protocol} not supported`);
  }
}

module.exports = startServer;
