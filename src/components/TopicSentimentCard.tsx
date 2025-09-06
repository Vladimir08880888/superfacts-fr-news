'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Article } from '@/lib/news-collector';

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

interface TopicSentimentCardProps {
  data: CategorySentiment | TrendingTopic;
  type: 'category' | 'topic';
  index: number;
  onClick?: () => void;
}

const TopicSentimentCard: React.FC<TopicSentimentCardProps> = ({ 
  data, 
  type, 
  index,
  onClick 
}) => {
  const getSentimentColor = (sentiment: 'positive' | 'negative' | 'neutral') => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSentimentIcon = (sentiment: 'positive' | 'negative' | 'neutral') => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="w-4 h-4" />;
      case 'negative': return <TrendingDown className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  const getSentimentEmoji = (sentiment: 'positive' | 'negative' | 'neutral') => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😟';
      default: return '😐';
    }
  };

  const getScorePercentage = (score: number) => {
    // Convertir le score de -1/+1 vers un pourcentage
    return Math.abs(score * 100);
  };

  const renderSentimentBar = () => {
    if (type === 'topic') {
      const topic = data as TrendingTopic;
      return (
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <motion.div
            className={`h-2 rounded-full ${
              topic.sentiment === 'positive' ? 'bg-green-500' :
              topic.sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-400'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${getScorePercentage(topic.sentimentScore)}%` }}
            transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
          />
        </div>
      );
    }

    const category = data as CategorySentiment;
    const total = category.total;
    
    if (total === 0) return null;

    return (
      <div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
        <div className="flex h-full">
          {/* Segment positif */}
          <motion.div
            className="bg-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${(category.positive / total) * 100}%` }}
            transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
          />
          {/* Segment neutre */}
          <motion.div
            className="bg-gray-400"
            initial={{ width: 0 }}
            animate={{ width: `${(category.neutral / total) * 100}%` }}
            transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
          />
          {/* Segment négatif */}
          <motion.div
            className="bg-red-500"
            initial={{ width: 0 }}
            animate={{ width: `${(category.negative / total) * 100}%` }}
            transition={{ duration: 1, delay: index * 0.1 + 0.7 }}
          />
        </div>
      </div>
    );
  };

  const getName = () => {
    return type === 'category' ? (data as CategorySentiment).category : (data as TrendingTopic).keyword;
  };

  const getTotal = () => {
    return type === 'category' ? (data as CategorySentiment).total : (data as TrendingTopic).count;
  };

  const getSentiment = () => {
    return type === 'category' ? (data as CategorySentiment).dominantSentiment : (data as TrendingTopic).sentiment;
  };

  const getScore = () => {
    return type === 'category' ? (data as CategorySentiment).sentimentScore : (data as TrendingTopic).sentimentScore;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-100 p-6 cursor-pointer hover:shadow-lg transition-all duration-300 ${onClick ? 'hover:border-blue-200' : ''}`}
    >
      {/* Header avec nom et emoji */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">
            {getSentimentEmoji(getSentiment())}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{getName()}</h3>
            <p className="text-sm text-gray-500">{getTotal()} articles</p>
          </div>
        </div>
        
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium ${getSentimentColor(getSentiment())}`}>
          {getSentimentIcon(getSentiment())}
          <span>{(getScore() * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Barre de sentiment */}
      {renderSentimentBar()}

      {/* Détails par type */}
      {type === 'category' && (() => {
        const category = data as CategorySentiment;
        return (
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="text-green-600">
              <div className="font-semibold">{category.positive}</div>
              <div>Positifs</div>
            </div>
            <div className="text-gray-600">
              <div className="font-semibold">{category.neutral}</div>
              <div>Neutres</div>
            </div>
            <div className="text-red-600">
              <div className="font-semibold">{category.negative}</div>
              <div>Négatifs</div>
            </div>
          </div>
        );
      })()}

      {type === 'topic' && (() => {
        const topic = data as TrendingTopic;
        return (
          <div className="space-y-2">
            <div className="text-xs text-gray-500">
              Tendance: <span className="font-medium">{topic.keyword}</span>
            </div>
            {topic.articles.length > 0 && (
              <div className="text-xs text-gray-600">
                Exemple: "{topic.articles[0].title.substring(0, 50)}..."
              </div>
            )}
          </div>
        );
      })()}

      {/* Articles représentatifs pour les catégories */}
      {type === 'category' && (() => {
        const category = data as CategorySentiment;
        const { mostPositive, mostNegative } = category.articles;
        
        if (!mostPositive && !mostNegative) return null;

        return (
          <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
            {mostPositive && (
              <div className="text-xs">
                <span className="text-green-600 font-medium">+ Positif:</span>
                <p className="text-gray-600 mt-1">"{mostPositive.title.substring(0, 60)}..."</p>
              </div>
            )}
            {mostNegative && (
              <div className="text-xs">
                <span className="text-red-600 font-medium">- Négatif:</span>
                <p className="text-gray-600 mt-1">"{mostNegative.title.substring(0, 60)}..."</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Indicateur de performance */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Impact sentiment</span>
          <div className="flex items-center space-x-1">
            {Math.abs(getScore()) > 0.3 ? (
              <>
                <div className={`w-2 h-2 rounded-full ${getScore() > 0 ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="font-medium">Fort</span>
              </>
            ) : Math.abs(getScore()) > 0.1 ? (
              <>
                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                <span className="font-medium">Modéré</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                <span className="font-medium">Faible</span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TopicSentimentCard;
