'use strict';

const hippie = require('hippie');

const settings = require('../test_settings');
const url = `${settings.test.protocol}${settings.test.domain}:${settings.port}`;
const apiPath = `/api/v1/download`;

describe(apiPath, () => {
  it('should respond with a status of 200');

  it('should respond with changes newer than the given lastUpdateTS');
});
