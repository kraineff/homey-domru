import { $, type BuildConfig } from "bun";

const config: BuildConfig = {
    entrypoints: ["./src/index.ts"],
    target: "node",
    sourcemap: "inline",
    minify: true,
};

await $`rm -rf build`;
await Promise.all([
    Bun.build({
        ...config,
        format: "esm",
        outdir: "./build",
        naming: "[dir]/[name].js",
    }),
    Bun.build({
        ...config,
        format: "cjs",
        outdir: "./build/cjs",
        naming: "[dir]/[name].cjs",
    }),
]);
await $`tsc --outDir ./build`;
await $`tsc --outDir ./build/cjs`;
await $`echo '{"type": "commonjs"}' > ./build/cjs/package.json`;
await $`rm -rf domru-1.0.0.tgz`;
await $`npm pack`;