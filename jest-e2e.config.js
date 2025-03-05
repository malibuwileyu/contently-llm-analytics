module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^test/(.*)$': '<rootDir>/test/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  coverageDirectory: './coverage/e2e',
  testTimeout: 1200000, // 20 minutes
  forceExit: true, // Force exit after tests complete
  cacheDirectory: 'J:/jest-e2e-cache'
};