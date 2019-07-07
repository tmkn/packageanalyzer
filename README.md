# Node.js Package Analyzer (npa)
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