/// <reference types="vite/client" />
/// <reference types="unplugin-icons/types/vue" />

interface ImportMetaEnv {
	readonly VITE_APP_NAME?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

declare module 'vue-audio-visual' {
	import type { Component } from 'vue';

	export const AVCircle: Component;
	export const AVBars: Component;
	export const AVLine: Component;
	export const AVMedia: Component;
	export const AVPlugin: { install(app: unknown): void };
	export const AVWaveform: Component;
}
