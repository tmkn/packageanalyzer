# Node.js Package Analyzer

[![Build Status](https://dev.azure.com/tmkndev/packageanalyzer/_apis/build/status/tmkn.packageanalyzer?branchName=master)](https://dev.azure.com/tmkndev/packageanalyzer/_build/latest?definitionId=1&branchName=master)
[![codecov](https://codecov.io/gh/tmkn/packageanalyzer/branch/master/graph/badge.svg)](https://codecov.io/gh/tmkn/packageanalyzer)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=tmkn_packageanalyzer&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=tmkn_packageanalyzer)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=tmkn_packageanalyzer&metric=sqale_index)](https://sonarcloud.io/dashboard?id=tmkn_packageanalyzer)
[![npm (scoped)](https://img.shields.io/npm/v/@tmkn/packageanalyzer)](https://www.npmjs.com/package/@tmkn/packageanalyzer)
[![npm](https://img.shields.io/npm/dw/@tmkn/packageanalyzer)](https://www.npmjs.com/package/@tmkn/packageanalyzer)

> A sample output of the `analyze` command
> ![App Banner](./banner.png)

A framework to introspect and analyze Node.js projects.

## Features

- **Package Linter**: Verify the integrity of your Node.js packages with ESLint like rules
- **Custom Rules:**: Write your own rules
- **Dependency Anlysis**: Get a quick overview of any Node.js package and its dependencies
- **API**: Leverage the same API that powers the linter and dependency analysis to build fully customized checks and integrations.

## Install

```bash
npm install -g @tmkn/packageanalyzer
```

**yarn:**

```bash
yarn global add @tmkn/packageanalyzer
```

## Usage

Please see the [documentation](https://packageanalyzer-docs.vercel.app/) on usage.

## Contributing

Contributions are welcome! Please see [DEVELOP.md](./DEVELOP.md) for information on how to set up the development environment and contribute to the project.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
