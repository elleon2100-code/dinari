import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { createReadStream, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Vite plugin: serve CSS y JS del directorio raíz de Dinari durante dev.
 * En producción los paths absolutos (/css/, /js/) resuelven desde dinari.app/.
 */
const dinariStaticPlugin = {
  name: 'dinari-parent-static',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const cssMatch = req.url?.split('?')[0].match(/^\/css\/(.+\.css)$/);
      const jsMatch  = req.url?.split('?')[0].match(/^\/js\/(.+\.js)$/);

      if (cssMatch) {
        const filePath = resolve(__dirname, '..', 'css', cssMatch[1]);
        if (existsSync(filePath)) {
          res.setHeader('Content-Type', 'text/css; charset=utf-8');
          createReadStream(filePath).pipe(res);
          return;
        }
      }
      if (jsMatch) {
        const filePath = resolve(__dirname, '..', 'js', jsMatch[1]);
        if (existsSync(filePath)) {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          createReadStream(filePath).pipe(res);
          return;
        }
      }
      next();
    });
  },
};

export default defineConfig({
  site: 'https://dinari.app',
  output: 'static',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/dev/'),
    }),
  ],
  vite: {
    plugins: [dinariStaticPlugin],
  },
});
