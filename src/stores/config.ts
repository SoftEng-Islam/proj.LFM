import { acceptHMRUpdate, defineStore } from 'pinia';
import { useUiStore } from '@/stores/ui';
import { useExplorerStore } from '@/stores/explorer.store';
import { getConfig as getConfigCommand, saveConfig as saveConfigCommand, getHomeDir, watchConfigFile } from '@/services/tauri-bridge';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { LfmConfig } from '@/schemas/config.schema';
import { DEFAULT_CONFIG, validateConfig } from '@/schemas/config.schema';

export const useConfigStore = defineStore('config', {
	state: () => ({
		config: { ...DEFAULT_CONFIG } as LfmConfig,
		isLoading: false,
		isSaving: false,
		error: '',
		saveMessage: '',
		/** Tracks whether we're currently saving to prevent echo from the watcher */
		_suppressNextWatch: false,
		_watcherUnlisten: null as UnlistenFn | null,
	}),
	actions: {
		async loadConfig() {
			this.isLoading = true;
			this.error = '';
			try {
				const config = await getConfigCommand();
				// Set default path to user's home directory if not set
				if (!config.behavior.default_path) {
					const homeDir = await getHomeDir();
					config.behavior.default_path = homeDir;
				}
				this.config = validateConfig(config);
				this.applyLiveConfig();
				// Start watching the config file for external changes
				await this.startConfigWatcher();
			} catch (error) {
				this.error = String(error ?? 'Unable to load configuration.');
			} finally {
				this.isLoading = false;
			}
		},
		async saveConfig() {
			const configToSave = {
				...this.config,
				appearance: {
					...this.config.appearance,
					font_size: Number(this.config.appearance.font_size),
				},
			};
			this.isSaving = true;
			this.error = '';
			this.saveMessage = '';
			this._suppressNextWatch = true;
			try {
				await saveConfigCommand(configToSave);
				this.saveMessage = 'Configuration saved successfully.';
				this.applyLiveConfig();
			} catch (error) {
				this.error = String(error ?? 'Unable to save configuration.');
				this._suppressNextWatch = false;
			} finally {
				this.isSaving = false;
				// Reset the suppression flag after a short delay so the
				// watcher event triggered by our own write gets ignored.
				setTimeout(() => {
					this._suppressNextWatch = false;
				}, 500);
			}
		},
		applyLiveConfig() {
			const a = this.config.appearance;
			useUiStore().setTheme(a.theme);
			useExplorerStore().showHiddenFiles = a.show_hidden_files;
			document.documentElement.dataset.accent = a.accent || 'orange';
			document.documentElement.style.setProperty('--lfm-font-size', String(a.font_size) + 'px');
			const sizes: Record<string, number> = { small: 16, medium: 24, large: 32, 'extra-large': 48 };
			document.documentElement.style.setProperty('--lfm-icon-size', String(sizes[a.icon_size] || 24) + 'px');
		},
		/**
		 * Start watching the config file for external changes.
		 * When `~/.config/LFM/config.toml` is modified outside the app,
		 * the Rust backend emits a `config_file_changed` event and we
		 * reactively reload the config into the store.
		 */
		async startConfigWatcher() {
			// Avoid duplicate watchers
			if (this._watcherUnlisten) return;
			try {
				// Ask Rust to start the file system watcher
				await watchConfigFile();
				// Listen for change events from the backend
				this._watcherUnlisten = await listen<LfmConfig>('config_file_changed', (event) => {
					if (this._suppressNextWatch) return;
					const incoming = validateConfig(event.payload);
					this.config = incoming;
					this.applyLiveConfig();
				});
			} catch (err) {
				// Non-fatal — the app works fine without the watcher,
				// it just won't auto-reload on external edits.
				console.warn('[LFM] Could not start config file watcher:', err);
			}
		},
		/** Clean up the watcher listener when the store is destroyed. */
		stopConfigWatcher() {
			if (this._watcherUnlisten) {
				this._watcherUnlisten();
				this._watcherUnlisten = null;
			}
		},
	},
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useConfigStore, import.meta.hot));
}
