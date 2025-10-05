# Contributing to Notefinity Core

Thank you for your interest in contributing to Notefinity Core! This document provides guidelines and information for contributors.

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, include:

- **Clear description** of the bug
- **Steps to reproduce** the behavior
- **Expected vs actual behavior**
- **Environment details** (OS, Node.js version, etc.)
- **Code samples** that demonstrate the issue

### Suggesting Features

Feature requests are welcome! Please:

- Use GitHub Discussions for feature proposals
- Describe the use case and motivation
- Consider if the feature belongs in the core or should be an extension

### Pull Requests

1. **Fork** the repository
2. **Create a branch** from `main`: `git checkout -b feature/my-feature`
3. **Make your changes** following our coding standards
4. **Add tests** for new functionality
5. **Update documentation** as needed
6. **Run tests** and ensure they pass: `npm test`
7. **Format code**: `npm run format`
8. **Commit** with a clear message
9. **Push** to your branch: `git push origin feature/my-feature`
10. **Submit a pull request**

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/notefinity-core.git
cd notefinity-core

# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build

# Start development mode (watch)
npm run dev
```

## Coding Standards

### TypeScript

- Use TypeScript for all code
- Follow strict type checking
- Export types and interfaces for public APIs
- Use meaningful variable and function names

### Code Style

- Code is automatically formatted with Prettier
- Run `npm run format` before committing
- Follow existing patterns in the codebase

### Testing

- Write tests for new functionality
- Maintain or improve test coverage
- Tests should be descriptive and test real use cases
- Use Jest testing framework

### Documentation

- Document public APIs with JSDoc comments
- Update README.md for significant changes
- Include code examples for new features

## Project Structure

```
src/
├── page-manager.ts    # Main PageManager class
├── index.ts          # Package exports
└── types.ts          # TypeScript definitions

tests/                 # Test files
├── page-manager.test.ts
└── setup.ts

docs/                  # Additional documentation
└── api/              # API documentation
```

## Commit Message Guidelines

Use clear, descriptive commit messages:

```
feat: add support for page tags
fix: resolve memory leak in page deletion
docs: update API documentation
test: add tests for page filtering
refactor: improve error handling in createNote
```

## Release Process

Releases are handled by maintainers:

1. Version bumping follows [Semantic Versioning](https://semver.org/)
2. Changes are documented in CHANGELOG.md
3. Releases are tagged and published to npm

## Getting Help

- 💬 [GitHub Discussions](https://github.com/your-org/notefinity-core/discussions)
- 📧 Email: core-maintainers@notefinity.com
- 💬 Discord: [Notefinity Community](https://discord.gg/notefinity)

## Recognition

Contributors will be recognized in:

- CONTRIBUTORS.md file
- Release notes
- GitHub contributors graph

Thank you for helping make Notefinity Core better! 🎉
