/**
 * LFM Configuration Schema — Single Source of Truth (Frontend)
 *
 * This file defines the canonical TypeScript types for the LFM configuration.
 * Every field here MUST have a corresponding Rust counterpart in `src-tauri/src/config.rs`.
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
	/** Icon size category */
	icon_size: 'small' | 'medium' | 'large' | 'extra-large';
	/** Base font size in pixels */
	font_size: number;
	/** Whether to display hidden (dot-prefixed) files */
	show_hidden_files: boolean;
	/** Show native window control buttons (close/minimize/maximize) */
	window_controls: boolean;
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
}

// ─── Terminal ───────────────────────────────────────────────────────────────

export interface LfmConfigTerminal {
	/** Terminal emulator command (e.g. 'kitty', 'alacritty', 'gnome-terminal') */
	emulator: string;
}

// ─── Root Config ────────────────────────────────────────────────────────────

export interface LfmConfig {
	appearance: LfmConfigAppearance;
	behavior: LfmConfigBehavior;
	terminal: LfmConfigTerminal;
}

// ─── Default Configuration ──────────────────────────────────────────────────

/**
 * The default configuration values.
 * Must match the Rust `impl Default for Config` in `config.rs`.
 */
export const DEFAULT_CONFIG: LfmConfig = {
	appearance: {
		theme: 'dark',
		icon_size: 'medium',
		font_size: 14,
		show_hidden_files: false,
		window_controls: true,
		accent: 'orange',
	},
	behavior: {
		default_path: '',
		confirm_delete: true,
		single_click_open: false,
	},
	terminal: {
		emulator: 'kitty',
	},
};

// ─── Validation ─────────────────────────────────────────────────────────────

const VALID_ICON_SIZES: LfmConfigAppearance['icon_size'][] = [
	'small',
	'medium',
	'large',
	'extra-large',
];

/**
 * Validates a raw config object, filling in missing fields with defaults.
 * Returns a fully-typed, safe `LfmConfig`.
 */
export function validateConfig(raw: Partial<LfmConfig>): LfmConfig {
	const d = DEFAULT_CONFIG;
	const appearance = raw.appearance ?? {};
	const behavior = raw.behavior ?? {};
	const terminal = raw.terminal ?? {};

	return {
		appearance: {
			theme: typeof appearance.theme === 'string' ? appearance.theme : d.appearance.theme,
			icon_size: VALID_ICON_SIZES.includes(appearance.icon_size as any)
				? (appearance.icon_size as LfmConfigAppearance['icon_size'])
				: d.appearance.icon_size,
			font_size:
				typeof appearance.font_size === 'number' && appearance.font_size >= 8 && appearance.font_size <= 32
					? appearance.font_size
					: d.appearance.font_size,
			show_hidden_files:
				typeof appearance.show_hidden_files === 'boolean'
					? appearance.show_hidden_files
					: d.appearance.show_hidden_files,
			window_controls:
				typeof appearance.window_controls === 'boolean'
					? appearance.window_controls
					: d.appearance.window_controls,
			accent: typeof appearance.accent === 'string' ? appearance.accent : d.appearance.accent,
		},
		behavior: {
			default_path:
				typeof behavior.default_path === 'string' ? behavior.default_path : d.behavior.default_path,
			confirm_delete:
				typeof behavior.confirm_delete === 'boolean' ? behavior.confirm_delete : d.behavior.confirm_delete,
			single_click_open:
				typeof behavior.single_click_open === 'boolean'
					? behavior.single_click_open
					: d.behavior.single_click_open,
		},
		terminal: {
			emulator: typeof terminal.emulator === 'string' ? terminal.emulator : d.terminal.emulator,
		},
	};
}
