'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/contexts/TranslationContext';
import { Database, HardDrive, Trash2, Activity, BarChart3 } from 'lucide-react';

interface CacheStats {
  totalKeys: number;
  translationKeys: number;
  healthy: boolean;
}

export default function CacheSettings() {
  const { useKVCache, setUseKVCache, clearCache } = useTranslation();
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Get health status
      const healthResponse = await fetch('/api/kv?action=health');
      const healthData = await healthResponse.json();
      
      // Get stats
      const statsResponse = await fetch('/api/kv?action=stats');
      const statsData = await statsResponse.json();
      
      setStats({
        healthy: healthData.healthy || false,
        totalKeys: statsData.data?.totalKeys || 0,
        translationKeys: statsData.data?.translationKeys || 0,
      });
    } catch (error) {
      console.error('Failed to fetch cache stats:', error);
      setStats({
        healthy: false,
        totalKeys: 0,
        translationKeys: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Êtes-vous sûr de vouloir vider le cache des traductions? Cette action ne peut pas être annulée.')) {
      return;
    }
    
    setIsClearing(true);
    try {
      await clearCache();
      await fetchStats(); // Refresh stats after clearing
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleToggleKV = (enabled: boolean) => {
    setUseKVCache(enabled);
    if (enabled) {
      fetchStats();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Paramètres du Cache</h2>
      </div>

      {/* Cache Type Selection */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Type de Cache</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="cacheType"
              checked={useKVCache}
              onChange={() => handleToggleKV(true)}
              className="text-blue-600"
            />
            <Database className="w-5 h-5 text-blue-600" />
            <div>
              <div className="font-medium text-gray-900">Vercel KV (Recommandé)</div>
              <div className="text-sm text-gray-600">Cache distribué haute performance</div>
            </div>
          </label>
          
          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="cacheType"
              checked={!useKVCache}
              onChange={() => handleToggleKV(false)}
              className="text-blue-600"
            />
            <HardDrive className="w-5 h-5 text-gray-600" />
            <div>
              <div className="font-medium text-gray-900">Local Storage</div>
              <div className="text-sm text-gray-600">Stockage local dans le navigateur</div>
            </div>
          </label>
        </div>
      </div>

      {/* KV Stats */}
      {useKVCache && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Statistiques KV</h3>
            <button
              onClick={fetchStats}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
            >
              <BarChart3 className="w-4 h-4" />
              {isLoading ? 'Chargement...' : 'Actualiser'}
            </button>
          </div>
          
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className={`w-4 h-4 ${stats.healthy ? 'text-green-600' : 'text-red-600'}`} />
                  <span className="text-sm font-medium text-gray-700">Statut</span>
                </div>
                <div className={`text-lg font-semibold ${stats.healthy ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.healthy ? 'Actif' : 'Inactif'}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">Clés Totales</div>
                <div className="text-lg font-semibold text-gray-900">{stats.totalKeys}</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">Traductions en Cache</div>
                <div className="text-lg font-semibold text-blue-600">{stats.translationKeys}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleClearCache}
          disabled={isClearing}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          {isClearing ? 'Vidange...' : 'Vider le Cache'}
        </button>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">À propos du cache</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Le cache des traductions améliore les performances en évitant les appels API répétés</li>
          <li>• Vercel KV offre un cache distribué plus rapide et fiable</li>
          <li>• Les traductions sont mises en cache pendant 24 heures</li>
          <li>• Le système bascule automatiquement vers localStorage si KV n'est pas disponible</li>
        </ul>
      </div>
    </div>
  );
}
