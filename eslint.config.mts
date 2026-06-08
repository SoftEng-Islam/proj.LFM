import { defineConfig } from "eslint/config";

import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import { vueTsConfigs } from "@vue/eslint-config-typescript";

export default defineConfig([
    {
        ignores: ["dist/**", "coverage/**", "node_modules/**", "src-tauri/**"],
    },
    { files: ["**/*.{js,mjs,cjs,ts,mts,cts,vue}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.browser } },
    tseslint.configs.recommended,
    pluginVue.configs["flat/essential"],
    vueTsConfigs.recommended,
    { files: ["**/*.vue"], languageOptions: { parserOptions: { parser: tseslint.parser } } },
]);
