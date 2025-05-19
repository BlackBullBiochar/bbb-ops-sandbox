// vite.config.js
import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    // 1) First, handle your own source .js files before Vite’s normal JSX transform
    {
      name: 'treat-js-files-as-jsx',
      async transform(code, id) {
        if (!id.match(/src\/.*\.js$/)) return null;
        // use Vite’s esbuild under the hood to parse JSX in .js
        return transformWithEsbuild(code, id, {
          loader: 'jsx',
          jsx: 'automatic'
        });
      }
    },
    // 2) Then run the official React plugin (for HMR, fast refresh, etc.)
    react()
  ],

  // 3) Also force esbuild to see .js as JSX during dependency pre-bundling
  optimizeDeps: {
    force: true,
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
  },

  server: {
    open: true
  }
});
