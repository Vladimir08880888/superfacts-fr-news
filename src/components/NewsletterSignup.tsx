'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Check, AlertCircle, Send, Star } from 'lucide-react';
import { useTranslatedText } from '@/contexts/TranslationContext';

interface NewsletterSignupProps {
  variant?: 'default' | 'compact' | 'inline' | 'sidebar';
  className?: string;
}

export default function NewsletterSignup({ variant = 'default', className = '' }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['general']);
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { translatedText: titleText } = useTranslatedText('Restez informé avec notre newsletter');
  const { translatedText: descriptionText } = useTranslatedText('Recevez les meilleures actualités directement dans votre boîte mail');
  const { translatedText: emailPlaceholder } = useTranslatedText('Votre adresse email');
  const { translatedText: subscribeText } = useTranslatedText('S\'abonner');
  const { translatedText: subscribingText } = useTranslatedText('Abonnement...');
  const { translatedText: successText } = useTranslatedText('Merci ! Vous êtes maintenant abonné à notre newsletter.');
  const { translatedText: dailyText } = useTranslatedText('Quotidien');
  const { translatedText: weeklyText } = useTranslatedText('Hebdomadaire');
  const { translatedText: categoriesText } = useTranslatedText('Catégories d\'intérêt');

  const categories = [
    { id: 'general', name: 'Actualités générales' },
    { id: 'tech', name: 'Technologie' },
    { id: 'politics', name: 'Politique' },
    { id: 'economy', name: 'Économie' },
    { id: 'sports', name: 'Sport' },
    { id: 'culture', name: 'Culture' },
    { id: 'international', name: 'International' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Mock API call - replace with actual newsletter service
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          categories: selectedCategories,
          frequency,
          language: 'fr', // Could be dynamic based on current language
        }),
      });

      if (response.ok) {
        setIsSubscribed(true);
        setEmail('');
      } else {
        const data = await response.json();
        setError(data.error || 'Erreur lors de l\'abonnement');
      }
    } catch (err) {
      console.error('Newsletter subscription error:', err);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    if (categoryId === 'general') return; // General is always selected
    
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  if (variant === 'compact') {
    return (
      <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 ${className}`}>
        {isSubscribed ? (
          <div className="text-center">
            <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-green-700 font-medium">{successText}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-900">Newsletter</span>
            </div>
            <div className="flex space-x-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={emailPlaceholder}
                required
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? subscribingText : subscribeText}
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-600 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <motion.div 
        className={`bg-white rounded-2xl shadow-lg p-6 border border-gray-100 ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {isSubscribed ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Abonnement confirmé !
            </h3>
            <p className="text-sm text-gray-600">{successText}</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {titleText}
              </h3>
              <p className="text-sm text-gray-600">
                {descriptionText}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={emailPlaceholder}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fréquence
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFrequency('daily')}
                    className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                      frequency === 'daily'
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {dailyText}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrequency('weekly')}
                    className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                      frequency === 'weekly'
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {weeklyText}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? subscribingText : subscribeText}</span>
              </button>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}
            </form>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center text-xs text-gray-500">
                <Star className="w-3 h-3 mr-1" />
                <span>Gratuit, sans spam, désabonnement en un clic</span>
              </div>
            </div>
          </>
        )}
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.section 
      className={`bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white ${className}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {isSubscribed ? (
        <div className="text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Merci !</h2>
          <p className="text-blue-100">{successText}</p>
        </div>
      ) : (
        <>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">{titleText}</h2>
            <p className="text-xl text-blue-100 mb-6">{descriptionText}</p>
          </div>

          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={emailPlaceholder}
              required
              className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-lg placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200"
            />

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFrequency('daily')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  frequency === 'daily'
                    ? 'bg-white text-blue-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {dailyText}
              </button>
              <button
                type="button"
                onClick={() => setFrequency('weekly')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  frequency === 'weekly'
                    ? 'bg-white text-blue-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {weeklyText}
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white text-blue-600 py-4 px-6 rounded-lg font-semibold hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Send className="w-5 h-5" />
              <span>{isSubmitting ? subscribingText : subscribeText}</span>
            </button>

            {error && (
              <div className="flex items-center space-x-2 text-red-200 text-sm bg-red-500/20 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </form>

          <div className="text-center mt-6">
            <div className="flex items-center justify-center text-sm text-blue-200">
              <Star className="w-4 h-4 mr-1" />
              <span>Gratuit • Sans spam • Désabonnement facile</span>
            </div>
          </div>
        </>
      )}
    </motion.section>
  );
}
