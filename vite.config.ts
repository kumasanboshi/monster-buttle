import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  define: {
    'process.env.VITE_SERVER_URL': JSON.stringify(process.env.VITE_SERVER_URL || ''),
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});
