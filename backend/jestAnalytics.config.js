module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/services/analyticsClient.test.js',
    '<rootDir>/tests/services/analyticsService.test.js',
    '<rootDir>/tests/http/analyticsRoutes.test.js',
  ],
  collectCoverageFrom: [
    'src/services/analyticsClient.js',
    'src/services/analyticsService.js',
    'src/controllers/analyticsController.js',
    'src/routes/analyticsRoutes.js',
  ],
  coverageDirectory: 'coverage/analytics',
  coverageReporters: ['text', 'json-summary', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 55,
      functions: 70,
      lines: 65,
      statements: 65,
    },
  },
};
