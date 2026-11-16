import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const base = env.VITE_BASE_PATH || "/";
  if (!/^\/([A-Za-z0-9._~-]+\/)*$/.test(base) || /\/{1,2}\.{1,2}\//.test(base)) {
    throw new Error("VITE_BASE_PATH must be a root-relative path with a trailing slash.");
  }

  return {
    base,
    plugins: [react()],
    server: { host: "0.0.0.0", port: 3000, strictPort: true },
    build: { sourcemap: false },
  };
});
