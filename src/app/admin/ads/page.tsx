'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Eye, 
  MousePointer, 
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { Advertisement, AdPerformance, AdStatus, AdType, AdPlacement } from '@/types/advertising';
import { useTranslatedText } from '@/contexts/TranslationContext';

interface AnalyticsData {
  overview: {
    totalImpressions: number;
    totalClicks: number;
    totalRevenue: number;
    averageCTR: number;
    activeCampaigns: number;
    totalBudget: number;
    spentBudget: number;
    remainingBudget: number;
  };
  topPerformingAds: Array<{
    adId: string;
    title: string;
    advertiser: string;
    impressions: number;
    clicks: number;
    revenue: number;
    ctr: number;
  }>;
  revenueByDay: Array<{
    date: string;
    revenue: number;
  }>;
}

export default function AdsDashboard() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'ads' | 'analytics'>('overview');
  const [selectedAdType, setSelectedAdType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const dashboardTitle = useTranslatedText('Tableau de bord publicitaire');
  const overviewText = useTranslatedText('Vue d\'ensemble');
  const adsText = useTranslatedText('Annonces');
  const analyticsText = useTranslatedText('Analyses');
  const totalImpressions = useTranslatedText('Impressions totales');
  const totalClicks = useTranslatedText('Clics totaux');
  const totalRevenue = useTranslatedText('Revenus totaux');
  const activeCampaigns = useTranslatedText('Campagnes actives');
  const topPerformingAds = useTranslatedText('Top des annonces');
  const recentRevenue = useTranslatedText('Revenus récents');
  const createNewAd = useTranslatedText('Créer une nouvelle annonce');
  const refreshData = useTranslatedText('Actualiser les données');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load ads
      const adsResponse = await fetch('/api/ads/manage');
      if (adsResponse.ok) {
        const adsData = await adsResponse.json();
        if (adsData.success) {
          setAds(adsData.ads);
        }
      }

      // Load analytics
      const analyticsResponse = await fetch('/api/ads/analytics?type=summary');
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        if (analyticsData.success) {
          setAnalytics(analyticsData.data);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdStatus = async (adId: string, currentStatus: AdStatus) => {
    const newStatus = currentStatus === AdStatus.ACTIVE ? AdStatus.PAUSED : AdStatus.ACTIVE;
    
    try {
      const response = await fetch('/api/ads/manage', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: adId, status: newStatus }),
      });

      if (response.ok) {
        setAds(ads.map(ad => 
          ad.id === adId ? { ...ad, status: newStatus } : ad
        ));
      }
    } catch (error) {
      console.error('Error updating ad status:', error);
    }
  };

  const deleteAd = async (adId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) return;

    try {
      const response = await fetch(`/api/ads/manage?id=${adId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAds(ads.filter(ad => ad.id !== adId));
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
    }
  };

  const filteredAds = ads.filter(ad => {
    if (selectedAdType !== 'all' && ad.type !== selectedAdType) return false;
    if (selectedStatus !== 'all' && ad.status !== selectedStatus) return false;
    return true;
  });

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
    return `${num.toFixed(2)}%`;
  };

  const getStatusColor = (status: AdStatus) => {
    switch (status) {
      case AdStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case AdStatus.PAUSED:
        return 'bg-yellow-100 text-yellow-800';
      case AdStatus.EXPIRED:
        return 'bg-red-100 text-red-800';
      case AdStatus.PENDING:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analytics && [
          {
            title: totalImpressions,
            value: formatNumber(analytics.overview.totalImpressions),
            icon: Eye,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
          },
          {
            title: totalClicks,
            value: formatNumber(analytics.overview.totalClicks),
            icon: MousePointer,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
          },
          {
            title: totalRevenue,
            value: formatCurrency(analytics.overview.totalRevenue),
            icon: DollarSign,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
          },
          {
            title: activeCampaigns,
            value: analytics.overview.activeCampaigns.toString(),
            icon: TrendingUp,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50'
          }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-6 rounded-xl border border-gray-200 ${stat.bgColor}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Performance Cards */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performing Ads */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              {topPerformingAds}
            </h3>
            <div className="space-y-4">
              {analytics.topPerformingAds.slice(0, 5).map((ad, index) => (
                <div key={ad.adId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 truncate">{ad.title}</p>
                    <p className="text-sm text-gray-600">{ad.advertiser}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(ad.revenue)}</p>
                    <p className="text-xs text-gray-500">{formatPercentage(ad.ctr)} CTR</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
              {recentRevenue}
            </h3>
            <div className="space-y-2">
              {analytics.revenueByDay.slice(-7).map((day, index) => (
                <div key={day.date} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString('fr-FR')}
                  </span>
                  <div className="flex items-center">
                    <div 
                      className="h-2 bg-purple-500 rounded mr-2"
                      style={{ 
                        width: `${(day.revenue / Math.max(...analytics.revenueByDay.map(d => d.revenue))) * 100}px` 
                      }}
                    />
                    <span className="text-sm font-medium">{formatCurrency(day.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );

  const renderAdsTable = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
    >
      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={selectedAdType}
            onChange={(e) => setSelectedAdType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les types</option>
            <option value={AdType.BANNER}>Bannières</option>
            <option value={AdType.NATIVE}>Natif</option>
            <option value={AdType.VIDEO}>Vidéo</option>
            <option value={AdType.SPONSORED_ARTICLE}>Article sponsorisé</option>
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value={AdStatus.ACTIVE}>Actif</option>
            <option value={AdStatus.PAUSED}>En pause</option>
            <option value={AdStatus.EXPIRED}>Expiré</option>
            <option value={AdStatus.PENDING}>En attente</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Annonce
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Budget
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Performance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAds.map((ad) => (
              <tr key={ad.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{ad.title}</div>
                    <div className="text-sm text-gray-500">{ad.advertiser.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {ad.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ad.status)}`}>
                    {ad.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div>{formatCurrency(ad.campaign.budget)}</div>
                  <div className="text-xs text-gray-500">
                    Dépensé: {formatCurrency(ad.campaign.spentAmount)}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div>{formatNumber(ad.campaign.impressions)} impressions</div>
                  <div className="text-xs text-gray-500">
                    {ad.campaign.clicks} clics • {formatPercentage(
                      ad.campaign.impressions > 0 ? (ad.campaign.clicks / ad.campaign.impressions) * 100 : 0
                    )} CTR
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleAdStatus(ad.id, ad.status)}
                      className={`p-2 rounded-lg transition-colors ${
                        ad.status === AdStatus.ACTIVE
                          ? 'text-yellow-600 hover:bg-yellow-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={ad.status === AdStatus.ACTIVE ? 'Pause' : 'Activate'}
                    >
                      {ad.status === AdStatus.ACTIVE ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteAd(ad.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900">{dashboardTitle}</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadData}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {refreshData}
              </button>
              <button className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                {createNewAd}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: overviewText, icon: BarChart3 },
              { id: 'ads', label: adsText, icon: Eye },
              { id: 'analytics', label: analyticsText, icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'ads' && renderAdsTable()}
        {selectedTab === 'analytics' && renderOverview()}
      </div>
    </div>
  );
}
