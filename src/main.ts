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

app.mount('#app');
