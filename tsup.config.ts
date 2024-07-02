import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  splitting: false,
  sourcemap: "inline",
  treeshake: true,
  clean: true,
  format: ["esm", "cjs"],
});
