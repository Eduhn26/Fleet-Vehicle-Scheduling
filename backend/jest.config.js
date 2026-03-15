// NOTE: Jest is configured for backend-only tests with coverage focused on runtime application code.
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  clearMocks: true,
  restoreMocks: true,
  verbose: true,
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/services/**/*.js',
    'src/controllers/**/*.js',
    'src/middleware/**/*.js',
    '!src/**/*.d.js'
  ]
};