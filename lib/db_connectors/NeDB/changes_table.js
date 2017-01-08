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

  getLatestRevision() {
    return new Promise((resolve, reject) => {
      const query = {};
      return this.store.find(query).sort({ rev: 1 }).exec((err, result) => {
        if (err) {
          reject(err);
        } else {
          const rev = result[result.length - 1] ? result[result.length - 1].rev : 0;
          resolve(rev);
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

  // Revision (rev) needs to be sent back to the sync handler
  // so it knows what the currentRevision for a client is
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
      return this.store.find(query, { _id: 0, source: 0 }).sort({ rev: 1 }).exec((err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }
}

module.exports = ChangesTable;
