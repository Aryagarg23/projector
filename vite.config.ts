import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

function clientSideRoutingPlugin() {
  return {
    name: 'client-side-routing',
    configureServer(server: any) {
      return () => {
        server.middlewares.use((req: any, _res: any, next: any) => {
          if (req.method === 'GET' && !req.url.includes('.') && req.url !== '/') {
            req.url = '/';
          }
          next();
        });
      };
    },
  };
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    clientSideRoutingPlugin(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Opt-in only: forcing middleware mode breaks `vite` CLI dev server startup.
    middlewareMode: process.env.VITE_MIDDLEWARE_MODE === 'true',
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
