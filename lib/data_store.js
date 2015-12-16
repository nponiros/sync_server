'use strict';

const NeDBDataStore = require('nedb');

class DataStore {
  constructor(collectionName, dataPath) {
    const filename = `${dataPath}/${collectionName}.db`;
    const options = {
      filename,
      autoload: true
    };
    this.datastore = new NeDBDataStore(options);
  }
  save(changeObject) {
    const promise = new Promise((resolve, reject) => {
      this.datastore.insert(changeObject, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(changeObject._id);
        }
      });
    });
    return promise;
  }
  find(query, projection) {
    const promise = new Promise((resolve, reject) => {
      this.datastore.find(query, projection, function(err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
    return promise;
  }
}

module.exports = DataStore;
