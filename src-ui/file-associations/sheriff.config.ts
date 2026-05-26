import { type SheriffConfig } from "@softarc/sheriff-core";

export const sheriffConfig: SheriffConfig = {
    entryFile: "src-ui/module/index.ts",
    version: 1,
    autoTagging: true,
    tagging: {
        "src-ui/extension": "extension",
        "src-ui/core": "core",
        "src-ui/module": "module",
    },
    depRules: {
        root: ["core"],
        extension: ["core"],
        module: ["core"],
    },
};
