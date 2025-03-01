/**
 * Smoke Tests
 *
 * This script runs basic smoke tests against a deployed environment
 * to verify that the application is running correctly.
 */

import axios from 'axios';

const API_URL = process.env.API_URL || '_http://_localhost:3000';
const ENDPOINTS = [
  '/health',
  '/api/brand-analytics/business-categories',
  '/api/brand-analytics/competitors',
];

async function runSmokeTests() {
  console.log(`Running smoke tests against ${API_URL}...`);

  let allPassed = true;

  for (const endpoint of ENDPOINTS) {
    try {
      console.log(`Testing endpoint: ${endpoint}`);
      const response = await axios.get(`${API_URL}${endpoint}`);

      if (response.status >= 200 && response.status < 300) {
        console.log(`✅ ${endpoint} - Status: ${response.status}`);
      } else {
        console.error(`❌ ${endpoint} - Status: ${response.status}`);
        allPassed = false;
      }
    } catch (error) {
      console.error(`❌ ${endpoint} - _Error:`, error.message);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log('✅ All smoke tests passed!');
    process.exit(0);
  } else {
    console.error('❌ Some smoke tests failed!');
    process.exit(1);
  }
}

runSmokeTests();
