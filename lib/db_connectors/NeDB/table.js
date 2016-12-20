'use strict';

const NeDBDataStore = require('nedb');

class Table {
  constructor(name, dbOptions) {
    const filename = `${name}.table`;
    const options = {
      filename,
      autoload: true,
    };
    this.store = new NeDBDataStore(Object.assign({}, options, dbOptions));
  }

  _addID(key, obj) {
    return Object.assign({}, obj, { _id: key });
  }

  add(key, changeObject) {
    return new Promise((resolve, reject) => {
      this.store.insert(this._addID(key, changeObject), (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  get(key) {
    return new Promise((resolve, reject) => {
      this.store.findOne({ _id: key }, { _id: 0 }, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }

  update(key, changeObject) {
    return new Promise((resolve, reject) => {
      this.store.update({ _id: key }, changeObject, {}, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  remove(key) {
    return new Promise((resolve, reject) => {
      this.store.remove({ _id: key }, {}, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

module.exports = Table;
