# Developing the Package Analyzer

This guide provides instructions for setting up the development environment and contributing to the Package Analyzer.

## Setting up the dev environment

To get started, you'll need to have [Node.js](https://nodejs.org/) (version 18 or higher) and [yarn](https://yarnpkg.com/) installed on your machine.

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/tmkn/packageanalyzer.git
    cd packageanalyzer
    ```

2.  **Install the dependencies:**

    ```bash
    yarn install
    ```

3.  **Build the project:**

    ```bash
    yarn build
    ```

## IDE

Any IDE will work, however the project contains config files for `VSCode` that make it very easy to contribute.

When you open the project with `VSCode` it will automatically start 2 tasks in watch mode.

- `dev`: Builds the project in watch mode, so when you run the debugger the files are always up to date.
- `typecheck`: Starts `typescript` in watch mode so you can quickly see if your code is syntactically correct.

Additionally it comes with a `launch.json` with a preconfigured debugging setup.

## Project Structure

The project uses `typescript` project references. The only real difference is that the `test` folder has more relaxed type settings. E.g. looking up array values in the `src` folder need a nullable check, while the same check in the `tests` folder does not.

Here's a high-level overview of the most important directories in the project:

- `src`: The source code of the application.
    - `attachments`: Implementations of the attachment mechanism, used to associate additional metadata with packages.
    - `cli`: The command-line interface (built with `clipanion`).
    - `extensions`: Utility functions for working with the dependency tree.
    - `package`: Contains the core `Package` class that describes the dependency tree.
    - `providers`: Retrievve and return metadata for packages.
    - `reports`: Implements various reports, including the linting functionality (`LintReport`).
    - `visitors`: Logic for traversing the dependency tree.
- `tests`: The test suite for the application.

## Building

To build the project, you can use the `build` script:

```bash
yarn build
```

This will compile the TypeScript code via `tsdown` and output the JavaScript files and type definitions to the `dist` directory.

You can also run the build in watch mode, which will automatically rebuild the project whenever you make changes to the source code:

```bash
yarn dev
```

## Testing

All tests are in the `test` folder next to the `src` folder and are implemented via `vitest`.

When using `VSCode` it is recommended to install the `vitest` extension to quickly run single tests.

To run the test suite, you can use the `test` script:

```bash
yarn test
```

You can also run the tests in watch mode:

```bash
yarn test:watch
```

To generate a code coverage report, you can use the `test:coverage` script:

```bash
yarn test:coverage
```

## Contributing

Contributions are welcome! If you'd like to contribute to the project, please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with a descriptive commit message prefixed with `chore`, `feat` or `fix`.
4.  Push your changes to your fork.
5.  Open a pull request to the `master` branch of the original repository.

When contributing, please make sure to follow the existing code style and to add tests for any new functionality.
