'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTranslatedText } from '@/contexts/TranslationContext';
import Link from 'next/link';

interface BreakingNews {
  id: string;
  title: string;
  url: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
}

interface BreakingNewsBannerProps {
  breakingNews: BreakingNews[];
  className?: string;
}

export default function BreakingNewsBanner({ breakingNews, className = '' }: BreakingNewsBannerProps) {
  const [visibleNews, setVisibleNews] = useState<BreakingNews[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  
  const { translatedText: breakingLabel } = useTranslatedText('BREAKING');
  const { translatedText: urgentLabel } = useTranslatedText('URGENT');
  const { translatedText: importantLabel } = useTranslatedText('IMPORTANT');

  useEffect(() => {
    // Filter out dismissed news and sort by priority
    const filteredNews = breakingNews
      .filter(news => !dismissedIds.has(news.id))
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 3); // Show max 3 breaking news

    setVisibleNews(filteredNews);
  }, [breakingNews, dismissedIds]);

  const dismissNews = (newsId: string) => {
    setDismissedIds(prev => new Set([...prev, newsId]));
    
    // Store dismissed IDs in localStorage for persistence
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dismissed-breaking-news') || '[]';
      const dismissedList = JSON.parse(stored);
      dismissedList.push(newsId);
      localStorage.setItem('dismissed-breaking-news', JSON.stringify(dismissedList));
    }
  };

  // Load dismissed IDs from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dismissed-breaking-news');
      if (stored) {
        try {
          const dismissedList = JSON.parse(stored);
          setDismissedIds(new Set(dismissedList));
        } catch (error) {
          console.error('Failed to parse dismissed news:', error);
        }
      }
    }
  }, []);

  const getPriorityStyle = (priority: BreakingNews['priority']) => {
    switch (priority) {
      case 'high':
        return {
          bg: 'bg-red-600',
          text: 'text-white',
          label: breakingLabel,
          animation: 'animate-pulse'
        };
      case 'medium':
        return {
          bg: 'bg-orange-500',
          text: 'text-white',
          label: urgentLabel,
          animation: ''
        };
      case 'low':
        return {
          bg: 'bg-blue-600',
          text: 'text-white',
          label: importantLabel,
          animation: ''
        };
    }
  };

  if (visibleNews.length === 0) return null;

  return (
    <div className={cn('fixed top-20 left-0 right-0 z-40 px-4 sm:px-6 lg:px-8', className)}>
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="popLayout">
          {visibleNews.map((news, index) => {
            const style = getPriorityStyle(news.priority);
            
            return (
              <motion.div
                key={news.id}
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: index * 60, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                transition={{ duration: 0.5, type: 'spring', stiffness: 300 }}
                className={cn(
                  'relative flex items-center gap-4 p-3 rounded-lg shadow-lg backdrop-blur-sm border mb-2',
                  style.bg,
                  style.text,
                  style.animation
                )}
                style={{ zIndex: 40 - index }}
              >
                {/* Icon */}
                <div className="flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>

                {/* Label */}
                <div className="flex-shrink-0">
                  <span className="text-xs font-bold px-2 py-1 bg-white/20 rounded">
                    {style.label}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <Link href={news.url}>
                    <motion.p
                      whileHover={{ scale: 1.02 }}
                      className="text-sm font-medium truncate hover:underline cursor-pointer"
                    >
                      {news.title}
                    </motion.p>
                  </Link>
                </div>

                {/* External link indicator */}
                <div className="flex-shrink-0">
                  <Link href={news.url}>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-1 hover:bg-white/20 rounded transition-colors duration-200"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </motion.button>
                  </Link>
                </div>

                {/* Dismiss button */}
                <div className="flex-shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => dismissNews(news.id)}
                    className="p-1 hover:bg-white/20 rounded transition-colors duration-200"
                    aria-label="Fermer"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
