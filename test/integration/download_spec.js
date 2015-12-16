'use strict';

const chakram = require('chakram');
const expect = chakram.expect;

const settings = require('../test_settings');
const baseUrl = `${settings.test.protocol}${settings.test.domain}:${settings.port}`;
const apiPath = `/api/v1/download`;

describe(apiPath, () => {
  before(() => {
    chakram.setRequestDefaults({
      baseUrl
    });
  });

  it('should respond with a status of 200');

  it('should respond with changes newer than the given lastUpdateTS');
});
