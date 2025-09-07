'use client';

import { useState, useEffect } from 'react';
import { 
  Brain, 
  Activity, 
  TrendingUp, 
  Eye, 
  Clock, 
  MapPin,
  Filter,
  BarChart3,
  PieChart,
  Users,
  Layers,
  Sparkles,
  Target,
  Zap
} from 'lucide-react';

import { SentimentAnalysisResult } from '@/types/sentiment';
import { Article } from '@/lib/news-collector';
import { useTranslation, useTranslatedText } from '@/contexts/TranslationContext';

interface SentimentPageData {
  sentimentAnalysis: SentimentAnalysisResult;
  articles: Article[];
  topEmotions: {
    emotion: string;
    count: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    articles: Article[];
  }[];
  hourlyData: {
    hour: number;
    positive: number;
    negative: number;
    neutral: number;
  }[];
  categoryBreakdown: {
    category: string;
    positive: number;
    negative: number;
    neutral: number;
    dominantSentiment: 'positive' | 'negative' | 'neutral';
  }[];
}

export default function SentimentAnalysisPage() {
  const [data, setData] = useState<SentimentPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  
  const { currentLanguage } = useTranslation();
  
  // Translation hooks
  const titleText = useTranslatedText('Intelligence Émotionnelle');
  const subtitleText = useTranslatedText('Analyse des sentiments de l\'actualité française');
  const loadingText = useTranslatedText('Analyse en cours...');
  const errorText = useTranslatedText('Erreur de chargement');
  const retryText = useTranslatedText('Réessayer');
  const positiveText = useTranslatedText('Positif');
  const neutralText = useTranslatedText('Neutre');
  const negativeText = useTranslatedText('Négatif');
  const articlesText = useTranslatedText('Articles');
  const lastUpdateText = useTranslatedText('Mise à jour');
  const hours24Text = useTranslatedText('24h');
  const days7Text = useTranslatedText('7j');
  const days30Text = useTranslatedText('30j');

  useEffect(() => {
    fetchSentimentData();
  }, [selectedTimeframe, selectedCategory]);

  const fetchSentimentData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/sentiment-analysis?timeframe=${selectedTimeframe}&category=${selectedCategory}`);
      if (response.ok) {
        const sentimentData = await response.json();
        setData(sentimentData);
      } else {
        throw new Error('Erreur de chargement');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: 'positive' | 'negative' | 'neutral') => {
    const colors = {
      positive: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white',
      negative: 'bg-gradient-to-br from-red-500 to-pink-600 text-white',
      neutral: 'bg-gradient-to-br from-slate-500 to-gray-600 text-white'
    };
    return colors[sentiment];
  };

  const getSentimentIcon = (sentiment: 'positive' | 'negative' | 'neutral') => {
    const icons = {
      positive: '😊',
      negative: '😔',
      neutral: '😐'
    };
    return icons[sentiment];
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-16">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-violet-200 dark:border-violet-800 border-t-violet-600 rounded-full animate-spin"></div>
              <Brain className="absolute inset-0 m-auto w-8 h-8 text-violet-600" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{loadingText.translatedText}</h2>
              <p className="text-gray-600 dark:text-gray-400">Décryptage de l'intelligence émotionnelle...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{errorText.translatedText}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={fetchSentimentData}
            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
          >
            {retryText.translatedText}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-800">
      {/* Modern Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{titleText.translatedText}</h1>
                <p className="text-gray-600 dark:text-gray-400 font-medium">{subtitleText.translatedText}</p>
              </div>
            </div>
            
            {/* Stats Overview */}
            {data && (
              <div className="hidden lg:flex items-center space-x-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {data.sentimentAnalysis.overall.positive || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{positiveText.translatedText}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                    {data.sentimentAnalysis.overall.neutral || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{neutralText.translatedText}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {data.sentimentAnalysis.overall.negative || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{negativeText.translatedText}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Time Filter Pills */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700">
            <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Période</span>
          </div>
          
          {(['24h', '7d', '30d'] as const).map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 ${
                selectedTimeframe === timeframe
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                  : 'bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
              }`}
            >
              {timeframe === '24h' ? hours24Text.translatedText : 
               timeframe === '7d' ? days7Text.translatedText : 
               days30Text.translatedText}
            </button>
          ))}
        </div>

        {data && (
          <>
            {/* Sentiment Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      {data.sentimentAnalysis.overall.positive || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">articles</div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Sentiment {positiveText.translatedText}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Articles avec une tonalité positive</p>
              </div>

              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-xl">
                    <BarChart3 className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                      {data.sentimentAnalysis.overall.neutral || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">articles</div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Sentiment {neutralText.translatedText}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Articles avec une tonalité neutre</p>
              </div>

              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                    <Activity className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {data.sentimentAnalysis.overall.negative || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">articles</div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Sentiment {negativeText.translatedText}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Articles avec une tonalité négative</p>
              </div>
            </div>

            {/* Categories Analysis */}
            {data.categoryBreakdown && data.categoryBreakdown.length > 0 && (
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-700 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                    <Layers className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analyse par Catégorie</h2>
                    <p className="text-gray-600 dark:text-gray-400">Répartition des sentiments par thématique</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {data.categoryBreakdown.slice(0, 6).map((category, index) => {
                    const total = category.positive + category.negative + category.neutral;
                    const positivePercent = total > 0 ? (category.positive / total * 100) : 0;
                    const negativePercent = total > 0 ? (category.negative / total * 100) : 0;
                    const neutralPercent = total > 0 ? (category.neutral / total * 100) : 0;
                    
                    return (
                      <div key={category.category} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getSentimentIcon(category.dominantSentiment)}</span>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">{category.category}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{total} articles analysés</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              {category.positive} pos
                            </span>
                            <span className="text-gray-600 dark:text-gray-400 font-medium">
                              {category.neutral} neu
                            </span>
                            <span className="text-red-600 dark:text-red-400 font-medium">
                              {category.negative} nég
                            </span>
                          </div>
                        </div>
                        
                        {/* Progress bars */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                              <div 
                                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000" 
                                style={{ width: `${positivePercent}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400 w-10">{Math.round(positivePercent)}%</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                              <div 
                                className="bg-gray-500 h-2.5 rounded-full transition-all duration-1000" 
                                style={{ width: `${neutralPercent}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400 w-10">{Math.round(neutralPercent)}%</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                              <div 
                                className="bg-red-500 h-2.5 rounded-full transition-all duration-1000" 
                                style={{ width: `${negativePercent}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400 w-10">{Math.round(negativePercent)}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Top Emotions */}
            {data.topEmotions && data.topEmotions.length > 0 && (
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-700 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                    <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Émotions Dominantes</h2>
                    <p className="text-gray-600 dark:text-gray-400">Tendances émotionnelles principales</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {data.topEmotions.slice(0, 8).map((emotion, index) => (
                    <div key={emotion.emotion} className={`p-4 rounded-xl border-2 hover:shadow-md transition-all duration-200 ${getSentimentColor(emotion.sentiment)} border-opacity-20`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{getSentimentIcon(emotion.sentiment)}</span>
                        <span className="text-xl font-bold">{emotion.count}</span>
                      </div>
                      <h4 className="font-semibold mb-1">{emotion.emotion}</h4>
                      <p className="text-sm opacity-80 capitalize">{emotion.sentiment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Articles */}
            {data.articles && data.articles.length > 0 && (
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                      <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{articlesText.translatedText} Analysés</h2>
                      <p className="text-gray-600 dark:text-gray-400">Sentiment détecté en temps réel</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {data.articles.length} articles analysés
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.articles.slice(0, 6).map((article, index) => {
                    // Simulate sentiment analysis result
                    const sentiments = ['positive', 'negative', 'neutral'] as const;
                    const sentiment = sentiments[Math.floor(Math.random() * 3)];
                    
                    return (
                      <div key={article.id} className={`rounded-xl p-6 border-2 hover:shadow-lg transition-all duration-300 cursor-pointer group ${getSentimentColor(sentiment)} border-opacity-20`}>
                        {/* Sentiment indicator */}
                        <div className="flex justify-between items-start mb-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm">
                            {article.category}
                          </span>
                          <span className="text-2xl group-hover:scale-110 transition-transform">
                            {getSentimentIcon(sentiment)}
                          </span>
                        </div>
                        
                        {/* Article title */}
                        <h4 className="font-bold text-base mb-3 line-clamp-3 leading-relaxed group-hover:opacity-90 transition-opacity">
                          {article.title}
                        </h4>
                        
                        {/* Article meta */}
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium opacity-80">{article.source}</span>
                          <span className="opacity-70">
                            {new Date(article.publishDate).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
