import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  return {
    plugins: [react(), tailwindcss()],
    build: {
      outDir: '../../src/main/resources/static',
      emptyOutDir: true,
    },
    // define: {
    //   'import.meta.env.VITE_API_URL': isProduction ? '""' : undefined,
    // },
  };
});
