'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  BarChart3, 
  TrendingUp, 
  Activity,
  Globe,
  RefreshCw,
  SortAsc,
  SortDesc,
  Grid,
  List,
  AlertCircle
} from 'lucide-react';
import SourceCard from '@/components/SourceCard';
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

interface GlobalStats {
  totalSources: number;
  activeSources: number;
  totalArticles: number;
  todayArticles: number;
  avgArticlesPerSource: number;
  topCategories: Array<{ category: string; count: number; }>;
  lastUpdateTime: string;
}

interface SourcesData {
  success: boolean;
  globalStats: GlobalStats;
  sourcesStats: SourceStats[];
}

const SourcesPage: React.FC = () => {
  const [sourcesData, setSourcesData] = useState<SourcesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'articles' | 'activity'>('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Traductions
  const { translatedText: dashboardTitle } = useTranslatedText('Tableau de Bord des Sources', []);
  const { translatedText: dashboardSubtitle } = useTranslatedText('Découvrez les statistiques détaillées de nos', []);
  const { translatedText: sourcesText } = useTranslatedText('sources d\'actualités françaises', []);
  const { translatedText: lastUpdateText } = useTranslatedText('Dernière mise à jour :', []);
  const { translatedText: totalSourcesText } = useTranslatedText('Sources totales', []);
  const { translatedText: activeText } = useTranslatedText('actives', []);
  const { translatedText: totalArticlesText } = useTranslatedText('Articles totaux', []);
  const { translatedText: perSourceText } = useTranslatedText('par source', []);
  const { translatedText: todayText } = useTranslatedText('Aujourd\'hui', []);
  const { translatedText: newArticlesText } = useTranslatedText('Nouveaux articles', []);
  const { translatedText: activeSourcesText } = useTranslatedText('Sources actives', []);
  const { translatedText: activityRateText } = useTranslatedText('Taux d\'activité', []);
  const { translatedText: topCategoriesText } = useTranslatedText('Top Catégories', []);
  const { translatedText: searchPlaceholderText } = useTranslatedText('Rechercher une source...', []);
  const { translatedText: allCategoriesText } = useTranslatedText('Toutes les catégories', []);
  const { translatedText: sortByText } = useTranslatedText('Trier par:', []);
  const { translatedText: ratingText } = useTranslatedText('Rating', []);
  const { translatedText: nameText } = useTranslatedText('Nom', []);
  const { translatedText: articlesText } = useTranslatedText('Articles', []);
  const { translatedText: activityText } = useTranslatedText('Activité', []);
  const { translatedText: refreshText } = useTranslatedText('Actualiser', []);
  const { translatedText: loadingText } = useTranslatedText('Chargement des statistiques des sources...', []);
  const { translatedText: loadingErrorText } = useTranslatedText('Erreur de chargement', []);
  const { translatedText: retryText } = useTranslatedText('Réessayer', []);
  const { translatedText: noSourcesText } = useTranslatedText('Aucune source trouvée', []);
  const { translatedText: modifyFiltersText } = useTranslatedText('Essayez de modifier vos critères de recherche ou de filtrage.', []);
  const { translatedText: resetFiltersText } = useTranslatedText('Réinitialiser les filtres', []);

  const fetchSourcesStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/sources-stats');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur lors du chargement des données');
      }
      
      setSourcesData(data);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSourcesStats();
  }, []);

  const getUniqueCategories = () => {
    if (!sourcesData) return [];
    const categories = [...new Set(sourcesData.sourcesStats.map(source => source.category))];
    return categories.sort();
  };

  const getFilteredAndSortedSources = () => {
    if (!sourcesData) return [];
    
    let filtered = sourcesData.sourcesStats;
    
    // Filtrer par recherche
    if (searchTerm) {
      filtered = filtered.filter(source => 
        source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        source.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrer par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(source => source.category === selectedCategory);
    }
    
    // Trier
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;
        case 'articles':
          aValue = a.totalArticles;
          bValue = b.totalArticles;
          break;
        case 'activity':
          aValue = a.avgArticlesPerDay;
          bValue = b.avgArticlesPerDay;
          break;
        default:
          return 0;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' ? 
        (aValue as number) - (bValue as number) : 
        (bValue as number) - (aValue as number);
    });
    
    return filtered;
  };

  const formatUpdateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-gray-600">{loadingText}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900">{loadingErrorText}</h2>
              <p className="text-gray-600 text-center max-w-md">{error}</p>
              <button 
                onClick={fetchSourcesStats}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {retryText}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sourcesData) return null;

  const filteredSources = getFilteredAndSortedSources();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-white"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {dashboardTitle}
            </h1>
            <p className="text-xl opacity-90 mb-6 max-w-2xl">
              {dashboardSubtitle} {sourcesData.globalStats.totalSources} {sourcesText}
            </p>
            <p className="text-sm opacity-75">
              {lastUpdateText} {formatUpdateTime(sourcesData.globalStats.lastUpdateTime)}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Statistiques globales */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 -mt-6"
        >
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Globe className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{sourcesData.globalStats.totalSources}</p>
                <p className="text-sm text-gray-600">{totalSourcesText}</p>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-green-600 text-sm font-medium">
                {sourcesData.globalStats.activeSources} {activeText}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-3">
              <BarChart3 className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{sourcesData.globalStats.totalArticles}</p>
                <p className="text-sm text-gray-600">{totalArticlesText}</p>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-blue-600 text-sm font-medium">
                {sourcesData.globalStats.avgArticlesPerSource.toFixed(1)} {perSourceText}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-3">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{sourcesData.globalStats.todayArticles}</p>
                <p className="text-sm text-gray-600">{todayText}</p>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-purple-600 text-sm font-medium">
                {newArticlesText}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Activity className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round((sourcesData.globalStats.activeSources / sourcesData.globalStats.totalSources) * 100)}%
                </p>
                <p className="text-sm text-gray-600">{activeSourcesText}</p>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-orange-600 text-sm font-medium">
                {activityRateText}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Top Categories */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{topCategoriesText}</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {sourcesData.globalStats.topCategories.slice(0, 5).map((cat, idx) => (
              <div key={cat.category} className="text-center">
                <div className="bg-blue-100 rounded-lg p-3 mb-2">
                  <p className="text-lg font-bold text-blue-900">{cat.count}</p>
                </div>
                <p className="text-sm text-gray-600">{cat.category}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Filtres et contrôles */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={searchPlaceholderText}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                />
              </div>

              {/* Filtre catégorie */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-48 appearance-none"
                >
                  <option value="all">{allCategoriesText}</option>
                  {getUniqueCategories().map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Tri */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">{sortByText}</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="rating">{ratingText}</option>
                  <option value="name">{nameText}</option>
                  <option value="articles">{articlesText}</option>
                  <option value="activity">{activityText}</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </button>
              </div>

              {/* Mode d'affichage */}
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} transition-colors`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} transition-colors`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Actualiser */}
              <button
                onClick={fetchSourcesStats}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{refreshText}</span>
              </button>
            </div>
          </div>

          {/* Info résultats */}
          <div className="mt-4 text-sm text-gray-600">
            {filteredSources.length} source{filteredSources.length !== 1 ? 's' : ''} trouvée{filteredSources.length !== 1 ? 's' : ''}
            {searchTerm && ` pour "${searchTerm}"`}
            {selectedCategory !== 'all' && ` dans la catégorie "${selectedCategory}"`}
          </div>
        </motion.div>

        {/* Liste des sources */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className={`grid gap-6 ${viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
          }`}
        >
          {filteredSources.map((source, index) => (
            <SourceCard
              key={source.name}
              source={source}
              index={index}
            />
          ))}
        </motion.div>

        {filteredSources.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center py-12"
          >
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{noSourcesText}</h3>
            <p className="text-gray-600 mb-4">
              {modifyFiltersText}
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {resetFiltersText}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SourcesPage;
