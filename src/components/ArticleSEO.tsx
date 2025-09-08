import { Metadata } from 'next'
import { Article } from '@/lib/news-collector'

interface ArticleSEOProps {
  article: Article
}

export function generateArticleMetadata(article: Article): Metadata {
  const title = `${article.title} - SuperFacts.fr`
  const description = article.summary || article.title
  const publishedTime = new Date(article.publishDate).toISOString()
  const modifiedTime = publishedTime

  return {
    title,
    description,
    keywords: [
      article.category,
      'actualités france',
      'news france', 
      ...article.title.split(' ').slice(0, 5), // Premiers mots du titre comme mots-clés
    ],
    authors: [{ name: article.source, url: article.sourceUrl }],
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime,
      modifiedTime,
      authors: [article.source],
      section: article.category,
      tags: [article.category, 'actualités', 'france'],
      images: article.imageUrl ? [
        {
          url: article.imageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        }
      ] : [],
      url: `https://superfacts.fr/article/${article.id}`,
      siteName: 'SuperFacts.fr',
      locale: 'fr_FR',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: article.imageUrl ? [article.imageUrl] : [],
    },
    alternates: {
      canonical: `/article/${article.id}`,
    },
    other: {
      'article:published_time': publishedTime,
      'article:modified_time': modifiedTime,
      'article:author': article.source,
      'article:section': article.category,
      'article:tag': article.category,
    },
  }
}

export function ArticleSEOSchema({ article }: ArticleSEOProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.summary || article.title,
    image: article.imageUrl ? [article.imageUrl] : [],
    datePublished: new Date(article.publishDate).toISOString(),
    dateModified: new Date(article.publishDate).toISOString(),
    author: {
      '@type': 'Organization',
      name: article.source,
      url: article.sourceUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'SuperFacts.fr',
      url: 'https://superfacts.fr',
      logo: {
        '@type': 'ImageObject',
        url: 'https://superfacts.fr/logo.png',
        width: 512,
        height: 512,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://superfacts.fr/article/${article.id}`,
    },
    articleSection: article.category,
    inLanguage: 'fr-FR',
    isAccessibleForFree: true,
    url: `https://superfacts.fr/article/${article.id}`,
    thumbnailUrl: article.imageUrl,
    keywords: [article.category, 'actualités', 'france', 'news'].join(', '),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  )
}
