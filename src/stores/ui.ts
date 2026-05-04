import { computed, watch } from 'vue';
import { useStorage } from '@vueuse/core';
import { acceptHMRUpdate, defineStore } from 'pinia';

import type { UiTheme } from '@/types/file-manager';

const themeStorageKey = 'lfm-theme';

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

export const useUiStore = defineStore('ui', () => {
	const theme = useStorage<UiTheme>(themeStorageKey, 'dark');
	const isDark = computed(() => theme.value === 'dark');
	const themeToggleLabel = computed(() => (isDark.value ? 'Light Mode' : 'Dark Mode'));

	watch(
		theme,
		(nextTheme) => {
			applyThemeToDocument(nextTheme);
		},
		{ immediate: true }
	);

	function initializeTheme() {
		applyThemeToDocument(theme.value);
	}

	function setTheme(nextTheme: UiTheme) {
		theme.value = nextTheme;
	}

	function toggleTheme() {
		setTheme(isDark.value ? 'light' : 'dark');
	}

	return {
		theme,
		isDark,
		themeToggleLabel,
		initializeTheme,
		setTheme,
		toggleTheme
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useUiStore, import.meta.hot));
}
