# Project Structure

Recommended active structure for LFM:

```text
src-ui/
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
  src-ui/
```

Guidelines:

- Keep reusable primitives in `src-ui/components/ui`.
- Keep feature-specific views, composables, and data together under `src-ui/features/<feature-name>`.
- Keep global layout shells in `src-ui/components/layout`.
- Keep theme tokens and app-wide styling in `src-ui/styles`.
- Preserve old migration code in `src-ui/legacy` until each area has a Vue replacement.
