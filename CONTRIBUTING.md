# Contributing to Rete.js Workflow Editor

Thank you for your interest in contributing to the Rete.js Workflow Editor! We appreciate your time and effort in making this project better. This guide will help you get started with contributing.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** to your local machine
3. **Create a new branch** for your feature or bugfix
4. **Install dependencies** with `npm install`
5. **Start the development server** with `npm run dev`

## 🧑‍💻 Development Workflow

### Code Style

We use the following tools to maintain code quality:

- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type checking

Run these commands to ensure your code follows our standards:

```bash
# Check for linting errors
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Format code
npm run format

# Check TypeScript types
npm run type-check
```

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages. This helps with generating changelogs and versioning.

Format: `type(scope): description`

Example:
```
feat(nodes): add RedditScraperNode
fix(ui): resolve node positioning issue
```

### Pull Requests

1. Keep your PRs focused on a single feature or bugfix
2. Update the documentation if necessary
3. Make sure all tests pass
4. Reference any related issues in your PR description
5. Request reviews from maintainers

## 🧪 Testing

We use Vitest for testing. To run tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm run test:coverage
```

## 📝 Adding New Nodes

1. Create a new file in `src/nodes/` following the naming convention `YourNodeNameNode.ts`
2. Extend the `BaseNode` class
3. Implement the required methods:
   - `getInputs()`: Define input ports
   - `getOutputs()`: Define output ports
   - `getControls()`: Define node controls
   - `executeNode()`: Implement node logic

Example node structure:

```typescript
import { BaseNode } from '../core/BaseNode';

export class YourNodeNameNode extends BaseNode {
  constructor() {
    super('YourNodeName');
    this.addControl('someControl', {
      type: 'text',
      label: 'Some Setting',
      defaultValue: ''
    });
  }

  // Implement required methods...
}
```

## 📚 Documentation

- Update the README.md for significant changes
- Add JSDoc comments for all public methods and classes
- Document any breaking changes in the CHANGELOG.md

## 🐛 Reporting Bugs

Found a bug? Please open an issue with:

1. A clear title and description
2. Steps to reproduce
3. Expected vs actual behavior
4. Screenshots if applicable
5. Browser/OS version

## 💡 Feature Requests

Have an idea for a new feature? Open an issue with:

1. A clear description of the feature
2. Why it would be useful
3. Any potential implementation ideas

## 🤝 Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

## 🙏 Thank You!

Your contributions make open source software amazing. Thank you for your time and effort!
