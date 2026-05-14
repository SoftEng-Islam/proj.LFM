import type { RouteRecordRaw } from 'vue-router';

import FileManagerView from '@/features/explorer/views/FileManagerView.vue';
import SettingsView from '@/features/settings/views/SettingsView.vue';
import DrivesOverviewView from '@/features/storage/views/DrivesOverviewView.vue';
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
			return store.config.behavior.default_path || '/drives';
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
