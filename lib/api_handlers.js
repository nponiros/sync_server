'use strict';

const send = require('./sender_functions.js');

function init(allCollections) {
  function downloadChanges(req, res, next) {
    const lastUpdateTS = req.body.lastUpdateTS;
    const collectionNames = req.body.collectionNames;

    const collectionPromises = collectionNames.map((collectionName) => {
      const collection = allCollections.get(collectionName);
      if (collection) {
        return collection.find(lastUpdateTS);
      } else {
        Promise.reject('Collection not found');
      }
    });

    Promise.all(collectionPromises).then(function(results) {
      const responseData = {};
      responseData.changes = results.reduce(function(a, b) {
        return a.concat(b);
      }, []);

      send.jsonContent(res, responseData);
    }).catch(next);
  }

  function uploadChanges(req, res, next) {
    const changes = req.body.changes;
    const lastUpdateTS = Date.now();

    const changePromises = changes.map((changeObj) => {
      const collectionName = changeObj.collectionName;
      const collection = allCollections.get(collectionName);
      if (collection) {
        return collection.save(changeObj, lastUpdateTS);
      } else {
        Promise.reject('Collection not found');
      }
    });

    Promise.all(changePromises).then(function(changeIds) {
      const responseData = {
        lastUpdateTS,
        changeIds
      };
      send.jsonContent(res, responseData);
    }).catch(next);
  }

  return {
    download: downloadChanges,
    upload: uploadChanges
  };
}

module.exports = {init};
