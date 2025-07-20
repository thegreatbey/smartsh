import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts", "src/index.ts"],
  format: ["esm", "cjs"],  // ✅ BOTH formats
  target: "node14",
  splitting: false,
  clean: true,
  dts: true,
  banner: {
    js: "#!/usr/bin/env node"
  }
});
