# Node.js Package Analyzer (pkga)
[![Build Status](https://dev.azure.com/tmkndev/packageanalyzer/_apis/build/status/tmkn.packageanalyzer?branchName=master)](https://dev.azure.com/tmkndev/packageanalyzer/_build/latest?definitionId=1&branchName=master)
[![codecov](https://codecov.io/gh/tmkn/packageanalyzer/branch/master/graph/badge.svg)](https://codecov.io/gh/tmkn/packageanalyzer)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=tmkn_packageanalyzer&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=tmkn_packageanalyzer)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=tmkn_packageanalyzer&metric=sqale_index)](https://sonarcloud.io/dashboard?id=tmkn_packageanalyzer)

> Work in progress!

![App Banner](./banner.png)

A framework to introspect Node.js projects.

Stats are fun!

## Install
```
git clone https://github.com/tmkn/packageanalyzer.git
yarn install
yarn build
```
See [ARCHITECTURE.md](ARCHITECTURE.md) for a quick tour around the code

## Usage
### Analyze latest version of a package
`pkga analyze --package typescript`
### Analyze specific version of a package
`pkga analyze --package typescript@3.5.1`
### Analyze local folder
`pkga analyze --folder path/to/folder`

## Prints various statistics:
* Number of transitive dependencies
* Number of unique dependencies
* List most referred package
* List Package with most direct dependencies
* List package with most versions
* Which kind of licenses are used

## Development
### Watch mode
`yarn dev`
### Build
`yarn build`
## Tests
### Run tests
`yarn test`
### Watch tests
`yarn test:watch`

## Roadmap
* Stabilize API
* Provide option to specify a series of checks that should be run
* Provide package health check (number of open tickets, release velocity etc)
* Provide check for deprecated packages/unnecessary polyfills

## License
MIT
