#!/usr/bin/env node

'use strict';

const argv = require('yargs').argv;

const defaultSettings = require('../lib/settings.js');
const server = require('../lib/server.js');

let collectionNames;
if (argv.collections) {
  collectionNames = argv.collections.split(',');
} else {
  collectionNames = defaultSettings.collectionNames;
}

const settings = {
  apiPath: defaultSettings.apiPath,
  port: argv.p || defaultSettings.port,
  dataPath: argv.path || defaultSettings.dataPath,
  collectionNames,
  accessLogFileName: defaultSettings.accessLogFileName,
  errorLogFileName: defaultSettings.errorLogFileName
};

server.start(settings);
