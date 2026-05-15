import { acceptHMRUpdate, defineStore } from 'pinia';
import { useUiStore } from '@/stores/ui';
import { useExplorerStore } from '@/stores/explorer.store';
import { getConfig as getConfigCommand, saveConfig as saveConfigCommand } from '@/services/tauri-bridge';
import type { LfmConfig } from '@/services/tauri-bridge';

function createDefaultConfig(): LfmConfig {
return {
appearance: {
theme: 'dark',
icon_size: 'medium',
font_size: 14,
show_hidden_files: false,
window_controls: true,
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
try {
await saveConfigCommand(configToSave);
this.saveMessage = 'Configuration saved successfully.';
useUiStore().setTheme(this.config.appearance.theme);
useExplorerStore().showHiddenFiles = this.config.appearance.show_hidden_files;
} catch (error) {
this.error = String(error ?? 'Unable to save configuration.');
} finally {
this.isSaving = false;
}
},
applyLiveConfig() {
const a = this.config.appearance;
useUiStore().setTheme(a.theme);
useExplorerStore().showHiddenFiles = a.show_hidden_files;
document.documentElement.style.setProperty('--lfm-font-size', String(a.font_size) + 'px');
const sizes: Record<string, number> = { small: 16, medium: 24, large: 32 };
document.documentElement.style.setProperty('--lfm-icon-size', String(sizes[a.icon_size] || 24) + 'px');
},
},
});

if (import.meta.hot) {
import.meta.hot.accept(acceptHMRUpdate(useConfigStore, import.meta.hot));
}
