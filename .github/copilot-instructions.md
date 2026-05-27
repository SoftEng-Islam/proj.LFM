# Copilot instructions

To contribute effectively to this project, follow these guidelines:

Before making changes:

1. Read and follow all rules inside the `.ai/` directory.
2. Prioritize:
    - explicit user instructions
    - existing architecture
    - repository conventions
    - framework best practices
3. **Follow the project style**: Ensure all changes adhere to the existing code and documentation style. Review the [project's codebase](/) to understand the conventions used. Preserve existing behavior unless explicitly instructed otherwise.
4. Avoid broad refactors and unrelated changes.
5. Reuse existing utilities, composables, and components before creating new ones.
6. Keep edits minimal, focused, and maintainable.
7. Do not hallucinate APIs, files, directories, or behavior.
8. Validate imports, types, and consistency before finishing changes.
9. Avoid unnecessary dependencies and abstractions.
10. Ask for clarification when requirements are ambiguous.
11. Prefer pnpm for JavaScript and TypeScript package management.
12. Avoid npm unless explicitly requested.
13. Prefer existing project tooling and conventions.
14. **Rules for Material Design icons** Ensure all changes in [Material Design icons](/src-ui/file-associations) will follow these rules
    1. **Use Material Design color palette**: When working with icons in [Material Design icons](/src-ui/file-associations), use colors from the [Material Design color palette](/src-ui/file-associations/material-colors.yml). This ensures visual consistency across the project.
    2. **Adhere to the project architecture**: Familiarize yourself with the [project's architecture](/src-ui/file-associations/src/architecture.md). The core logic is separated from the extension logic. The core handles icon manifest generation, icon associations, and translation. The extension interacts with the VS Code API. Make sure to respect the dependency rules between modules.
    3. **Design pixel-perfect icons**: Create icons that are sharp and clear at 16x16 pixels. Align icons to a **16x16 grid** to ensure sharpness and avoid blurriness. More details are available in the [CONTRIBUTING.md](/CONTRIBUTING.md#pixel-perfect-icons).
    4. **Write clean, modular, and well-documented code**: Document your code thoroughly and ensure it is easy to understand and maintain.
    5. **Test your changes**: Always test your changes to ensure they do not break existing functionality.
    6. **Keep it simple**: Aim for simplicity in your solutions and avoid unnecessary complexity.
    7. **Add new icons appropriately**:
    - Use colors from the [Material Design color palette](https://material.io/design/color/the-color-system.html).
    - Ensure icons have proper spacing (Read [CONTRIBUTING.md](/CONTRIBUTING.md#icon-spacing)).
    - Assign icons uniquely to file names, extensions, or folder names according to the [project guidelines](/CONTRIBUTING.md).
    - Provide separate icons for different color themes if necessary (Read [CONTRIBUTING.md](/CONTRIBUTING.md#icons-for-color-themes)).
    8. **Clone existing icons when possible**: If you need a variant of an existing icon with a different color, clone the icon through configuration without creating a new SVG (Read [CONTRIBUTING.md](/CONTRIBUTING.md#icon-cloning)).
    9. **Contribute to translations**: If you notice errors in translations, you can help fix them by editing the appropriate translation files (`package.nls*.json`).

Always read relevant files completely before editing.
Always ensure that your contributions comply with the project's guidelines and do not introduce any disallowed content.
