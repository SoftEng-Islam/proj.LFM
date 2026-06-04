import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import { defineConfigWithVueTs, vueTsConfigs } from "@vue/eslint-config-typescript";
import skipFormatting from "@vue/eslint-config-prettier/skip-formatting";

export default defineConfigWithVueTs(
    {
        ignores: ["dist/**", "coverage/**", "node_modules/**", "src-tauri/**"],
    },
    // Base JS rules applied globally (respecting your ignores)
    js.configs.recommended,
    {
        name: "lfm/app",
        files: ["src-ui/**/*.{ts,vue}", "vite.config.ts"],
        // The `extends` helper here safely applies these flat configs
        // strictly to the `files` matched above.
        extends: [pluginVue.configs["flat/recommended"], vueTsConfigs.recommended],
        rules: {
            "vue/multi-word-component-names": "off",
            "@typescript-eslint/consistent-type-imports": "error",
        },
    },
    skipFormatting,
);
