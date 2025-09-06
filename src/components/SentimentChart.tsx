'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface DailySentimentData {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  sentimentScore: number;
  dominantSentiment: 'positive' | 'negative' | 'neutral';
}

interface SentimentChartProps {
  data: DailySentimentData[];
  height?: number;
  className?: string;
}

const SentimentChart: React.FC<SentimentChartProps> = ({ 
  data, 
  height = 200, 
  className = '' 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`} style={{ height }}>
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  const maxTotal = Math.max(...data.map(d => d.total));
  const maxScore = Math.max(...data.map(d => Math.abs(d.sentimentScore)));
  const chartWidth = 100; // Pourcentage
  const chartPadding = 10;

  const getScoreColor = (score: number) => {
    if (score > 0.1) return '#10B981'; // Vert
    if (score < -0.1) return '#EF4444'; // Rouge
    return '#6B7280'; // Gris neutre
  };

  const getDayLabel = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Auj.';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.getDate().toString();
    }
  };

  const getSentimentEmoji = (sentiment: 'positive' | 'negative' | 'neutral') => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😟';
      default: return '😐';
    }
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-100 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Évolution du Sentiment</h3>
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Positif</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="text-gray-600">Neutre</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">Négatif</span>
          </div>
        </div>
      </div>

      <div className="relative" style={{ height }}>
        {/* Ligne de référence zéro */}
        <div 
          className="absolute left-0 right-0 border-t border-dashed border-gray-300"
          style={{ top: '50%' }}
        />
        
        <svg width="100%" height="100%" className="overflow-visible">
          {/* Grille de fond */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Ligne de tendance */}
          <motion.path
            d={data.map((point, index) => {
              const x = (index / (data.length - 1)) * (chartWidth - chartPadding * 2) + chartPadding;
              const y = height / 2 - (point.sentimentScore * height * 0.4);
              return `${index === 0 ? 'M' : 'L'} ${x}% ${y}`;
            }).join(' ')}
            stroke="#3B82F6"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />

          {/* Points de données */}
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * (chartWidth - chartPadding * 2) + chartPadding;
            const y = height / 2 - (point.sentimentScore * height * 0.4);

            return (
              <g key={index}>
                {/* Point principal */}
                <motion.circle
                  cx={`${x}%`}
                  cy={y}
                  r="4"
                  fill={getScoreColor(point.sentimentScore)}
                  stroke="white"
                  strokeWidth="2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.5, duration: 0.3 }}
                  className="drop-shadow-sm"
                />

                {/* Barre de volume (optionnel) */}
                {point.total > 0 && (
                  <motion.rect
                    x={`${x - 1}%`}
                    y={height - 10}
                    width="2%"
                    height={Math.max(2, (point.total / maxTotal) * 8)}
                    fill="#E5E7EB"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: index * 0.1 + 1, duration: 0.4 }}
                    style={{ transformOrigin: 'bottom' }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Labels des jours */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 pb-2">
          {data.map((point, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 1.2 }}
              className="text-center"
            >
              <div className="text-xs text-gray-500 mb-1">
                {getDayLabel(point.date)}
              </div>
              <div className="text-lg">
                {getSentimentEmoji(point.dominantSentiment)}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Statistiques en bas */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">
              {data[data.length - 1]?.positive || 0}
            </div>
            <div className="text-xs text-gray-500">Positifs auj.</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600">
              {data[data.length - 1]?.neutral || 0}
            </div>
            <div className="text-xs text-gray-500">Neutres auj.</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {data[data.length - 1]?.negative || 0}
            </div>
            <div className="text-xs text-gray-500">Négatifs auj.</div>
          </div>
        </div>
      </div>

      {/* Indicateur de tendance */}
      {data.length > 1 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2 }}
          className="mt-4 text-center"
        >
          {(() => {
            const current = data[data.length - 1];
            const previous = data[data.length - 2];
            const diff = current.sentimentScore - previous.sentimentScore;
            
            if (Math.abs(diff) < 0.05) {
              return (
                <div className="flex items-center justify-center space-x-2 text-gray-600">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-sm">Sentiment stable</span>
                </div>
              );
            }
            
            return (
              <div className={`flex items-center justify-center space-x-2 ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                <div className={`w-2 h-2 rounded-full ${diff > 0 ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-sm">
                  {diff > 0 ? '↗ Sentiment en hausse' : '↘ Sentiment en baisse'}
                </span>
                <span className="text-xs text-gray-500">
                  ({diff > 0 ? '+' : ''}{(diff * 100).toFixed(1)}%)
                </span>
              </div>
            );
          })()}
        </motion.div>
      )}
    </div>
  );
};

export default SentimentChart;
