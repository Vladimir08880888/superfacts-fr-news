'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Newspaper, Mail, Github, Twitter, Facebook, ExternalLink } from 'lucide-react';
import { useTranslatedText } from '@/contexts/TranslationContext';
import { useAdContext } from '@/hooks/useAdContext';
import BannerAd from '@/components/ads/BannerAd';
import { AdPlacement } from '@/types/advertising';
import Link from 'next/link';

export default function Footer() {
  const userContext = useAdContext();
  
  const { translatedText: aboutTitle } = useTranslatedText('À propos de SuperFacts.fr');
  const { translatedText: aboutText } = useTranslatedText('SuperFacts.fr agrège les actualités françaises en temps réel depuis les plus grandes sources d\'information du pays.');
  const { translatedText: quickLinksTitle } = useTranslatedText('Liens rapides');
  const { translatedText: sourcesText } = useTranslatedText('Sources');
  const { translatedText: bookmarksText } = useTranslatedText('Favoris');
  const { translatedText: sentimentText } = useTranslatedText('Analyse sentiment');
  const { translatedText: contactTitle } = useTranslatedText('Contact');
  const { translatedText: followUsTitle } = useTranslatedText('Suivez-nous');
  const { translatedText: copyrightText } = useTranslatedText('Tous droits réservés');
  const { translatedText: privacyText } = useTranslatedText('Politique de confidentialité');
  const { translatedText: termsText } = useTranslatedText('Conditions d\'utilisation');

  const footerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.footer
      variants={footerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className="bg-gray-900 text-white"
    >
      {/* Footer Banner Ad */}
      <div className="border-b border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={itemVariants} className="flex justify-center">
            <BannerAd 
              placement={AdPlacement.FOOTER}
              userContext={userContext}
              className="max-w-full"
            />
          </motion.div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                <Newspaper className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                  SuperFacts.fr
                </h3>
                <p className="text-xs text-gray-400">Actualités françaises</p>
              </div>
            </div>
            
            <p className="text-gray-300 mb-6 leading-relaxed max-w-md">
              {aboutText}
            </p>

            {/* Newsletter Subscription */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Votre email pour la newsletter"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
              />
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 font-medium flex items-center justify-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>S'abonner</span>
              </button>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <h4 className="text-lg font-semibold mb-6">{quickLinksTitle}</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/sources" className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center space-x-2">
                  <ExternalLink className="w-4 h-4" />
                  <span>{sourcesText}</span>
                </Link>
              </li>
              <li>
                <Link href="/bookmarks" className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center space-x-2">
                  <ExternalLink className="w-4 h-4" />
                  <span>{bookmarksText}</span>
                </Link>
              </li>
              <li>
                <Link href="/sentiment" className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center space-x-2">
                  <ExternalLink className="w-4 h-4" />
                  <span>{sentimentText}</span>
                </Link>
              </li>
              <li>
                <Link href="/daily-sentiment" className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center space-x-2">
                  <ExternalLink className="w-4 h-4" />
                  <span>Sentiment quotidien</span>
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Contact & Social */}
          <motion.div variants={itemVariants}>
            <h4 className="text-lg font-semibold mb-6">{followUsTitle}</h4>
            <div className="flex space-x-4 mb-6">
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors duration-200"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors duration-200"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-200"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>

            <div className="text-gray-400 text-sm space-y-2">
              <p>📧 contact@superfacts.fr</p>
              <p>📍 Paris, France</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Bar */}
      <motion.div
        variants={itemVariants}
        className="border-t border-gray-800 py-6"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-gray-400 text-sm">
              © 2024 SuperFacts.fr - {copyrightText}
            </p>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                {privacyText}
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                {termsText}
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.footer>
  );
}
