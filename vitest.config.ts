import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        include: ["lib/**/*.test.ts", "src-ui/**/*.test.ts"],
        exclude: ["node_modules/**", "dist/**"],
    },
});
