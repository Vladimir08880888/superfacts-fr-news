'use client';

import { motion } from 'framer-motion';
import { Share2, Facebook, Twitter, Linkedin, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SocialShareProps {
  title: string;
  url: string;
  description?: string;
  variant?: 'default' | 'compact' | 'floating';
  className?: string;
}

export default function SocialShare({ 
  title, 
  url, 
  description = '', 
  variant = 'default',
  className = ''
}: SocialShareProps) {
  const [isOpen, setIsOpen] = useState(false);

  const shareData = {
    title,
    text: description || title,
    url: window.location.origin + url
  };

  const socialLinks = [
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'hover:bg-blue-600 hover:text-white',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}&quote=${encodeURIComponent(shareData.title)}`,
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'hover:bg-sky-500 hover:text-white',
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.title)}`,
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'hover:bg-blue-700 hover:text-white',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.url)}`,
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'hover:bg-green-500 hover:text-white',
      url: `https://wa.me/?text=${encodeURIComponent(`${shareData.title} ${shareData.url}`)}`,
    },
  ];

  const handleShare = async (socialUrl?: string) => {
    if (socialUrl) {
      window.open(socialUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
      return;
    }

    // Try native share API first
    if (navigator.share && variant !== 'compact') {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Native sharing cancelled or failed');
      }
    } else {
      setIsOpen(!isOpen);
    }
  };

  const renderCompactVariant = () => (
    <div className={cn('flex items-center gap-2', className)}>
      {socialLinks.map(({ name, icon: Icon, color, url }) => (
        <motion.button
          key={name}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleShare(url)}
          className={cn(
            'p-2 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 transition-all duration-200',
            color
          )}
          title={`Partager sur ${name}`}
        >
          <Icon className="w-4 h-4" />
        </motion.button>
      ))}
    </div>
  );

  const renderFloatingVariant = () => (
    <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-40">
      <motion.div
        initial={{ x: 100 }}
        animate={{ x: 0 }}
        className="flex flex-col gap-2"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors duration-200"
        >
          <Share2 className="w-5 h-5" />
        </motion.button>
        
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col gap-2"
          >
            {socialLinks.map(({ name, icon: Icon, color, url }) => (
              <motion.button
                key={name}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleShare(url)}
                className={cn(
                  'p-3 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full shadow-lg border border-gray-300 dark:border-gray-600 transition-all duration-200',
                  color
                )}
                title={`Partager sur ${name}`}
              >
                <Icon className="w-4 h-4" />
              </motion.button>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );

  const renderDefaultVariant = () => (
    <div className={cn('relative', className)}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleShare()}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200"
      >
        <Share2 className="w-4 h-4" />
        <span className="text-sm font-medium">Partager</span>
      </motion.button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 z-50"
        >
          <div className="flex gap-2">
            {socialLinks.map(({ name, icon: Icon, color, url }) => (
              <motion.button
                key={name}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  handleShare(url);
                  setIsOpen(false);
                }}
                className={cn(
                  'p-2 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 transition-all duration-200',
                  color
                )}
                title={`Partager sur ${name}`}
              >
                <Icon className="w-4 h-4" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );

  if (variant === 'compact') return renderCompactVariant();
  if (variant === 'floating') return renderFloatingVariant();
  return renderDefaultVariant();
}
