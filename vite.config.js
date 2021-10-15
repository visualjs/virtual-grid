import path from 'path';
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'VisualJS',
      fileName: (format) => `virtual-grid.${format}.js`
    },
    sourcemap: true
  }
});
