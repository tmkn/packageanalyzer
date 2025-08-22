# Architecture

This document provides a high-level overview of the architecture of the Package Analyzer.

## Core Concepts

The core of the application is built around a few key concepts:

### `Package`

The `Package` class is the central data model of the application. It represents a single package in the dependency tree and contains information about the package, such as its name, version, dependencies, and more. The `Package` class also provides a set of utility methods to traverse and query the dependency tree.

### `Provider`

The `Provider` is responsible for fetching the metadata for a package (i.e., the `package.json` file). The application includes several providers that can fetch data from different sources, such as the local file system, a remote registry, or a flat file. This design makes it easy to add new data sources.

### `Visitor`

The `Visitor` is responsible for traversing the dependency tree. It starts with a single package and then recursively visits all of its dependencies, building up the complete dependency tree. The `Visitor` uses a `Provider` to fetch the metadata for each package.

## `Reports`

The reporting system is responsible for generating various reports based on the analysis of the dependency tree. Each report is implemented as a separate class that extends the `Report` class.

The `ReportService` is responsible for orchestrating the report generation process. It takes a `Package` object as input and then runs the specified reports to generate the output.

## Command-Line Interface (CLI)

The CLI is built using the `clipanion` framework. Each command is implemented as a separate class that extends the `Command` class from `clipanion`.

The main entry point for the CLI is the `src/cli.ts` file, which registers all of the available commands and runs the CLI which then delegates to the `ReportService`.

## Linting

A key feature of the Package Analyzer is its ability to "lint" dependencies for potential issues, such as security vulnerabilities, license non-compliance, or other quality concerns. This is implemented through a rule-based system similar to ESLint.
