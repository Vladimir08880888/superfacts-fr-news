'use client';

import React from 'react';
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
      case 'positive': return 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30';
      case 'negative': return 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50';
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
      case 'negative': return '😔';
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
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-3">
          <div
            className={`h-2.5 rounded-full transition-all duration-1000 ${
              topic.sentiment === 'positive' ? 'bg-emerald-500' :
              topic.sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-500'
            }`}
            style={{ width: `${getScorePercentage(topic.sentimentScore)}%` }}
          />
        </div>
      );
    }

    const category = data as CategorySentiment;
    const total = category.total;
    
    if (total === 0) return null;

    const positivePercent = (category.positive / total) * 100;
    const neutralPercent = (category.neutral / total) * 100;
    const negativePercent = (category.negative / total) * 100;

    return (
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3 overflow-hidden">
        <div className="flex h-full transition-all duration-1000">
          <div className="bg-emerald-500" style={{ width: `${positivePercent}%` }} />
          <div className="bg-gray-500" style={{ width: `${neutralPercent}%` }} />
          <div className="bg-red-500" style={{ width: `${negativePercent}%` }} />
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
    <div
      onClick={onClick}
      className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-600 ${onClick ? 'cursor-pointer hover:bg-white dark:hover:bg-gray-800' : ''}`}
    >
      {/* Header avec nom et emoji */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-3xl">
            {getSentimentEmoji(getSentiment())}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">{getName()}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{getTotal()} articles</p>
          </div>
        </div>
        
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-sm font-semibold ${getSentimentColor(getSentiment())}`}>
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
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3">
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{category.positive}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Positifs</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
              <div className="text-lg font-bold text-gray-600 dark:text-gray-400">{category.neutral}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Neutres</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
              <div className="text-lg font-bold text-red-600 dark:text-red-400">{category.negative}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Négatifs</div>
            </div>
          </div>
        );
      })()}

      {type === 'topic' && (() => {
        const topic = data as TrendingTopic;
        return (
          <div className="space-y-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Tendance: <span className="font-semibold">{topic.keyword}</span>
            </div>
            {topic.articles.length > 0 && (
              <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Exemple:</span><br />
                "{topic.articles[0].title.substring(0, 50)}..."
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
    </div>
  );
};

export default TopicSentimentCard;
