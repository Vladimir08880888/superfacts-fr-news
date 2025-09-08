'use client';

import { Article } from '@/lib/news-collector';
import { formatDate, formatReadTime, getCategoryColor, cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Clock, ExternalLink, TrendingUp, User, Languages, Bookmark, Heart, Frown, Meh, Download } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslatedText, useTranslation } from '@/contexts/TranslationContext';
import { useBookmarks } from '@/contexts/BookmarksContext';
import SocialShare from '@/components/SocialShare';
import { PDFGenerator } from '@/lib/pdf-generator';
import { useAnalytics, useArticleTimeTracking } from '@/hooks/useAnalytics';

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'featured' | 'compact';
  index?: number;
  sentiment?: {
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    confidence: number;
    intensity?: 'low' | 'medium' | 'high';
  };
}

export function ArticleCard({ article, variant = 'default', index = 0, sentiment }: ArticleCardProps) {
  const { currentLanguage } = useTranslation();
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();
  const analytics = useAnalytics();
  
  // Track time spent viewing this article card
  useArticleTimeTracking(article.id);
  const { translatedText: translatedTitle, isLoading: titleLoading } = useTranslatedText(article.title, [article.id]);
  const { translatedText: translatedSummary, isLoading: summaryLoading } = useTranslatedText(article.summary, [article.id]);
  const { translatedText: translatedCategory } = useTranslatedText(article.category, []);
  const { translatedText: translatedSource } = useTranslatedText(article.source, []);
  
  const showTranslationIndicator = currentLanguage.code !== 'fr' && (titleLoading || summaryLoading);
  const bookmarked = isBookmarked(article.id);
  
  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (bookmarked) {
      removeBookmark(article.id);
    } else {
      addBookmark(article);
    }
  };
  
  const handleArticleClick = () => {
    // Track article click
    analytics.trackArticleClick(article.id, article.title, article.category, article.source);
    
    // Track content consumption for enhanced ecommerce
    analytics.trackContentConsumption(article.id, article.title, article.category, 1);
    
    // Notify reading session tracking
    if ((window as any).trackArticleRead) {
      (window as any).trackArticleRead(article.id, article.category);
    }
  };
  
  const handlePDFDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Track PDF download
    analytics.track('pdf_download', 'engagement', 'article_pdf', undefined, {
      article_id: article.id,
      article_title: article.title,
      article_category: article.category
    });
    
    try {
      // Prepare translated content for PDF
      const translatedContent = {
        title: translatedTitle,
        summary: translatedSummary,
        category: translatedCategory,
        source: translatedSource
      };
      
      await PDFGenerator.downloadArticlePDF(article, {
        includeImage: true,
        includeTags: true,
        includeMetadata: true,
        fontSize: 'medium'
      }, translatedContent);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      // You could add a toast notification here
    }
  };
  
  // Fonctions de sentiment
  const getSentimentIcon = (sentiment: 'positive' | 'negative' | 'neutral') => {
    switch (sentiment) {
      case 'positive': return Heart;
      case 'negative': return Frown;
      default: return Meh;
    }
  };
  
  const getSentimentColor = (sentiment: 'positive' | 'negative' | 'neutral', intensity: 'low' | 'medium' | 'high' = 'medium') => {
    const colors = {
      positive: {
        low: 'text-green-400 bg-green-50',
        medium: 'text-green-600 bg-green-100',
        high: 'text-green-700 bg-green-200'
      },
      negative: {
        low: 'text-red-400 bg-red-50',
        medium: 'text-red-600 bg-red-100',
        high: 'text-red-700 bg-red-200'
      },
      neutral: {
        low: 'text-gray-400 bg-gray-50',
        medium: 'text-gray-500 bg-gray-100',
        high: 'text-gray-600 bg-gray-200'
      }
    };
    return colors[sentiment][intensity];
  };
  
  const getSentimentEmoji = (sentiment: 'positive' | 'negative' | 'neutral') => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😔';
      default: return '😐';
    }
  };
  
  const calculateSentiment = (text: string) => {
    if (sentiment) return sentiment;
    
    // Simple sentiment calculation if not provided
    const positiveWords = ['succès', 'victoire', 'croissance', 'amélioration', 'innovation'];
    const negativeWords = ['crise', 'échec', 'problème', 'accident', 'mort'];
    
    const lowerText = text.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveScore++;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeScore++;
    });
    
    if (positiveScore > negativeScore) {
      return { sentiment: 'positive' as const, score: 0.7, confidence: 0.6, intensity: 'medium' as const };
    } else if (negativeScore > positiveScore) {
      return { sentiment: 'negative' as const, score: -0.7, confidence: 0.6, intensity: 'medium' as const };
    }
    return { sentiment: 'neutral' as const, score: 0, confidence: 0.5, intensity: 'low' as const };
  };
  
  const articleSentiment = calculateSentiment(article.title + ' ' + article.summary);
  
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0
    }
  };

  const imageVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };
  
  const transitionProps = {
    duration: 0.5,
    delay: index * 0.1,
    ease: 'easeOut' as const
  };

  if (variant === 'compact') {
    return (
      <motion.article
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={transitionProps}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-gray-900/20 transition-all duration-300 overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <motion.div
              variants={imageVariants}
              whileHover="hover"
              whileTap="tap"
              className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0"
            >
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  // Prevent infinite loops if default image also fails
                  if (target.src !== window.location.origin + '/images/default-article.svg') {
                    target.src = '/images/default-article.svg';
                  }
                }}
                unoptimized={article.imageUrl.startsWith('http')}
              />
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <Link 
                href={`/articles/${article.id}`}
                className="block hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                onClick={handleArticleClick}
              >
                <div className="flex items-start gap-2">
                  <h3 className={cn(
                    "text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 flex-1",
                    titleLoading && "animate-pulse"
                  )}>
                    {translatedTitle}
                  </h3>
                  {showTranslationIndicator && (
                    <Languages className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
                  )}
                </div>
              </Link>
              
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-blue-600">{translatedSource}</span>
                  <span>•</span>
                  <span>{formatDate(article.publishDate)}</span>
                  {/* Sentiment indicator */}
                  <span className="text-lg" title={`Sentiment: ${articleSentiment.sentiment}`}>
                    {getSentimentEmoji(articleSentiment.sentiment)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handlePDFDownload}
                    className="p-1.5 rounded-full text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
                    title="Télécharger en PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleBookmarkClick}
                    className={cn(
                      "p-1.5 rounded-full transition-colors duration-200",
                      bookmarked 
                        ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30" 
                        : "text-gray-400 dark:text-gray-500 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                    )}
                    title={bookmarked ? "Retirer des favoris" : "Ajouter aux favoris"}
                  >
                    <Bookmark className={cn("w-3.5 h-3.5", bookmarked && "fill-current")} />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.article>
    );
  }

  if (variant === 'featured') {
    return (
      <motion.article
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={transitionProps}
        whileHover={{ y: -8, transition: { duration: 0.3 } }}
        className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-2xl dark:hover:shadow-gray-900/30 transition-all duration-500 overflow-hidden"
      >
        <motion.div 
          variants={imageVariants}
          whileHover="hover"
          className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 overflow-hidden"
        >
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              // Prevent infinite loops if default image also fails
              if (target.src !== window.location.origin + '/images/default-article.svg') {
                target.src = '/images/default-article.svg';
              }
            }}
            unoptimized={article.imageUrl.startsWith('http')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Badges superposés */}
          <div className="absolute top-4 left-4 flex gap-2">
            {article.isHot && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                <TrendingUp className="w-3 h-3" />
                Hot
              </span>
            )}
            <span className={cn('px-2 py-1 text-xs font-medium rounded-full border', getCategoryColor(article.category))}>
              {translatedCategory}
            </span>
            {/* Sentiment badge */}
            <span className={cn(
              'px-2 py-1 text-xs font-medium rounded-full border backdrop-blur-sm',
              getSentimentColor(articleSentiment.sentiment, articleSentiment.intensity || 'medium')
            )} title={`Sentiment: ${articleSentiment.sentiment} (${Math.round(articleSentiment.confidence * 100)}%)`}>
              {getSentimentEmoji(articleSentiment.sentiment)}
            </span>
          </div>
          
          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePDFDownload}
              className="p-2 rounded-full backdrop-blur-sm text-white/70 hover:text-blue-300 hover:bg-black/20 transition-colors duration-200"
              title="Télécharger en PDF"
            >
              <Download className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleBookmarkClick}
              className={cn(
                "p-2 rounded-full backdrop-blur-sm transition-colors duration-200",
                bookmarked 
                  ? "text-yellow-400 bg-black/20 hover:bg-black/30" 
                  : "text-white/70 hover:text-yellow-400 hover:bg-black/20"
              )}
              title={bookmarked ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <Bookmark className={cn("w-5 h-5", bookmarked && "fill-current")} />
            </motion.button>
          </div>
          
          <div className="absolute bottom-4 left-4 right-4">
            <Link 
              href={`/articles/${article.id}`}
              className="block"
              onClick={handleArticleClick}
            >
              <div className="flex items-start gap-2 mb-2">
                <h2 className={cn(
                  "text-xl font-bold text-white line-clamp-2 group-hover:text-blue-200 transition-colors duration-300 flex-1",
                  titleLoading && "animate-pulse"
                )}>
                  {translatedTitle}
                </h2>
                {showTranslationIndicator && (
                  <Languages className="w-4 h-4 text-blue-200 mt-1 shrink-0" />
                )}
              </div>
            </Link>
          </div>
        </motion.div>
        
        <div className="p-6">
          <p className={cn(
            "text-gray-600 dark:text-gray-300 line-clamp-3 mb-4",
            summaryLoading && "animate-pulse"
          )}>
            {translatedSummary}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span className="font-medium text-blue-600">{translatedSource}</span>
              </div>
              <span>•</span>
              <span>{formatDate(article.publishDate)}</span>
              {article.readTime && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatReadTime(article.readTime)}</span>
                  </div>
                </>
              )}
              {/* Sentiment indicator with confidence */}
              <span>•</span>
              <div className="flex items-center gap-1" title={`Confiance: ${Math.round(articleSentiment.confidence * 100)}%`}>
                <span className="text-base">{getSentimentEmoji(articleSentiment.sentiment)}</span>
                <span className="text-xs">{Math.round(articleSentiment.confidence * 100)}%</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePDFDownload}
                className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                title="Télécharger en PDF"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">PDF</span>
              </motion.button>
              <SocialShare 
                title={article.title}
                url={`/articles/${article.id}`}
                description={article.summary}
                variant="compact"
              />
              <Link 
                href={`/articles/${article.id}`}
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
                onClick={handleArticleClick}
              >
                <span className="text-sm font-medium">Lire l'article</span>
              </Link>
            </div>
          </div>
          
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-4">
              {article.tags.slice(0, 5).map((tag) => (
                <span 
                  key={tag}
                  className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-800 dark:hover:text-blue-200 transition-colors duration-200 cursor-pointer border border-blue-200 dark:border-blue-700 font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.article>
    );
  }

  // Variant par défaut
  return (
    <motion.article
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={transitionProps}
      whileHover={{ y: -6, transition: { duration: 0.3 } }}
      className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-xl dark:hover:shadow-gray-900/30 transition-all duration-400 overflow-hidden"
    >
      <motion.div 
        variants={imageVariants}
        whileHover="hover"
        className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 overflow-hidden"
      >
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            // Prevent infinite loops if default image also fails
            if (target.src !== window.location.origin + '/images/default-article.svg') {
              target.src = '/images/default-article.svg';
            }
          }}
          unoptimized={article.imageUrl.startsWith('http')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="absolute top-3 left-3 flex gap-2">
          {article.isHot && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/90 backdrop-blur-sm text-white text-xs font-medium rounded-full">
              <TrendingUp className="w-3 h-3" />
              Hot
            </span>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePDFDownload}
            className="p-2 rounded-full backdrop-blur-sm text-gray-600 bg-white/90 hover:text-blue-500 hover:bg-white transition-colors duration-200"
            title="Télécharger en PDF"
          >
            <Download className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleBookmarkClick}
            className={cn(
              "p-2 rounded-full backdrop-blur-sm transition-colors duration-200",
              bookmarked 
                ? "text-yellow-500 bg-white/90 hover:bg-white" 
                : "text-gray-600 bg-white/90 hover:text-yellow-500 hover:bg-white"
            )}
            title={bookmarked ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Bookmark className={cn("w-4 h-4", bookmarked && "fill-current")} />
          </motion.button>
        </div>
      </motion.div>
      
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className={cn('px-2 py-1 text-xs font-medium rounded-full border', getCategoryColor(article.category))}>
            {translatedCategory}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(article.publishDate)}</span>
        </div>
        
        <Link 
          href={`/articles/${article.id}`}
          className="block mb-3"
          onClick={handleArticleClick}
        >
          <div className="flex items-start gap-2">
            <h3 className={cn(
              "text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 flex-1",
              titleLoading && "animate-pulse"
            )}>
              {translatedTitle}
            </h3>
            {showTranslationIndicator && (
              <Languages className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            )}
          </div>
        </Link>
        
        <p className={cn(
          "text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-4",
          summaryLoading && "animate-pulse"
        )}>
          {translatedSummary}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-blue-600">{translatedSource}</span>
            {article.readTime && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatReadTime(article.readTime)}</span>
                </div>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePDFDownload}
              className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
              title="Télécharger en PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="text-sm">PDF</span>
            </motion.button>
            <SocialShare 
              title={article.title}
              url={`/articles/${article.id}`}
              description={article.summary}
              variant="compact"
            />
            <Link 
              href={`/articles/${article.id}`}
              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
              onClick={handleArticleClick}
            >
              <span className="text-sm">Lire</span>
            </Link>
          </div>
        </div>
        
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {article.tags.slice(0, 4).map((tag) => (
              <span 
                key={tag}
                className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-800 dark:hover:text-blue-200 transition-colors duration-200 cursor-pointer border border-blue-200 dark:border-blue-700"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.article>
  );
}
