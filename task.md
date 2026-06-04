# Status Bar — Complete Implementation

## What We're Building

The existing status bar only shows item count and selected count. According to the roadmap (`.ai/6.Known-Issues.md §11`), the status bar needs:

1. ✅ **[Done]** Item count in current directory
2. ✅ **[Done]** Selected item count
3. ☐ **Terminal panel** with `@xterm/xterm` (VSCode-like)
4. ☐ **Log support**
5. ☐ **Git integration** (current dir status)
6. ☐ **Running Processes** — copy/move/delete/compress progress

> [!IMPORTANT]
> The terminal (xterm) is the most complex piece. We will build a **panel** that slides up from the status bar (exactly like VSCode) — not embedded inline. The status bar stays at the bottom and acts as a toggle/launcher.

> [!NOTE]
> Git and Logs are **read-only info panels** — no backend commands needed beyond `git status` in a shell process. For now, git info will be shown via a dedicated Rust command. We will implement the running processes tracker using the already-existing `useOperationsStore`.

---

## Architecture

```
StatusBar.vue                    ← thin orchestration component (replaces current)
  ├── components/
  │   ├── StatusBarLeft.vue      ← item count + selected count (existing logic)
  │   ├── StatusBarRight.vue     ← right-side icons / toggles
  │   └── StatusBarPanel.vue     ← slide-up panel container (xterm/logs/git/tasks)
  │       ├── TerminalTab.vue    ← xterm.js terminal
  │       ├── LogTab.vue         ← scrollable log feed
  │       ├── GitTab.vue         ← git status info
  │       └── TasksTab.vue       ← running file operations
  └── useStatusBar.ts            ← composable (panel state + xterm instance mgmt)
```

The xterm plugin **`@xterm/xterm`** is already installed. We also need **`@xterm/addon-fit`** for auto-resize — we'll check if it's installed; if not we will use the basic terminal size.

---

## Proposed Changes

### Frontend

---

#### [MODIFY] [StatusBar.vue](file:///SSD/github/proj.LFM/src-ui/modules/StatusBar/StatusBar.vue)

Rewrite to be a slim orchestrator: renders left section (counts), right section (toggle buttons), and the slide-up panel.

---

#### [NEW] `src-ui/modules/StatusBar/useStatusBar.ts`

Composable holding:

- `panelOpen`, `activeTab` state
- xterm Terminal instance + FitAddon lifecycle
- `openPanel(tab)`, `togglePanel()`, `closePanel()` actions

---

#### [NEW] `src-ui/modules/StatusBar/components/TerminalTab.vue`

- Mounts `@xterm/xterm` Terminal into a `div`
- Uses a PTY-like shell via Tauri's `invoke('execute_command')` or spawns a shell process
- Auto-focuses on open, cleans up on unmount

> [!WARNING]
> A true PTY terminal requires a Rust command that spawns a shell (bash/zsh) and streams I/O. We will implement a **basic interactive shell** via a new Rust command `open_pty_shell`. For the first iteration we can use a simpler approach: xterm display with `invoke`-based I/O.

---

#### [NEW] `src-ui/modules/StatusBar/components/LogTab.vue`

- Displays app log entries reactively from a log store or `@tauri-apps/plugin-log` events

---

#### [NEW] `src-ui/modules/StatusBar/components/GitTab.vue`

- Calls a new Rust command `get_git_status(path)` → returns branch name + changed file count
- Shows branch indicator, modified/staged/untracked counts

---

#### [NEW] `src-ui/modules/StatusBar/components/TasksTab.vue`

- Reads from the existing `useOperationsStore` queue
- Shows running/pending/failed operations with type, source, and a progress indicator

---

### Backend (Rust)

#### [MODIFY] [main.rs](file:///SSD/github/proj.LFM/src-tauri/src/main.rs)

- Register new commands in `invoke_handler`

#### [NEW] `src-tauri/src/commands/terminal.rs`

- `get_git_status(path: String)` — runs `git -C <path> status --porcelain -b` and parses output

---

## Open Questions

> [!IMPORTANT]
> **Terminal PTY**: A full interactive PTY shell (like VSCode's terminal) requires streaming stdout/stderr back to xterm in real time. This needs either:
> (a) A Tauri plugin like `tauri-plugin-shell` (check if installed), or
> (b) A custom Rust async command that spawns a PTY and streams events.
>
> **Approach We prefer:**
>
> - Use `tauri-plugin-shell` to spawn a shell and pipe I/O via events (simpler)

---

## Verification Plan

- Run `pnpm run type-check` after all TS changes
- Run `nix-shell --run "cd src-tauri && cargo check"` after Rust changes
- Visual check of the status bar panel opening/closing
