import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/services/nfc/index.ts"],
  clean: true,
  dts: true,
  format: ["cjs", "esm"],
  sourcemap: true,
  minify: false,
});
