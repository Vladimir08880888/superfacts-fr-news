'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header';
import { ArticleCard } from '@/components/ArticleCard';
import SentimentButton from '@/components/SentimentButton';
import { Article } from '@/lib/news-collector';
import { Loader2, AlertCircle, Sparkles, TrendingUp, Clock } from 'lucide-react';
import { useTranslatedText, useTranslation } from '@/contexts/TranslationContext';
import NativeAd from '@/components/ads/NativeAd';
import BannerAd from '@/components/ads/BannerAd';
import GoogleAdSense, { AdSenseHeader, AdSenseSidebar } from '@/components/ads/GoogleAdSense';
import { AdPlacement } from '@/types/advertising';
import { useAdContext } from '@/hooks/useAdContext';
import { useAnalytics, useReadingSessionTracking, useSearchAnalytics } from '@/hooks/useAnalytics';
import { useAdConfiguration } from '@/hooks/useAdConfiguration';
import NewsletterSignup from '@/components/NewsletterSignup';

interface NewsResponse {
  success: boolean;
  articles: Article[];
  total: number;
  totalAvailable?: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
}

function HomeContent() {
  const { currentLanguage } = useTranslation();
  const analytics = useAnalytics();
  const { trackSearchQuery } = useSearchAnalytics();
  const { shouldShowAd, shouldShowBetweenArticleAd } = useAdConfiguration();
  
  // Initialize reading session tracking
  useReadingSessionTracking();
  const { translatedText: translatedHeroSubtitle } = useTranslatedText('Actualités françaises en temps réel', []);
  const { translatedText: translatedHeroDescription } = useTranslatedText('Découvrez les dernières actualités de France agrégées depuis les plus grandes sources d\'information', []);
  const { translatedText: translatedAvailableArticles } = useTranslatedText('articles disponibles', []);
  const { translatedText: translatedUpdatedContinuously } = useTranslatedText('Mis à jour en continu', []);
  const { translatedText: translatedLoadingNews } = useTranslatedText('Chargement des actualités...', []);
  const { translatedText: translatedTopStories } = useTranslatedText('À la Une', []);
  const { translatedText: translatedAllNews } = useTranslatedText('Toutes les actualités', []);
  const { translatedText: translatedTrends } = useTranslatedText('Tendances', []);
  const { translatedText: translatedStatistics } = useTranslatedText('Statistiques', []);
  const { translatedText: translatedTotalArticles } = useTranslatedText('Articles total', []);
  const { translatedText: translatedHotArticles } = useTranslatedText('Articles chauds', []);
  const { translatedText: translatedActiveSources } = useTranslatedText('Sources actives', []);
  const { translatedText: translatedNoArticlesFound } = useTranslatedText('Aucun article trouvé pour ces critères', []);
  const { translatedText: translatedNoArticlesAvailable } = useTranslatedText('Aucun article disponible pour le moment', []);
  const { translatedText: translatedCollectNews } = useTranslatedText('Collecter les actualités', []);
  const { translatedText: translatedCollecting } = useTranslatedText('Collecte...', []);
  const { translatedText: translatedArticle } = useTranslatedText('article', []);
  const { translatedText: translatedArticles } = useTranslatedText('articles', []);
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollecting, setIsCollecting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [overallSentiment, setOverallSentiment] = useState<{
    positive: number;
    negative: number;
    neutral: number;
    dominant: 'positive' | 'negative' | 'neutral';
  } | null>(null);
  
  // User context for ads
  const userContext = useAdContext(selectedCategory);

  // Charger les articles au démarrage
  useEffect(() => {
    loadArticles();
  }, []);

  // Filtrer les articles selon la recherche et la catégorie
  useEffect(() => {
    let filtered = articles;

    // Filtre par catégorie
    if (selectedCategory) {
      filtered = filtered.filter(article => 
        article.category === selectedCategory
      );
      // Track category filtering
      analytics.trackCategoryFilter(selectedCategory);
    }

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.summary.toLowerCase().includes(query) ||
        article.source.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query))
      );
      // Track search with results count
      trackSearchQuery(searchQuery, filtered.length);
    }

    setFilteredArticles(filtered);
  }, [articles, selectedCategory, searchQuery]);
  
  // Calculer le sentiment général
  useEffect(() => {
    if (filteredArticles.length === 0) {
      setOverallSentiment(null);
      return;
    }
    
    const calculateSentiment = (text: string) => {
      const positiveWords = ['succès', 'victoire', 'croissance', 'amélioration', 'innovation', 'record'];
      const negativeWords = ['crise', 'échec', 'problème', 'accident', 'mort', 'violence'];
      
      const lowerText = text.toLowerCase();
      let positiveScore = 0;
      let negativeScore = 0;
      
      positiveWords.forEach(word => {
        if (lowerText.includes(word)) positiveScore++;
      });
      
      negativeWords.forEach(word => {
        if (lowerText.includes(word)) negativeScore++;
      });
      
      if (positiveScore > negativeScore) return 'positive';
      if (negativeScore > positiveScore) return 'negative';
      return 'neutral';
    };
    
    let positive = 0, negative = 0, neutral = 0;
    
    filteredArticles.forEach(article => {
      const sentiment = calculateSentiment(article.title + ' ' + article.summary);
      if (sentiment === 'positive') positive++;
      else if (sentiment === 'negative') negative++;
      else neutral++;
    });
    
    const total = positive + negative + neutral;
    let dominant: 'positive' | 'negative' | 'neutral' = 'neutral';
    
    if (positive > negative && positive > neutral) dominant = 'positive';
    else if (negative > neutral) dominant = 'negative';
    
    setOverallSentiment({ positive, negative, neutral, dominant });
  }, [filteredArticles]);

  const loadArticles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Charger plus d'articles par défaut
      const response = await fetch('/api/news?limit=1000');
      const data: NewsResponse = await response.json();
      
      if (data.success) {
        setArticles(data.articles);
        console.log(`Chargé ${data.articles.length} articles sur ${data.totalAvailable || data.total} disponibles`);
      } else {
        setError('Erreur lors du chargement des articles');
      }
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Impossible de charger les actualités');
    } finally {
      setIsLoading(false);
    }
  };

  const collectNews = async () => {
    try {
      setIsCollecting(true);
      const response = await fetch('/api/collect', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        // Track news collection
        analytics.trackNewsCollection(result.articlesCollected || 0);
        // Recharger les articles après la collecte
        await loadArticles();
      } else {
        setError(result.error || 'Erreur lors de la collecte');
      }
    } catch (err) {
      console.error('Erreur lors de la collecte:', err);
      setError('Erreur lors de la collecte des actualités');
    } finally {
      setIsCollecting(false);
    }
  };

  const featuredArticles = filteredArticles.slice(0, 3);
  const regularArticles = filteredArticles.slice(3);
  const hotArticles = articles.filter(article => article.isHot).slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header
        onSearch={setSearchQuery}
        onCategoryFilter={setSelectedCategory}
        onCollectNews={collectNews}
        isCollecting={isCollecting}
        selectedCategory={selectedCategory}
      />

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white"
      >
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4" />
              <span>{translatedHeroSubtitle}</span>
            </motion.div>
            
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-4xl md:text-6xl font-bold mb-4"
            >
              SuperFacts
              <span className="block text-2xl md:text-3xl text-blue-200 mt-2">Toute l'actualité française</span>
            </motion.h1>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto"
            >
              {translatedHeroDescription}
            </motion.p>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 text-blue-100"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <span>{articles.length} {translatedAvailableArticles}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{translatedUpdatedContinuously}</span>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Formes décoratives */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-32 -translate-y-32" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-32 translate-y-32" />
      </motion.section>

      {/* Google AdSense Header Banner */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="bg-gray-50 dark:bg-gray-800/50 py-4"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <AdSenseHeader adSlot="1234567890" />
          </div>
        </div>
      </motion.section>

      {/* Section Sentiment moderne */}
      {overallSentiment && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="relative bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm py-12"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center">
              <SentimentButton
                sentiment={overallSentiment}
                articleCount={articles.length}
                variant="compact"
                className="max-w-sm"
              />
            </div>
          </div>
        </motion.section>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Gestion des erreurs */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-300"
            >
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* État de chargement */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">{translatedLoadingNews}</p>
            </motion.div>
          </div>
        ) : (
          <>
            {/* Section Articles à la Une */}
            {featuredArticles.length > 0 && (
              <section className="mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-3 mb-6"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {translatedTopStories}
                  </h2>
                </motion.div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {featuredArticles.map((article, index) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      variant={index === 0 ? 'featured' : 'default'}
                      index={index}
                    />
                  ))}
                </div>
                
                {/* Native ad after featured articles */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-8"
                >
                  <NativeAd 
                    placement={AdPlacement.BETWEEN_ARTICLES}
                    userContext={userContext}
                    variant="featured"
                    className="max-w-4xl mx-auto"
                  />
                </motion.div>
              </section>
            )}

            {/* Layout principal avec sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Articles principaux */}
              <div className="lg:col-span-3">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-between mb-6"
                >
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {selectedCategory ? selectedCategory : translatedAllNews}
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {filteredArticles.length} {filteredArticles.length === 1 ? translatedArticle : translatedArticles}
                  </span>
                </motion.div>
                
                {regularArticles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {regularArticles.map((article, index) => {
                      const elements = [];
                      
                      // Add the article
                      elements.push(
                        <ArticleCard
                          key={article.id}
                          article={article}
                          variant="default"
                          index={index + 3}
                        />
                      );
                      
                      // Add native ad based on configuration
                      if (shouldShowBetweenArticleAd(index) && index < regularArticles.length - 1) {
                        elements.push(
                          <motion.div
                            key={`ad-${index}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="md:col-span-2"
                          >
                            <NativeAd 
                              placement={AdPlacement.BETWEEN_ARTICLES}
                              userContext={userContext}
                              variant="default"
                            />
                          </motion.div>
                        );
                      }
                      
                      // Additional smaller banner ads every 8 articles (alternating placement)
                      if ((index + 1) % 8 === 0 && index < regularArticles.length - 1 && shouldShowAd(AdPlacement.BETWEEN_ARTICLES)) {
                        elements.push(
                          <motion.div
                            key={`banner-ad-${index}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            className="md:col-span-2 flex justify-center py-4"
                          >
                            <BannerAd 
                              placement={AdPlacement.BETWEEN_ARTICLES}
                              userContext={userContext}
                              className="max-w-lg"
                            />
                          </motion.div>
                        );
                      }
                      
                      // Google AdSense ads every 12 articles
                      if ((index + 1) % 12 === 0 && index < regularArticles.length - 1) {
                        elements.push(
                          <motion.div
                            key={`adsense-${index}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                            className="md:col-span-2"
                          >
                            <GoogleAdSense
                              adSlot="5555555555"
                              className="flex justify-center py-4"
                              responsive={true}
                              format="horizontal"
                            />
                          </motion.div>
                        );
                      }
                      
                      return elements;
                    }).flat()}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <div className="text-gray-400 mb-4">
                      <Sparkles className="w-12 h-12 mx-auto" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                      {searchQuery || selectedCategory 
                        ? translatedNoArticlesFound
                        : translatedNoArticlesAvailable
                      }
                    </p>
                    <button
                      onClick={collectNews}
                      disabled={isCollecting}
                      className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50"
                    >
                      {isCollecting ? translatedCollecting : translatedCollectNews}
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Sidebar */}
              <aside className="lg:col-span-1">
                {/* Google AdSense Sidebar Ad */}
                <motion.section
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-8"
                >
                  <AdSenseSidebar adSlot="9876543210" />
                </motion.section>
                
                {/* Sidebar Banner Ad */}
                <motion.section
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mb-8"
                >
                  <BannerAd 
                    placement={AdPlacement.SIDEBAR}
                    userContext={userContext}
                    className="w-full"
                  />
                </motion.section>
                {/* Articles chauds */}
                {hotArticles.length > 0 && (
                  <motion.section
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mb-8"
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{translatedTrends}</h3>
                      </div>
                      
                      <div className="space-y-3">
                        {hotArticles.map((article, index) => (
                          <ArticleCard
                            key={article.id}
                            article={article}
                            variant="compact"
                            index={index}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.section>
                )}
                
                {/* Sentiment Analysis Widget */}
                {overallSentiment && (
                  <motion.section
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.65 }}
                    className="mb-8"
                  >
                    <SentimentButton
                      sentiment={overallSentiment}
                      articleCount={filteredArticles.length}
                      variant="expanded"
                      className="w-full"
                    />
                  </motion.section>
                )}
                
                {/* Newsletter Signup */}
                <motion.section
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.65 }}
                  className="mb-8"
                >
                  <NewsletterSignup variant="sidebar" />
                </motion.section>
                
                {/* Compact Native Ad */}
                <motion.section
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="mb-8"
                >
                  <NativeAd 
                    placement={AdPlacement.SIDEBAR}
                    userContext={userContext}
                    variant="compact"
                  />
                </motion.section>

                {/* Statistiques */}
                <motion.section
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{translatedStatistics}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">{translatedTotalArticles}</span>
                      <span className="font-semibold text-blue-600">{articles.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">{translatedHotArticles}</span>
                      <span className="font-semibold text-red-600">{hotArticles.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">{translatedActiveSources}</span>
                      <span className="font-semibold text-green-600">
                        {new Set(articles.map(a => a.source)).size}
                      </span>
                    </div>
                  </div>
                </motion.section>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function HomePageClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Chargement...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
