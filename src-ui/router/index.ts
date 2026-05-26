import { createRouter, createWebHistory } from 'vue-router';

import routes from './routes';

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes,
	linkActiveClass: 'active',
	linkExactActiveClass: 'exact-active',
	scrollBehavior(_to, _from, savedPosition) {
		if (savedPosition) {
			return savedPosition;
		}

		return {
			left: 0,
			top: 0
		};
	}
});

export default router;
