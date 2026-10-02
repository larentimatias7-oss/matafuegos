import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Check if dev SSL certificates exist
const certPath = path.resolve(__dirname, 'certs/dev-cert.pem');
const keyPath = path.resolve(__dirname, 'certs/dev-key.pem');
const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);

// Enable HTTPS if requested via flag, env, or dev:https
const isHttpsMode = (
  process.env.HTTPS === 'true' || 
  process.env.VITE_HTTPS === 'true' || 
  process.argv.includes('--https')
) && hasCerts;

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all network interfaces (0.0.0.0) for mobile LAN testing
    port: 5173,
    https: isHttpsMode ? {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    } : false,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist'
  }
});
