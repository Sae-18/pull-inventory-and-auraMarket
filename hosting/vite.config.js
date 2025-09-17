import { defineConfig } from 'vite';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(),],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'home.html'),
        login: resolve(__dirname, 'pull.html'),
        auth: resolve(__dirname, 'login.html'),
        // Add more pages here
      },
    },
  },
});
