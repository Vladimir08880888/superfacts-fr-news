'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  TrendingUp, 
  Clock, 
  BarChart3, 
  Tag, 
  Activity,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useTranslatedText } from '@/contexts/TranslationContext';

interface SourceStats {
  name: string;
  category: string;
  logo: string;
  url: string;
  status: 'active' | 'inactive' | 'error';
  totalArticles: number;
  todayArticles: number;
  lastArticleDate?: string;
  avgArticlesPerDay: number;
  categoriesDistribution: { [key: string]: number };
  sentimentDistribution: { 
    positive: number; 
    negative: number; 
    neutral: number; 
  };
  rating: number;
  reliability: number;
  topTags: Array<{ tag: string; count: number; }>;
}

interface SourceCardProps {
  source: SourceStats;
  index: number;
}

const SourceCard: React.FC<SourceCardProps> = ({ source, index }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'inactive': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'inactive': return <AlertCircle className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const { translatedText: neverText } = useTranslatedText('Jamais', []);
  const { translatedText: lessThanHourText } = useTranslatedText('Il y a moins d\'1h', []);
  const { translatedText: totalText } = useTranslatedText('Total', []);
  const { translatedText: articlesText } = useTranslatedText('articles', []);
  const { translatedText: todayText } = useTranslatedText('Aujourd\'hui', []);
  const { translatedText: newText } = useTranslatedText('nouveaux', []);
  const { translatedText: lastPublishText } = useTranslatedText('Dernière publication', []);
  const { translatedText: avgPerDayText } = useTranslatedText('Moyenne/jour', []);
  const { translatedText: reliabilityText } = useTranslatedText('Fiabilité', []);
  const { translatedText: sentimentText } = useTranslatedText('Sentiment des articles', []);
  const { translatedText: popularTagsText } = useTranslatedText('Tags populaires', []);
  const { translatedText: categoryDistributionText } = useTranslatedText('Distribution par catégorie', []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return neverText;
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return lessThanHourText;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  const totalSentiment = source.sentimentDistribution.positive + 
                        source.sentimentDistribution.negative + 
                        source.sentimentDistribution.neutral;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group"
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden group-hover:animate-shimmer transition-all duration-300">
              <img 
                src={source.logo} 
                alt={source.name}
                className="w-8 h-8 object-contain animate-shimmer"
                style={{
                  animationDelay: `${(index * 0.5) % 3}s`
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/default-source.svg';
                }}
              />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{source.name}</h3>
              <span className="text-sm text-gray-500">{source.category}</span>
            </div>
          </div>
          
          <div className={`flex items-center space-x-1 ${getStatusColor(source.status)}`}>
            {getStatusIcon(source.status)}
            <span className="text-sm font-medium capitalize">{source.status}</span>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              {renderStars(source.rating)}
            </div>
            <span className="text-sm font-medium text-gray-700">{source.rating}/5</span>
          </div>
          
          <a 
            href={source.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Stats principales */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">{totalText}</span>
            </div>
            <p className="text-xl font-bold text-blue-900">{source.totalArticles}</p>
            <p className="text-xs text-blue-600">{articlesText}</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">{todayText}</span>
            </div>
            <p className="text-xl font-bold text-green-900">{source.todayArticles}</p>
            <p className="text-xs text-green-600">{newText}</p>
          </div>
        </div>

        {/* Métriques secondaires */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">{lastPublishText}</span>
            </div>
            <span className="font-medium text-gray-900">{formatDate(source.lastArticleDate)}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">{avgPerDayText}</span>
            </div>
            <span className="font-medium text-gray-900">{source.avgArticlesPerDay.toFixed(1)}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">{reliabilityText}</span>
            </div>
            <span className="font-medium text-gray-900">{source.reliability}%</span>
          </div>
        </div>
      </div>

      {/* Sentiment Distribution */}
      {totalSentiment > 0 && (
        <div className="px-6 pb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">{sentimentText}</h4>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-l-full inline-block"
              style={{ width: `${(source.sentimentDistribution.positive / totalSentiment) * 100}%` }}
            ></div>
            <div 
              className="bg-gray-400 h-2 inline-block"
              style={{ width: `${(source.sentimentDistribution.neutral / totalSentiment) * 100}%` }}
            ></div>
            <div 
              className="bg-red-500 h-2 rounded-r-full inline-block"
              style={{ width: `${(source.sentimentDistribution.negative / totalSentiment) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>😊 {source.sentimentDistribution.positive}</span>
            <span>😐 {source.sentimentDistribution.neutral}</span>
            <span>😟 {source.sentimentDistribution.negative}</span>
          </div>
        </div>
      )}

      {/* Top Tags */}
      {source.topTags.length > 0 && (
        <div className="px-6 pb-6">
          <div className="flex items-center space-x-2 mb-2">
            <Tag className="w-4 h-4 text-gray-500" />
            <h4 className="text-sm font-medium text-gray-700">{popularTagsText}</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {source.topTags.slice(0, 4).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                {tag.tag}
                <span className="ml-1 text-gray-500">({tag.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top Categories (si plus d'une catégorie) */}
      {Object.keys(source.categoriesDistribution).length > 1 && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-2 mt-4">{categoryDistributionText}</h4>
          <div className="space-y-2">
            {Object.entries(source.categoriesDistribution)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 3)
              .map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{category}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${(count / source.totalArticles) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">{count}</span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SourceCard;
