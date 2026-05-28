# Copilot Instructions

To contribute effectively to this project, follow these guidelines:

### 1. Context & Preparation

- Read and follow all rules inside the `.ai/` directory before making changes.
- Always read relevant files completely before editing.
- Ask for clarification when requirements are ambiguous.

### 2. Architecture & Tech Stack

- Prioritize explicit user instructions, existing architecture, and repository conventions.
- Write idiomatic code for the project's stack (Rust, TypeScript, and Vue.js).
- For Vue components, strictly use the Vue 3 Composition API.
- When working across the Tauri backend/frontend, ensure IPC boundaries and security best practices are respected.

### 3. Code Quality & Style

- **Follow the project style:** Ensure all changes adhere to the existing codebase and documentation style.
- Preserve existing behavior unless explicitly instructed otherwise.
- Reuse existing utilities, composables, and components before creating new ones.
- Avoid unnecessary dependencies and broad, unrelated refactors.
- Keep edits minimal, focused, and maintainable.

### 4. Constraints & Tooling

- **No Hallucinations:** Do not fabricate APIs, files, directories, or behavior.
- Validate imports, types, and logic consistency before finalizing changes.
- Strictly use `pnpm` for JavaScript/TypeScript package management; avoid `npm` unless explicitly requested.
