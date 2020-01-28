// config/unit/jest.js
module.exports = {
    testEnvironment: 'node',
    verbose: true,
    collectCoverage: true,
    coverageReporters: [ 'json', 'lcov', 'text', 'text-summary', 'clover' ],  
    coverageThreshold: {
        global: {
          statements: 75,
          branches: 75,
          functions: 75,
          lines: 75
        }
    },
    rootDir: "../../../../",
    testMatch: [
        '**/__tests__/**/*.[jt]s?(x)',
        '**/?(*.)+(spec|test).[tj]s?(x)'
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        '__tests__/unit/config/'
    ]
}