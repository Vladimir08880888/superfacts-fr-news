import { NextRequest, NextResponse } from 'next/server';
import { FrenchNewsCollector } from '@/lib/news-collector';
import type { Article } from '@/lib/news-collector';

interface DailySentimentData {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  sentimentScore: number; // Score de -1 à +1
  dominantSentiment: 'positive' | 'negative' | 'neutral';
}

interface CategorySentiment {
  category: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  sentimentScore: number;
  dominantSentiment: 'positive' | 'negative' | 'neutral';
  articles: {
    mostPositive?: Article;
    mostNegative?: Article;
  };
}

interface TrendingTopic {
  keyword: string;
  count: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  articles: Article[];
}

interface GlobalSentimentStats {
  today: DailySentimentData;
  yesterday: DailySentimentData;
  weekAverage: {
    sentimentScore: number;
    dominantSentiment: 'positive' | 'negative' | 'neutral';
  };
  trend: 'improving' | 'declining' | 'stable';
  totalAnalyzed: number;
  lastUpdated: string;
}

interface DailySentimentResponse {
  success: boolean;
  globalStats: GlobalSentimentStats;
  weeklyTrend: DailySentimentData[];
  categorySentiment: CategorySentiment[];
  trendingTopics: TrendingTopic[];
  extremeArticles: {
    mostPositive: Article[];
    mostNegative: Article[];
  };
}

export async function GET(request: NextRequest) {
  try {
    const collector = new FrenchNewsCollector();
    const allArticles = await collector.getArticles();
    
    if (!allArticles || allArticles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Aucun article trouvé pour l\'analyse'
      }, { status: 404 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Articles par jour
    const todayArticles = allArticles.filter(article => 
      new Date(article.publishDate) >= todayStart
    );
    
    const yesterdayArticles = allArticles.filter(article => {
      const date = new Date(article.publishDate);
      return date >= yesterdayStart && date < todayStart;
    });

    const weekArticles = allArticles.filter(article => 
      new Date(article.publishDate) >= weekAgo
    );

    // Fonction pour calculer le sentiment d'une liste d'articles
    const calculateSentimentData = (articles: Article[]): DailySentimentData => {
      const positive = articles.filter(a => a.sentiment === 'positive').length;
      const negative = articles.filter(a => a.sentiment === 'negative').length;
      const neutral = articles.filter(a => a.sentiment === 'neutral').length;
      const total = articles.length;

      // Calcul du score de sentiment (-1 à +1)
      const sentimentScore = total > 0 ? 
        ((positive - negative) / total) : 0;

      // Déterminer le sentiment dominant
      let dominantSentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (positive > negative && positive > neutral) {
        dominantSentiment = 'positive';
      } else if (negative > positive && negative > neutral) {
        dominantSentiment = 'negative';
      }

      return {
        date: todayStart.toISOString(),
        positive,
        negative,
        neutral,
        total,
        sentimentScore: Math.round(sentimentScore * 1000) / 1000,
        dominantSentiment
      };
    };

    const todayData = calculateSentimentData(todayArticles);
    const yesterdayData = calculateSentimentData(yesterdayArticles);

    // Calcul de la moyenne de la semaine
    const weekSentiments = weekArticles.map(a => a.sentiment);
    const weekPositive = weekSentiments.filter(s => s === 'positive').length;
    const weekNegative = weekSentiments.filter(s => s === 'negative').length;
    const weekTotal = weekSentiments.length;
    const weekSentimentScore = weekTotal > 0 ? ((weekPositive - weekNegative) / weekTotal) : 0;

    let weekDominantSentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    const weekNeutral = weekSentiments.filter(s => s === 'neutral').length;
    if (weekPositive > weekNegative && weekPositive > weekNeutral) {
      weekDominantSentiment = 'positive';
    } else if (weekNegative > weekPositive && weekNegative > weekNeutral) {
      weekDominantSentiment = 'negative';
    }

    // Déterminer la tendance
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    const scoreDiff = todayData.sentimentScore - yesterdayData.sentimentScore;
    if (Math.abs(scoreDiff) > 0.05) {
      trend = scoreDiff > 0 ? 'improving' : 'declining';
    }

    // Tendance hebdomadaire (7 derniers jours)
    const weeklyTrend: DailySentimentData[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayArticles = allArticles.filter(article => {
        const date = new Date(article.publishDate);
        return date >= dayStart && date < dayEnd;
      });

      const dayData = {
        ...calculateSentimentData(dayArticles),
        date: dayStart.toISOString()
      };
      weeklyTrend.push(dayData);
    }

    // Analyse par catégorie
    const categories = [...new Set(allArticles.map(a => a.category))];
    const categorySentiment: CategorySentiment[] = categories.map(category => {
      const categoryArticles = todayArticles.filter(a => a.category === category);
      if (categoryArticles.length === 0) {
        return {
          category,
          positive: 0,
          negative: 0,
          neutral: 0,
          total: 0,
          sentimentScore: 0,
          dominantSentiment: 'neutral' as const,
          articles: {}
        };
      }

      const positive = categoryArticles.filter(a => a.sentiment === 'positive').length;
      const negative = categoryArticles.filter(a => a.sentiment === 'negative').length;
      const neutral = categoryArticles.filter(a => a.sentiment === 'neutral').length;
      const total = categoryArticles.length;

      const sentimentScore = ((positive - negative) / total);
      
      let dominantSentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (positive > negative && positive > neutral) {
        dominantSentiment = 'positive';
      } else if (negative > positive && negative > neutral) {
        dominantSentiment = 'negative';
      }

      // Trouver les articles les plus positifs et négatifs de cette catégorie
      const positiveArticles = categoryArticles.filter(a => a.sentiment === 'positive');
      const negativeArticles = categoryArticles.filter(a => a.sentiment === 'negative');

      return {
        category,
        positive,
        negative,
        neutral,
        total,
        sentimentScore: Math.round(sentimentScore * 1000) / 1000,
        dominantSentiment,
        articles: {
          mostPositive: positiveArticles[0] || undefined,
          mostNegative: negativeArticles[0] || undefined,
        }
      };
    }).filter(cat => cat.total > 0)
      .sort((a, b) => b.total - a.total);

    // Mots-clés tendance avec sentiment
    const keywords = ['guerre', 'crise', 'succès', 'innovation', 'réchauffement', 'croissance', 
                     'violence', 'accord', 'élection', 'économie', 'santé', 'covid', 
                     'victoire', 'échec', 'progrès', 'conflit', 'paix', 'développement'];

    const trendingTopics: TrendingTopic[] = keywords.map(keyword => {
      const relatedArticles = todayArticles.filter(article => 
        article.title.toLowerCase().includes(keyword.toLowerCase()) ||
        article.content.toLowerCase().includes(keyword.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase()))
      );

      if (relatedArticles.length === 0) return null;

      const positive = relatedArticles.filter(a => a.sentiment === 'positive').length;
      const negative = relatedArticles.filter(a => a.sentiment === 'negative').length;
      const neutral = relatedArticles.filter(a => a.sentiment === 'neutral').length;

      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      let sentimentScore = 0;

      if (relatedArticles.length > 0) {
        sentimentScore = (positive - negative) / relatedArticles.length;
        if (positive > negative && positive > neutral) {
          sentiment = 'positive';
        } else if (negative > positive && negative > neutral) {
          sentiment = 'negative';
        }
      }

      return {
        keyword: keyword.charAt(0).toUpperCase() + keyword.slice(1),
        count: relatedArticles.length,
        sentiment,
        sentimentScore: Math.round(sentimentScore * 1000) / 1000,
        articles: relatedArticles.slice(0, 3) // Les 3 premiers articles
      };
    }).filter((topic): topic is TrendingTopic => topic !== null && topic.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Articles extrêmes (les plus positifs et négatifs)
    const positiveArticles = todayArticles
      .filter(a => a.sentiment === 'positive')
      .slice(0, 5);

    const negativeArticles = todayArticles
      .filter(a => a.sentiment === 'negative')
      .slice(0, 5);

    const globalStats: GlobalSentimentStats = {
      today: todayData,
      yesterday: yesterdayData,
      weekAverage: {
        sentimentScore: Math.round(weekSentimentScore * 1000) / 1000,
        dominantSentiment: weekDominantSentiment
      },
      trend,
      totalAnalyzed: allArticles.length,
      lastUpdated: new Date().toISOString()
    };

    const response: DailySentimentResponse = {
      success: true,
      globalStats,
      weeklyTrend,
      categorySentiment,
      trendingTopics,
      extremeArticles: {
        mostPositive: positiveArticles,
        mostNegative: negativeArticles
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur lors de l\'analyse de sentiment quotidien:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de l\'analyse de sentiment quotidien' 
      },
      { status: 500 }
    );
  }
}
