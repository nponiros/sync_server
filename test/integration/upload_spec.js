'use strict';

const chakram = require('chakram');
const expect = chakram.expect;
const fs = require('fs');

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
      collectionName: 'upload',
      _id: 1
    };
    const deleteObj = {
      operation: 'delete',
      collectionName: 'upload',
      _id: 2
    };
    const changes = [updateObj, deleteObj];
    const response = chakram.post(apiPath, {changes});

    expect(response).to.have.json('changeIds', [1, 2]);
    return chakram.waitFor([
      expect(response).to.have.status(200),
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
      })
    ]).then(() => {
      const content = fs.readFileSync(`${settings.dataPath}/upload.db`, {encoding: 'utf8'});
      const arr = content.split('\n');
      // Last element is an empty line
      expect(arr).to.have.length(3);
      for (let i = 0; i < arr.length - 1; i++) {
        const obj = JSON.parse(arr[i]);
        expect(obj.lastUpdateTS).to.not.equal(undefined);
        expect(obj.operation).to.not.equal(undefined);
        expect(obj._id).to.not.equal(undefined);
        expect(obj.collectionName).to.be.equal('upload');
        if (obj.operation === 'update') {
          expect(obj.changeSet).to.deep.equal(updateObj.changeSet);
        } else {
          expect(obj.changeSet).to.equal(undefined);
        }
      }
    });
  });

  it('should respond with an error if we use an unknown collection', () => {
    const updateObj = {
      operation: 'update',
      changeSet: {
        _id: 1
      },
      collectionName: 'unknown',
      _id: 1
    };
    const deleteObj = {
      operation: 'delete',
      collectionName: 'unknown',
      _id: 2
    };
    const changes = [updateObj, deleteObj];
    const response = chakram.post(apiPath, {changes});
    expect(response).to.have.status(500);
    return chakram.wait();
  });
});
