import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { SentimentAnalyzer } from '@/lib/sentiment-analyzer';
import { Article } from '@/lib/news-collector';

const sentimentAnalyzer = new SentimentAnalyzer();

// GET endpoint pour la page centrale de sentiment
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '24h';
    const category = searchParams.get('category') || 'all';
    const detail = searchParams.get('detail'); // Pour compatibilité avec l'ancien API
    
    // Charger les articles
    const articlesPath = path.join(process.cwd(), 'data', 'articles.json');
    let articles: Article[] = [];
    
    if (fs.existsSync(articlesPath)) {
      const articlesData = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'));
      articles = articlesData.articles || articlesData || [];
    }
    
    // Si c'est une demande pour l'ancien API (sans paramètres spéciaux)
    if (!searchParams.has('timeframe') && !searchParams.has('category')) {
      const analysisResult = sentimentAnalyzer.analyzeArticles(articles);
      return NextResponse.json({
        success: true,
        data: analysisResult,
        timestamp: new Date().toISOString()
      });
    }
    
    // Filtrer par timeframe
    const now = new Date();
    const hoursBack = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720; // 30j = 720h
    const cutoffDate = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);
    
    const filteredArticles = articles.filter(article => {
      const articleDate = new Date(article.publishDate);
      const matchesTime = articleDate >= cutoffDate;
      const matchesCategory = category === 'all' || article.category === category;
      return matchesTime && matchesCategory;
    });
    
    // Analyser les sentiments
    const sentimentAnalysis = sentimentAnalyzer.analyzeArticles(filteredArticles);
    
    // Générer des données d'émotions top
    const topEmotions = generateTopEmotions(filteredArticles);
    
    // Générer des données horaires
    const hourlyData = generateHourlyData(filteredArticles);
    
    // Générer breakdown par catégorie
    const categoryBreakdown = generateCategoryBreakdown(filteredArticles);
    
    return NextResponse.json({
      success: true,
      sentimentAnalysis,
      articles: filteredArticles.slice(0, 50), // Limiter pour la performance
      topEmotions,
      hourlyData,
      categoryBreakdown,
      metadata: {
        timeframe,
        category,
        totalFiltered: filteredArticles.length,
        totalAvailable: articles.length
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'analyse complète du sentiment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur interne',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articles, region, text } = body;
    
    // Si c'est une analyse simple de texte
    if (text && typeof text === 'string') {
      const sentiment = analyzeSentiment(text);
      return NextResponse.json({
        success: true,
        sentiment: sentiment.sentiment,
        score: sentiment.score,
        confidence: sentiment.confidence
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

function generateTopEmotions(articles: Article[]) {
  const emotions = {
    'succès': { count: 0, sentiment: 'positive' as const, articles: [] as Article[] },
    'crise': { count: 0, sentiment: 'negative' as const, articles: [] as Article[] },
    'innovation': { count: 0, sentiment: 'positive' as const, articles: [] as Article[] },
    'conflit': { count: 0, sentiment: 'negative' as const, articles: [] as Article[] },
    'croissance': { count: 0, sentiment: 'positive' as const, articles: [] as Article[] },
    'problème': { count: 0, sentiment: 'negative' as const, articles: [] as Article[] },
    'victoire': { count: 0, sentiment: 'positive' as const, articles: [] as Article[] },
    'difficulté': { count: 0, sentiment: 'negative' as const, articles: [] as Article[] },
    'amélioration': { count: 0, sentiment: 'positive' as const, articles: [] as Article[] },
    'tension': { count: 0, sentiment: 'negative' as const, articles: [] as Article[] }
  };
  
  articles.forEach(article => {
    const text = `${article.title} ${article.content}`.toLowerCase();
    
    Object.keys(emotions).forEach(emotion => {
      if (text.includes(emotion)) {
        emotions[emotion as keyof typeof emotions].count++;
        if (emotions[emotion as keyof typeof emotions].articles.length < 3) {
          emotions[emotion as keyof typeof emotions].articles.push(article);
        }
      }
    });
  });
  
  return Object.entries(emotions)
    .map(([emotion, data]) => ({ emotion, ...data }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function generateHourlyData(articles: Article[]) {
  const hourlyStats: { [hour: number]: { positive: number; negative: number; neutral: number } } = {};
  
  // Initialiser toutes les heures
  for (let i = 0; i < 24; i++) {
    hourlyStats[i] = { positive: 0, negative: 0, neutral: 0 };
  }
  
  articles.forEach(article => {
    const hour = new Date(article.publishDate).getHours();
    // Simuler sentiment basé sur le titre et le contenu
    const sentiment = simulateSentiment(`${article.title} ${article.content}`);
    hourlyStats[hour][sentiment]++;
  });
  
  return Object.entries(hourlyStats)
    .map(([hour, stats]) => ({ hour: parseInt(hour), ...stats }))
    .sort((a, b) => a.hour - b.hour);
}

function generateCategoryBreakdown(articles: Article[]) {
  const categories: { [category: string]: { positive: number; negative: number; neutral: number } } = {};
  
  articles.forEach(article => {
    if (!categories[article.category]) {
      categories[article.category] = { positive: 0, negative: 0, neutral: 0 };
    }
    
    const sentiment = simulateSentiment(`${article.title} ${article.content}`);
    categories[article.category][sentiment]++;
  });
  
  return Object.entries(categories).map(([category, stats]) => {
    const { positive, negative, neutral } = stats;
    const total = positive + negative + neutral;
    
    let dominantSentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (positive > negative && positive > neutral) dominantSentiment = 'positive';
    else if (negative > neutral) dominantSentiment = 'negative';
    
    return {
      category,
      positive,
      negative, 
      neutral,
      dominantSentiment
    };
  }).filter(cat => cat.positive + cat.negative + cat.neutral > 0);
}

function simulateSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const positiveKeywords = [
    'succès', 'victoire', 'croissance', 'amélioration', 'record', 'innovation',
    'excellence', 'triomphe', 'progrès', 'développement', 'essor', 'boom'
  ];
  const negativeKeywords = [
    'crise', 'échec', 'chute', 'problème', 'accident', 'mort', 'violence',
    'catastrophe', 'conflit', 'tension', 'difficulté', 'scandale'
  ];
  
  const lowerText = text.toLowerCase();
  let positiveScore = 0;
  let negativeScore = 0;
  
  positiveKeywords.forEach(keyword => {
    const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
    positiveScore += matches;
  });
  
  negativeKeywords.forEach(keyword => {
    const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
    negativeScore += matches;
  });
  
  if (positiveScore > negativeScore) return 'positive';
  if (negativeScore > positiveScore) return 'negative';
  return 'neutral';
}

function analyzeSentiment(text: string) {
  const positiveWords = [
    'bon', 'bien', 'excellent', 'formidable', 'génial', 'super', 'parfait',
    'succès', 'victoire', 'réussite', 'progrès', 'amélioration', 'croissance'
  ];
  
  const negativeWords = [
    'mauvais', 'mal', 'terrible', 'horrible', 'catastrophe', 'échec',
    'problème', 'difficulté', 'crise', 'guerre', 'violence', 'mort'
  ];

  const words = text.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;

  words.forEach(word => {
    if (positiveWords.some(pw => word.includes(pw))) {
      positiveCount++;
    }
    if (negativeWords.some(nw => word.includes(nw))) {
      negativeCount++;
    }
  });

  const totalSentimentWords = positiveCount + negativeCount;
  const score = totalSentimentWords === 0 ? 0 : (positiveCount - negativeCount) / totalSentimentWords;
  const confidence = Math.min(totalSentimentWords / words.length * 5, 1);
  
  let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (Math.abs(score) > 0.2) {
    sentiment = score > 0 ? 'positive' : 'negative';
  }

  return {
    sentiment,
    score: Math.round(score * 100) / 100,
    confidence: Math.round(confidence * 100) / 100
  };
}
