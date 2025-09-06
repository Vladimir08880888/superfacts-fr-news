'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X, Newspaper, TrendingUp, Globe, Zap, RefreshCw, Bookmark, Database, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LanguageSelector } from './LanguageSelector';
import { useTranslatedText, useTranslation } from '@/contexts/TranslationContext';
import { useBookmarks } from '@/contexts/BookmarksContext';
import BannerAd from './ads/BannerAd';
import { AdPlacement } from '@/types/advertising';
import { useAdContext } from '@/hooks/useAdContext';
import ThemeToggle from './ThemeToggle';
import Link from 'next/link';

interface HeaderProps {
  onSearch: (query: string) => void;
  onCategoryFilter: (category: string | null) => void;
  onCollectNews: () => void;
  isCollecting: boolean;
  selectedCategory: string | null;
}

const categories = [
  { id: null, name: 'Tout', icon: Globe },
  { id: 'Actualités', name: 'Actualités', icon: Newspaper },
  { id: 'Politique', name: 'Politique', icon: TrendingUp },
  { id: 'Économie', name: 'Économie', icon: TrendingUp },
  { id: 'Tech', name: 'Tech', icon: Zap },
  { id: 'Sport', name: 'Sport', icon: TrendingUp },
  { id: 'Culture', name: 'Culture', icon: TrendingUp },
  { id: 'Sciences', name: 'Sciences', icon: TrendingUp },
  { id: 'Santé', name: 'Santé', icon: TrendingUp },
  { id: 'International', name: 'International', icon: Globe },
];

// Component for translated category button
function CategoryButton({ category, isSelected, onClick }: {
  category: { id: string | null; name: string; icon: any };
  isSelected: boolean;
  onClick: () => void;
}) {
  const { translatedText } = useTranslatedText(category.name, []);
  const Icon = category.icon;
  
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all duration-200',
        isSelected
          ? 'bg-blue-100 text-blue-700 shadow-sm'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      )}
    >
      <Icon className="w-4 h-4" />
      <span>{translatedText}</span>
    </motion.button>
  );
}

// Component for mobile category button
function MobileCategoryButton({ category, isSelected, onClick }: {
  category: { id: string | null; name: string; icon: any };
  isSelected: boolean;
  onClick: () => void;
}) {
  const { translatedText } = useTranslatedText(category.name, []);
  const Icon = category.icon;
  
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 text-left',
        isSelected
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100'
      )}
    >
      <Icon className="w-5 h-5" />
      <span>{translatedText}</span>
    </motion.button>
  );
}

export function Header({ onSearch, onCategoryFilter, onCollectNews, isCollecting, selectedCategory }: HeaderProps) {
  const { currentLanguage } = useTranslation();
  const { bookmarks } = useBookmarks();
  const userContext = useAdContext(selectedCategory);
  const { translatedText: translatedSubtitle } = useTranslatedText('Actualités françaises', []);
  const { translatedText: translatedSearchPlaceholder } = useTranslatedText('Rechercher dans l\'actualité française...', []);
  const { translatedText: translatedMobileSearchPlaceholder } = useTranslatedText('Rechercher...', []);
  const { translatedText: translatedCollectingText } = useTranslatedText('Collecte...', []);
  const { translatedText: translatedRefreshText } = useTranslatedText('Actualiser', []);
  const { translatedText: translatedCollectingMobileText } = useTranslatedText('Collecte en cours...', []);
  const { translatedText: translatedRefreshMobileText } = useTranslatedText('Actualiser les news', []);
  const { translatedText: translatedNavigationText } = useTranslatedText('Navigation', []);
  const { translatedText: translatedCategoriesText } = useTranslatedText('Catégories', []);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleCategoryClick = (categoryId: string | null) => {
    onCategoryFilter(categoryId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.25, 0, 1] }}
        className={cn(
          'sticky top-0 z-50 transition-all duration-300',
          isScrolled 
            ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 shadow-lg' 
            : 'bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                  <Newspaper className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  SuperFacts
                </h1>
                <p className="text-xs text-gray-500">{translatedSubtitle}</p>
              </div>
            </motion.div>

            {/* Barre de recherche - Desktop */}
            <div className="hidden md:block flex-1 max-w-2xl mx-8">
              <form onSubmit={handleSearchSubmit} className="relative">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="relative"
                >
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={translatedSearchPlaceholder}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-gray-100"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        onSearch('');
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </motion.div>
              </form>
            </div>

            {/* Actions - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <LanguageSelector variant="compact" />
              
              {/* Sources Button */}
              <Link href="/sources">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                  title="Tableau de bord des sources"
                >
                  <Database className="w-5 h-5" />
                  <span className="hidden lg:inline text-sm font-medium">Sources</span>
                </motion.button>
              </Link>
              
              {/* Daily Sentiment Button */}
              <Link href="/daily-sentiment">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200"
                  title="Analyse du sentiment quotidien"
                >
                  <Smile className="w-5 h-5" />
                  <span className="hidden lg:inline text-sm font-medium">Sentiment</span>
                </motion.button>
              </Link>
              
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Bookmarks Button */}
              <Link href="/bookmarks">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-all duration-200"
                  title="Mes favoris"
                >
                  <Bookmark className="w-5 h-5" />
                  {bookmarks.length > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      {bookmarks.length > 99 ? '99+' : bookmarks.length}
                    </motion.span>
                  )}
                </motion.button>
              </Link>
              
              <motion.button
                onClick={onCollectNews}
                disabled={isCollecting}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200',
                  isCollecting
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl'
                )}
              >
                <RefreshCw className={cn('w-4 h-4', isCollecting && 'animate-spin')} />
                <span className="hidden sm:inline">
                  {isCollecting ? translatedCollectingText : translatedRefreshText}
                </span>
              </motion.button>
            </div>

            {/* Menu Mobile */}
            <div className="md:hidden">
              <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.button>
            </div>
          </div>

          {/* Navigation des catégories - Desktop */}
          <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="hidden md:flex items-center space-x-1 py-3 border-t border-gray-100 overflow-x-auto"
          >
            {categories.map((category) => (
              <CategoryButton
                key={category.id || 'all'}
                category={category}
                isSelected={selectedCategory === category.id}
                onClick={() => handleCategoryClick(category.id)}
              />
            ))}
          </motion.nav>
          
          {/* Header Banner Ad */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="hidden md:flex justify-center py-4 border-t border-gray-50"
          >
            <BannerAd 
              placement={AdPlacement.HEADER}
              userContext={userContext}
              className="max-w-full"
            />
          </motion.div>
        </div>
      </motion.header>

      {/* Menu Mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu Content */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 md:hidden"
            >
              <div className="p-6">
                {/* Header du menu */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">{translatedNavigationText}</h2>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Barre de recherche mobile */}
                <form onSubmit={handleSearchSubmit} className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={translatedMobileSearchPlaceholder}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </form>

                {/* Action de collecte */}
                <motion.button
                  onClick={() => {
                    onCollectNews();
                    setIsMobileMenuOpen(false);
                  }}
                  disabled={isCollecting}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium mb-6 transition-all duration-200',
                    isCollecting
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  )}
                >
                  <RefreshCw className={cn('w-5 h-5', isCollecting && 'animate-spin')} />
                  <span>{isCollecting ? translatedCollectingMobileText : translatedRefreshMobileText}</span>
                </motion.button>

                {/* Theme Toggle */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Thème</h3>
                  <ThemeToggle />
                </div>
                
                {/* Sources Button */}
                <Link href="/sources" onClick={() => setIsMobileMenuOpen(false)}>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="w-full flex items-center justify-between p-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 mb-3"
                  >
                    <div className="flex items-center gap-3">
                      <Database className="w-5 h-5" />
                      <span className="font-medium">Tableau de Bord</span>
                    </div>
                  </motion.button>
                </Link>
                
                {/* Daily Sentiment Button */}
                <Link href="/daily-sentiment" onClick={() => setIsMobileMenuOpen(false)}>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="w-full flex items-center justify-between p-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 mb-3"
                  >
                    <div className="flex items-center gap-3">
                      <Smile className="w-5 h-5" />
                      <span className="font-medium">Sentiment du Jour</span>
                    </div>
                  </motion.button>
                </Link>
                
                {/* Bookmarks Button */}
                <Link href="/bookmarks" onClick={() => setIsMobileMenuOpen(false)}>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="w-full flex items-center justify-between p-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-all duration-200 mb-6"
                  >
                    <div className="flex items-center gap-3">
                      <Bookmark className="w-5 h-5" />
                      <span className="font-medium">Mes favoris</span>
                    </div>
                    {bookmarks.length > 0 && (
                      <span className="bg-yellow-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {bookmarks.length > 99 ? '99+' : bookmarks.length}
                      </span>
                    )}
                  </motion.button>
                </Link>
                
                {/* Navigation catégories mobile */}
                {/* Language Selector */}
                <div className="mb-6">
                  <LanguageSelector />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">{translatedCategoriesText}</h3>
                  {categories.map((category) => (
                    <MobileCategoryButton
                      key={category.id || 'all'}
                      category={category}
                      isSelected={selectedCategory === category.id}
                      onClick={() => handleCategoryClick(category.id)}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
