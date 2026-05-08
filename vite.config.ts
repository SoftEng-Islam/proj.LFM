import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import VueDevTools from 'vite-plugin-vue-devtools';

export default defineConfig(async ({ mode }) => {
    const plugins = [vue(), tailwindcss(), VueDevTools()];

    if (process.env.ANALYZE === 'true') {
        const { visualizer } = await import('rollup-plugin-visualizer');
        plugins.push(
            visualizer({
                open: true,
                filename: 'dist/stats.html',
                gzipSize: true,
                brotliSize: true,
            })
        );
    }

    return {
        clearScreen: false,
        plugins,
        server: {
            host: '0.0.0.0',
            port: 1420,
            strictPort: true,
            open: false,
            watch: {
                ignored: ['**/src-tauri/target/**'],
            },
        },
        preview: {
            host: '0.0.0.0',
            port: 4173,
            strictPort: true,
        },
        css: {
            devSourcemap: mode === 'development',
            preprocessorOptions: {
                sass: {
                    api: 'modern-compiler',
                    indentedSyntax: true,
                },
            },
        },
        resolve: {
            alias: [
                { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
                { find: /^daisyui$/, replacement: fileURLToPath(new URL('./node_modules/daisyui/index.js', import.meta.url)) },
                { find: /^daisyui\/theme$/, replacement: fileURLToPath(new URL('./node_modules/daisyui/theme/index.js', import.meta.url)) },
            ],
            tsconfigPaths: true,
        },
    };
});
