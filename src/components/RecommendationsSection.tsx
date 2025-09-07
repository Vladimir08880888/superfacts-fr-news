'use client';

import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, RefreshCw } from 'lucide-react';
import { ArticleCard } from './ArticleCard';
import { useRecommendations } from '@/contexts/RecommendationsContext';
import { useTranslatedText } from '@/contexts/TranslationContext';
import { Article } from '@/lib/news-collector';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface RecommendationsSectionProps {
  articles: Article[];
  className?: string;
}

export default function RecommendationsSection({ articles, className = '' }: RecommendationsSectionProps) {
  const { getRecommendations, readingHistory } = useRecommendations();
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { translatedText: sectionTitle } = useTranslatedText('Recommandé pour vous');
  const { translatedText: noHistoryTitle } = useTranslatedText('Articles tendance');
  const { translatedText: noHistoryDescription } = useTranslatedText('Découvrez les articles les plus populaires du moment');
  const { translatedText: personalizedDescription } = useTranslatedText('Basé sur vos lectures précédentes');
  const { translatedText: refreshText } = useTranslatedText('Actualiser');

  const recommendations = getRecommendations(articles, 6);
  const hasHistory = readingHistory.length > 0;
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (recommendations.length === 0) {
    return null;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section className={cn('py-12 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            {hasHistory ? (
              <Sparkles className="w-8 h-8 text-blue-500" />
            ) : (
              <TrendingUp className="w-8 h-8 text-blue-500" />
            )}
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {hasHistory ? sectionTitle : noHistoryTitle}
            </h2>
          </div>
          
          <div className="flex items-center justify-center gap-4">
            <p className="text-gray-600 dark:text-gray-400">
              {hasHistory ? personalizedDescription : noHistoryDescription}
            </p>
            
            {hasHistory && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
                title={refreshText}
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">{refreshText}</span>
              </motion.button>
            )}
          </div>

          {/* Recommendation Stats */}
          {hasHistory && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>{readingHistory.length} articles lus</span>
              </div>
              
              {Object.keys(recommendations.length > 0 ? 
                Object.fromEntries(
                  Object.entries(recommendations.reduce((acc: any, article) => {
                    acc[article.category] = (acc[article.category] || 0) + 1;
                    return acc;
                  }, {})).slice(0, 2)
                ) : {}
              ).map((category, index) => (
                <div key={category} className="flex items-center gap-2">
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    index === 0 ? 'bg-green-500' : 'bg-purple-500'
                  )}></div>
                  <span>{category}</span>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Articles Grid */}
        <motion.div
          key={refreshKey}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {recommendations.map((article, index) => (
            <motion.div
              key={`${article.id}-${refreshKey}`}
              variants={itemVariants}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <ArticleCard 
                article={article} 
                variant="default" 
                index={index} 
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Personalization Hint */}
        {!hasHistory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="text-center mt-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Lisez des articles pour obtenir des recommandations personnalisées
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
