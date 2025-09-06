'use client';

import { useBookmarks } from '@/contexts/BookmarksContext';
import { useTranslatedText } from '@/contexts/TranslationContext';
import { ArticleCard } from '@/components/ArticleCard';
import { motion } from 'framer-motion';
import { Bookmark, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BookmarksPage() {
  const { bookmarks, clearBookmarks } = useBookmarks();
  const { translatedText: pageTitle } = useTranslatedText('Mes articles favoris');
  const { translatedText: emptyMessage } = useTranslatedText('Aucun article en favori');
  const { translatedText: emptyDescription } = useTranslatedText('Commencez à ajouter des articles à vos favoris en cliquant sur l\'icône de signet.');
  const { translatedText: clearAllText } = useTranslatedText('Tout supprimer');

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Bookmark className="w-8 h-8 text-yellow-500" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              {pageTitle}
            </h1>
          </div>
          
          {bookmarks.length > 0 && (
            <div className="flex items-center justify-center gap-4">
              <p className="text-gray-600 dark:text-gray-400">
                {bookmarks.length} article{bookmarks.length > 1 ? 's' : ''} sauvegardé{bookmarks.length > 1 ? 's' : ''}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearBookmarks}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4" />
                {clearAllText}
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Content */}
        {bookmarks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Bookmark className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              {emptyMessage}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
              {emptyDescription}
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {bookmarks.map((article, index) => (
              <motion.div
                key={article.id}
                variants={itemVariants}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <ArticleCard article={article} variant="default" index={index} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
