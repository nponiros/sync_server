'use strict';

const fs = require('fs');
const path = require('path');

const initializeLogger = require('../log_handlers');
const startServer = require('../server/server');
const initSyncHandler = require('../sync/init_handlers');

module.exports = function (dataPath) {
  const settings = JSON.parse(fs.readFileSync(path.join(dataPath, 'config.json'), { encoding: 'utf8' }));

  const logger = initializeLogger(dataPath, settings.logging);

  process.on('uncaughtException', (err) => {
    logger.file.error('uncaughtException:', err.name, err.message, err.stack);
    logger.console.error('uncaughtException:', err.name, err.message);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, p) => {
    logger.file.error('unhandledRejection:', reason, p);
    logger.console.error('unhandledRejection:', reason);
    process.exit(1);
  });

  let DB;
  if (settings.db.connector === 'NeDB') {
    DB = require('../db_connectors/NeDB/db');
  } else if (settings.db.connector === 'MongoDB') {
    DB = require('../db_connectors/MongoDB/db');
  }

  const db = new DB(Object.assign({}, settings.db.opts, { dataPath }), logger);
  db.init()
      .then(() => initSyncHandler(db, logger, settings.sync))
      .then((handlers) => {
        startServer({
          syncHandler: handlers,
          logger,
          settings: settings.server,
          dataPath,
        });
      });
};
