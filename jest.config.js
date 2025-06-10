module.exports = {
    roots: ["<rootDir>/tests"],
    transform: { "^.+\\.tsx?$": "ts-jest" },
    testEnvironment: "node",
    testEnvironmentOptions: { globalsCleanup: "on" },
    coveragePathIgnorePatterns: ["/node_modules/", "<rootDir>/build/"],
    fakeTimers: { enableGlobally: true }
};
