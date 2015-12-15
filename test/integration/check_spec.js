'use strict';

const hippie = require('hippie');

const settings = require('../test_settings');
const url = `${settings.test.protocol}${settings.test.domain}:${settings.port}`;
const apiPath = '/api/v1/check';

describe(apiPath, () => {
  it('should respond with a status of 200', (done) => {
    hippie()
      .base(url)
      .head(apiPath)
      .expectStatus(200)
      .end(done);
  });

  it('should respond with an empty body', (done) => {
    hippie()
      .base(url)
      .head(apiPath)
      .expectBody('')
      .end(done);
  });
});
