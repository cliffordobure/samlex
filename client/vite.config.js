import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5001,
    host: true, // This allows external connections
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  build: {
    minify: 'esbuild',
    target: 'es2015',
    chunkSizeWarningLimit: 2000,
    sourcemap: false,
    cssCodeSplit: false, // Disable CSS code splitting to reduce complexity
    rollupOptions: {
      output: {
        // Simplified output without manual chunks
        format: 'es',
      },
      onwarn(warning, warn) {
        // Suppress specific warnings
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        warn(warning);
      },
    },
    // Simplified esbuild config
    esbuild: {
      target: 'es2015',
    },
  },
  // If you need to expose environment variables, use import.meta.env in your code instead of process.env
  // define: {
  //   "process.env": process.env,
  // },
});
