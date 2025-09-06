import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { RecommendationSystem } from '@/lib/recommendation-engine';
import { Article } from '@/lib/news-collector';
import { UserActivity } from '@/types/recommendations';

const recommendationSystem = new RecommendationSystem();

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const engine = url.searchParams.get('engine');
    const trending = url.searchParams.get('trending');

    // Changer le moteur de recommandation si demandé
    if (engine) {
      const switchSuccess = recommendationSystem.switchEngine(engine);
      if (!switchSuccess) {
        return NextResponse.json(
          {
            success: false,
            error: `Moteur de recommandation "${engine}" non trouvé`
          },
          { status: 400 }
        );
      }
    }

    // Si demande de trending topics uniquement
    if (trending === 'true') {
      const trendingTopics = recommendationSystem.getTrendingTopics();
      return NextResponse.json({
        success: true,
        data: trendingTopics,
        timestamp: new Date().toISOString()
      });
    }

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID utilisateur requis'
        },
        { status: 400 }
      );
    }

    // Lire les articles
    const articlesPath = path.join(process.cwd(), 'data', 'articles.json');
    const articlesData = await readFile(articlesPath, 'utf-8');
    const articles: Article[] = JSON.parse(articlesData);

    // Générer les recommandations
    const recommendations = await recommendationSystem.generateRecommendations(
      userId,
      articles,
      limit
    );

    return NextResponse.json({
      success: true,
      data: recommendations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur lors de la génération des recommandations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la génération des recommandations',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, articles, preferences, activity, limit = 10 } = body;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID utilisateur requis'
        },
        { status: 400 }
      );
    }

    // Mettre à jour l'activité utilisateur si fournie
    if (activity) {
      const userActivity: UserActivity = {
        userId,
        articleId: activity.articleId,
        action: activity.action,
        timestamp: activity.timestamp || new Date().toISOString(),
        timeSpent: activity.timeSpent || 0,
        scrollDepth: activity.scrollDepth || 0
      };

      recommendationSystem.updateUserProfile(userId, userActivity);
    }

    // Utiliser les articles fournis ou charger depuis le fichier
    let articlesToUse: Article[] = [];
    
    if (articles && Array.isArray(articles)) {
      articlesToUse = articles;
    } else {
      const articlesPath = path.join(process.cwd(), 'data', 'articles.json');
      const articlesData = await readFile(articlesPath, 'utf-8');
      articlesToUse = JSON.parse(articlesData);
    }

    // Générer les recommandations
    const recommendations = await recommendationSystem.generateRecommendations(
      userId,
      articlesToUse,
      limit
    );

    return NextResponse.json({
      success: true,
      data: recommendations,
      requestParams: {
        userId,
        limit,
        hasActivity: !!activity,
        articlesCount: articlesToUse.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur lors du POST recommendations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors du traitement de la demande',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

// Route pour gérer les interactions utilisateur
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, activity } = body;

    if (!userId || !activity) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID utilisateur et activité requis'
        },
        { status: 400 }
      );
    }

    const userActivity: UserActivity = {
      userId,
      articleId: activity.articleId,
      action: activity.action,
      timestamp: activity.timestamp || new Date().toISOString(),
      timeSpent: activity.timeSpent || 0,
      scrollDepth: activity.scrollDepth || 0
    };

    recommendationSystem.updateUserProfile(userId, userActivity);

    return NextResponse.json({
      success: true,
      message: 'Profil utilisateur mis à jour',
      data: {
        userId,
        activity: userActivity
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la mise à jour',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}
