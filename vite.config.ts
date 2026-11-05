import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  cacheDir: './.tmp/vite-cache',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'lucide-react'],
          katex: ['katex'],
          hicumData: [
            './src/data/hicumParameters.ts',
            './src/data/hicumEquations.ts',
            './src/data/hicumCircuit.ts',
          ],
        },
      },
    },
  }
})
