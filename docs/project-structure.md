# Project Structure

Recommended active structure for LFM:

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
```

Guidelines:

- Keep reusable primitives in `src/components/ui`.
- Keep feature-specific views, composables, and data together under `src/features/<feature-name>`.
- Keep global layout shells in `src/components/layout`.
- Keep theme tokens and app-wide styling in `src/styles`.
- Preserve old migration code in `src/legacy` until each area has a Vue replacement.
