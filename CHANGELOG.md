# Change Log
This project adheres to [Semantic Versioning](http://semver.org/).

## [2.0.0-beta.4] - 2017-02-05

* Allow more https/wss options than just the certificates
* Bug fix: during poll synchronization a /check call shouldn't increment the next client version
* Fix https://github.com/nponiros/sync\_server/issues/8

## [2.0.0-beta.2] - 2017-01-21

* Allow CORS to be configured
* Add WebSockets support
* Change revision handling
  * Each DB changes has its own revision
  * Don't save a DB revision. Just read the last revision from the changes table
  * Don't return the DB revision when client gets data. Return the revision of the last change the client receives or the current db revision if there are no data for the client
* meta data reading/writing is now async
* Write stack trace into error log
* Update dependencies

## [2.0.0-beta.1] - 2016-12-27

This is a complete rewrite to make the server work with Dexie.Syncable. This version is not backwards compatible. The new API is described in the README. Please open an issue if you are using an old version and want to upgrade it.

## [1.0.0] - 2016-02-20

### Added

* Add help flag for CLI
* Add version flag for CLI
* Add support for a JSON configuration file via -c or --config flag

### Changed

* Fix documentation
* Log files are saved in the same directory as the data
* Use both a file logger and a console logger
* On start show which collections are supported and where the data is saved
* Set request size limit to 100kb, the default for body parser
* Update dependencies
* Replace yargs with minimist
* Adjust .eslintrc for version 2.2.0
* Change package.json engine to node version >= 4.0.0
