import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  // Load environment variables based on the current mode
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    base: env.VITE_PUBLIC_PATH || '/',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: true,
      rollupOptions: {
        input: {
          main: fileURLToPath(new URL('index.html', import.meta.url))
        },
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            rete: ['rete', 'rete-area-plugin', 'rete-connection-plugin', 'rete-react-plugin'],
            vendor: ['three', 'elkjs']
          }
        }
      }
    },
    server: {
      port: 3000,
      open: true,
      host: true
    },
    preview: {
      port: 3000,
      open: true
    }
  };
});
