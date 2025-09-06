import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { SentimentAnalyzer } from '@/lib/sentiment-analyzer';
import { Article } from '@/lib/news-collector';

const sentimentAnalyzer = new SentimentAnalyzer();

export async function GET(request: NextRequest) {
  try {
    // Lire les articles depuis le fichier JSON
    const articlesPath = path.join(process.cwd(), 'data', 'articles.json');
    const articlesData = await readFile(articlesPath, 'utf-8');
    const articles: Article[] = JSON.parse(articlesData);

    // Analyser le sentiment géographique
    const analysisResult = sentimentAnalyzer.analyzeArticles(articles);

    return NextResponse.json({
      success: true,
      data: analysisResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors de l\'analyse de sentiment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de l\'analyse de sentiment',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articles, region } = body;

    if (!articles || !Array.isArray(articles)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Articles requis et doivent être un tableau'
        },
        { status: 400 }
      );
    }

    // Filtrer par région si spécifié
    let filteredArticles = articles;
    if (region) {
      // Ici, nous pourrions filtrer les articles par région
      // Pour l'instant, nous utilisons tous les articles
      filteredArticles = articles;
    }

    const analysisResult = sentimentAnalyzer.analyzeArticles(filteredArticles);

    // Filtrer les résultats par région si demandé
    if (region) {
      analysisResult.regional = analysisResult.regional.filter(r => 
        r.region.toLowerCase().includes(region.toLowerCase()) ||
        r.regionCode.toLowerCase() === region.toLowerCase()
      );
    }

    return NextResponse.json({
      success: true,
      data: analysisResult,
      requestParams: { region },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors de l\'analyse POST:', error);
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
