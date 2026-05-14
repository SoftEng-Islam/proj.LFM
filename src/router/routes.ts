import type { RouteRecordRaw } from 'vue-router';

import FileManagerView from '@/features/explorer/views/FileManagerView.vue';
import SettingsView from '@/features/settings/views/SettingsView.vue';
import { useConfigStore } from '@/stores/config';

const routes: RouteRecordRaw[] = [
	{
		path: '/settings',
		name: 'settings',
		component: SettingsView,
		meta: {
			title: 'LFM Settings',
		},
	},
	{
		path: '/',
		name: 'root',
		redirect: () => {
			const store = useConfigStore();
			return store.config.behavior.default_path || '/';
		},
	},
	{
		path: '/:path(.*)*',
		name: 'browser',
		component: FileManagerView,
		meta: {
			title: 'LFM Explorer',
		},
	},
];

if (defaultPath !== '/') {
	routes.unshift({
		path: '/',
		redirect: defaultPath,
	});
}

export default routes;
