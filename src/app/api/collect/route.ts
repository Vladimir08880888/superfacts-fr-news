import { NextResponse } from 'next/server';
import { FrenchNewsCollector } from '@/lib/news-collector';

export async function POST() {
  try {
    console.log('🔄 Démarrage de la collecte d\'actualités...');
    
    const collector = new FrenchNewsCollector();
    const result = await collector.collectNews();
    
    return NextResponse.json({
      success: true,
      message: `Collecte terminée avec succès`,
      data: {
        newArticles: result.newArticles,
        totalArticles: result.totalArticles
      }
    });
  } catch (error) {
    console.error('Erreur lors de la collecte:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la collecte des actualités',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Utilisez POST pour déclencher la collecte d\'actualités',
    endpoints: {
      collect: 'POST /api/collect',
      news: 'GET /api/news?category=&limit=&hot='
    }
  });
}
