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
    chunkSizeWarningLimit: 1000,
    sourcemap: false, // Disable sourcemaps in production to reduce build time
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split node_modules into separate chunks to reduce memory usage
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@reduxjs')) {
              return 'vendor-redux';
            }
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs')) {
              return 'vendor-charts';
            }
            return 'vendor';
          }
        },
      },
    },
    // Optimize esbuild settings
    esbuild: {
      target: 'es2015',
      drop: ['console', 'debugger'], // Remove console and debugger in production
    },
  },
  // If you need to expose environment variables, use import.meta.env in your code instead of process.env
  // define: {
  //   "process.env": process.env,
  // },
});
