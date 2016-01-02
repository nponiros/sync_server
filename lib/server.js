'use strict';

const os = require('os');

// Express modules
const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');

const winston = require('winston');
const Logger = winston.Logger;
const FileTransport = winston.transports.File;

// Internal modules
const apiRoutes = require('./api_routes.js');
const send = require('./sender_functions.js');

const DataStore = require('./data_store.js');
const Collection = require('./collection.js');
const apiHandlers = require('./api_handlers.js');

const errorTransportName = 'errorTransport';

function prepareApiHandlers(collectionNames, dataPath) {
  const collections = new Map();
  collectionNames.forEach((collectionName) => {
    const collection = new Collection(new DataStore(collectionName, dataPath));
    collections.set(collectionName, collection);
  });
  const initializedApiHandlers = apiHandlers.init(collections);
  return initializedApiHandlers;
}

function initializeLogger(accessLogFileName, errorLogFileName, logsPath) {
  const logger = new Logger({
    transports: [
      new FileTransport({
        name: 'infoTransport',
        filename: `${logsPath}/${accessLogFileName}`,
        level: 'info'
      }),
      new FileTransport({
        name: errorTransportName,
        filename: `${logsPath}/${errorLogFileName}`,
        level: 'error'
      })
    ]
  });

  return logger;
}

function start(settings) {
  const logger = initializeLogger(settings.accessLogFileName, settings.errorLogFileName, settings.logsPath);
  const initializedApiHandlers = prepareApiHandlers(settings.collectionNames, settings.dataPath);
  const expressApp = express();

  expressApp.set('port', settings.port);
  expressApp.set('x-powered-by', false);

  expressApp.use(cors());
  expressApp.use(bodyParser.json());

  expressApp.use(settings.apiPath, (req, res, next) => {
    logger.info(req.path);
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
    logger.error(err.name, err.message);
    send.error(res, {
      name: err.name,
      message: err.message
    });
  });

  winston.handleExceptions(logger.transports[errorTransportName]);

  expressApp.listen(expressApp.get('port'), function() {
    const ifaces = os.networkInterfaces();
    const ifaceNames = Object.keys(ifaces);
    const protocol = 'http://';
    console.log('Server addresses:');
    ifaceNames.forEach((name) => {
      const iface = ifaces[name];
      iface.forEach((ifaceEntry) => {
        if (ifaceEntry.family === 'IPv4') {
          console.log(`${ifaceEntry.family}: ${protocol}${ifaceEntry.address}:${expressApp.get('port')}`);
        } else {
          console.log(`${ifaceEntry.family}: ${protocol}[${ifaceEntry.address}]:${expressApp.get('port')}`);
        }
      });
    });
    logger.info('Server start');
  });
}

module.exports = {start};
