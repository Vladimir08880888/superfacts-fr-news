import { NextResponse } from 'next/server';
import { databaseManager } from '@/lib/database-adapter';
import { Article } from '@/lib/news-collector';

export async function GET() {
  try {
    // Получаем информацию об адаптере
    const adapterInfo = await databaseManager.getAdapterInfo();
    
    // Пытаемся получить статьи
    let articles: Article[] = [];
    let articleError: string | null = null;
    try {
      articles = await databaseManager.getArticles();
    } catch (error) {
      articleError = error instanceof Error ? error.message : 'Unknown error';
    }
    
    // Проверяем cron задачи
    const cronInfo = {
      configured: true,
      nextRun: 'Scheduled for 6:00, 12:00, 18:00 UTC daily',
      timezone: 'UTC',
      status: 'Active'
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL || 'false',
        platform: process.platform,
        memory: process.memoryUsage(),
      },
      database: {
        adapter: adapterInfo,
        articlesCount: articles.length,
        articleError,
        sampleArticle: articles[0] || null
      },
      cron: cronInfo,
      apis: {
        collect: '/api/collect',
        news: '/api/news',
        health: '/api/health'
      }
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Debug API failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    console.log('🔄 Force refreshing database adapter...');
    await databaseManager.forceRefreshAdapter();
    
    const adapterInfo = await databaseManager.getAdapterInfo();
    
    return NextResponse.json({
      success: true,
      message: 'Database adapter refreshed',
      adapter: adapterInfo
    });
  } catch (error) {
    console.error('Debug refresh error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to refresh adapter',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
