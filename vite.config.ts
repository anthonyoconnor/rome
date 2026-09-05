import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
 css: { postcss: { plugins: [tailwindcss()] } },
 plugins: [react(), {
  name: 'citizen-trial-route',
  configureServer(server) {
   server.middlewares.use((request, _response, next) => {
    if (request.url === '/trials/citizens-3d/' || request.url === '/trials/citizens-3d') {
     request.url = '/trials/citizens-3d/index.html';
    }
    next();
   });
  },
 }],
 resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
 server: { host: '127.0.0.1', port: 5173, strictPort: true },
});
