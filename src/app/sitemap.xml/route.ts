import { NextResponse } from 'next/server';
import { FrenchNewsCollector } from '@/lib/news-collector';
import { seoManager } from '@/lib/seo-manager';

export async function GET() {
  try {
    const collector = new FrenchNewsCollector();
    const articles = await collector.getArticles();
    
    // Получаем уникальные категории
    const categories = Array.from(new Set(articles.map(article => article.category)));
    
    const sitemapXML = seoManager.generateSitemapXML(articles, categories);

    return new NextResponse(sitemapXML, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}
