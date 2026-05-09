/// <reference types="vite/client" />
/// <reference types="unplugin-icons/types/vue" />

interface ImportMetaEnv {
	readonly VITE_APP_NAME?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
