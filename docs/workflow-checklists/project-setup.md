# Project Setup Guide

## 1. Development Environment Setup

### 1.1 Node.js and Package Manager Setup
```bash
# Install Node.js LTS version
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be 18.x.x
npm --version   # Should be 8.x.x

# Install global dependencies
npm install -g @nestjs/cli typescript ts-node
```

### 1.2 Project Initialization
```bash
# Create new NestJS project
nest new contently-llm-analytics
cd contently-llm-analytics

# Initialize Git repository
git init
git add .
git commit -m "Initial commit"
```

### 1.3 TypeScript Configuration
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "es2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["src/*"],
      "@test/*": ["test/*"]
    }
  }
}
```

### 1.4 ESLint and Prettier Setup
```bash
# Install ESLint and Prettier dependencies
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
```

```javascript
// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
  },
};
```

```json
// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 80,
  "tabWidth": 2,
  "semi": true,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

### 1.5 Git Hooks Setup
```bash
# Install Husky and lint-staged
npm install --save-dev husky lint-staged
npx husky install
npm pkg set scripts.prepare="husky install"
```

```json
// package.json
{
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "prettier --write"
    ]
  },
  "scripts": {
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\"",
    "lint:fix": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\""
  }
}
```

### 1.6 Docker Development Environment
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USERNAME=postgres
      - DB_PASSWORD=postgres
      - DB_DATABASE=contently
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: contently
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## 2. Infrastructure Setup
> **DEFERRED**: AWS/Terraform setup, CI/CD pipelines, Prometheus/Grafana monitoring stack, CloudWatch logging, and Sentry error tracking will be implemented in future phases.

### 2.1 Basic Infrastructure
- [x] Set up local development environment with Docker Compose
- [x] Configure basic health checks
- [x] Set up simple console logging

## 3. Security Foundation
> **DEFERRED**: SSL/TLS configuration, advanced audit logging, complex RBAC patterns, advanced rate limiting, and security event monitoring will be implemented in future phases.

### 3.1 Basic Security
- [x] Set up JWT authentication
- [x] Implement basic RBAC
- [x] Configure basic input validation
- [x] Set up basic error handling

## 4. Database Setup
> **DEFERRED**: Advanced connection pooling, database backup system, complex transaction patterns, and advanced query optimization will be implemented in future phases.

### 4.1 Basic Database Setup
```typescript
// src/config/database.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/*{.ts,.js}'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
};
```

### 4.2 Redis Cache Setup
- [x] Configure Redis connection
- [x] Set up CacheModule with Redis store
- [x] Implement basic caching service
- [x] Add cache health checks
- [x] Set up basic cache tests

```typescript
// src/config/cache.config.ts
import { CacheModuleOptions } from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';

export const cacheConfig: CacheModuleOptions = {
  store: redisStore,
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT, 10),
  ttl: 300,
};
```

### 4.3 Basic Migration Strategy
- [x] Set up migration directory structure
- [x] Create base schema migration
- [x] Add rollback migration support
- [x] Implement audit logging

```typescript
// src/migrations/1234567890-InitialSetup.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSetup1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Basic schema setup
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback logic
  }
}
```

## Note: Deferred Implementations

The following items from the project setup are deferred for future phases:

### Infrastructure
- AWS/Terraform setup
- CI/CD pipelines
- Prometheus/Grafana monitoring stack
- CloudWatch logging
- Error tracking (Sentry)
- Advanced volume configurations
- Complex networking setup
- Multi-stage builds

### Database
- Advanced connection pooling
- Database backup system
- Complex transaction patterns
- Advanced query optimization

### Security
- SSL/TLS configuration (not needed for local dev)
- Advanced audit logging
- Complex RBAC patterns
- Advanced rate limiting
- Security event monitoring

### Monitoring & Logging
- ELK stack integration
- APM setup
- Complex metrics collection
- Alerting systems

### Testing
- Performance testing suite
- Load testing infrastructure
- Stress testing scenarios
- Advanced E2E test coverage

These items have been added to the deferred features section in the high-level checklist and will be implemented in future phases as needed. 