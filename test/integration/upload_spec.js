'use strict';

const chakram = require('chakram');
const expect = chakram.expect;

const settings = require('../test_settings');
const baseUrl = `${settings.test.protocol}${settings.test.domain}:${settings.port}`;
const apiPath = '/api/v1/upload';

describe('/upload', () => {
  before(() => {
    chakram.setRequestDefaults({
      baseUrl
    });
  });

  it('should respond with a lastUpdateTS and empty changeIds if we send no changes', () => {
    const response = chakram.post(apiPath, {changes: []});
    expect(response).to.have.status(200);
    expect(response).to.have.schema({
      type: 'object',
      properties: {
        lastUpdateTS: {
          type: 'number'
        },
        changeIds: {
          type: 'array'
        }
      }
    });
    expect(response).to.have.json('changeIds', []);
    return chakram.wait();
  });

  it('should respond with a lastUpdateTS and changeIds depending on the changes we send', () => {
    const updateObj = {
      operation: 'update',
      changeSet: {
        _id: 1
      },
      collectionName: 'test_collection',
      _id: 1
    };
    const deleteObj = {
      operation: 'delete',
      collectionName: 'test_collection',
      _id: 2
    };
    const changes = [updateObj, deleteObj];
    const response = chakram.post(apiPath, {changes});
    expect(response).to.have.status(200);
    expect(response).to.have.schema({
      type: 'object',
      properties: {
        lastUpdateTS: {
          type: 'number'
        },
        changeIds: {
          type: 'array'
        }
      }
    });
    expect(response).to.have.json('changeIds', [1, 2]);
    return chakram.wait();
  });

  it('should save the change objects in the data base');
  // TODO don't forget to check non undefined lastUpdateTS
});
