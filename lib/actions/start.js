'use strict';

const fs = require('fs');
const path = require('path');

const initializeLogger = require('../log_handlers');
const startServer = require('../server/server');
const initSyncHandler = require('../sync/handler');
const DB = require('../db_connectors/NeDB/db');

module.exports = function (dataPath) {
  const settings = JSON.parse(fs.readFileSync(path.join(dataPath, 'config.json'), { encoding: 'utf8' }));

  const logger = initializeLogger(dataPath, settings.logging);

  const db = new DB(Object.assign({}, settings.db.opts, { dataPath }), logger);

  startServer({
    syncHandler: initSyncHandler(db, logger),
    logger,
    settings: settings.server,
  });
};
