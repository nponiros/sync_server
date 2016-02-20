'use strict';

const os = require('os');

// Express modules
const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');

// Internal modules
const apiRoutes = require('./api_routes.js');
const send = require('./sender_functions.js');

const DataStore = require('./data_store.js');
const Collection = require('./collection.js');
const apiHandlers = require('./api_handlers.js');

const initializeLogger = require('./log_handlers');

function prepareApiHandlers(collectionNames, dataPath) {
  const collections = new Map();
  collectionNames.forEach((collectionName) => {
    const collection = new Collection(new DataStore(collectionName, dataPath));
    collections.set(collectionName, collection);
  });
  const initializedApiHandlers = apiHandlers.init(collections);
  return initializedApiHandlers;
}

function start(settings) {
  const logger = initializeLogger(settings.accessLogFileName, settings.errorLogFileName, settings.dataPath);
  const initializedApiHandlers = prepareApiHandlers(settings.collectionNames, settings.dataPath);
  const expressApp = express();

  expressApp.set('port', settings.port);
  expressApp.set('x-powered-by', false);

  expressApp.use(cors());
  expressApp.use(bodyParser.json({
    limit: settings.requestSizeLimit
  }));

  expressApp.use(settings.apiPath, (req, res, next) => {
    logger.file.info(req.path);
    logger.console.info(req.path);
    next();
  });

  expressApp.use(settings.apiPath, apiRoutes.init(initializedApiHandlers.upload, initializedApiHandlers.download));

// catch 404 and forward to error handler
  expressApp.use(function(req, res, next) {
    const err = new Error('Not Found');
    next(err);
  });

// Error handler
  expressApp.use(function(err, req, res, next) { // eslint-disable-line no-unused-vars
    logger.file.error(err.name, err.message);
    logger.console.error(err.name, err.message);
    send.error(res, {
      name: err.name,
      message: err.message
    });
  });

  expressApp.listen(expressApp.get('port'), function() {
    const ifaces = os.networkInterfaces();
    const ifaceNames = Object.keys(ifaces);
    const protocol = 'http://';
    logger.console.info('Server addresses:');
    ifaceNames.forEach((name) => {
      const iface = ifaces[name];
      iface.forEach((ifaceEntry) => {
        if (ifaceEntry.family === 'IPv4') {
          logger.console.info(`${ifaceEntry.family}: ${protocol}${ifaceEntry.address}:${expressApp.get('port')}`);
        } else {
          logger.console.info(`${ifaceEntry.family}: ${protocol}[${ifaceEntry.address}]:${expressApp.get('port')}`);
        }
      });
    });
    logger.console.info(`Files saved in: ${settings.dataPath}`);
    logger.console.info(`Supported collections: ${settings.collectionNames}`);
    logger.file.info('Server start');
  });
}

module.exports = {start};
