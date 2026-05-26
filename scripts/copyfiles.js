const cpy = require("cpy");

(async () => {
    await cpy(["src-ui/**/*", "!src-ui/**/*.ts", "src-ui/lib/**/*", "build/**/*", "!src-ui/**/*.scss"], "out", {
        parents: true,
    });
})();
