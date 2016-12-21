'use strict';

const NeDBDataStore = require('nedb');

class UncommittedChangesTable {
  constructor(name, dbOptions) {
    const options = {
      filename: name,
      autoload: true,
    };
    this.store = new NeDBDataStore(Object.assign({}, options, dbOptions));
  }

  update(clientIdentity, changes) {
    return new Promise((resolve, reject) => {
      const updateRules = { $push: { changes: { $each: changes } } };
      this.store.update({ _id: clientIdentity }, updateRules, { upsert: true }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  get(clientIdentity) {
    return new Promise((resolve, reject) => {
      this.store.findOne({ _id: clientIdentity }, { _id: 0 }, (err, data) => {
        if (err) {
          return reject(err);
        }
        this.store.remove({ _id: clientIdentity }, {}, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(data || { changes: [] });
          }
        });
      });
    });
  }
}

module.exports = UncommittedChangesTable;
