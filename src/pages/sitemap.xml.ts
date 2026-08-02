import type { APIRoute } from 'astro';

export const prerender = true;

const SITE = 'https://brickify.fun';

type RouteGroup = {
  xDefault: string;
  en?: string;
  es?: string;
  changefreq: 'weekly' | 'monthly' | 'yearly';
  priority: number;
};

const staticRoutes: RouteGroup[] = [
  { xDefault: '/', en: '/en/', es: '/es/', changefreq: 'weekly', priority: 1.0 },
  { xDefault: '/about', en: '/en/about', es: '/es/about', changefreq: 'monthly', priority: 0.4 },
  { xDefault: '/contact', en: '/en/contact', es: '/es/contact', changefreq: 'monthly', priority: 0.4 },
  { xDefault: '/privacy', en: '/en/privacy', es: '/es/privacy', changefreq: 'yearly', priority: 0.2 },
  { xDefault: '/cookies', en: '/en/cookies', es: '/es/cookies', changefreq: 'yearly', priority: 0.2 },
  { xDefault: '/terms', en: '/en/terms', es: '/es/terms', changefreq: 'yearly', priority: 0.2 },
  { xDefault: '/legal', en: '/en/legal', es: '/es/legal', changefreq: 'yearly', priority: 0.2 },
  { xDefault: '/refund-policy', en: '/en/refund-policy', es: '/es/refund-policy', changefreq: 'yearly', priority: 0.2 },
  { xDefault: '/share', en: '/en/share', es: '/es/share', changefreq: 'weekly', priority: 0.5 },
  { xDefault: '/blog', en: '/en/blog', es: '/es/blog', changefreq: 'weekly', priority: 0.8 },
  { xDefault: '/personalized-lego-gift', en: '/en/personalized-lego-gift', es: '/es/regalo-lego-personalizado', changefreq: 'monthly', priority: 0.8 },
  { xDefault: '/lego-wedding-favors', en: '/en/lego-wedding-favors', es: '/es/recuerdos-boda-lego-personalizados', changefreq: 'monthly', priority: 0.8 },
  { xDefault: '/corporate-lego-gifts', en: '/en/corporate-lego-gifts', es: '/es/regalos-empresa-lego-personalizados', changefreq: 'monthly', priority: 0.8 },
  { xDefault: '/custom-lego-minifigure-photo', en: '/en/custom-lego-minifigure-photo', es: '/es/minifig-lego-personalizada-foto', changefreq: 'monthly', priority: 0.8 },
  { xDefault: '/custom-lego-gifts-for-couples', en: '/en/custom-lego-gifts-for-couples', changefreq: 'monthly', priority: 0.7 },
  { xDefault: '/lego-birthday-gift', en: '/en/lego-birthday-gift', changefreq: 'monthly', priority: 0.7 },
  { xDefault: '/lego-anniversary-gift', en: '/en/lego-anniversary-gift', es: '/es/regalo-aniversario-lego-personalizado', changefreq: 'monthly', priority: 0.7 },
  { xDefault: '/fathers-day-lego-gift', en: '/en/fathers-day-lego-gift', es: '/es/regalo-lego-dia-del-padre', changefreq: 'monthly', priority: 0.7 },
  { xDefault: '/mothers-day-lego-gift', en: '/en/mothers-day-lego-gift', es: '/es/regalo-lego-dia-de-la-madre', changefreq: 'monthly', priority: 0.7 },
  { xDefault: '/lego-graduation-gift', en: '/en/lego-graduation-gift', es: '/es/regalo-graduacion-lego-personalizado', changefreq: 'monthly', priority: 0.7 },
  { xDefault: '/lego-retirement-gift', en: '/en/lego-retirement-gift', es: '/es/regalo-jubilacion-lego-personalizado', changefreq: 'monthly', priority: 0.7 },
];

const blogSlugMap: Record<string, string | undefined> = {
  '5-gift-ideas-with-custom-lego-minifigures': '5-ideas-de-regalos-con-minifiguras-lego-personalizadas',
  'best-lego-gifts-for-weddings': 'mejores-regalos-lego-para-bodas',
  'custom-lego-gifts-for-couples': undefined,
  'how-to-turn-a-photo-into-a-lego-minifigure': 'como-convertir-una-foto-en-minifig-lego',
  'lego-birthday-gift-ideas': undefined,
  'lego-gifts-for-coworkers': 'regalos-lego-para-companeros',
  'personalized-lego-gifts-ideas': 'ideas-regalos-lego-personalizados',
  'ultimate-guide-to-combining-lego-pieces-from-photo': 'guia-definitiva-combinar-piezas-lego-segun-tu-foto',
};

const englishBlogFiles = import.meta.glob('/src/pages/blog/*.astro', { eager: true });
const englishPrefixedBlogFiles = import.meta.glob('/src/pages/en/blog/*.astro', { eager: true });
const spanishBlogFiles = import.meta.glob('/src/pages/es/blog/*.astro', { eager: true });

function absoluteUrl(path: string): string {
  return `${SITE}${path}`;
}

function alternatesFor(route: RouteGroup): Array<{ hreflang: string; href: string }> {
  return [
    { hreflang: 'x-default', href: absoluteUrl(route.xDefault) },
    { hreflang: 'en', href: absoluteUrl(route.en ?? route.xDefault) },
    ...(route.es ? [{ hreflang: 'es', href: absoluteUrl(route.es) }] : []),
  ];
}

function buildUrlEntry(loc: string, route: RouteGroup): string {
  const alternates = alternatesFor(route)
    .map(({ hreflang, href }) => `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${href}"/>`)
    .join('\n');

  return [
    '  <url>',
    `    <loc>${absoluteUrl(loc)}</loc>`,
    alternates,
    `    <changefreq>${route.changefreq}</changefreq>`,
    `    <priority>${route.priority.toFixed(1)}</priority>`,
    '  </url>',
  ].join('\n');
}

function routeEntries(route: RouteGroup): string[] {
  const locs = [route.xDefault, route.en, route.es].filter((value, index, self): value is string => !!value && self.indexOf(value) === index);
  return locs.map((loc) => buildUrlEntry(loc, route));
}

function blogRoutes(): RouteGroup[] {
  const enPrefixed = new Set(Object.keys(englishPrefixedBlogFiles));
  const esPages = new Set(Object.keys(spanishBlogFiles));

  return Object.keys(englishBlogFiles)
    .map((file) => file.split('/').pop()?.replace(/\.astro$/, ''))
    .filter((slug): slug is string => !!slug)
    .sort((a, b) => a.localeCompare(b))
    .map((slug) => {
      const translatedSlug = blogSlugMap[slug];
      const esPath = translatedSlug && esPages.has(`/src/pages/es/blog/${translatedSlug}.astro`) ? `/es/blog/${translatedSlug}` : undefined;
      const enPath = enPrefixed.has(`/src/pages/en/blog/${slug}.astro`) ? `/en/blog/${slug}` : undefined;

      return {
        xDefault: `/blog/${slug}`,
        en: enPath,
        es: esPath,
        changefreq: 'monthly',
        priority: 0.7,
      } satisfies RouteGroup;
    });
}

export const GET: APIRoute = async () => {
  const entries = [...staticRoutes, ...blogRoutes()].flatMap(routeEntries).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
