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