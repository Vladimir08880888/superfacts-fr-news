'use client';

import React from 'react';

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
  height = 300, 
  className = '' 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 ${className}`} style={{ height }}>
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  const maxTotal = Math.max(...data.map(d => d.total));
  const chartPadding = 20;

  const getScoreColor = (score: number) => {
    if (score > 0.1) return 'rgb(16, 185, 129)'; // Emerald
    if (score < -0.1) return 'rgb(239, 68, 68)'; // Red
    return 'rgb(107, 114, 128)'; // Gray
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
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  const getSentimentEmoji = (sentiment: 'positive' | 'negative' | 'neutral') => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😔';
      default: return '😐';
    }
  };

  return (
    <div className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Évolution du Sentiment</h3>
        <div className="flex items-center space-x-3 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">Positif</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">Neutre</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">Négatif</span>
          </div>
        </div>
      </div>

      <div className="relative bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4" style={{ height }}>
        {/* Référence zéro */}
        <div 
          className="absolute left-4 right-4 border-t border-dashed border-gray-300 dark:border-gray-600"
          style={{ top: '50%' }}
        />
        
        <svg width="100%" height="100%" className="overflow-visible">
          {/* Ligne de tendance */}
          <path
            d={data.map((point, index) => {
              const x = (index / (data.length - 1)) * 80 + 10; // Pourcentage
              const y = height / 2 - (point.sentimentScore * height * 0.3);
              return `${index === 0 ? 'M' : 'L'} ${x}% ${y}`;
            }).join(' ')}
            stroke="rgb(99, 102, 241)"
            strokeWidth="3"
            fill="none"
            className="drop-shadow-sm"
          />

          {/* Points de données */}
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * 80 + 10;
            const y = height / 2 - (point.sentimentScore * height * 0.3);

            return (
              <circle
                key={index}
                cx={`${x}%`}
                cy={y}
                r="6"
                fill={getScoreColor(point.sentimentScore)}
                stroke="white"
                strokeWidth="2"
                className="drop-shadow-lg"
              />
            );
          })}
        </svg>

        {/* Labels des jours */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-6 pb-2">
          {data.map((point, index) => (
            <div key={index} className="text-center">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">
                {getDayLabel(point.date)}
              </div>
              <div className="text-lg">
                {getSentimentEmoji(point.dominantSentiment)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statistiques en bas */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {data[data.length - 1]?.positive || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Positifs</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {data[data.length - 1]?.neutral || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Neutres</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {data[data.length - 1]?.negative || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Négatifs</div>
          </div>
        </div>
      </div>

      {/* Indicateur de tendance */}
      {data.length > 1 && (
        <div className="mt-4 text-center">
          {(() => {
            const current = data[data.length - 1];
            const previous = data[data.length - 2];
            const diff = current.sentimentScore - previous.sentimentScore;
            
            if (Math.abs(diff) < 0.05) {
              return (
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700/50 rounded-full">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Sentiment stable</span>
                </div>
              );
            }
            
            return (
              <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${diff > 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ${diff > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">
                  {diff > 0 ? '↗ Sentiment en hausse' : '↘ Sentiment en baisse'}
                </span>
                <span className="text-xs opacity-70">
                  ({diff > 0 ? '+' : ''}{(diff * 100).toFixed(1)}%)
                </span>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default SentimentChart;
