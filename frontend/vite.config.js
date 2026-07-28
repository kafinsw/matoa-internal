import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

const certPath = './certs/cert.pem';
const keyPath = './certs/key.pem';
const hasCert = fs.existsSync(certPath) && fs.existsSync(keyPath);

export default defineConfig({
  base: '/internal/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: hasCert
      ? { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }
      : undefined,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1/matoa_internal',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/uploads': {
        target: 'http://127.0.0.1/matoa_internal',
        changeOrigin: true,
      },
    },
  },
});
