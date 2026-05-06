import type { RouteRecordRaw } from 'vue-router';

import FileManagerView from '@/features/explorer/views/FileManagerView.vue';
import { defaultPath } from '@/features/navigation/navigation';

const routes: RouteRecordRaw[] = [
	{
		path: '/',
		redirect: defaultPath
	},
	{
		path: '/:path(.*)*',
		name: 'browser',
		component: FileManagerView,
		meta: {
			title: 'LFM Explorer'
		}
	}
];

export default routes;
