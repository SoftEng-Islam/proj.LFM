import './styles/vendor/tailwind.css';
import 'vue-toastification/dist/index.css';
import 'tippy.js/dist/tippy.css';
import 'animate.css';
import './styles/main.sass';

import { MotionPlugin } from '@vueuse/motion';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import Toast from 'vue-toastification';

import App from './App.vue';
import { tooltipDirective } from './directives/tooltip';
import router from './router';
import { useUiStore } from './stores/ui';
import { initShortcuts } from '@/renderer/shortcuts';
import { on as busOn } from '@/renderer/events/bus';
import { useFileManagerStore } from './stores/file-manager';
import { useSettingsStore } from './stores/settings';

document.title = import.meta.env.VITE_APP_NAME ?? 'LFM Explorer';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(MotionPlugin);
app.directive('tooltip', tooltipDirective);
app.use(Toast, {
	timeout: 2500,
	position: 'bottom-right',
	hideProgressBar: true,
	closeButton: false,
	maxToasts: 4,
	newestOnTop: true,
});

useUiStore(pinia).initializeTheme();

// Load settings and initialize global shortcuts + bus handlers.
(async () => {
	const settings = useSettingsStore(pinia);
	const fm = useFileManagerStore(pinia);

	try {
		await settings.load();
	} catch (e) {
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
		const raw = path || settings.defaultPath || '@drives';
		// Resolve known aliases to actual routes/paths
		let target = raw;
		if (raw === '@drives') target = '/drives';
		fm.openSection(target);
	});

	// Tab navigation: move to next/prev tab and push route
	function goTab(next = true) {
		const tabs = fm.windowTabs as any[];
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
	const sizes = ['small', 'medium', 'large', 'xlarge'];
	function adjustIconSize(delta: number) {
		const cur = settings.explorerIconSize || 'medium';
		const idx = Math.max(0, sizes.indexOf(cur));
		const n = Math.min(sizes.length - 1, Math.max(0, idx + delta));
		settings.explorerIconSize = sizes[n] as any;
		settings.save();
	}
	busOn('shortcut:icons-increase', () => adjustIconSize(1));
	busOn('shortcut:icons-decrease', () => adjustIconSize(-1));
	busOn('shortcut:icons-zoom', (payload: any) => {
		if (!payload || typeof payload.deltaY !== 'number') return;
		// deltaY < 0 => wheel up => increase
		adjustIconSize(payload.deltaY < 0 ? 1 : -1);
	});

	// Help fallback: open settings for now
	busOn('shortcut:help', () => fm.openSettings());

	// Finally mount the app after wiring
	app.mount('#app');
})();
