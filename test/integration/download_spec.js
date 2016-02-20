'use strict';

const chakram = require('chakram');
const expect = chakram.expect;

const settings = require('../test_settings');
const baseUrl = `${settings.test.protocol}${settings.test.domain}:${settings.port}`;
const apiPath = '/api/v1/download';

describe(apiPath, () => {
  before(() => {
    chakram.setRequestDefaults({
      baseUrl
    });
  });

  it('should respond with changes newer than the given lastUpdateTS', () => {
    const response = chakram.post(apiPath, {lastUpdateTS: 1433015224199, collectionNames: ['non_empty']});
    expect(response).to.have.status(200);
    expect(response).to.have.schema('changes', {minItems: 2, maxItems: 2});
    return chakram.wait();
  });

  it('should not send the lastUpdateTS as part of the changes', () => {
    const response = chakram.post(apiPath, {lastUpdateTS: 1433015224209, collectionNames: ['non_empty']});
    expect(response).to.have.status(200);
    expect(response).to.have.schema('changes', {minItems: 1, maxItems: 1});
    return chakram.wait().then((rsp) => {
      expect(rsp.body.changes[0].lastUpdateTS).to.equal(undefined);
    });
  });

  it('should respond with empty changes if the collection is empty', () => {
    const response = chakram.post(apiPath, {collectionNames: ['empty']});
    expect(response).to.have.status(200);
    expect(response).to.have.json('changes', []);
    return chakram.wait();
  });

  it('should respond with the entire collection content if lastUpdateTS is undefined', () => {
    const response = chakram.post(apiPath, {collectionNames: ['non_empty']});
    expect(response).to.have.status(200);
    expect(response).to.have.schema('changes', {minItems: 4, maxItems: 4});
    return chakram.wait();
  });

  it('should respond with an error if a given collection is unknown', () => {
    const response = chakram.post(apiPath, {collectionNames: ['unknown']});
    expect(response).to.have.status(500);
    return chakram.wait();
  });
});
