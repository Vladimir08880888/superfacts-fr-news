'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Smile,
  Frown, 
  Meh,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  AlertCircle,
  BarChart3,
  Activity,
  Clock
} from 'lucide-react';
import SentimentChart from '@/components/SentimentChart';
import TopicSentimentCard from '@/components/TopicSentimentCard';
import { useTranslatedText } from '@/contexts/TranslationContext';
import type { Article } from '@/lib/news-collector';

interface DailySentimentData {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  sentimentScore: number;
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

const DailySentimentPage: React.FC = () => {
  const [sentimentData, setSentimentData] = useState<DailySentimentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Traductions
  const { translatedText: pageTitle } = useTranslatedText('Sentiment du Jour', []);
  const { translatedText: pageSubtitle } = useTranslatedText('Analysez l\'humeur générale des actualités françaises', []);
  const { translatedText: loadingText } = useTranslatedText('Analyse du sentiment en cours...', []);
  const { translatedText: errorTitle } = useTranslatedText('Erreur de chargement', []);
  const { translatedText: retryText } = useTranslatedText('Réessayer', []);
  const { translatedText: refreshText } = useTranslatedText('Actualiser', []);
  const { translatedText: todayText } = useTranslatedText('Aujourd\'hui', []);
  const { translatedText: yesterdayText } = useTranslatedText('Hier', []);
  const { translatedText: weekAverageText } = useTranslatedText('Moyenne hebdomadaire', []);
  const { translatedText: articlesAnalyzedText } = useTranslatedText('articles analysés', []);
  const { translatedText: lastUpdateText } = useTranslatedText('Dernière mise à jour', []);
  const { translatedText: categoryAnalysisText } = useTranslatedText('Analyse par Catégorie', []);
  const { translatedText: trendingTopicsText } = useTranslatedText('Sujets Tendance', []);
  const { translatedText: mostPositiveText } = useTranslatedText('Articles les Plus Positifs', []);
  const { translatedText: mostNegativeText } = useTranslatedText('Articles les Plus Négatifs', []);
  const { translatedText: improvingText } = useTranslatedText('En amélioration', []);
  const { translatedText: decliningText } = useTranslatedText('En baisse', []);
  const { translatedText: stableText } = useTranslatedText('Stable', []);

  const fetchSentimentData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/daily-sentiment');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur lors du chargement des données');
      }
      
      setSentimentData(data);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentimentData();
  }, []);

  const getSentimentIcon = (sentiment: 'positive' | 'negative' | 'neutral', size = 'w-6 h-6') => {
    switch (sentiment) {
      case 'positive': return <Smile className={`${size} text-green-600`} />;
      case 'negative': return <Frown className={`${size} text-red-600`} />;
      default: return <Meh className={`${size} text-gray-600`} />;
    }
  };

  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'declining': return <TrendingDown className="w-5 h-5 text-red-600" />;
      default: return <Minus className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTrendText = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving': return improvingText;
      case 'declining': return decliningText;
      default: return stableText;
    }
  };

  const formatUpdateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-gray-600">{loadingText}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900">{errorTitle}</h2>
              <p className="text-gray-600 text-center max-w-md">{error}</p>
              <button 
                onClick={fetchSentimentData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {retryText}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sentimentData) return null;

  const { globalStats, weeklyTrend, categorySentiment, trendingTopics, extremeArticles } = sentimentData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="container mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-white text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {pageTitle}
            </h1>
            <p className="text-xl opacity-90 mb-6 max-w-2xl mx-auto">
              {pageSubtitle}
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm opacity-75">
              <Clock className="w-4 h-4" />
              <span>{lastUpdateText} : {formatUpdateTime(globalStats.lastUpdated)}</span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Statistiques principales */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 -mt-6"
        >
          {/* Sentiment d'aujourd'hui */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-3">
              {getSentimentIcon(globalStats.today.dominantSentiment, 'w-8 h-8')}
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {(globalStats.today.sentimentScore * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-gray-600">{todayText}</p>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {globalStats.today.total} articles analysés
            </div>
          </div>

          {/* Comparaison avec hier */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Activity className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {(globalStats.yesterday.sentimentScore * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-gray-600">{yesterdayText}</p>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              vs. {globalStats.yesterday.total} articles
            </div>
          </div>

          {/* Tendance */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-3">
              {getTrendIcon(globalStats.trend)}
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {getTrendText(globalStats.trend)}
                </p>
                <p className="text-sm text-gray-600">Tendance</p>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Évolution quotidienne
            </div>
          </div>

          {/* Moyenne hebdomadaire */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {(globalStats.weekAverage.sentimentScore * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-gray-600">{weekAverageText}</p>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {globalStats.totalAnalyzed} {articlesAnalyzedText}
            </div>
          </div>
        </motion.div>

        {/* Graphique d'évolution */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">Évolution Hebdomadaire</h2>
            <button
              onClick={fetchSentimentData}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{refreshText}</span>
            </button>
          </div>
          <SentimentChart data={weeklyTrend} height={250} />
        </motion.div>

        {/* Analyse par catégorie */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">{categoryAnalysisText}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categorySentiment.map((category, index) => (
              <TopicSentimentCard
                key={category.category}
                data={category}
                type="category"
                index={index}
              />
            ))}
          </div>
        </motion.div>

        {/* Sujets tendance */}
        {trendingTopics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">{trendingTopicsText}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {trendingTopics.slice(0, 8).map((topic, index) => (
                <TopicSentimentCard
                  key={topic.keyword}
                  data={topic}
                  type="topic"
                  index={index}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Articles extrêmes */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Articles positifs */}
          {extremeArticles.mostPositive.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Smile className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-semibold text-gray-900">{mostPositiveText}</h3>
              </div>
              <div className="space-y-4">
                {extremeArticles.mostPositive.slice(0, 3).map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.7 }}
                    className="border-l-4 border-green-500 pl-4 py-2"
                  >
                    <h4 className="font-medium text-gray-900 mb-1">{article.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {article.summary.substring(0, 100)}...
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{article.source}</span>
                      <span>{article.category}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Articles négatifs */}
          {extremeArticles.mostNegative.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Frown className="w-6 h-6 text-red-600" />
                <h3 className="text-xl font-semibold text-gray-900">{mostNegativeText}</h3>
              </div>
              <div className="space-y-4">
                {extremeArticles.mostNegative.slice(0, 3).map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.7 }}
                    className="border-l-4 border-red-500 pl-4 py-2"
                  >
                    <h4 className="font-medium text-gray-900 mb-1">{article.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {article.summary.substring(0, 100)}...
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{article.source}</span>
                      <span>{article.category}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DailySentimentPage;
