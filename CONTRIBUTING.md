# Contributing to Dice Roller

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Please be respectful and constructive in all interactions. We aim to maintain a welcoming and inclusive environment for all contributors.

## Getting Started

### Setting Up Your Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/dice
   cd dice
   ```

3. Install development dependencies:
   ```bash
   npm install
   ```

4. Verify your setup:
   ```bash
   npm test
   ```

## Development Workflow

### Making Changes

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes, following the coding standards below

3. Add or update tests to cover your changes

4. Run all tests before committing:
   ```bash
   npm test
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run with interactive UI
npm run test:ui

# Update snapshots after intentional visual changes
npm run test:update-snapshots
```

### Serving Locally

Open `index.html` directly in a browser, or use the included server script to test on other devices (e.g. a phone on the same network):

```bash
./serve.sh
```

## Coding Standards

- Vanilla JS, HTML, and CSS — no build step, no frameworks
- Keep all logic in `src/`, styles in `css/`
- Write clear, descriptive commit messages
- Use meaningful variable names — avoid abbreviations
- One die, plural is dice. Never write "dices"
- Use "Roll" (not "Throw") in user-facing text and in code

## Testing Guidelines

- Write Playwright tests for all new features and bug fixes
- Ensure existing tests still pass
- Use descriptive test names that explain what is being tested
- Group related tests in the same spec file

## Commit Message Guidelines

- Use the imperative mood ("Add feature" not "Added feature")
- Keep the first line under 72 characters
- Reference issues and PRs where relevant
- Provide additional context in the body if needed

Example:
```
Add mystery mode confirmation on Restart

When Restart is clicked while any die is in mystery mode,
show a confirmation modal before proceeding.

Fixes #42
```

## Submitting a Pull Request

1. Push your changes to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Open a Pull Request on GitHub against the `main` branch

3. Fill out the PR description with:
   - Clear description of the changes
   - Motivation and context
   - How the changes have been tested
   - Any breaking changes
   - Related issue numbers

4. Wait for review and address any feedback

5. Once approved, a maintainer will merge your PR

## Pull Request Review Process

- All PRs require at least one review before merging
- CI checks must pass (tests)
- Reviewers may request changes or clarifications
- Be responsive to feedback and questions

## Reporting Bugs

If you find a bug, please open an issue on GitHub with:

- Clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Your environment (OS, browser, device type)
- Any relevant console errors
- Screenshots or screen recordings if applicable

## Requesting Features

Feature requests are welcome! Please:

- Check existing issues to avoid duplicates
- Clearly describe the feature and its use case
- Explain why it would be useful to other users
- Consider submitting a PR if you can implement it

## Documentation

- Update `README.md` for any user-facing changes
- Update `INSTRUCTIONS.md` if requirements change
- Keep code self-documenting with meaningful names

## Questions?

- Check existing documentation and issues first
- Open a GitHub issue for questions about contributing

## License

By contributing to Dice Roller, you agree that your contributions will be licensed under the MIT License.
