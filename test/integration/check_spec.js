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

  it('should respond with an empty body', () => {
    const response = chakram.head(apiPath);
    expect(response).to.have.status(200);
    expect(response.body).to.equal(undefined);
    return chakram.wait();
  });
});
