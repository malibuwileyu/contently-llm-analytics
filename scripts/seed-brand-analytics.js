/**
 * Script to run the Brand Analytics seed data
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('Building the project...');
execSync('npm run build', { stdio: 'inherit' });

console.log('Running the Brand Analytics seed script...');
execSync('node dist/src/modules/brand-analytics/scripts/seed-data.js', { stdio: 'inherit' });

console.log('Seed data has been successfully loaded!'); 