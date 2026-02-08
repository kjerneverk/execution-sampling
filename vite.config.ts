import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "execution-sampling",
      fileName: () => "index.js",
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        "@modelcontextprotocol/sdk",
        "@kjerneverk/execution",
        "node:crypto",
      ],
    },
    sourcemap: true,
    minify: false,
  },
  plugins: [dts({ rollupTypes: true })],
});
