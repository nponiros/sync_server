'use strict';

const hippie = require('hippie');

const settings = require('../test_settings');
const url = `${settings.test.protocol}${settings.test.domain}:${settings.port}`;
const apiUrl = `${url}${settings.apiPath}/check`;

describe('/check', () => {
  it('should respond with a status of 200', (done) => {
    hippie()
      .head(apiUrl)
      .expectStatus(200)
      .end(done);
  });

  it('should respond with an empty body', (done) => {
    hippie()
      .head(apiUrl)
      .expectBody('')
      .end(done);
  });
});
