import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { PoliticalTracker } from '@/lib/political-tracker';
import { Article } from '@/lib/news-collector';

const politicalTracker = new PoliticalTracker();

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const figureId = url.searchParams.get('figureId');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // Lire les articles pour l'analyse
    const articlesPath = path.join(process.cwd(), 'data', 'articles.json');
    const articlesData = await readFile(articlesPath, 'utf-8');
    const articles: Article[] = JSON.parse(articlesData);

    // Mettre à jour la présence média
    politicalTracker.updateMediaPresence(articles);

    switch (type) {
      case 'analytics': {
        const analytics = politicalTracker.analyzeArticles(articles);
        return NextResponse.json({
          success: true,
          data: analytics,
          timestamp: new Date().toISOString()
        });
      }

      case 'insights': {
        const insights = politicalTracker.generateInsights(articles);
        return NextResponse.json({
          success: true,
          data: insights.slice(0, limit),
          timestamp: new Date().toISOString()
        });
      }

      case 'figures': {
        const figures = politicalTracker.getPoliticalFigures();
        return NextResponse.json({
          success: true,
          data: figures,
          timestamp: new Date().toISOString()
        });
      }

      case 'figure': {
        if (!figureId) {
          return NextResponse.json(
            {
              success: false,
              error: 'ID de personnalité politique requis'
            },
            { status: 400 }
          );
        }

        const figure = politicalTracker.getPoliticalFigure(figureId);
        if (!figure) {
          return NextResponse.json(
            {
              success: false,
              error: 'Personnalité politique non trouvée'
            },
            { status: 404 }
          );
        }

        const mediaPresence = politicalTracker.getMediaPresence(figureId);
        const promises = politicalTracker.getPromisesByFigure(figureId);

        return NextResponse.json({
          success: true,
          data: {
            figure,
            mediaPresence,
            promises
          },
          timestamp: new Date().toISOString()
        });
      }

      case 'promises': {
        if (figureId) {
          const promises = politicalTracker.getPromisesByFigure(figureId);
          return NextResponse.json({
            success: true,
            data: promises,
            timestamp: new Date().toISOString()
          });
        }

        // Retourner toutes les promesses si pas de figureId spécifique
        const allFigures = politicalTracker.getPoliticalFigures();
        const allPromises: any[] = [];
        
        allFigures.forEach(figure => {
          const promises = politicalTracker.getPromisesByFigure(figure.id);
          allPromises.push(...promises.map(promise => ({
            ...promise,
            figureName: figure.name
          })));
        });

        const sortedPromises = allPromises
          .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
          .slice(0, limit);

        return NextResponse.json({
          success: true,
          data: sortedPromises,
          timestamp: new Date().toISOString()
        });
      }

      case 'events': {
        const events = politicalTracker.getUpcomingEvents(limit);
        return NextResponse.json({
          success: true,
          data: events,
          timestamp: new Date().toISOString()
        });
      }

      case 'media-presence': {
        if (!figureId) {
          return NextResponse.json(
            {
              success: false,
              error: 'ID de personnalité politique requis pour la présence média'
            },
            { status: 400 }
          );
        }

        const period = url.searchParams.get('period');
        const mediaPresence = politicalTracker.getMediaPresence(figureId, period || undefined);

        return NextResponse.json({
          success: true,
          data: mediaPresence,
          timestamp: new Date().toISOString()
        });
      }

      default: {
        // Retour par défaut : analytics complet
        const analytics = politicalTracker.analyzeArticles(articles);
        const insights = politicalTracker.generateInsights(articles);
        const upcomingEvents = politicalTracker.getUpcomingEvents(5);

        return NextResponse.json({
          success: true,
          data: {
            analytics,
            insights: insights.slice(0, 5),
            upcomingEvents,
            summary: {
              totalFigures: politicalTracker.getPoliticalFigures().length,
              articlesAnalyzed: articles.length,
              topFigure: analytics.topFigures[0]?.name || 'Aucun',
              mainTrend: insights[0]?.title || 'Aucune tendance détectée'
            }
          },
          timestamp: new Date().toISOString()
        });
      }
    }

  } catch (error) {
    console.error('Erreur dans l\'API political-tracker:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de l\'analyse politique',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    switch (type) {
      case 'add-promise': {
        const { promise } = data;
        if (!promise) {
          return NextResponse.json(
            {
              success: false,
              error: 'Données de promesse requises'
            },
            { status: 400 }
          );
        }

        politicalTracker.addPromise(promise);
        return NextResponse.json({
          success: true,
          message: 'Promesse ajoutée avec succès',
          data: promise
        });
      }

      case 'update-promise': {
        const { id, updates } = data;
        if (!id || !updates) {
          return NextResponse.json(
            {
              success: false,
              error: 'ID et mises à jour de promesse requis'
            },
            { status: 400 }
          );
        }

        const success = politicalTracker.updatePromise(id, updates);
        if (success) {
          return NextResponse.json({
            success: true,
            message: 'Promesse mise à jour avec succès'
          });
        } else {
          return NextResponse.json(
            {
              success: false,
              error: 'Promesse non trouvée'
            },
            { status: 404 }
          );
        }
      }

      case 'add-event': {
        const { event } = data;
        if (!event) {
          return NextResponse.json(
            {
              success: false,
              error: 'Données d\'événement requises'
            },
            { status: 400 }
          );
        }

        politicalTracker.addEvent(event);
        return NextResponse.json({
          success: true,
          message: 'Événement ajouté avec succès',
          data: event
        });
      }

      case 'analyze-custom': {
        const { articles } = data;
        if (!articles || !Array.isArray(articles)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Articles requis pour l\'analyse personnalisée'
            },
            { status: 400 }
          );
        }

        const analytics = politicalTracker.analyzeArticles(articles);
        const insights = politicalTracker.generateInsights(articles);

        return NextResponse.json({
          success: true,
          data: {
            analytics,
            insights,
            meta: {
              articlesAnalyzed: articles.length,
              figuresDetected: analytics.topFigures.length,
              insightsGenerated: insights.length
            }
          },
          timestamp: new Date().toISOString()
        });
      }

      default: {
        return NextResponse.json(
          {
            success: false,
            error: 'Type de requête non supporté'
          },
          { status: 400 }
        );
      }
    }

  } catch (error) {
    console.error('Erreur POST political-tracker:', error);
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
