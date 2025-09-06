import { MetadataRoute } from 'next';
import { FrenchNewsCollector } from '@/lib/news-collector';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://superfacts.fr';
  const collector = new FrenchNewsCollector();
  
  try {
    const articles = await collector.getArticles();
    
    // Pages principales
    const routes = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'hourly' as const,
        priority: 1,
      },
    ];

    // Articles récents (derniers 50)
    const recentArticles = articles.slice(0, 50).map((article) => ({
      url: article.sourceUrl,
      lastModified: new Date(article.publishDate),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));

    // Catégories
    const categories = ['Politique', 'Économie', 'Tech', 'Sport', 'Culture', 'Sciences', 'Santé', 'International'];
    const categoryRoutes = categories.map((category) => ({
      url: `${baseUrl}?category=${encodeURIComponent(category)}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));

    return [...routes, ...categoryRoutes, ...recentArticles];
  } catch (error) {
    console.error('Erreur lors de la génération du sitemap:', error);
    // Retour vers un sitemap basique en cas d'erreur
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'hourly',
        priority: 1,
      },
    ];
  }
}
