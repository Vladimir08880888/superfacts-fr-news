'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Frown, 
  Meh, 
  TrendingUp,
  Brain,
  Sparkles,
  ChevronRight,
  Activity,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { useTranslatedText } from '@/contexts/TranslationContext';

interface SentimentData {
  positive: number;
  negative: number;
  neutral: number;
  dominant: 'positive' | 'negative' | 'neutral';
}

interface SentimentButtonProps {
  sentiment: SentimentData | null;
  articleCount: number;
  className?: string;
  variant?: 'compact' | 'expanded' | 'minimal';
}

export default function SentimentButton({ 
  sentiment, 
  articleCount, 
  className = '',
  variant = 'expanded'
}: SentimentButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Translations
  const { translatedText: positiveText } = useTranslatedText('Ambiance positive', []);
  const { translatedText: negativeText } = useTranslatedText('Climat tendu', []);
  const { translatedText: neutralText } = useTranslatedText('Actualité équilibrée', []);
  const { translatedText: analyzeText } = useTranslatedText('Analyser les sentiments', []);
  const { translatedText: moodText } = useTranslatedText('Humeur générale', []);
  const { translatedText: articlesAnalyzedText } = useTranslatedText('articles analysés', []);

  if (!sentiment) {
    return null;
  }

  const total = sentiment.positive + sentiment.negative + sentiment.neutral;
  const positivePercent = total > 0 ? (sentiment.positive / total * 100) : 0;
  const negativePercent = total > 0 ? (sentiment.negative / total * 100) : 0;
  const neutralPercent = total > 0 ? (sentiment.neutral / total * 100) : 0;

  const getSentimentConfig = (dominant: 'positive' | 'negative' | 'neutral') => {
    const configs = {
      positive: {
        icon: Heart,
        text: positiveText,
        bgGradient: 'from-emerald-500 via-teal-500 to-green-500',
        hoverGradient: 'from-emerald-600 via-teal-600 to-green-600',
        shadowColor: 'shadow-emerald-500/25',
        hoverShadow: 'hover:shadow-emerald-500/40',
        iconColor: 'text-emerald-100',
        textColor: 'text-white',
        borderColor: 'border-emerald-300/30',
        emoji: '😊',
        pulseColor: 'bg-emerald-400'
      },
      negative: {
        icon: Frown,
        text: negativeText,
        bgGradient: 'from-red-500 via-rose-500 to-pink-500',
        hoverGradient: 'from-red-600 via-rose-600 to-pink-600',
        shadowColor: 'shadow-red-500/25',
        hoverShadow: 'hover:shadow-red-500/40',
        iconColor: 'text-red-100',
        textColor: 'text-white',
        borderColor: 'border-red-300/30',
        emoji: '😔',
        pulseColor: 'bg-red-400'
      },
      neutral: {
        icon: Meh,
        text: neutralText,
        bgGradient: 'from-slate-500 via-gray-500 to-zinc-500',
        hoverGradient: 'from-slate-600 via-gray-600 to-zinc-600',
        shadowColor: 'shadow-slate-500/25',
        hoverShadow: 'hover:shadow-slate-500/40',
        iconColor: 'text-slate-100',
        textColor: 'text-white',
        borderColor: 'border-slate-300/30',
        emoji: '😐',
        pulseColor: 'bg-slate-400'
      }
    };
    return configs[dominant];
  };

  const config = getSentimentConfig(sentiment.dominant);

  // Minimal variant (for basic use)
  if (variant === 'minimal') {
    return (
      <Link href="/sentiment">
        <motion.button
          className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-xl
            bg-gradient-to-r ${config.bgGradient}
            text-white font-medium shadow-md hover:shadow-lg
            transition-all duration-200 border border-white/10 hover:border-white/20
            ${className}
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Analyse des sentiments"
        >
          <Brain className="w-4 h-4" />
          <span className="text-sm">Sentiment</span>
          <div className="px-1.5 py-0.5 bg-white/20 rounded text-xs font-semibold">AI</div>
        </motion.button>
      </Link>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <Link href="/sentiment">
        <motion.div
          className={`relative group cursor-pointer ${className}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            className={`
              flex items-center gap-3 px-4 py-3 rounded-2xl
              bg-gradient-to-r ${config.bgGradient}
              border ${config.borderColor}
              ${config.shadowColor} shadow-lg
              ${config.hoverShadow} hover:shadow-2xl
              transition-all duration-300
              backdrop-blur-sm
            `}
          >
            {/* Animated pulse background */}
            <div className={`absolute inset-0 ${config.pulseColor} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500`} />
            
            {/* Icon with pulse animation */}
            <div className="relative">
              <config.icon className={`w-5 h-5 ${config.iconColor}`} />
              <motion.div 
                className={`absolute inset-0 ${config.pulseColor} rounded-full opacity-30`}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>

            <span className={`text-sm font-medium ${config.textColor}`}>
              {config.text}
            </span>

            <ChevronRight className={`w-4 h-4 ${config.iconColor} group-hover:translate-x-1 transition-transform duration-200`} />
          </motion.div>
        </motion.div>
      </Link>
    );
  }

  // Expanded variant (default)
  return (
    <motion.div 
      className={`relative ${className}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Link href="/sentiment">
        <motion.div
          className={`
            relative group cursor-pointer overflow-hidden rounded-2xl
            bg-gradient-to-br ${config.bgGradient}
            border-2 ${config.borderColor}
            ${config.shadowColor} shadow-xl
            ${config.hoverShadow} hover:shadow-2xl
            transition-all duration-500 ease-out
            backdrop-blur-sm
          `}
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12" />
          </div>

          {/* Animated pulse overlay */}
          <motion.div 
            className={`absolute inset-0 ${config.pulseColor} opacity-0`}
            animate={{ 
              opacity: isHovered ? [0, 0.1, 0] : 0,
              scale: isHovered ? [1, 1.05, 1] : 1 
            }}
            transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0 }}
          />

          <div className="relative p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="relative"
                  animate={{ rotate: isHovered ? 360 : 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <div className={`p-3 bg-white/20 rounded-xl backdrop-blur-sm border ${config.borderColor}`}>
                    <Brain className={`w-6 h-6 ${config.iconColor}`} />
                  </div>
                  {/* Sparkle effect */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        className="absolute -top-1 -right-1"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                      >
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                
                <div>
                  <h3 className={`text-lg font-bold ${config.textColor} flex items-center gap-2`}>
                    <span>{moodText}</span>
                    <motion.span
                      className="text-2xl"
                      animate={{ scale: isHovered ? [1, 1.2, 1] : 1 }}
                      transition={{ duration: 0.5, repeat: isHovered ? Infinity : 0 }}
                    >
                      {config.emoji}
                    </motion.span>
                  </h3>
                  <p className={`text-sm ${config.textColor} opacity-90`}>
                    {articleCount} {articlesAnalyzedText}
                  </p>
                </div>
              </div>

              <motion.div
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronRight className={`w-5 h-5 ${config.iconColor}`} />
              </motion.div>
            </div>

            {/* Sentiment display */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <config.icon className={`w-8 h-8 ${config.iconColor}`} />
                <span className={`text-xl font-bold ${config.textColor}`}>
                  {config.text}
                </span>
              </div>
              <div className={`text-right ${config.textColor}`}>
                <div className="text-2xl font-bold">{sentiment[sentiment.dominant]}</div>
                <div className="text-sm opacity-80">articles</div>
              </div>
            </div>

            {/* Progress bars */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 min-w-[80px]">
                  <Heart className="w-4 h-4 text-emerald-300" />
                  <span className="text-xs text-white font-medium">{sentiment.positive}</span>
                </div>
                <div className="flex-1 bg-white/20 rounded-full h-2 overflow-hidden">
                  <motion.div 
                    className="bg-emerald-400 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${positivePercent}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                  />
                </div>
                <span className="text-xs text-white/80 w-8">{Math.round(positivePercent)}%</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 min-w-[80px]">
                  <Meh className="w-4 h-4 text-slate-300" />
                  <span className="text-xs text-white font-medium">{sentiment.neutral}</span>
                </div>
                <div className="flex-1 bg-white/20 rounded-full h-2 overflow-hidden">
                  <motion.div 
                    className="bg-slate-400 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${neutralPercent}%` }}
                    transition={{ duration: 1, delay: 0.4 }}
                  />
                </div>
                <span className="text-xs text-white/80 w-8">{Math.round(neutralPercent)}%</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 min-w-[80px]">
                  <Frown className="w-4 h-4 text-red-300" />
                  <span className="text-xs text-white font-medium">{sentiment.negative}</span>
                </div>
                <div className="flex-1 bg-white/20 rounded-full h-2 overflow-hidden">
                  <motion.div 
                    className="bg-red-400 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${negativePercent}%` }}
                    transition={{ duration: 1, delay: 0.6 }}
                  />
                </div>
                <span className="text-xs text-white/80 w-8">{Math.round(negativePercent)}%</span>
              </div>
            </div>

            {/* CTA */}
            <motion.div 
              className="mt-4 pt-4 border-t border-white/20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm ${config.textColor} opacity-90 flex items-center gap-2`}>
                  <Activity className="w-4 h-4" />
                  {analyzeText}
                </span>
                <motion.div
                  animate={{ x: isHovered ? 5 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-1"
                >
                  <BarChart3 className={`w-4 h-4 ${config.iconColor}`} />
                  <TrendingUp className={`w-4 h-4 ${config.iconColor}`} />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

// Backward compatibility
export function MinimalSentimentButton() {
  return (
    <Link href="/sentiment">
      <motion.button
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 border border-white/10 hover:border-white/20"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Analyse des sentiments"
      >
        <Brain className="w-4 h-4" />
        <span className="text-sm">Sentiment</span>
        <div className="px-1.5 py-0.5 bg-white/20 rounded text-xs font-semibold">AI</div>
      </motion.button>
    </Link>
  );
}
