'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Calendar, User, Heart, MapPin, Clock, 
  ChevronDown, X, Sparkles, TrendingUp, Target, Zap 
} from 'lucide-react';
import { useTranslatedText } from '@/contexts/TranslationContext';
import { useUser } from '@/contexts/UserContext';

export interface SearchFilters {
  query: string;
  categories: string[];
  sources: string[];
  dateRange: {
    from: string;
    to: string;
  };
  author: string;
  sentiment: 'all' | 'positive' | 'negative' | 'neutral';
  timeRange: 'all' | 'hour' | 'day' | 'week' | 'month';
  location: string;
  tags: string[];
  readStatus: 'all' | 'read' | 'unread';
  bookmarked: boolean;
  hot: boolean;
  minReadTime: number;
  maxReadTime: number;
}

interface AdvancedSearchProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  availableCategories: string[];
  availableSources: string[];
  isVisible: boolean;
  onToggle: () => void;
  resultsCount?: number;
}

const defaultFilters: SearchFilters = {
  query: '',
  categories: [],
  sources: [],
  dateRange: { from: '', to: '' },
  author: '',
  sentiment: 'all',
  timeRange: 'all',
  location: '',
  tags: [],
  readStatus: 'all',
  bookmarked: false,
  hot: false,
  minReadTime: 0,
  maxReadTime: 10,
};

export default function AdvancedSearch({
  filters,
  onFiltersChange,
  availableCategories,
  availableSources,
  isVisible,
  onToggle,
  resultsCount = 0
}: AdvancedSearchProps) {
  const { user } = useUser();
  
  // Переводы
  const { translatedText: searchPlaceholder } = useTranslatedText('Rechercher des actualités...', []);
  const { translatedText: advancedFilters } = useTranslatedText('Filtres avancés', []);
  const { translatedText: categories } = useTranslatedText('Catégories', []);
  const { translatedText: sources } = useTranslatedText('Sources', []);
  const { translatedText: dateRange } = useTranslatedText('Période', []);
  const { translatedText: author } = useTranslatedText('Auteur', []);
  const { translatedText: sentiment } = useTranslatedText('Sentiment', []);
  const { translatedText: location } = useTranslatedText('Lieu', []);
  const { translatedText: readingTime } = useTranslatedText('Temps de lecture', []);
  const { translatedText: clearAll } = useTranslatedText('Tout effacer', []);
  const { translatedText: applyFilters } = useTranslatedText('Appliquer', []);
  const { translatedText: resultsFound } = useTranslatedText('résultats trouvés', []);
  
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const updateFilter = <K extends keyof SearchFilters>(
    key: K, 
    value: SearchFilters[K]
  ) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const applySearchFilters = () => {
    onFiltersChange(localFilters);
  };

  const clearFilters = () => {
    const cleared = { ...defaultFilters, query: localFilters.query };
    setLocalFilters(cleared);
    onFiltersChange(cleared);
  };

  const toggleCategory = (category: string) => {
    const newCategories = localFilters.categories.includes(category)
      ? localFilters.categories.filter(c => c !== category)
      : [...localFilters.categories, category];
    updateFilter('categories', newCategories);
  };

  const toggleSource = (source: string) => {
    const newSources = localFilters.sources.includes(source)
      ? localFilters.sources.filter(s => s !== source)
      : [...localFilters.sources, source];
    updateFilter('sources', newSources);
  };

  const getTimeRangeOptions = () => [
    { value: 'all', label: 'Toute période' },
    { value: 'hour', label: 'Dernière heure' },
    { value: 'day', label: 'Dernières 24h' },
    { value: 'week', label: 'Dernière semaine' },
    { value: 'month', label: 'Dernier mois' },
  ];

  const getSentimentOptions = () => [
    { value: 'all', label: 'Tous', icon: Target },
    { value: 'positive', label: 'Positif', icon: Heart },
    { value: 'neutral', label: 'Neutre', icon: User },
    { value: 'negative', label: 'Négatif', icon: TrendingUp },
  ];

  const getReadStatusOptions = () => [
    { value: 'all', label: 'Tous les articles' },
    { value: 'unread', label: 'Non lus' },
    { value: 'read', label: 'Déjà lus' },
  ];

  const activeFiltersCount = () => {
    let count = 0;
    if (localFilters.categories.length > 0) count++;
    if (localFilters.sources.length > 0) count++;
    if (localFilters.author) count++;
    if (localFilters.sentiment !== 'all') count++;
    if (localFilters.timeRange !== 'all') count++;
    if (localFilters.location) count++;
    if (localFilters.readStatus !== 'all') count++;
    if (localFilters.bookmarked) count++;
    if (localFilters.hot) count++;
    if (localFilters.dateRange.from || localFilters.dateRange.to) count++;
    return count;
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {/* Основная строка поиска */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 py-4">
          {/* Поле поиска */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={localFilters.query}
              onChange={(e) => updateFilter('query', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearchFilters()}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Кнопка фильтров */}
          <button
            onClick={onToggle}
            className={`relative px-4 py-3 rounded-lg border flex items-center gap-2 transition-colors ${
              isVisible 
                ? 'bg-blue-50 border-blue-300 text-blue-700' 
                : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">{advancedFilters}</span>
            {activeFiltersCount() > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {activeFiltersCount()}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${isVisible ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Результаты */}
          {resultsCount > 0 && (
            <div className="hidden sm:flex items-center gap-2 text-gray-600">
              <Sparkles className="w-4 h-4" />
              <span>{resultsCount} {resultsFound}</span>
            </div>
          )}
        </div>
      </div>

      {/* Панель расширенных фильтров */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 bg-gray-50"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Категории */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {categories}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableCategories.map(category => (
                      <button
                        key={category}
                        onClick={() => toggleCategory(category)}
                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                          localFilters.categories.includes(category)
                            ? 'bg-blue-100 border-blue-300 text-blue-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Période */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline w-4 h-4 mr-1" />
                    {dateRange}
                  </label>
                  <select
                    value={localFilters.timeRange}
                    onChange={(e) => updateFilter('timeRange', e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {getTimeRangeOptions().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sentiment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {sentiment}
                  </label>
                  <div className="flex gap-2">
                    {getSentimentOptions().map(option => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => updateFilter('sentiment', option.value as any)}
                          className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm border transition-colors ${
                            localFilters.sentiment === option.value
                              ? 'bg-blue-100 border-blue-300 text-blue-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sources */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {sources}
                  </label>
                  <div className="max-h-32 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {availableSources.slice(0, 10).map(source => (
                        <button
                          key={source}
                          onClick={() => toggleSource(source)}
                          className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                            localFilters.sources.includes(source)
                              ? 'bg-green-100 border-green-300 text-green-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {source}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Auteur */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline w-4 h-4 mr-1" />
                    {author}
                  </label>
                  <input
                    type="text"
                    value={localFilters.author}
                    onChange={(e) => updateFilter('author', e.target.value)}
                    placeholder="Nom de l'auteur"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Lieu */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline w-4 h-4 mr-1" />
                    {location}
                  </label>
                  <input
                    type="text"
                    value={localFilters.location}
                    onChange={(e) => updateFilter('location', e.target.value)}
                    placeholder="Ville, région..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Options utilisateur */}
                {user && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options personnelles
                    </label>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={localFilters.bookmarked}
                          onChange={(e) => updateFilter('bookmarked', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Mes favoris uniquement</span>
                      </label>
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={localFilters.hot}
                          onChange={(e) => updateFilter('hot', e.target.checked)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <Zap className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-gray-700">Articles tendance</span>
                      </label>

                      <select
                        value={localFilters.readStatus}
                        onChange={(e) => updateFilter('readStatus', e.target.value as any)}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      >
                        {getReadStatusOptions().map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  {clearAll}
                </button>
                
                <button
                  onClick={applySearchFilters}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  {applyFilters}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
