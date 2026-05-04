import type { RouteRecordRaw } from 'vue-router';

import FileManagerView from '@/features/explorer/views/FileManagerView.vue';
import { defaultSectionId, routeSections } from '@/features/navigation/navigation';

const routes: RouteRecordRaw[] = [
	{
		path: '/',
		redirect: `/${defaultSectionId}`
	},
	...routeSections.map((section) => ({
		path: section.path,
		name: section.id,
		component: FileManagerView,
		meta: {
			sectionId: section.id,
			title: `${section.label} · LFM Explorer`
		}
	})),
	{
		path: '/:pathMatch(.*)*',
		redirect: `/${defaultSectionId}`
	}
];

export default routes;
