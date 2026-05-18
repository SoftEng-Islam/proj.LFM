import { acceptHMRUpdate, defineStore } from 'pinia';
import { readData, writeData } from '@/services/tauri-bridge';

export type IconSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface SettingsState {
	showWindowControls: boolean;
	sidebarIconSize: IconSize;
	explorerIconSize: IconSize;
	theme: 'light' | 'dark' | 'system';
	accentColor: string;
	showPreviewPane: boolean;
	defaultPath: string;
	shortcuts: Record<string, string>;
}

function defaults(): SettingsState {
	return {
		showWindowControls: true,
		sidebarIconSize: 'medium',
		explorerIconSize: 'medium',
		theme: 'system',
		accentColor: '',
		showPreviewPane: true,
		defaultPath: '@drives',
		shortcuts: {},
	};
}

export const useSettingsStore = defineStore('settings', {
	state: (): SettingsState => defaults(),
	actions: {
		async load() {
			try {
				const res = await readData('user:settings');
				if (res && res.status && res.data) {
					Object.assign(this, res.data as Partial<SettingsState>);
				}
			} catch (e) {
				// ignore — keep defaults
				 
				console.warn('Could not load settings, using defaults', e);
			}
		},
		async save() {
			try {
				await writeData('user:settings', {
					showWindowControls: this.showWindowControls,
					sidebarIconSize: this.sidebarIconSize,
					explorerIconSize: this.explorerIconSize,
					theme: this.theme,
					accentColor: this.accentColor,
					showPreviewPane: this.showPreviewPane,
					defaultPath: this.defaultPath,
					shortcuts: this.shortcuts,
				});
			} catch (e) {
				 
				console.error('Failed to save settings', e);
			}
		},
		setIconSizes(sidebar: IconSize, explorer: IconSize) {
			this.sidebarIconSize = sidebar;
			this.explorerIconSize = explorer;
			void this.save();
		},
	},
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useSettingsStore, import.meta.hot));
}

export default useSettingsStore;
