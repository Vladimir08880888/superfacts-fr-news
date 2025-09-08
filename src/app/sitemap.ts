import { MetadataRoute } from 'next';
import { FrenchNewsCollector } from '@/lib/news-collector';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://superfacts.fr';
  
  try {
    const collector = new FrenchNewsCollector();
    const articles = await collector.getArticles();
    
    // Pages principales
    const mainRoutes: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'hourly',
        priority: 1.0,
      },
      {
        url: `${baseUrl}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly', 
        priority: 0.6,
      },
      {
        url: `${baseUrl}/contact`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
    ];

    // Articles internes (si vous avez des pages d'articles dédiées)
    const articleRoutes: MetadataRoute.Sitemap = articles.slice(0, 100).map((article) => ({
      url: `${baseUrl}/article/${article.id}`,
      lastModified: new Date(article.publishDate),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // Catégories avec URLs SEO-friendly
    const categories = [
      { slug: 'politique', name: 'Politique' },
      { slug: 'economie', name: 'Économie' },
      { slug: 'technologie', name: 'Tech' },
      { slug: 'sport', name: 'Sport' },
      { slug: 'culture', name: 'Culture' },
      { slug: 'sciences', name: 'Sciences' },
      { slug: 'sante', name: 'Santé' },
      { slug: 'international', name: 'International' }
    ];
    
    const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
      url: `${baseUrl}/category/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.7,
    }));

    // Sources médias principales
    const sources = ['le-monde', 'le-figaro', 'liberation', 'france-24', 'bfmtv'];
    const sourceRoutes: MetadataRoute.Sitemap = sources.map((source) => ({
      url: `${baseUrl}/source/${source}`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.6,
    }));

    return [...mainRoutes, ...categoryRoutes, ...sourceRoutes, ...articleRoutes];
  } catch (error) {
    console.error('Erreur lors de la génération du sitemap:', error);
    // Sitemap basique en cas d'erreur
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'hourly',
        priority: 1.0,
      },
    ];
  }
}
