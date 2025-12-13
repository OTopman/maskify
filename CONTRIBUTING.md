# Contributing to Maskify

Thank you for your interest in contributing to Maskify! We welcome contributions from the community and appreciate your effort in helping us improve this project.

## Table of Contents

- [Contributing to Maskify](#contributing-to-maskify)
  - [Table of Contents](#table-of-contents)
  - [Code of Conduct](#code-of-conduct)
  - [Getting Started](#getting-started)
  - [Description](#description)
  - [Reporting Issues](#reporting-issues)
  - [Questions?](#questions)
  - [License](#license)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/OTopman/maskify.git
   cd maskify
3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/OTopman/maskify.git

## Development Setup
1. Install dependencies:
   ```bash
   npm install
2. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
3. Set up your development environment according to the project's README

## Making Changes
- Create a feature branch for each piece of work
- Make sure your code follows the project's coding standards
- Write clear, descriptive commit messages
- Keep commits atomic and focused on a single issue
- Update documentation as needed

## Submitting Changes
### Before You Submit
1. Pull the latest changes from upstream:
   ```bash
   git fetch upstream
   git rebase upstream/main

2. Run tests to ensure everything passes:
   ```bash
   npm test

3. Check your code for linting issues:
   ```bash
   npm run lint

4. Build the project to ensure no build errors:
   ```bash
   npm run build


## Coding Standards
- **Code Style:** Follow the existing code style in the repository
- **Naming Conventions:** Use descriptive, meaningful names for variables, functions, and files
- **Comments:** Add comments for complex logic and non-obvious implementations
- **No console.log:** Use proper logging methods instead
- **Error Handling:** Implement proper error handling and validation
- **Performance:** Consider performance implications of your changes

## Testing
- **Write tests** for new features and bug fixes
- **Maintain or improve** code coverage
- **Test edge cases** and error scenarios
- **Run all tests** before submitting:
  ```bash
  npm test

## Documentation
- Update the README.md if your changes affect usage
- Add inline comments for complex logic
- Update API documentation if applicable
- Include examples for new features
- Keep documentation clear and concise

## Commit Message Guidelines
Follow these guidelines for commit messages:
- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line
- Example:
  ```code
  - Add user authentication module
  - Implement JWT-based authentication
  - Add login and logout endpoints
  - Create user model with validation
    
    Closes #123

## Pull Request Process
1. Update your branch with the latest upstream changes:
    ```bash
    git fetch upstream
    git rebase upstream/main
2. Push to your fork:
   ```bash
   git push origin feature/your-feature-name

3. Create a Pull Request on GitHub with:

   - Clear title describing the changes
   - Detailed description of what was changed and why
   - Reference to related issues (e.g., "Closes #123")
   - Screenshots or examples if applicable
4. PR Description Template:
   ```
   ## Description
    Brief description of the changes

    ## Type of Change
    - [ ] Bug fix
    - [ ] New feature
    - [ ] Documentation update
    - [ ] Performance improvement

    ## Related Issues
    Closes #(issue number)

    ## How Has This Been Tested?
    Describe the tests you ran and how to reproduce them.

    ## Checklist
    - [ ] My code follows the style guidelines of this project
    - [ ] I have performed a self-review of my own code
    - [ ] I have commented my code, particularly in hard-to-understand areas
    - [ ] I have made corresponding changes to the documentation
    - [ ] My changes generate no new warnings
    - [ ] I have added tests that prove my fix is effective or that my feature works
    - [ ] New and existing unit tests passed locally with my changes
5. **Respond to feedback** - Be open to suggestions and ready to make changes based on review comments
6. **Once approved**, a maintainer will merge your PR

## Reporting Issues
- Check if the issue already exists
- Provide a clear description of the issue
- Include steps to reproduce the bug
- Add relevant error messages or logs
- Mention your environment (OS, Node version, etc.)

## Questions?
Feel free to open an issue with the ```question``` label if you need clarification or have questions about contributing.

## License
By contributing to Maskify, you agree that your contributions will be licensed under the project's license.

Thank you for helping make Maskify better! 🎉
