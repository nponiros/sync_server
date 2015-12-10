'use strict';

class Collection {
  constructor(datastore) {
    this.datastore = datastore;
  }

  save(changeObjects, lastUpdateTS) {
    const changeObjectPromises = changeObjects.map((changeObject) => {
      changeObject.lastUpdateTS = lastUpdateTS;
      return this.datastore.save(changeObject);
    });
    return changeObjectPromises;
  }

  find(lastUpdateTS) {
    const query = {
      lastUpdateTS: {
        $gt: lastUpdateTS
      }
    };
    const projection = {
      lastUpdateTS: 0
    };
    return this.datastore.find(query, projection);
  }
}

module.exports = Collection;
