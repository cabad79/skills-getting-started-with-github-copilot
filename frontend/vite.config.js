import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh
      fastRefresh: true,
      // Optimize JSX runtime
      jsxRuntime: 'automatic',
    })
  ],

  // Performance optimizations
  build: {
    // Optimize for S3/Vercel deployment
    outDir: 'dist',
    assetsDir: 'assets',

    // Enable minification with esbuild (faster than terser)
    minify: 'esbuild',

    // Generate source maps for production debugging (disable for max performance)
    sourcemap: false,

    // Chunk splitting strategy
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and related libraries
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          // Separate chunk for SQL.js (large dependency)
          'database': ['sql.js', 'localforage']
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },

    // Chunk size warning limit (500kb)
    chunkSizeWarningLimit: 500,

    // CSS code splitting
    cssCodeSplit: true,

    // Enable tree-shaking
    target: 'esnext',

    // Optimize dependencies
    commonjsOptions: {
      transformMixedEsModules: true,
    },

    // Asset inlining threshold (4kb)
    assetsInlineLimit: 4096,

    // Terser options (if using terser)
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
  },

  // Dev server optimizations
  server: {
    // Enable HMR
    hmr: true,

    // Port configuration
    port: 5173,
    strictPort: false,

    // Optimize dependencies
    fs: {
      strict: true,
    },
  },

  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['sql.js'], // Large WASM file, exclude from pre-bundling
    esbuildOptions: {
      // Optimize esbuild
      target: 'esnext',
    },
  },

  // Enable CSS preprocessing
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      // Add global CSS variables if needed
    },
    // CSS modules configuration
    modules: {
      localsConvention: 'camelCase',
    },
  },

  // Preview server config
  preview: {
    port: 4173,
    strictPort: false,
  },

  // Base URL - set this to your S3 bucket URL if using subdirectory
  base: './',

  // Experimental features
  experimental: {
    // Optimize dependency pre-bundling
    renderBuiltUrl(filename) {
      return './' + filename
    }
  },
})
