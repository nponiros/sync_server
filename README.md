# SyncServer (WIP)

A small node server which uses [NeDB](https://github.com/louischatriot/nedb) to write data to the disk. The server can be used with a client for example [SyncClient](https://github.com/nponiros/sync_client) to save change sets which can later be synchronized with other devices.

## REST API

### Data upload
Used to upload the change sets. Each changes gets saved in a collection depending on the collectionName attribute in the change object.

* URL: /api/v1/upload
* Method: POST
* Params: JSON with
  * changes:
    * type: Array<ChangeObj>
    * explanation: Array of change object to be saved to disk
* Return: JSON with
  * changeIds: 
    * type: Array<String>
    * explanation: Array with the IDs of all objects which where written in the various collections
  * lastUpdateTS:
    * type: Number
    * explanation: Timestamp created with Date.now(). Used by the download operation

### Data download
Used to download new change sets missing from the client. Which changes get downloaded depend on the lastUpdateTS attribute.

* URL: /api/v1/download
* Method: POST
* Params: JSON with
  * lastUpdateTS:
    * type: Number
    * explanation: Timestamp created with Date.now(). Used to distinguish between new and old change sets so we know what to send to the client
  * collectionNames:
    * type: Array<String>
    * explanation: Name of collections in which we want to look for new data
* Return: JSON with
  * changes:
    * type: Array<ChangeObj>
    * explanation: Array of change objects newer than lastUpdateTS

### Online check
Can be used to check if the server is online

* URL: /api/v1/check
* Method: HEAD
* Params: None
* Return: Headers

### ChangeObj

Object with:
* operation:
  * type: ENUM(update | delete),
  * explanation: Used to distinguish between data update and delete. Delete does not actually delete anything in the server database. It is used to delete data in the client database
* changeSet:
  * type: Object
  * explanation: The actual data to be updated. Only relevant for update operations
* collectionName:
  * type: String
  * explanation: The name of the collection in which we want to save the change set
* \_id:
  * type: String
  * explanation: ID of the object we are changing. If used with SyncClient, this ID is the same as the ID in the change set

## TODO

* CORS
* Tests
* Improve docu
* Collection names are static -> Change this to define collections via settings
* Publish package
