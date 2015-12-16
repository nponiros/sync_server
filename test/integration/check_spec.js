'use strict';

const chakram = require('chakram');
const expect = chakram.expect;

const settings = require('../test_settings');
const baseUrl = `${settings.test.protocol}${settings.test.domain}:${settings.port}`;
const apiPath = '/api/v1/check';

describe(apiPath, () => {
  before(() => {
    chakram.setRequestDefaults({
      baseUrl
    });
  });

  it('should respond with a status of 200', () => {
    const response = chakram.head(apiPath);
    return expect(response).to.have.status(200);
  });

  it('should respond with an empty body', () => {
    const response = chakram.head(apiPath);
    return expect(response.body).to.be.undefined;
  });
});
