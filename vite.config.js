import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { viteSingleFile } from 'vite-plugin-singlefile'

const removeModuleAttribute = () => ({
  name: 'remove-module-attribute',
  transformIndexHtml(html) {
    return html.replace(/<script type="module" crossorigin/g, '<script');
  }
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte(), viteSingleFile(), removeModuleAttribute()],
  base: './', // CRITICAL: Generates relative paths for local file:// TV execution
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2015' // Compiles to ES2015, which is fully supported by esbuild and Tizen TV browsers
  }
})
