/**
 * Script to automatically fix common linting issues
 * Run with: node scripts/fix-lint-issues.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to recursively find all TypeScript files
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('dist')) {
      findTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Fix property names with underscores
function fixPropertyNames(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Common property names that should not have underscores
  const commonProps = [
    'providers', 'controllers', 'imports', 'exports', 
    'useValue', 'useClass', 'useFactory', 'inject', 
    'driver', 'autoSchemaFile', 'sortSchema', 'playground', 
    'ssl', 'entities', 'prefix', 'endpoint', 'load', 
    'buckets', 'verified', 'results', 'title', 'snippet', 
    'url', 'migrationsTableName', 'logging', 'retryAttempts',
    'retryDelay', 'extra', 'registerController', 'context'
  ];
  
  // Fix property names with underscores
  commonProps.forEach(prop => {
    const regex = new RegExp(`_${prop}\\s*:`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `${prop}:`);
      modified = true;
    }
  });
  
  // Fix numeric values with underscores (e.g., 0._85 -> 0.85)
  const numericRegex = /(\d+)\._(\d+)/g;
  if (numericRegex.test(content)) {
    content = content.replace(numericRegex, '$1.$2');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed property names in ${filePath}`);
  }
}

// Main function
function main() {
  console.log('Finding TypeScript files...');
  const tsFiles = findTsFiles('src');
  tsFiles.push(...findTsFiles('test'));
  
  console.log(`Found ${tsFiles.length} TypeScript files`);
  
  // Fix property names
  console.log('Fixing property names...');
  tsFiles.forEach(file => {
    try {
      fixPropertyNames(file);
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  });
  
  // Run ESLint with --fix
  console.log('Running ESLint with --fix...');
  try {
    execSync('npm run lint', { stdio: 'inherit' });
  } catch (error) {
    console.log('ESLint found issues that need manual fixing.');
  }
  
  console.log('Done!');
}

main();