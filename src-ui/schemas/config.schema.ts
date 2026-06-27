/**
 * LFM Configuration Schema — Single Source of Truth (Frontend)
 *
 * This file defines the canonical TypeScript types for the LFM configuration.
 * Every field here MUST have a corresponding Rust counterpart in `src-tauri/src-ui/config.rs`.
 *
 * When adding a new config option:
 *   1. Add the field to the appropriate interface below.
 *   2. Add a matching default in `DEFAULT_CONFIG`.
 *   3. Add the corresponding Rust field in `config.rs` (with `serde(default = …)`).
 *   4. Add the UI control in `SettingsView.vue`.
 *
 * The Pinia config store and `tauri-bridge.ts` re-export these types —
 * any mismatch will surface as a compile-time TypeScript error.
 */

// ─── Appearance ─────────────────────────────────────────────────────────────

export interface LfmConfigAppearance {
    /** Active theme name (e.g. 'dark', 'light', 'lsnord', 'lsrosepine') */
    theme: string;
    /** Folder/icon theme set used by the backend and icon layer */
    icon_set: string;
    /** Icon size category */
    icon_size: "small" | "medium" | "large" | "extra-large";
    /** Base font size in pixels */
    font_size: number;
    /** Whether to display hidden (dot-prefixed) files */
    show_hidden_files: boolean;
    /** Visual treatment for hidden files when they are visible */
    hidden_files_visual_style: "dimmed" | "normal" | "blurred";
    /** Show native window control buttons (close/minimize/maximize) */
    window_controls: boolean;
    /** Show minimize button in window controls */
    show_minimize: boolean;
    /** Show maximize button in window controls */
    show_maximize: boolean;
    /** Show close button in window controls */
    show_close: boolean;
    /** Accent color palette key (e.g. 'orange', 'blue', 'teal') */
    accent: string;
}

// ─── Behavior ───────────────────────────────────────────────────────────────

export interface LfmConfigBehavior {
    /** Default directory opened when the app starts */
    default_path: string;
    /** Ask for confirmation before permanent deletes */
    confirm_delete: boolean;
    /** Open files/folders with a single click instead of double */
    single_click_open: boolean;
    /** Default sort mode for the workspace */
    sort_mode: "name" | "modified" | "size" | "kind";
}

// ─── Terminal ───────────────────────────────────────────────────────────────

export interface LfmConfigTerminal {
    /** Terminal emulator command (e.g. 'kitty', 'alacritty', 'gnome-terminal') */
    emulator: string;
}

// ─── Explorer ───────────────────────────────────────────────────────────────

export interface LfmConfigExplorer {
    /** Whether system/internal mount points should be shown in drive lists */
    show_mount_points: boolean;
}

// ─── Shortcuts ──────────────────────────────────────────────────────────────

export interface LfmConfigShortcuts {
    back: string[];
    forward: string[];
    refresh: string[];
    focus_search: string[];
    help: string[];
    rename: string[];
    toggle_preview: string[];
    toggle_ai: string[];
    goto_default_path: string[];
    open_settings: string[];
    next_tab: string[];
    previous_tab: string[];
    increase_icon_size: string[];
    decrease_icon_size: string[];
    select_all: string[];
    copy: string[];
    cut: string[];
    paste: string[];
    open_selected: string[];
    delete_selected: string[];
    clear_or_close: string[];
    toggle_selection: string[];
    toggle_selection_focused: string[];
    move_up: string[];
    move_down: string[];
    move_left: string[];
    move_right: string[];
    extend_up: string[];
    extend_down: string[];
    extend_left: string[];
    extend_right: string[];
    focus_up: string[];
    focus_down: string[];
    focus_left: string[];
    focus_right: string[];
}

// ─── Root Config ────────────────────────────────────────────────────────────

export interface LfmConfig {
    appearance: LfmConfigAppearance;
    behavior: LfmConfigBehavior;
    terminal: LfmConfigTerminal;
    explorer: LfmConfigExplorer;
    shortcuts: LfmConfigShortcuts;
}

// ─── Default Configuration ──────────────────────────────────────────────────

/**
 * The default configuration values.
 * Must match the Rust `impl Default for Config` in `config.rs`.
 */
export const DEFAULT_CONFIG: LfmConfig = {
    appearance: {
        theme: "dark",
        icon_set: "Papirus",
        icon_size: "medium",
        font_size: 14,
        show_hidden_files: false,
        hidden_files_visual_style: "dimmed",
        window_controls: true,
        show_minimize: true,
        show_maximize: true,
        show_close: true,
        accent: "orange",
    },
    behavior: {
        default_path: "/drives",
        confirm_delete: true,
        single_click_open: false,
        sort_mode: "kind",
    },
    terminal: {
        emulator: "kitty",
    },
    explorer: {
        show_mount_points: false,
    },
    shortcuts: {
        back: ["Alt+ArrowLeft"],
        forward: ["Alt+ArrowRight"],
        refresh: ["F5"],
        focus_search: ["Ctrl+f", "Meta+f"],
        help: ["F1"],
        rename: ["F2"],
        toggle_preview: ["F3"],
        toggle_ai: ["F4"],
        goto_default_path: ["F6"],
        open_settings: ["F7"],
        next_tab: ["Ctrl+PageDown", "Ctrl+Shift+ArrowRight"],
        previous_tab: ["Ctrl+PageUp", "Ctrl+Shift+ArrowLeft"],
        increase_icon_size: ["Ctrl+="],
        decrease_icon_size: ["Ctrl+-"],
        select_all: ["Ctrl+a", "Meta+a"],
        copy: ["Ctrl+c", "Meta+c"],
        cut: ["Ctrl+x", "Meta+x"],
        paste: ["Ctrl+v", "Meta+v"],
        open_selected: ["Enter"],
        delete_selected: ["Delete"],
        clear_or_close: ["Escape"],
        toggle_selection: ["Space"],
        toggle_selection_focused: ["Ctrl+Space", "Meta+Space"],
        move_up: ["ArrowUp"],
        move_down: ["ArrowDown"],
        move_left: ["ArrowLeft"],
        move_right: ["ArrowRight"],
        extend_up: ["Shift+ArrowUp"],
        extend_down: ["Shift+ArrowDown"],
        extend_left: ["Shift+ArrowLeft"],
        extend_right: ["Shift+ArrowRight"],
        focus_up: ["Ctrl+ArrowUp", "Meta+ArrowUp"],
        focus_down: ["Ctrl+ArrowDown", "Meta+ArrowDown"],
        focus_left: ["Ctrl+ArrowLeft", "Meta+ArrowLeft"],
        focus_right: ["Ctrl+ArrowRight", "Meta+ArrowRight"],
    },
};

// ─── Validation ─────────────────────────────────────────────────────────────

type PartialConfigSection<T> = {
    [K in keyof T]?: T[K];
};

type PartialLfmConfig = {
    appearance?: PartialConfigSection<LfmConfigAppearance>;
    behavior?: PartialConfigSection<LfmConfigBehavior>;
    terminal?: PartialConfigSection<LfmConfigTerminal>;
    explorer?: PartialConfigSection<LfmConfigExplorer>;
    shortcuts?: PartialConfigSection<LfmConfigShortcuts>;
};

export type ShortcutConfigKey = keyof LfmConfigShortcuts;

export const SHORTCUT_FIELD_ORDER: Array<{
    key: ShortcutConfigKey;
    label: string;
}> = [
    { key: "back", label: "Back" },
    { key: "forward", label: "Forward" },
    { key: "refresh", label: "Refresh" },
    { key: "focus_search", label: "Focus Search" },
    { key: "help", label: "Help" },
    { key: "rename", label: "Rename" },
    { key: "toggle_preview", label: "Toggle Preview Pane" },
    { key: "toggle_ai", label: "Toggle AI Sidebar" },
    { key: "goto_default_path", label: "Open Default Path" },
    { key: "open_settings", label: "Open Settings" },
    { key: "next_tab", label: "Next Tab" },
    { key: "previous_tab", label: "Previous Tab" },
    { key: "increase_icon_size", label: "Increase Icon Size" },
    { key: "decrease_icon_size", label: "Decrease Icon Size" },
    { key: "select_all", label: "Select All" },
    { key: "copy", label: "Copy" },
    { key: "cut", label: "Cut" },
    { key: "paste", label: "Paste" },
    { key: "open_selected", label: "Open Selected Item" },
    { key: "delete_selected", label: "Delete Selected Item" },
    { key: "clear_or_close", label: "Clear Selection / Close Overlay" },
    { key: "toggle_selection", label: "Toggle Selection" },
    { key: "toggle_selection_focused", label: "Toggle Focused Item Selection" },
    { key: "move_up", label: "Move Selection Up" },
    { key: "move_down", label: "Move Selection Down" },
    { key: "move_left", label: "Move Selection Left" },
    { key: "move_right", label: "Move Selection Right" },
    { key: "extend_up", label: "Extend Selection Up" },
    { key: "extend_down", label: "Extend Selection Down" },
    { key: "extend_left", label: "Extend Selection Left" },
    { key: "extend_right", label: "Extend Selection Right" },
    { key: "focus_up", label: "Focus Up (Keep Selection)" },
    { key: "focus_down", label: "Focus Down (Keep Selection)" },
    { key: "focus_left", label: "Focus Left (Keep Selection)" },
    { key: "focus_right", label: "Focus Right (Keep Selection)" },
];

const VALID_ICON_SIZES: LfmConfigAppearance["icon_size"][] = ["small", "medium", "large", "extra-large"];

const VALID_HIDDEN_FILE_STYLES: LfmConfigAppearance["hidden_files_visual_style"][] = ["dimmed", "normal", "blurred"];

function validateShortcutBindings(raw: Partial<LfmConfigShortcuts> | undefined, defaults: LfmConfigShortcuts): LfmConfigShortcuts {
    const result = {} as LfmConfigShortcuts;

    for (const key of Object.keys(defaults) as ShortcutConfigKey[]) {
        const value = raw?.[key];
        result[key] = Array.isArray(value)
            ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
            : defaults[key];

        if (result[key].length === 0) {
            result[key] = defaults[key];
        }
    }

    return result;
}

/**
 * Validates a raw config object, filling in missing fields with defaults.
 * Returns a fully-typed, safe `LfmConfig`.
 */
export function validateConfig(raw: PartialLfmConfig): LfmConfig {
    const d = DEFAULT_CONFIG;
    const appearance = raw.appearance ?? {};
    const behavior = raw.behavior ?? {};
    const terminal = raw.terminal ?? {};
    const explorer = raw.explorer ?? {};
    const shortcuts = raw.shortcuts;

    return {
        appearance: {
            theme: typeof appearance.theme === "string" ? appearance.theme : d.appearance.theme,
            icon_set: typeof appearance.icon_set === "string" ? appearance.icon_set : d.appearance.icon_set,
            icon_size: VALID_ICON_SIZES.includes(appearance.icon_size as LfmConfigAppearance["icon_size"])
                ? (appearance.icon_size as LfmConfigAppearance["icon_size"])
                : d.appearance.icon_size,
            font_size:
                typeof appearance.font_size === "number" && appearance.font_size >= 8 && appearance.font_size <= 32
                    ? appearance.font_size
                    : d.appearance.font_size,
            show_hidden_files: typeof appearance.show_hidden_files === "boolean" ? appearance.show_hidden_files : d.appearance.show_hidden_files,
            hidden_files_visual_style: VALID_HIDDEN_FILE_STYLES.includes(
                appearance.hidden_files_visual_style as LfmConfigAppearance["hidden_files_visual_style"],
            )
                ? (appearance.hidden_files_visual_style as LfmConfigAppearance["hidden_files_visual_style"])
                : d.appearance.hidden_files_visual_style,
            window_controls: typeof appearance.window_controls === "boolean" ? appearance.window_controls : d.appearance.window_controls,
            show_minimize: typeof appearance.show_minimize === "boolean" ? appearance.show_minimize : d.appearance.show_minimize,
            show_maximize: typeof appearance.show_maximize === "boolean" ? appearance.show_maximize : d.appearance.show_maximize,
            show_close: typeof appearance.show_close === "boolean" ? appearance.show_close : d.appearance.show_close,
            accent: typeof appearance.accent === "string" ? appearance.accent : d.appearance.accent,
        },
        behavior: {
            default_path: typeof behavior.default_path === "string" ? behavior.default_path : d.behavior.default_path,
            confirm_delete: typeof behavior.confirm_delete === "boolean" ? behavior.confirm_delete : d.behavior.confirm_delete,
            single_click_open: typeof behavior.single_click_open === "boolean" ? behavior.single_click_open : d.behavior.single_click_open,
            sort_mode: ["name", "modified", "size", "kind"].includes(behavior.sort_mode as any) ? (behavior.sort_mode as any) : d.behavior.sort_mode,
        },
        terminal: {
            emulator: typeof terminal.emulator === "string" ? terminal.emulator : d.terminal.emulator,
        },
        explorer: {
            show_mount_points: typeof explorer.show_mount_points === "boolean" ? explorer.show_mount_points : d.explorer.show_mount_points,
        },
        shortcuts: validateShortcutBindings(shortcuts, d.shortcuts),
    };
}
