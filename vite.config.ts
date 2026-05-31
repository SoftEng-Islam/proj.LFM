import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
// import tsconfigPaths from 'vite-tsconfig-paths';
import VueDevTools from "vite-plugin-vue-devtools";
import Icons from "unplugin-icons/vite";
import svgLoader from "vite-svg-loader";
// import { visualizer } from 'rollup-plugin-visualizer';
import viteImagemin from "vite-plugin-imagemin";
import vuePugPlugin from "vite-plugin-pug";

export default defineConfig(({ mode }) => {
    const server = {
        port: 1420,
        // Tauri expects a fixed port, fail if that port is not available.
        strictPort: true,
        watch: {
            open: true,
            usePolling: true,
            interval: 300,
            ignored: ["**/src-tauri/target/**"],
        },
    };
    const plugins = [
        viteImagemin({
            gifsicle: {
                optimizationLevel: 7,
                interlaced: false,
            },
            optipng: {
                optimizationLevel: 7,
            },
            mozjpeg: {
                quality: 20,
            },
            pngquant: {
                quality: [0.8, 0.9],
                speed: 4,
            },
            svgo: {
                plugins: [
                    {
                        name: "removeViewBox",
                    },
                    {
                        name: "removeEmptyAttrs",
                        active: true,
                    },
                ],
            },
        }),
        vue({
            template: {
                preprocessOptions: {
                    // 'preprocessOptions' is passed through to the pug compiler
                    plugins: [vuePugPlugin],
                },
            },
        }),
        tailwindcss(),
        VueDevTools(),
        Icons({
            compiler: "vue3",
        }),
        svgLoader(),
    ];

    if (mode === "analyze") {
        // plugins.push(visualizer({ filename: 'dist/stats.html', open: false }));
    }

    return {
        // Prevent vite from obscuring rust errors
        clearScreen: false,
        server,
        // To make use of `TAURI_PLATFORM`, `TAURI_ARCH`, `TAURI_FAMILY`, `TAURI_PLATFORM_VERSION`, `TAURI_PLATFORM_TYPE`, and `TAURI_DEBUG` env variables
        envPrefix: ["VITE_", "TAURI_"],
        build: {
            // Tauri Supports es2021
            target: ["es2021", "chrome100", "safari13"],
            // Don't minify for debug builds
            minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
            // produce sourcemaps for debug builds
            sourcemap: !!process.env.TAURI_DEBUG,
        },
        css: {
            devSourcemap: mode === "development",
        },
        resolve: {
            tsconfigPaths: true,
            alias: {
                "@": fileURLToPath(new URL("./src-ui", import.meta.url)),
            },
        },
        plugins,
    };
});
