'use strict';

const path = require('path');

module.exports = {
  apiPath: '/api/v1',
  dataPath: path.resolve(process.env.HOME, 'SYNC_SERVER_DATA'),
  collectionNames: ['testCollection'],
  errorLogFileName: 'error.log',
  accessLogFileName: 'access.log',
  port: 3000
};
