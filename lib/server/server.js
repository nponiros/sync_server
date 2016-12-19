'use strict';

const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');

const printInterfaces = require('./print_interfaces');
const send = require('./sender_functions');

function startServer({
  logger,
  syncHandler,
  settings,
}) {
  const expressApp = express();

  expressApp.set('port', settings.port);
  expressApp.set('x-powered-by', false);

  expressApp.use(cors());
  expressApp.use(bodyParser.json({ limit: settings.requestSizeLimit }));

  expressApp.use('/', (req, res, next) => {
    // TODO print client ID etc.
    logger.file.info(req.path);
    logger.console.info(req.path);
    next();
  });

  expressApp.use('/', (req, res, next) => {
    const syncData = req.body;
    syncHandler(syncData)
      .then((data) => {
        send.jsonContent(res, data);
      })
      .catch((e) => {
        next(e);
      });
  });

  expressApp.use('/check', (req, res) => {
    res.end();
  });

  // catch 404 and forward to error handler
  expressApp.use(function (req, res, next) {
    // TODO fix this to pass status code
    const err = new Error('Not Found');
    next(err);
  });

  // Error handler
  expressApp.use(function (err, req, res, next) { // eslint-disable-line no-unused-vars
    logger.file.error(err.name, err.message);
    logger.console.error(err.name, err.message);
    send.error(res, {
      name: err.name,
      message: err.message,
    });
  });

  expressApp.listen(expressApp.get('port'), () => {
    printInterfaces(logger, settings.protocol, settings.port);
  });
}

module.exports = startServer;
