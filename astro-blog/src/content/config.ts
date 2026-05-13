import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Schema de frontmatter para todas las guías/artículos de Dinari.
 *
 * Uso mínimo (campos requeridos):
 *   title, description, slug, heroTitle, heroSubtitle, heroBadge,
 *   publishDate, canonical, breadcrumbs
 *
 * Uso completo: ver campos opcionales abajo.
 */
const guias = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/guias' }),
  schema: z.object({
    // ── SEO básico ──────────────────────────────────────────────────────────
    title:       z.string().max(70),
    description: z.string().max(160),
    canonical:   z.string().url(),
    robots:      z.string().default('index, follow'),

    // ── Open Graph ──────────────────────────────────────────────────────────
    ogTitle:       z.string().optional(),
    ogDescription: z.string().optional(),
    ogType:        z.enum(['article', 'website']).default('article'),
    ogImage:       z.string().url().optional(),

    // ── Hero del artículo ───────────────────────────────────────────────────
    heroTitle:    z.string(),
    heroSubtitle: z.string(),
    heroBadge:    z.string().default('Guía'),
    heroColor:    z.enum(['sage', 'charcoal', 'stone']).default('sage'),

    // ── Metadatos del artículo ──────────────────────────────────────────────
    publishDate:  z.coerce.date(),
    updatedDate:  z.coerce.date().optional(),
    author:       z.string().default('Dinari'),
    category:     z.string().default('Finanzas Personales'),
    readTime:     z.number().optional(), // minutos

    // ── Breadcrumbs ─────────────────────────────────────────────────────────
    breadcrumbs: z.array(
      z.object({
        name: z.string(),
        url:  z.string(),
      })
    ).min(1),

    // ── Schema.org ──────────────────────────────────────────────────────────
    schemaType: z
      .enum(['Article', 'HowTo', 'FAQPage', 'Article+FAQ'])
      .default('Article'),

    faqItems: z
      .array(
        z.object({
          question: z.string(),
          answer:   z.string(),
        })
      )
      .optional(),

    howToSteps: z
      .array(
        z.object({
          name: z.string(),
          text: z.string(),
        })
      )
      .optional(),

    // ── Sidebar CTA ─────────────────────────────────────────────────────────
    sidebarCta: z
      .object({
        icon:  z.string(),
        title: z.string(),
        desc:  z.string(),
        links: z.array(
          z.object({
            text:    z.string(),
            href:    z.string(),
            variant: z.enum(['sage', 'outline', 'ghost']).default('sage'),
          })
        ),
      })
      .optional(),

    // ── AdSense ─────────────────────────────────────────────────────────────
    // publisher ID global se configura en ArticleLayout.astro
    // Aquí se definen los slots específicos de cada artículo.
    // Formato: "ca-pub-XXXXXXXXXX" o vacío para placeholder
    adSlots: z
      .object({
        afterIntro:         z.string().optional(),
        midArticle:         z.string().optional(),
        beforeConclusion:   z.string().optional(),
        sidebar:            z.string().optional(),
      })
      .optional(),

    // ── Artículos relacionados ───────────────────────────────────────────────
    relatedArticles: z
      .array(
        z.object({
          title: z.string(),
          href:  z.string(),
          badge: z.string().optional(),
        })
      )
      .optional(),
  }),
});

export const collections = { guias };
