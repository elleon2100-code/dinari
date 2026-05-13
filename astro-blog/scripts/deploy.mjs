/**
 * deploy.mjs — Copia el output de Astro a las carpetas correctas del sitio Dinari.
 *
 * Uso:
 *   node scripts/deploy.mjs           → producción
 *   node scripts/deploy.mjs --preview → solo preview local (no sobreescribe raíz)
 *
 * Qué hace:
 *  1. Por cada slug en dist/, copia dist/[slug]/index.html → ../[slug]/index.html
 *  2. Copia dist/sitemap-*.xml → ../sitemap-blog.xml (referencia para integrar)
 *  3. No toca los demás archivos del sitio raíz (simulador, calculadora, etc.)
 */

import { cp, readdir, stat, writeFile } from 'fs/promises';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const distDir    = resolve(__dirname, '..', 'dist');
const rootDir    = resolve(__dirname, '..', '..');
const isPreview  = process.argv.includes('--preview');

// Slugs que son artículos de blog (añadir aquí cuando agregues nuevos)
const ARTICLE_SLUGS = [
  'metodo-bola-de-nieve',
  'como-salir-de-deudas',
  'el-peligro-del-pago-minimo',
  'hoja-de-ruta-financiera',
  'retiro-tardio',
];

async function main() {
  if (!existsSync(distDir)) {
    console.error('❌ No existe dist/. Ejecuta "npm run build" primero.');
    process.exit(1);
  }

  console.log(`\n🚀 Dinari Blog Deploy ${isPreview ? '(preview)' : '(producción)'}\n`);

  for (const slug of ARTICLE_SLUGS) {
    const srcHtml = resolve(distDir, slug, 'index.html');
    const dstDir  = resolve(rootDir, slug);
    const dstHtml = resolve(dstDir, 'index.html');

    if (!existsSync(srcHtml)) {
      console.warn(`⚠️  No se encontró dist/${slug}/index.html — ¿existe ese artículo?`);
      continue;
    }

    if (!isPreview) {
      await cp(srcHtml, dstHtml, { force: true });
      console.log(`✅ ${slug}/index.html → copiado a raíz`);
    } else {
      console.log(`🔍 (preview) Encontrado: dist/${slug}/index.html`);
    }
  }

  // Copiar el index de guias
  const indexSrc = resolve(distDir, 'index.html');
  const indexDstDir = resolve(rootDir, 'guias');
  const indexDst = resolve(indexDstDir, 'index.html');
  if (existsSync(indexSrc)) {
    if (!isPreview) {
      // Create guias directory if it doesn't exist
      if (!existsSync(indexDstDir)) {
        await import('fs/promises').then(fs => fs.mkdir(indexDstDir, { recursive: true }));
      }
      await cp(indexSrc, indexDst, { force: true });
      console.log(`✅ guias/index.html → copiado a raíz`);
    } else {
      console.log(`🔍 (preview) Encontrado: dist/index.html`);
    }
  }

  // Copiar sitemap del blog como referencia
  const sitemapSrc = resolve(distDir, 'sitemap-index.xml');
  if (existsSync(sitemapSrc)) {
    const sitemapDst = resolve(rootDir, 'sitemap-blog.xml');
    if (!isPreview) {
      await cp(sitemapSrc, sitemapDst, { force: true });
      console.log('✅ sitemap-blog.xml → copiado a raíz');
    }
  }

  console.log('\n✨ Deploy completado.\n');
  if (isPreview) {
    console.log('💡 Para desplegar en producción, ejecuta: npm run deploy\n');
  }
}

main().catch((err) => {
  console.error('❌ Error en deploy:', err);
  process.exit(1);
});
