/**
 * Jest setup file for E2E tests
 *
 * This file runs before all tests to set up the test environment
 */

// Increase timeout for all tests
jest.setTimeout(30000);

// Mock console methods to reduce noise during tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Only show errors by _default, unless DEBUG=true
if (!process.env.DEBUG) {
  console.log = jest.fn();
  console.warn = jest.fn();
  // Keep error logging enabled
}

// Restore console methods after all tests
afterAll(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});
