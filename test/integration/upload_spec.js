'use strict';

const hippie = require('hippie');

const settings = require('../test_settings');
const url = `${settings.test.protocol}${settings.test.domain}:${settings.port}`;
const apiPath = '/api/v1/upload';

describe('/upload', () => {

  it('should respond with a status of 200', (done) => {
    hippie()
      .json()
      .base(url)
      .post(apiPath)
      .expectStatus(200)
      .send({changes: []})
      .end(done);
  });

  it('should respond with a lastUpdateTS and empty changeIds if we send no changes', (done) => {
    hippie()
      .json()
      .base(url)
      .post(apiPath)
      .expectStatus(200)
      .expect((res, body, next) => {
        const lastUpdateTS = body.lastUpdateTS;
        if (lastUpdateTS !== undefined && typeof lastUpdateTS === 'number') {
          if (Array.isArray(body.changeIds) && body.changeIds.length === 0) {
            next();
          } else {
            next(Error('Invalid changeIds length'));
          }
        } else {
          next(Error('Invalid lastUpdateTS'))
        }
      })
      .send({changes: []})
      .end(done);
  });

  it('should respond with a lastUpdateTS and changeIds depending on the changes we send', (done) => {
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
    hippie()
      .json()
      .base(url)
      .post(apiPath)
      .expectStatus(200)
      .expect((res, body, next) => {
        const lastUpdateTS = body.lastUpdateTS;
        if (lastUpdateTS !== undefined && typeof lastUpdateTS === 'number') {
          if (Array.isArray(body.changeIds) && body.changeIds.length === 2) {
            if (body.changeIds[0] === updateObj._id && body.changeIds[1] === deleteObj._id) {
              next();
            } else {
              next(Error('Wrong changeIds'));
            }
          } else {
            next(Error('Invalid changeIds length'));
          }
        } else {
          next(Error('Invalid lastUpdateTS'))
        }
      })
      .send({changes})
      .end(done);
  });

  it('should save the change objects in the data base');
  // TODO don't forget to check non undefined lastUpdateTS
});
