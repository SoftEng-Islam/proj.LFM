# LFM

![LFM icon](src-tauri/icons/icon.png)

LFM is a Linux-first desktop file manager built with Vue, TypeScript, Rust, Tauri, Tailwind CSS, and Sass.

> Status: active rewrite. The new Vue frontend is being built in `src/`, while the previous implementation is preserved in `src/legacy/` for migration.

## Goals

- Build a fast desktop file manager focused on Linux workflows.
- Keep the UI modular with Vue feature folders instead of one large generic frontend tree.
- Use Rust and Tauri for native filesystem access and desktop packaging.
- Migrate old functionality gradually without deleting working reference code too early.

## Stack

- Vue 3
- TypeScript
- Rust
- Tauri
- Tailwind CSS
- Sass
- Vitest

## Project Layout

```text
src/
  App.vue
  main.ts
  components/
    layout/
    ui/
  features/
    explorer/
    navigation/
  styles/
  types/
  legacy/
src-tauri/
  src/
docs/
```

Notes:

- `src/` is the active frontend.
- `src/legacy/` contains the previous app code kept for migration.
- `src-tauri/` contains the Rust desktop backend and Tauri configuration.
- `docs/project-structure.md` documents the intended frontend shape.

## Development

Prerequisites:

- A recent Node.js installation
- pnpm `10.14.0` or newer
- A working Rust toolchain with `cargo`
- Linux system dependencies required by Tauri/WebKit

Install dependencies:

```sh
pnpm install
```

Run the web frontend only:

```sh
pnpm run dev
```

Run the desktop app with Tauri:

```sh
pnpm run tauri:dev
```

Useful commands:

```sh
pnpm run type-check
pnpm run lint
pnpm test
pnpm run build
```

## Current Direction

- Move file-manager features from `src/legacy/` into `src/features/`
- Add a typed frontend service layer for Tauri commands
- Rebuild navigation, explorer panes, operations, and settings as Vue features
- Keep the repo Linux-first and avoid drifting back into mixed frontend architectures

## Contributing

The project is still being reshaped, so contributions should follow the new structure instead of extending the old root-level frontend pattern.

Before adding new frontend code:

- Prefer `src/features/<feature-name>` for feature work
- Prefer `src/components/ui` for reusable UI primitives
- Leave `src/legacy/` as migration reference unless you are explicitly moving code out of it

## License

Apache-2.0. See [LICENSE](LICENSE).
