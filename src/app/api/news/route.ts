import { NextRequest, NextResponse } from 'next/server';
import { FrenchNewsCollector } from '@/lib/news-collector';

const collector = new FrenchNewsCollector();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '1000'); // Augmenté de 100 à 1000
    const page = parseInt(searchParams.get('page') || '1');
    const hot = searchParams.get('hot') === 'true';

    let allArticles;
    let articles;

    if (hot) {
      articles = await collector.getHotNews(limit);
      allArticles = articles;
    } else if (category) {
      allArticles = await collector.getArticlesByCategory(category);
      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      articles = allArticles.slice(startIndex, endIndex);
    } else {
      allArticles = await collector.getArticles();
      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      articles = allArticles.slice(startIndex, endIndex);
    }

    return NextResponse.json({
      success: true,
      articles,
      total: articles.length,
      totalAvailable: allArticles.length,
      page,
      limit,
      hasMore: allArticles.length > page * limit
    });
  } catch (error) {
    console.error('Erreur API news:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des actualités' },
      { status: 500 }
    );
  }
}
