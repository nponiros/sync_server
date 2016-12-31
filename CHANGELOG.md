# Change Log
This project adheres to [Semantic Versioning](http://semver.org/).

## [] - Not released

* Allow CORS to be configured

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
