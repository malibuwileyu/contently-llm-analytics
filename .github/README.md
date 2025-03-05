# CI/CD Pipeline Documentation

## Overview

This repository uses GitHub Actions for continuous integration and continuous deployment. The pipeline is designed to ensure code quality, run automated tests, and deploy to different environments.

## Workflow Architecture

### Continuous Integration (CI)

The CI workflow runs on every pull request to the `main` branch and on every push to the `main` branch. It consists of the following jobs:

1. **Lint**: Runs ESLint to ensure code quality and style consistency.
2. **Test**: Runs unit tests, integration tests, and generates a coverage report.
3. **Build**: Builds the application and uploads the build artifacts.

### Continuous Deployment (CD)

The CD workflow runs on every push to the `main` branch. It consists of the following jobs:

1. **Deploy to Development**: Deploys the application to the development environment and runs smoke tests.
2. **Deploy to Staging**: Deploys the application to the staging environment and runs E2E tests. This job requires manual approval.
3. **Deploy to Production**: Deploys the application to the production environment and runs health checks. This job requires manual approval.

## Local Development

### Git Hooks

This repository uses Husky to run git hooks:

- **Pre-commit**: Runs lint-staged to lint and format staged files, and then runs a full lint check.
- **Pre-push**: Runs unit tests to ensure all tests pass before pushing.

### Running Tests Locally

To run all tests locally:

```bash
npm run test:all
```

This will run linting, unit tests, and E2E tests.

To run specific test suites:

```bash
npm test          # Run unit tests
npm run test:e2e  # Run E2E tests
npm run test:cov  # Generate coverage report
npm run test:smoke # Run smoke tests
```

## Branch Protection Rules

The `main` branch is protected with the following rules:

1. Require status checks to pass before merging
2. Require branch to be up to date before merging
3. Require code owner reviews

## Deployment Process

### Development Environment

The development environment is automatically deployed on every push to the `main` branch. Smoke tests are run to ensure the deployment was successful.

### Staging Environment

The staging environment requires manual approval for deployment. E2E tests are run against the staging environment to ensure everything works as expected.

### Production Environment

The production environment requires manual approval for deployment. Health checks are run against the production environment to ensure everything is working correctly.

## Troubleshooting

### Common Issues

1. **Tests failing in CI but passing locally**: This is often due to environment differences. Check the CI logs for details.
2. **Deployment failing**: Check the deployment logs for details. Make sure all environment variables are set correctly.

### Getting Help

If you need help with the CI/CD pipeline, contact the DevOps team or open an issue in this repository. 