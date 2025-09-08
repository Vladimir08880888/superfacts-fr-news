'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Mail, 
  Eye, 
  MousePointer, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface MonetizationStats {
  revenue: {
    total: number;
    monthly: number;
    growth: number;
  };
  advertising: {
    impressions: number;
    clicks: number;
    ctr: number;
    revenue: number;
  };
  newsletter: {
    subscribers: number;
    openRate: number;
    clickRate: number;
  };
}

export default function MonetizationDashboard() {
  const [stats, setStats] = useState<MonetizationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    loadMonetizationStats();
  }, [timeframe]);

  const loadMonetizationStats = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API calls
      const mockStats: MonetizationStats = {
        revenue: {
          total: 8450,
          monthly: 2850,
          growth: 12.5
        },
        advertising: {
          impressions: 45230,
          clicks: 1680,
          ctr: 3.7,
          revenue: 1240
        },
        newsletter: {
          subscribers: 2340,
          openRate: 24.8,
          clickRate: 4.2
        }
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading monetization stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Impossible de charger les statistiques de monétisation</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Frame Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Tableau de bord monétisation</h2>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {['week', 'month', 'quarter'].map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period as any)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                timeframe === period
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {period === 'week' ? '7 jours' : period === 'month' ? '30 jours' : '90 jours'}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className={`flex items-center text-sm ${
              stats.revenue.growth > 0 ? 'text-green-100' : 'text-red-100'
            }`}>
              {stats.revenue.growth > 0 ? (
                <ArrowUpRight className="w-4 h-4 mr-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 mr-1" />
              )}
              {formatPercentage(Math.abs(stats.revenue.growth))}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-green-100 text-sm">Revenus totaux</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.revenue.total)}</p>
            <p className="text-green-100 text-xs">
              {formatCurrency(stats.revenue.monthly)} ce mois
            </p>
          </div>
        </motion.div>


        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MousePointer className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-sm text-gray-500">CTR {formatPercentage(stats.advertising.ctr)}</div>
          </div>
          <div className="space-y-1">
            <p className="text-gray-600 text-sm">Revenus publicitaires</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.advertising.revenue)}</p>
            <p className="text-gray-500 text-xs">
              {formatNumber(stats.advertising.clicks)} clics sur {formatNumber(stats.advertising.impressions)}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-sm text-gray-500">OR {formatPercentage(stats.newsletter.openRate)}</div>
          </div>
          <div className="space-y-1">
            <p className="text-gray-600 text-sm">Abonnés newsletter</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.newsletter.subscribers)}</p>
            <p className="text-gray-500 text-xs">
              CTR {formatPercentage(stats.newsletter.clickRate)}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition des revenus</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="font-medium">Publicités</span>
              </div>
              <span className="font-bold text-blue-600">€1,240</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="font-medium">Newsletter sponsorisée</span>
              </div>
              <span className="font-bold text-green-600">€480</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span className="font-medium">Affiliation</span>
              </div>
              <span className="font-bold text-yellow-600">€180</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Objectifs mensuels</h3>
          <div className="space-y-4">
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Revenus publicitaires</span>
                <span>82%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '82%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">€1,240 / €1,500</p>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Abonnés newsletter</span>
                <span>78%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-600 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">2,340 / 3,000</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-left">
            <Calendar className="w-6 h-6 text-purple-600 mb-2" />
            <h4 className="font-medium text-gray-900">Programmer une newsletter sponsorisée</h4>
            <p className="text-sm text-gray-600">Créer une campagne d'email marketing</p>
          </button>
          
          <button className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-left">
            <TrendingUp className="w-6 h-6 text-green-600 mb-2" />
            <h4 className="font-medium text-gray-900">Optimiser les publicités</h4>
            <p className="text-sm text-gray-600">Améliorer le CTR et les revenus</p>
          </button>
          
        </div>
      </motion.div>
    </div>
  );
}
