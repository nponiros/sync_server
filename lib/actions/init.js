'use strict';

const fs = require('fs');
const path = require('path');

const config = {
  logging: {
    errorLogFileName: 'error.log',
    accessLogFileName: 'access.log',
  },
  server: {
    port: 3000,
    protocol: 'http',
    requestSizeLimit: '100kb',
  },
  db: {
    connector: 'NeDB',
    opts: {},
  },
};

module.exports = function (basePath) {
  const files = fs.readdirSync(basePath);

  if (files.length === 0) {
    fs.writeFileSync(path.join(basePath, 'config.json'), JSON.stringify(config, undefined, 2));
  } else {
    console.log('Directory is not empty. Will not initialize.');
  }
};
