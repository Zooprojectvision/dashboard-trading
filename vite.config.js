// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [
    // Plugin React (Fast Refresh, JSX, etc.)
    react(),
  ],

  // Résolutions pratiques pour des imports propres: import X from '@/components/X'
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  // Dev server
  server: {
    port: 5173,        // même port que tu utilises déjà
    strictPort: true,  // si 5173 est pris, Vite ne bascule pas automatiquement
    open: true,        // ouvre automatiquement le navigateur
    host: true,        // utile si tu testes depuis un autre device sur le LAN
  },

  // Build
  build: {
    outDir: 'dist',        // défaut Vite
    sourcemap: false,      // passe à true si tu veux debugger la prod
    chunkSizeWarningLimit: 1000, // évite les warnings trop stricts
  },

  // ⚠️ Dé-commente uniquement si tu déploies sous un sous-répertoire (ex: /zpv/)
  // base: '/zpv/',

  // Optimisations (optionnel)
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'recharts',
    ],
  },
})
