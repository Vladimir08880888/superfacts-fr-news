'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  TrendingUp, 
  BarChart3, 
  Brain, 
  MapPin, 
  Calendar,
  Filter,
  Sparkles,
  Eye,
  Clock,
  Globe,
  Zap
} from 'lucide-react';

import { SentimentAnalysisResult } from '@/types/sentiment';
import { Article } from '@/lib/news-collector';
import { useTranslatedText } from '@/contexts/TranslationContext';
import SentimentChart from '@/components/SentimentChart';
import TopicSentimentCard from '@/components/TopicSentimentCard';

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
  const [selectedSentiment, setSelectedSentiment] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');
  
  const t = useTranslatedText;

  useEffect(() => {
    fetchSentimentData();
  }, [selectedTimeframe, selectedCategory]);

  const fetchSentimentData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sentiment-analysis?timeframe=${selectedTimeframe}&category=${selectedCategory}`);
      if (response.ok) {
        const sentimentData = await response.json();
        setData(sentimentData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données de sentiment:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: 'positive' | 'negative' | 'neutral', intensity: 'low' | 'medium' | 'high' = 'medium') => {
    const colors = {
      positive: {
        low: 'text-green-400 bg-green-50 border-green-200',
        medium: 'text-green-600 bg-green-100 border-green-300',
        high: 'text-green-800 bg-green-200 border-green-400'
      },
      negative: {
        low: 'text-red-400 bg-red-50 border-red-200',
        medium: 'text-red-600 bg-red-100 border-red-300',
        high: 'text-red-800 bg-red-200 border-red-400'
      },
      neutral: {
        low: 'text-gray-400 bg-gray-50 border-gray-200',
        medium: 'text-gray-600 bg-gray-100 border-gray-300',
        high: 'text-gray-800 bg-gray-200 border-gray-400'
      }
    } as const;
    return colors[sentiment][intensity];
  };

  const getSentimentIcon = (sentiment: 'positive' | 'negative' | 'neutral') => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😔';
      default: return '😐';
    }
  };

  const calculateOverallMood = (): { mood: 'positive' | 'negative' | 'neutral', intensity: 'low' | 'medium' | 'high', description: string } => {
    if (!data) return { mood: 'neutral' as const, intensity: 'medium' as const, description: 'Analysing...' };
    
    const { positive, negative, neutral } = data.sentimentAnalysis.overall;
    const total = positive + negative + neutral;
    
    if (total === 0) return { mood: 'neutral' as const, intensity: 'medium' as const, description: 'Pas de données' };
    
    const positiveRatio = positive / total;
    const negativeRatio = negative / total;
    
    let mood: 'positive' | 'negative' | 'neutral' = 'neutral';
    let intensity: 'low' | 'medium' | 'high' = 'medium';
    let description = '';
    
    if (positiveRatio > 0.6) {
      mood = 'positive';
      intensity = 'high';
      description = 'Ambiance très positive aujourd\'hui! 🌟';
    } else if (positiveRatio > 0.4) {
      mood = 'positive';
      intensity = 'medium';
      description = 'Climat plutôt optimiste 🙂';
    } else if (negativeRatio > 0.6) {
      mood = 'negative';
      intensity = 'high';
      description = 'Journée difficile dans l\'actualité ⛈️';
    } else if (negativeRatio > 0.4) {
      mood = 'negative';
      intensity = 'medium';
      description = 'Ambiance un peu tendue 🌥️';
    } else {
      mood = 'neutral';
      intensity = 'medium';
      description = 'Équilibre dans l\'actualité ⚖️';
    }
    
    return { mood, intensity, description };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="w-16 h-16 text-white" />
            </motion.div>
            <div className="ml-4 text-white">
              <h2 className="text-xl font-bold">Analyse des émotions en cours...</h2>
              <p className="text-blue-200">Décryptage de l'humeur des nouvelles françaises</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Erreur de chargement</h2>
          <button
            onClick={fetchSentimentData}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const overallMood = calculateOverallMood();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Hero Section - L'humeur générale */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative container mx-auto px-4 py-16 text-center text-white"
        >
          <div className="mb-8">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block"
            >
              <Heart className="w-20 h-20 mx-auto mb-4 text-pink-400" />
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-bold mb-4">
              Le Cœur de l'Actualité
            </h1>
            <p className="text-xl md:text-2xl text-blue-200 mb-8">
              L'intelligence émotionnelle des nouvelles françaises
            </p>
          </div>

          {/* Carte de l'humeur générale */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={`inline-block px-8 py-6 rounded-2xl border-2 ${getSentimentColor(overallMood.mood, overallMood.intensity)} backdrop-blur-lg`}
          >
            <div className="text-4xl mb-2">{getSentimentIcon(overallMood.mood)}</div>
            <h3 className="text-2xl font-bold mb-2">Ambiance Générale</h3>
            <p className="text-lg">{overallMood.description}</p>
            <div className="mt-4 flex justify-center space-x-4 text-sm">
              <span>😊 {data.sentimentAnalysis.overall.positive}</span>
              <span>😐 {data.sentimentAnalysis.overall.neutral}</span>
              <span>😔 {data.sentimentAnalysis.overall.negative}</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Contrôles et filtres */}
      <div className="bg-black bg-opacity-30 backdrop-blur-lg border-t border-white border-opacity-20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-white" />
              <span className="text-white font-medium">Filtres:</span>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {/* Filtre temporel */}
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg border border-white border-opacity-30 backdrop-blur-lg"
              >
                <option value="24h">24 heures</option>
                <option value="7d">7 jours</option>
                <option value="30d">30 jours</option>
              </select>

              {/* Filtre catégorie */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg border border-white border-opacity-30 backdrop-blur-lg"
              >
                <option value="all">Toutes catégories</option>
                <option value="Politique">Politique</option>
                <option value="Économie">Économie</option>
                <option value="Sport">Sport</option>
                <option value="International">International</option>
                <option value="Culture">Culture</option>
              </select>

              {/* Filtre sentiment */}
              <select
                value={selectedSentiment}
                onChange={(e) => setSelectedSentiment(e.target.value as any)}
                className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg border border-white border-opacity-30 backdrop-blur-lg"
              >
                <option value="all">Tous sentiments</option>
                <option value="positive">😊 Positif</option>
                <option value="neutral">😐 Neutre</option>
                <option value="negative">😔 Négatif</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Graphiques principaux */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Graphique des tendances */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-20"
            >
              <div className="flex items-center mb-6">
                <TrendingUp className="w-6 h-6 text-blue-400 mr-3" />
                <h2 className="text-2xl font-bold text-white">Évolution des Sentiments</h2>
              </div>
              <SentimentChart data={data.sentimentAnalysis.trends?.map(trend => ({
                ...trend,
                total: trend.positive + trend.negative + trend.neutral,
                sentimentScore: trend.positive + trend.negative + trend.neutral === 0 ? 0 : 
                  (trend.positive - trend.negative) / (trend.positive + trend.negative + trend.neutral),
                dominantSentiment: trend.positive > trend.negative && trend.positive > trend.neutral ? 'positive' as const :
                  trend.negative > trend.neutral ? 'negative' as const : 'neutral' as const
              })) || []} />
            </motion.div>

            {/* Répartition par catégories */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-20"
            >
              <div className="flex items-center mb-6">
                <BarChart3 className="w-6 h-6 text-green-400 mr-3" />
                <h2 className="text-2xl font-bold text-white">Sentiments par Catégorie</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.categoryBreakdown?.map((category, index) => (
                  <motion.div
                    key={category.category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="bg-white bg-opacity-5 rounded-xl p-4 border border-white border-opacity-10"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-white">{category.category}</h3>
                      <span className="text-2xl">{getSentimentIcon(category.dominantSentiment)}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-green-300">Positif</span>
                        <span className="text-green-300">{category.positive}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Neutre</span>
                        <span className="text-gray-300">{category.neutral}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-red-300">Négatif</span>
                        <span className="text-red-300">{category.negative}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar avec détails */}
          <div className="space-y-6">
            
            {/* Top émotions */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-20"
            >
              <div className="flex items-center mb-4">
                <Sparkles className="w-5 h-5 text-yellow-400 mr-2" />
                <h3 className="text-lg font-bold text-white">Émotions Dominantes</h3>
              </div>
              <div className="space-y-3">
                {data.topEmotions?.slice(0, 6).map((emotion, index) => (
                  <motion.div
                    key={emotion.emotion}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex justify-between items-center p-3 bg-white bg-opacity-5 rounded-lg"
                  >
                    <div className="flex items-center">
                      <span className="text-xl mr-2">{getSentimentIcon(emotion.sentiment)}</span>
                      <span className="text-white font-medium">{emotion.emotion}</span>
                    </div>
                    <span className="text-sm text-gray-300">{emotion.count}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Statistiques en temps réel */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-20"
            >
              <div className="flex items-center mb-4">
                <Zap className="w-5 h-5 text-purple-400 mr-2" />
                <h3 className="text-lg font-bold text-white">En Temps Réel</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-300">Articles analysés</span>
                  <span className="text-white font-bold">{data.articles?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Dernière mise à jour</span>
                  <span className="text-white text-sm">
                    {data.sentimentAnalysis.lastUpdated ? 
                      new Date(data.sentimentAnalysis.lastUpdated).toLocaleTimeString('fr-FR') 
                      : 'Maintenant'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Régions couvertes</span>
                  <span className="text-white font-bold">{data.sentimentAnalysis.regional?.length || 0}</span>
                </div>
              </div>
            </motion.div>

            {/* Analyse régionale mini */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-20"
            >
              <div className="flex items-center mb-4">
                <MapPin className="w-5 h-5 text-blue-400 mr-2" />
                <h3 className="text-lg font-bold text-white">Régions</h3>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.sentimentAnalysis.regional?.slice(0, 5).map((region, index) => (
                  <motion.div
                    key={region.region}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex justify-between items-center p-2 bg-white bg-opacity-5 rounded-lg text-sm"
                  >
                    <span className="text-white">{region.region}</span>
                    <div className="flex items-center">
                      <span className="text-xs mr-2">{getSentimentIcon(region.dominantSentiment)}</span>
                      <span className="text-gray-300">{region.totalArticles}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Articles récents avec sentiment */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-12 bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-white border-opacity-20"
        >
          <div className="flex items-center mb-6">
            <Eye className="w-6 h-6 text-indigo-400 mr-3" />
            <h2 className="text-2xl font-bold text-white">Articles Récents Analysés</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.articles?.slice(0, 6).map((article, index) => {
              // Simuler un sentiment pour la démo
              const sentiment = ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)] as 'positive' | 'negative' | 'neutral';
              return (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`p-4 rounded-xl border ${getSentimentColor(sentiment, 'low')} bg-opacity-20 hover:bg-opacity-30 transition-all cursor-pointer`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-black bg-opacity-30 text-white">
                      {article.category}
                    </span>
                    <span className="text-xl">{getSentimentIcon(sentiment)}</span>
                  </div>
                  <h4 className="text-white font-medium text-sm mb-2 line-clamp-2">
                    {article.title}
                  </h4>
                  <div className="flex justify-between items-center text-xs text-gray-300">
                    <span>{article.source}</span>
                    <span>{new Date(article.publishDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
