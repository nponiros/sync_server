#!/usr/bin/env node

'use strict';

const path = require('path');
const argv = require('yargs').argv;

const startAction = require('../lib/actions/start');
const initAction = require('../lib/actions/init');

const action = argv._[0];

const basePath = process.cwd();

switch (action) {
  case 'init': initAction(basePath); break;
  case 'start': {
    const dataPath = path.resolve(argv.path);
    startAction(dataPath);
    break;
  }
  default: console.log('Action', action, 'not supported');
}
