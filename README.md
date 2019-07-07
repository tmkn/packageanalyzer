# Node.js Package Analyzer (npa)
[![Build Status](https://dev.azure.com/tmkndev/packageanalyzer/_apis/build/status/tmkn.packageanalyzer?branchName=master)](https://dev.azure.com/tmkndev/packageanalyzer/_build/latest?definitionId=1&branchName=master)
[![codecov](https://codecov.io/gh/tmkn/packageanalyzer/branch/master/graph/badge.svg)](https://codecov.io/gh/tmkn/packageanalyzer)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=tmkn_packageanalyzer&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=tmkn_packageanalyzer)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=tmkn_packageanalyzer&metric=sqale_index)](https://sonarcloud.io/dashboard?id=tmkn_packageanalyzer)

> Work in progress!

![App Banner](./banner.png)

A tool to analyze your Node.js project.

Stats are fun!

## Install
`npm install -g packageanalyzer`

## Usage
### Analyze latest version of a package
`npa -o typescript`
### Analyze specific version of a package
`npa -o typescript@3.5.1`
### Analyze local folder
`npa -f path/to/folder`

## Prints various statistics:
* Number of transitive dependencies
* Number of unique dependencies
* List most referred package
* List Package with most direct dependencies
* List package with most versions
* Which kind of licenses are used

## Development
### Watch mode
`npm run dev`
### Build
`npm run build`
## Tests
### Run tests
`npm run test`
### Watch tests
`npm run test:watch`

## Ideas
* Make available as API
* Check for specific dependency/maintainer etc
* Get oldest/newest dependency

## License
MIT