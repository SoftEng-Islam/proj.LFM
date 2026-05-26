import './styles/vendor/tailwind.css';
import 'tippy.js/dist/tippy.css';
import './styles/main.css';

import { MotionPlugin } from '@vueuse/motion';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { tooltipDirective } from './directives/tooltip';
import router from './router';
import { useUiStore } from './stores/ui';
import { initShortcuts } from '@/renderer/shortcuts';
import { on as busOn } from '@/renderer/events/bus';
import { useFileManagerStore } from './stores/file-manager';
import { useConfigStore } from './stores/config';

document.title = import.meta.env.VITE_APP_NAME ?? 'LFM Explorer';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(MotionPlugin);
app.directive('tooltip', tooltipDirective);

useUiStore(pinia).initializeTheme();

// Load settings and initialize global shortcuts + bus handlers.
(async () => {
	const fm = useFileManagerStore(pinia);
	const configStore = useConfigStore(pinia);

	try {
		await configStore.loadConfig();
	} catch {
		// ignore
	}

	// Initialize keyboard shortcuts (uses settings for default path when needed)
	initShortcuts();

	// Shortcut handlers
	busOn('shortcut:back', () => {
		router.go(-1);
	});
	busOn('shortcut:forward', () => {
		router.go(1);
	});
	busOn('shortcut:open-settings', () => {
		fm.openSettings();
	});
	busOn('shortcut:toggle-preview', () => {
		fm.toggleDetails();
	});
	busOn('shortcut:toggle-ai', () => {
		fm.toggleAiChat();
	});
	busOn('shortcut:goto-default-path', (path: string) => {
		const raw = path || configStore.config.behavior.default_path || '/drives';
		// Resolve known aliases to actual routes/paths
		let target = raw;
		if (raw === '@drives') target = '/drives';
		router.push(target);
	});

	// Tab navigation: move to next/prev tab and push route
	function goTab(next = true) {
		const tabs = fm.windowTabs;
		const currentTab = router.currentRoute.value.query.tab;
		let idx = -1;

		if (typeof currentTab === 'string' && currentTab) {
			idx = tabs.findIndex((t) => t.id === currentTab);
		}

		if (idx === -1) {
			const currentPath = router.currentRoute.value.path;
			idx = tabs.findIndex((t) => t.path === currentPath);
		}

		if (idx === -1) return;
		const newIdx = next ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length;
		const tab = tabs[newIdx];
		if (tab && tab.path) router.push({ path: tab.path, query: { tab: tab.id } });
	}
	busOn('shortcut:tab-next', () => goTab(true));
	busOn('shortcut:tab-prev', () => goTab(false));

	// Icon size helpers
	const sizes = ['small', 'medium', 'large', 'extra-large'] as const;
	let iconSizeSaveTimer: ReturnType<typeof setTimeout> | null = null;
	function adjustIconSize(delta: number) {
		const cur = configStore.config.appearance.icon_size || 'medium';
		const idx = Math.max(0, sizes.indexOf(cur));
		const n = Math.min(sizes.length - 1, Math.max(0, idx + delta));
		const nextSize = sizes[n] ?? 'medium';
		configStore.config.appearance.icon_size = nextSize;
		configStore.applyLiveConfig();

		if (iconSizeSaveTimer) clearTimeout(iconSizeSaveTimer);
		iconSizeSaveTimer = setTimeout(() => {
			void configStore.saveConfig();
		}, 250);
	}
	busOn('shortcut:icons-increase', () => adjustIconSize(1));
	busOn('shortcut:icons-decrease', () => adjustIconSize(-1));
	busOn('shortcut:icons-zoom', (payload: { deltaY: number }) => {
		if (!payload || typeof payload.deltaY !== 'number') return;
		// deltaY < 0 => wheel up => increase
		adjustIconSize(payload.deltaY < 0 ? 1 : -1);
	});

	// Help fallback: open settings for now
	busOn('shortcut:help', () => fm.openSettings());
	busOn('shortcut:refresh', () => fm.refresh());
	busOn('shortcut:open-selected', () => {
		if (fm.selectedItem?.id) {
			void fm.openItem(fm.selectedItem.id);
		}
	});
	busOn('shortcut:delete-selected', () => {
		void fm.deleteSelection();
	});
	busOn('shortcut:copy', () => {
		if (fm.selectedItems.length > 0) {
			fm.setClipboard(fm.selectedItems.map((item) => item.id), 'copy');
		}
	});
	busOn('shortcut:cut', () => {
		if (fm.selectedItems.length > 0) {
			fm.setClipboard(fm.selectedItems.map((item) => item.id), 'cut');
		}
	});
	busOn('shortcut:paste', () => {
		void fm.paste();
	});
	busOn('shortcut:select-all', () => {
		fm.selectAllItems();
	});
	busOn('shortcut:escape', () => {
		if (fm.expandedPreviewId) {
			fm.setExpandedPreviewId(null);
			return;
		}

		if (fm.settingsOpen) {
			fm.closeSettings();
			return;
		}

		if (document.querySelector('.LFM-context-menu, .LFM-modal-overlay')) {
			return;
		}

		if (fm.detailsOpen) {
			fm.toggleDetails();
			return;
		}

		if (fm.aiChatOpen) {
			fm.toggleAiChat();
			return;
		}

		fm.clearSelection();
	});

	// Finally mount the app after wiring
	app.mount('#app');
})();
