import { NextRequest, NextResponse } from 'next/server';
import { FrenchNewsCollector } from '@/lib/news-collector';
import { seoManager } from '@/lib/seo-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    const collector = new FrenchNewsCollector();
    const articles = await collector.getArticles();
    
    const rssXML = seoManager.generateRSSFeed(articles, category || undefined, 50);

    return new NextResponse(rssXML, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800', // Cache for 30 minutes
      },
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return new NextResponse('Error generating RSS feed', { status: 500 });
  }
}
