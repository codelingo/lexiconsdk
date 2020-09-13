module.exports = {
    preset: 'ts-jest',
    testEnvironment: '',
    testRegex: "test/.*\\.spec\\.ts",
    testPathIgnorePatterns: [
        "<rootDir>/node_modules"
    ],
    // globals: {
    //     'ts-jest': {
    //         diagnostics: false,
    //         // testConfig: "tsconfig-test.json"
    //     }
    // },
};