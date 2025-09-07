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
import { useSwipeToClose } from '@/hooks/useSwipeGesture';

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
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
      )}
    >
      <Icon className="w-5 h-5" />
      <span>{translatedText}</span>
    </motion.button>
  );
}

// Enhanced mobile category button for grid layout
function EnhancedMobileCategoryButton({ category, isSelected, onClick }: {
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
        'flex flex-col items-center gap-2 p-3 rounded-2xl font-medium transition-all duration-200 min-h-[80px] justify-center text-center border-2',
        isSelected
          ? 'bg-blue-500 text-white border-blue-600 shadow-lg'
          : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
      )}
    >
      <div className={cn(
        'w-8 h-8 rounded-xl flex items-center justify-center transition-colors',
        isSelected 
          ? 'bg-white/20' 
          : 'bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-300 dark:group-hover:bg-gray-600'
      )}>
        <Icon className={cn(
          'w-5 h-5 transition-colors',
          isSelected 
            ? 'text-white' 
            : 'text-gray-500 dark:text-gray-400'
        )} />
      </div>
      <span className={cn(
        'text-xs leading-tight',
        isSelected 
          ? 'text-white font-semibold' 
          : 'text-gray-600 dark:text-gray-400'
      )}>
        {translatedText}
      </span>
      {isSelected && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full"></div>
      )}
    </motion.button>
  );
}

export function Header({ onSearch, onCategoryFilter, onCollectNews, isCollecting, selectedCategory }: HeaderProps) {
  const { currentLanguage } = useTranslation();
  const { bookmarks } = useBookmarks();
  const userContext = useAdContext(selectedCategory);
  
  // Swipe to close mobile menu
  const swipeRef = useSwipeToClose(() => setIsMobileMenuOpen(false), 80);
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

            {/* Enhanced Mobile Menu Button */}
            <div className="md:hidden">
              <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                whileTap={{ scale: 0.95 }}
                className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 relative"
                aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              >
                <motion.div
                  animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {isMobileMenuOpen ? 
                    <X className="w-6 h-6 text-gray-700 dark:text-gray-300" /> : 
                    <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                  }
                </motion.div>
                {/* Notification dot if there are bookmarks */}
                {bookmarks.length > 0 && !isMobileMenuOpen && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
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

      {/* Menu Mobile - Improved Version */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Enhanced Overlay with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Improved Menu Content with Swipe Support */}
            <motion.div
              ref={swipeRef as any}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl z-50 md:hidden overflow-hidden"
            >
              <div className="flex flex-col h-full">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                      <Newspaper className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{translatedNavigationText}</h2>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-gray-600 transition-colors duration-200 text-gray-600 dark:text-gray-300"
                    aria-label="Fermer le menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Enhanced Mobile Search */}
                <div className="p-4 bg-white dark:bg-gray-900">
                  <form onSubmit={handleSearchSubmit} className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={translatedMobileSearchPlaceholder}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base dark:text-white"
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
                    </div>
                  </form>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overscroll-contain">
                  <div className="p-4 space-y-4">
                    
                    {/* Action de collecte - Enhanced */}
                    <motion.button
                      onClick={() => {
                        onCollectNews();
                        setIsMobileMenuOpen(false);
                      }}
                      disabled={isCollecting}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        'w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl font-semibold text-base shadow-lg transition-all duration-200',
                        isCollecting
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-xl active:scale-95'
                      )}
                    >
                      <RefreshCw className={cn('w-6 h-6', isCollecting && 'animate-spin')} />
                      <span>{isCollecting ? translatedCollectingMobileText : translatedRefreshMobileText}</span>
                    </motion.button>

                    {/* Quick Actions Section */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">Actions Rapides</h3>
                      
                      {/* Sources Button - Enhanced */}
                      <Link href="/sources" onClick={() => setIsMobileMenuOpen(false)}>
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-200 border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                              <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="text-left">
                              <span className="font-semibold block">Sources</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">Tableau de bord</span>
                            </div>
                          </div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        </motion.button>
                      </Link>
                      
                      
                      {/* Bookmarks Button - Enhanced */}
                      <Link href="/bookmarks" onClick={() => setIsMobileMenuOpen(false)}>
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 transition-all duration-200 border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                              <Bookmark className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div className="text-left">
                              <span className="font-semibold block">Favoris</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">Articles sauvegardés</span>
                            </div>
                          </div>
                          {bookmarks.length > 0 && (
                            <span className="bg-yellow-500 text-white text-xs font-bold rounded-full min-w-[24px] h-6 flex items-center justify-center px-2">
                              {bookmarks.length > 99 ? '99+' : bookmarks.length}
                            </span>
                          )}
                        </motion.button>
                      </Link>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>

                    {/* Settings Section */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">Paramètres</h3>
                      
                      {/* Theme Toggle - Enhanced */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                            <Smile className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="text-left">
                            <span className="font-semibold block text-gray-700 dark:text-gray-300">Thème</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Apparence</span>
                          </div>
                        </div>
                        <ThemeToggle />
                      </div>
                      
                      {/* Language Selector - Enhanced */}
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                            <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="text-left">
                            <span className="font-semibold block text-gray-700 dark:text-gray-300">Langue</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Traduction automatique</span>
                          </div>
                        </div>
                        <LanguageSelector />
                      </div>
                    </div>

                    {/* Another Divider */}
                    <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>
                
                    {/* Categories Navigation - Enhanced */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">{translatedCategoriesText}</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {categories.map((category) => (
                          <EnhancedMobileCategoryButton
                            key={category.id || 'all'}
                            category={category}
                            isSelected={selectedCategory === category.id}
                            onClick={() => handleCategoryClick(category.id)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Safe Area for modern phones */}
                <div className="pb-safe bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-600">
                  <div className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                      <span>SuperFacts.fr - Actualités françaises</span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Swipe vers la droite pour fermer
                    </p>
                  </div>
                </div>
                </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
