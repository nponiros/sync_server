'use strict';

const NeDBDataStore = require('nedb');

class ChangesTable {
  constructor(name, dbOptions) {
    const options = {
      filename: name,
      autoload: true,
    };
    this.store = new NeDBDataStore(Object.assign({}, options, dbOptions));
  }

  add(changeObject) {
    return new Promise((resolve, reject) => {
      this.store.insert(changeObject, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  getByRevision(revisionNumber) {
    return new Promise((resolve, reject) => {
      const query = {
        rev: {
          $gt: revisionNumber,
        },
      };
      return this.store.find(query, { _id: 0, rev: 0 }).sort({ rev: 1 }).exec((err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  getByRevisionAndClientID(revisionNumber, clientID) {
    return new Promise((resolve, reject) => {
      const query = {
        rev: {
          $gt: revisionNumber,
        },
        source: {
          $ne: clientID,
        },
      };
      return this.store.find(query, { _id: 0, source: 0, rev: 0 }).sort({ rev: 1 }).exec((err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /* cleanUp(revisionNumber) {
    return new Promise((resolve, reject) => {
      this.store.remove({ rev: { $lt: revisionNumber } }, { multi: true }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  } */
}

module.exports = ChangesTable;
