import { acceptHMRUpdate, defineStore } from 'pinia';
import type { UiTheme } from '@/types/file-manager';

const themeStorageKey = 'lfm-theme';
const defaultTheme: UiTheme = 'dark';

function applyThemeToDocument(theme: UiTheme) {
	if (typeof document === 'undefined') {
		return;
	}

	const root = document.documentElement;
	root.classList.toggle('dark', theme === 'dark');
	root.classList.toggle('light', theme === 'light');
	root.dataset.theme = theme;
	root.style.colorScheme = theme;
}

function resolveInitialTheme(): UiTheme {
	if (typeof window === 'undefined') {
		return defaultTheme;
	}

	const storedTheme = window.localStorage.getItem(themeStorageKey);
	if (storedTheme === 'light' || storedTheme === 'dark') {
		return storedTheme as UiTheme;
	}

	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function persistTheme(theme: UiTheme) {
	if (typeof window === 'undefined') {
		return;
	}
	window.localStorage.setItem(themeStorageKey, theme);
}

export const useUiStore = defineStore('ui', {
	state: () => ({
		theme: defaultTheme as UiTheme,
		hasHydratedTheme: false,
	}),
	getters: {
		isDark: (state) => state.theme === 'dark',
		themeToggleLabel(): string {
			return this.isDark ? 'Light Mode' : 'Dark Mode';
		},
	},
	actions: {
		initializeTheme() {
			if (!this.hasHydratedTheme) {
				this.theme = resolveInitialTheme();
				this.hasHydratedTheme = true;
			}
			persistTheme(this.theme);
			applyThemeToDocument(this.theme);
		},
		setTheme(nextTheme: UiTheme) {
			this.theme = nextTheme;
			this.hasHydratedTheme = true;
			persistTheme(this.theme);
			applyThemeToDocument(this.theme);
		},
		toggleTheme() {
			this.setTheme(this.isDark ? 'light' : 'dark');
		},
	},
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useUiStore, import.meta.hot));
}
