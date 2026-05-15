import type { RouteRecordRaw } from 'vue-router';

import FileManagerView from '@/features/explorer/views/FileManagerView.vue';
import SettingsView from '@/features/settings/views/SettingsView.vue';
import DrivesOverviewView from '@/features/storage/views/DrivesOverviewView.vue';
import { useConfigStore } from '@/stores/config';
import { getHomeDir } from '@/composables/useFilesystem';

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
		path: '/drives',
		name: 'drives',
		component: DrivesOverviewView,
		meta: {
			title: 'Storage Overview',
		},
	},
	{
		path: '/',
		name: 'root',
		redirect: () => {
			const store = useConfigStore();
			const defaultPath = store.config.behavior.default_path;
			// Use stored path, or resolve to home directory dynamically, or fallback to /drives
			if (defaultPath && defaultPath.startsWith('/')) {
				return defaultPath;
			}
			const home = getHomeDir();
			return home && home !== '/' ? home : '/drives';
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

export default routes;
