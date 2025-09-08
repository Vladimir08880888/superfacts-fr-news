'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Shield, Eye, BarChart3, Smartphone, Monitor, Globe } from 'lucide-react';
import { useAdConfiguration } from '@/hooks/useAdConfiguration';
import { useTranslatedText } from '@/contexts/TranslationContext';

interface AdPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdPreferences({ isOpen, onClose }: AdPreferencesProps) {
  const { 
    configuration, 
    updateConfiguration, 
    isAdBlockerDetected, 
    userHasOptedOut,
    optOutOfAds,
    optInToAds,
    adStats 
  } = useAdConfiguration();

  const { translatedText: preferencesTitle } = useTranslatedText('Préférences publicitaires');
  const { translatedText: generalSettingsText } = useTranslatedText('Paramètres généraux');
  const { translatedText: adPlacementsText } = useTranslatedText('Emplacements publicitaires');
  const { translatedText: performanceText } = useTranslatedText('Performance');
  const { translatedText: privacyText } = useTranslatedText('Confidentialité');
  const { translatedText: saveText } = useTranslatedText('Enregistrer');
  const { translatedText: optOutText } = useTranslatedText('Désactiver toutes les publicités');
  const { translatedText: optInText } = useTranslatedText('Réactiver les publicités');
  
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {preferencesTitle}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
            <div className="p-6 space-y-8">
              {/* Ad Blocker Detection */}
              {isAdBlockerDetected && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
                >
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <div>
                      <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                        Bloqueur de publicité détecté
                      </h3>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Nous respectons votre choix d&apos;utiliser un bloqueur de publicité.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* General Settings */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>{generalSettingsText}</span>
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {userHasOptedOut ? optInText : optOutText}
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {userHasOptedOut 
                          ? 'Réactiver l\'affichage de toutes les publicités'
                          : 'Masquer toutes les publicités sur le site'
                        }
                      </p>
                    </div>
                    <button
                      onClick={userHasOptedOut ? optInToAds : optOutOfAds}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        userHasOptedOut
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      {userHasOptedOut ? 'Réactiver' : 'Désactiver'}
                    </button>
                  </div>

                  {!userHasOptedOut && (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Fréquence des publicités entre articles
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Afficher une publicité tous les {configuration.betweenArticlesFrequency} articles
                          </p>
                        </div>
                        <select
                          value={configuration.betweenArticlesFrequency}
                          onChange={(e) => updateConfiguration({ 
                            betweenArticlesFrequency: parseInt(e.target.value) 
                          })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value={3}>Tous les 3 articles</option>
                          <option value={4}>Tous les 4 articles</option>
                          <option value={5}>Tous les 5 articles</option>
                          <option value={6}>Tous les 6 articles</option>
                          <option value={8}>Tous les 8 articles</option>
                          <option value={10}>Tous les 10 articles</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Publicités respectueuses
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Respecter vos préférences de navigation
                          </p>
                        </div>
                        <button
                          onClick={() => updateConfiguration({ 
                            respectUserPreferences: !configuration.respectUserPreferences 
                          })}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            configuration.respectUserPreferences ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                            configuration.respectUserPreferences ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* Ad Placements */}
              {!userHasOptedOut && (
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                    <Eye className="w-5 h-5" />
                    <span>{adPlacementsText}</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { key: 'enableHeaderAds', label: 'En-tête', icon: Monitor },
                      { key: 'enableSidebarAds', label: 'Barre latérale', icon: Monitor },
                      { key: 'enableFooterAds', label: 'Pied de page', icon: Monitor },
                      { key: 'enableBetweenArticleAds', label: 'Entre les articles', icon: Globe },
                      { key: 'enableMobileStickyAds', label: 'Mobile collant', icon: Smartphone },
                      { key: 'enableNativeAds', label: 'Publicités natives', icon: Globe },
                    ].map(({ key, label, icon: Icon }) => (
                      <div key={key} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Icon className="w-4 h-4 text-gray-500" />
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {label}
                          </label>
                        </div>
                        <button
                          onClick={() => updateConfiguration({ 
                            [key]: !configuration[key as keyof typeof configuration] 
                          })}
                          className={`w-8 h-4 rounded-full transition-colors ${
                            configuration[key as keyof typeof configuration] 
                              ? 'bg-blue-600' 
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-full bg-white shadow-md transform transition-transform ${
                            configuration[key as keyof typeof configuration] 
                              ? 'translate-x-4' 
                              : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Performance Stats */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>{performanceText}</span>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {adStats.clickThroughRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Taux de clic</div>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {(100 - adStats.loadFailureRate).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Taux de succès</div>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {adStats.isPerformingWell() ? '✓' : '✗'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Performance</div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Les modifications sont sauvegardées automatiquement
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {saveText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
