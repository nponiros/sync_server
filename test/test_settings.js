'use strict';

const path = require('path');

module.exports = {
  apiPath: '/api/v1',
  dataPath: path.resolve(__dirname, 'integration/test_data'),
  collectionNames: ['upload', 'empty', 'non_empty'],
  errorLogFileName: 'test-error.log',
  accessLogFileName: 'test-access.log',
  port: 8080,
  requestSizeLimit: '100kb', // body-parser default
  // Settings only used in tests
  test: {
    domain: 'localhost',
    protocol: 'http://'
  }
};
