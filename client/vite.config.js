import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5001,
    host: true,
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
    target: 'es2015',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    // Use terser with conservative settings to avoid initialization issues
    minify: 'terser',
    terserOptions: {
      compress: {
        // Disable optimizations that can cause "Cannot access before initialization" errors
        hoist_funs: false,
        hoist_vars: false,
        dead_code: true,
        drop_console: false, // Keep console logs for debugging
        keep_infinity: true,
        passes: 1, // Reduce passes to avoid aggressive optimization
      },
      mangle: {
        // Less aggressive variable mangling
        keep_classnames: true,
        keep_fnames: true,
      },
      format: {
        comments: false,
      },
    },
    cssMinify: true,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        // Let Vite handle chunking automatically - more reliable
        // manualChunks: undefined,
      },
    },
  },
});
