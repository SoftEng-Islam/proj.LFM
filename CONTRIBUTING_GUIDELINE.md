# Contributing to LFM

Thank you for your interest in contributing to LFM! We want to make this the best file manager for Linux, and your help is appreciated.

## Our Philosophy

We follow a **Centralized Development** model. We encourage all contributors to work on the main codebase at `https://github.com/softeng/proj.LFM`. This helps us maintain a unified vision and ensures that all users benefit from every improvement.

## How to Contribute

### 1. Report Bugs

Use the GitHub Issues tab to report bugs. Please provide as much detail as possible, including your Linux distribution and desktop environment.

### 2. Suggest Features

We are open to new ideas! Open an issue to discuss your feature suggestion before starting development.

### 3. Submit Pull Requests

- Fork the repository.
- Create a new feature branch (`git checkout -b feature/amazing-feature`).
- Ensure your code passes linting (`pnpm run lint`) and tests (`pnpm test`).
- Commit your changes (`git commit -m 'Add some amazing feature'`).
- Push to the branch (`git push origin feature/amazing-feature`).
- Open a Pull Request.

## Development Guidelines

- **Structure**: New frontend features should go into `src-ui/features/<feature-name>`.
- **Styling**: Use the design tokens defined in `src-ui/styles/main.sass`.
- **Types**: Always use TypeScript and provide proper type definitions.

## Branding Notice

LFM is open source, but its name and identity are central to the project. If you fork the project for your own purposes, you must rename the project and use different branding.

---

By contributing, you agree that your contributions will be licensed under the project's **GPL-v3 License**.
