import { acceptHMRUpdate, defineStore } from 'pinia';
import { useUiStore } from '@/stores/ui';
import { useExplorerStore } from '@/stores/explorer.store';
import { getConfig as getConfigCommand, saveConfig as saveConfigCommand } from '@/services/tauri-bridge';
import type { LfmConfig } from '@/services/tauri-bridge';

function createDefaultConfig(): LfmConfig {
	return {
		appearance: {
			theme: 'dark',
			icon_set: 'Papirus',
			font_size: 14,
			show_hidden_files: false,
		},
		behavior: {
			default_path: '/home/user',
			confirm_delete: true,
			single_click_open: false,
		},
		terminal: {
			emulator: 'kitty',
		},
	};
}

export const useConfigStore = defineStore('config', {
	state: () => ({
		config: createDefaultConfig() as LfmConfig,
		isLoading: false,
		isSaving: false,
		error: '',
		saveMessage: '',
	}),
	actions: {
		async loadConfig() {
			this.isLoading = true;
			this.error = '';
			try {
				const config = await getConfigCommand();
				this.config = config;
				useUiStore().setTheme(config.appearance.theme);
				useExplorerStore().showHiddenFiles = config.appearance.show_hidden_files;
			} catch (error) {
				this.error = String(error ?? 'Unable to load configuration.');
			} finally {
				this.isLoading = false;
			}
		},
		async saveConfig() {
			this.isSaving = true;
			this.error = '';
			this.saveMessage = '';
			try {
				await saveConfigCommand(this.config);
				this.saveMessage = 'Configuration saved successfully.';
				useUiStore().setTheme(this.config.appearance.theme);
				useExplorerStore().showHiddenFiles = this.config.appearance.show_hidden_files;
			} catch (error) {
				this.error = String(error ?? 'Unable to save configuration.');
			} finally {
				this.isSaving = false;
			}
		},
	},
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useConfigStore, import.meta.hot));
}
