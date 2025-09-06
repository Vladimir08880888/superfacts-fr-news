'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  ExternalLink, 
  Calendar, 
  TrendingUp,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Article } from '@/lib/news-collector';
import { formatDate, formatReadTime, getCategoryColor, cn } from '@/lib/utils';
import SocialShare from '@/components/SocialShare';

interface ArticleResponse {
  success: boolean;
  article: Article;
  error?: string;
}

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const articleId = params.id as string;

  useEffect(() => {
    if (articleId) {
      fetchArticle(articleId);
    }
  }, [articleId]);

  const fetchArticle = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/articles/${id}`);
      const data: ArticleResponse = await response.json();
      
      if (data.success) {
        setArticle(data.article);
      } else {
        setError(data.error || 'Article not found');
      }
    } catch (err) {
      console.error('Error fetching article:', err);
      setError('Failed to load article');
    } finally {
      setIsLoading(false);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement de l'article...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-6"
        >
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Article non trouvé</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </button>
        </motion.div>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100">
      {/* Header avec navigation */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 sticky top-0 z-50"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Retour</span>
            </button>
            
            <Link
              href="/"
              className="text-xl font-bold text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              SuperFacts
            </Link>
            
            <SocialShare 
              title={article.title}
              url={`/articles/${article.id}`}
              description={article.summary}
              variant="compact"
              className="flex items-center gap-2"
            />
          </div>
        </div>
      </motion.header>

      {/* Article principal */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {/* Image principale */}
          <div className="relative h-96 bg-gradient-to-br from-gray-100 to-gray-200">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover"
              priority
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                // Prevent infinite loops if default image also fails
                if (target.src !== window.location.origin + '/images/default-article.svg') {
                  target.src = '/images/default-article.svg';
                }
              }}
              unoptimized={article.imageUrl.startsWith('http')}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Badges superposés */}
            <div className="absolute top-6 left-6 flex gap-3">
              {article.isHot && (
                <span className="inline-flex items-center gap-1 px-3 py-2 bg-red-500/90 backdrop-blur-sm text-white text-sm font-medium rounded-full">
                  <TrendingUp className="w-4 h-4" />
                  Hot
                </span>
              )}
              <span className={cn('px-3 py-2 text-sm font-medium rounded-full backdrop-blur-sm', getCategoryColor(article.category))}>
                {article.category}
              </span>
            </div>
          </div>

          {/* Contenu de l'article */}
          <div className="p-8">
            {/* Métadonnées */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span className="font-medium text-blue-600">{article.source}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(article.publishDate)}</span>
              </div>
              {article.readTime && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatReadTime(article.readTime)}</span>
                </div>
              )}
            </div>

            {/* Titre */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
              {article.title}
            </h1>

            {/* Résumé */}
            {article.summary && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded-r-lg">
                <p className="text-lg text-gray-700 leading-relaxed font-medium">
                  {article.summary}
                </p>
              </div>
            )}

            {/* Contenu principal */}
            <div className="prose prose-lg max-w-none mb-8">
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {article.content}
              </div>
            </div>

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span 
                      key={tag}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors duration-200 cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Lien vers la source */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Article publié par <span className="font-medium text-blue-600">{article.source}</span>
                </p>
                <Link
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                >
                  <span>Lire sur la source</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
          
          {/* Секция обмена */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="border-t border-gray-200 px-8 py-6"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Partager cet article</h3>
                <p className="text-sm text-gray-600">Partagez cette information avec vos proches</p>
              </div>
              <SocialShare 
                title={article.title}
                url={`/articles/${article.id}`}
                description={article.summary}
                variant="default"
              />
            </div>
          </motion.div>
        </motion.article>
      </main>
    </div>
  );
}
