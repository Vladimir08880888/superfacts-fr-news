import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { FactChecker } from '@/lib/fact-checker';
import { Article } from '@/lib/news-collector';

const factChecker = new FactChecker();

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const articleId = url.searchParams.get('articleId');
    const stats = url.searchParams.get('stats');

    // Si demande de statistiques
    if (stats === 'true') {
      const factCheckStats = factChecker.getStats();
      return NextResponse.json({
        success: true,
        data: factCheckStats,
        timestamp: new Date().toISOString()
      });
    }

    // Lire tous les articles
    const articlesPath = path.join(process.cwd(), 'data', 'articles.json');
    const articlesData = await readFile(articlesPath, 'utf-8');
    const articles: Article[] = JSON.parse(articlesData);

    if (articleId) {
      // Vérifier un article spécifique
      const article = articles.find(a => a.id === articleId);
      if (!article) {
        return NextResponse.json(
          {
            success: false,
            error: 'Article non trouvé'
          },
          { status: 404 }
        );
      }

      const factCheckResult = await factChecker.checkArticle(article);
      return NextResponse.json({
        success: true,
        data: factCheckResult,
        timestamp: new Date().toISOString()
      });
    }

    // Vérifier tous les articles (limite à 20 pour éviter la surcharge)
    const articlesToCheck = articles.slice(0, 20);
    const results = [];

    for (const article of articlesToCheck) {
      try {
        const result = await factChecker.checkArticle(article);
        results.push(result);
      } catch (error) {
        console.error(`Erreur lors de la vérification de l'article ${article.id}:`, error);
        // Continuer avec les autres articles
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        results,
        stats: factChecker.getStats(),
        totalChecked: results.length,
        totalAvailable: articles.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur lors de la vérification des faits:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la vérification des faits',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articles, articleId, options } = body;

    if (articleId) {
      // Vérifier un article par ID
      const articlesPath = path.join(process.cwd(), 'data', 'articles.json');
      const articlesData = await readFile(articlesPath, 'utf-8');
      const allArticles: Article[] = JSON.parse(articlesData);
      
      const article = allArticles.find(a => a.id === articleId);
      if (!article) {
        return NextResponse.json(
          {
            success: false,
            error: 'Article non trouvé'
          },
          { status: 404 }
        );
      }

      const result = await factChecker.checkArticle(article);
      return NextResponse.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    }

    if (!articles || !Array.isArray(articles)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Articles requis et doivent être un tableau'
        },
        { status: 400 }
      );
    }

    // Vérifier les articles fournis
    const results = [];
    const maxArticles = options?.limit || Math.min(articles.length, 10);

    for (let i = 0; i < maxArticles; i++) {
      try {
        const result = await factChecker.checkArticle(articles[i]);
        results.push(result);
      } catch (error) {
        console.error(`Erreur lors de la vérification de l'article ${articles[i]?.id}:`, error);
        // Continuer avec les autres articles
      }
    }

    // Filtres optionnels
    let filteredResults = results;
    if (options?.riskLevel) {
      filteredResults = results.filter(r => r.riskLevel === options.riskLevel);
    }
    if (options?.minCredibilityScore) {
      filteredResults = results.filter(r => r.credibilityScore >= options.minCredibilityScore);
    }

    return NextResponse.json({
      success: true,
      data: {
        results: filteredResults,
        stats: factChecker.getStats(),
        totalProcessed: results.length,
        totalFiltered: filteredResults.length
      },
      requestParams: options,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur lors du fact-checking POST:', error);
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

// Route pour mettre à jour la crédibilité des sources
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, updates, newSource } = body;

    if (newSource) {
      // Ajouter une nouvelle source de confiance
      factChecker.addTrustedSource(newSource);
      return NextResponse.json({
        success: true,
        message: 'Source ajoutée avec succès',
        data: newSource
      });
    }

    if (!domain) {
      return NextResponse.json(
        {
          success: false,
          error: 'Domaine requis pour la mise à jour'
        },
        { status: 400 }
      );
    }

    factChecker.updateSourceCredibility(domain, updates);

    return NextResponse.json({
      success: true,
      message: 'Source mise à jour avec succès',
      data: { domain, updates }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour des sources:', error);
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
