'use strict';

const http = require('http');
const https = require('https');

const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');

const printInterfaces = require('../print_interfaces');
const send = require('./sender_functions');

const readCertificates = require('../read_certificates');

function startPollServer({
  logger,
  syncHandler,
  settings,
  dataPath,
}) {
  const expressApp = express();
  const pollHandler = syncHandler;

  expressApp.set('port', settings.port);
  expressApp.set('x-powered-by', false);

  expressApp.use(cors(settings.cors));
  expressApp.use(bodyParser.json({ limit: settings.requestSizeLimit }));

  expressApp.use('/check', (req, res) => {
    res.end();
  });

  expressApp.use('/', (req, res, next) => {
    const syncData = req.body;
    pollHandler(syncData)
      .then((data) => {
        send.jsonContent(res, data);
      })
      .catch((e) => {
        next(e);
      });
  });

  // catch 404 and forward to error handler
  expressApp.use(function (req, res, next) {
    const err = new Error('Not Found');
    next(err);
  });

  // Error handler
  expressApp.use(function (err, req, res, next) { // eslint-disable-line no-unused-vars
    logger.file.error(err.name, err.message, err.stack);
    logger.console.error(err.name, err.message);
    send.error(res, {
      name: err.name,
      errorMessage: err.message,
    });
  });

  if (settings.protocol === 'http') {
    http.createServer(expressApp)
        .listen(expressApp.get('port'), () => {
          printInterfaces(logger, settings.protocol, settings.port);
        });
  } else {
    const httpsSettings = settings.https;
    if (!httpsSettings) {
      throw new Error('Https configuration is missing');
    }

    const httpsOptions = Object.assign({}, httpsSettings, readCertificates(dataPath, httpsSettings));
    https.createServer(httpsOptions, expressApp)
        .listen(expressApp.get('port'), () => {
          printInterfaces(logger, settings.protocol, settings.port);
        });
  }
}

module.exports = startPollServer;
