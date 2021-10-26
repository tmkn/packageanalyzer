module.exports = {
    roots: [
      "<rootDir>/tests"
    ],
    transform: {
      "^.+\\.tsx?$": "ts-jest"
    },
    testEnvironment: "node",
    coveragePathIgnorePatterns: ["/node_modules/", "<rootDir>/build/"],
    timers: "modern"
  }