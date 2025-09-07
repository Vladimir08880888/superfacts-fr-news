import { Article } from './news-collector';

export interface SEOMetaTags {
  title: string;
  description: string;
  keywords: string[];
  canonical?: string;
  robots?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  image?: string;
  type?: string;
  locale?: string;
}

export interface OpenGraphTags {
  title: string;
  description: string;
  type: 'website' | 'article' | 'profile';
  url: string;
  image: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  siteName: string;
  locale?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

export interface TwitterCardTags {
  card: 'summary' | 'summary_large_image' | 'app' | 'player';
  site?: string;
  creator?: string;
  title: string;
  description: string;
  image: string;
  imageAlt?: string;
}

export interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

export interface SEOConfiguration {
  siteName: string;
  siteUrl: string;
  defaultImage: string;
  twitterHandle?: string;
  facebookAppId?: string;
  languages: string[];
  organization: {
    name: string;
    url: string;
    logo: string;
    sameAs: string[];
  };
}

export class SEOManager {
  private config: SEOConfiguration;

  constructor(config: SEOConfiguration) {
    this.config = config;
  }

  // Генерация мета-тегов для главной страницы
  public generateHomepageMetaTags(
    totalArticles: number,
    categories: string[],
    language = 'fr'
  ): SEOMetaTags {
    const title = language === 'fr' 
      ? 'SuperFacts.fr - Actualités françaises en temps réel'
      : 'SuperFacts.fr - French News in Real-Time';
    
    const description = language === 'fr'
      ? `Découvrez ${totalArticles} actualités françaises en temps réel depuis ${categories.length} catégories. Sources fiables : Le Monde, Le Figaro, France 24, Liberation et plus.`
      : `Discover ${totalArticles} French news articles in real-time from ${categories.length} categories. Trusted sources: Le Monde, Le Figaro, France 24, Liberation and more.`;

    const keywords = language === 'fr' 
      ? ['actualités france', 'news français', 'information temps réel', 'presse française', ...categories.map(c => c.toLowerCase())]
      : ['french news', 'france news', 'real-time news', 'french media', ...categories.map(c => c.toLowerCase())];

    return {
      title,
      description,
      keywords,
      canonical: this.config.siteUrl,
      robots: 'index, follow',
      type: 'website',
      locale: language === 'fr' ? 'fr_FR' : 'en_US',
      image: this.config.defaultImage,
      modifiedTime: new Date().toISOString()
    };
  }

  // Génération des méta-tags pour un article
  public generateArticleMetaTags(
    article: Article,
    language = 'fr'
  ): SEOMetaTags {
    const title = `${article.title} | SuperFacts.fr`;
    const description = this.truncateText(article.summary, 160);
    const keywords = [
      article.category.toLowerCase(),
      article.source.toLowerCase(),
      ...article.tags.map(t => t.toLowerCase()),
      'actualités france',
      'news français'
    ];

    return {
      title,
      description,
      keywords,
      canonical: `${this.config.siteUrl}/article/${article.id}`,
      robots: 'index, follow',
      author: article.author,
      publishedTime: article.publishDate,
      section: article.category,
      tags: article.tags,
      image: article.imageUrl !== '/images/default-article.svg' ? article.imageUrl : this.config.defaultImage,
      type: 'article',
      locale: language === 'fr' ? 'fr_FR' : 'en_US'
    };
  }

  // Génération des méta-tags pour une catégorie
  public generateCategoryMetaTags(
    category: string,
    articleCount: number,
    recentArticles: Article[],
    language = 'fr'
  ): SEOMetaTags {
    const title = language === 'fr'
      ? `${category} - Actualités ${category.toLowerCase()} | SuperFacts.fr`
      : `${category} - ${category} News | SuperFacts.fr`;
    
    const description = language === 'fr'
      ? `${articleCount} actualités ${category.toLowerCase()} mises à jour en temps réel. Suivez les dernières nouvelles de ${category.toLowerCase()} depuis les sources françaises de référence.`
      : `${articleCount} ${category.toLowerCase()} news updated in real-time. Follow the latest ${category.toLowerCase()} news from trusted French sources.`;
    
    const keywords = [
      `actualités ${category.toLowerCase()}`,
      `news ${category.toLowerCase()}`,
      category.toLowerCase(),
      'france',
      'temps réel',
      ...recentArticles.slice(0, 5).map(a => a.source.toLowerCase())
    ];

    return {
      title,
      description,
      keywords,
      canonical: `${this.config.siteUrl}/category/${encodeURIComponent(category.toLowerCase())}`,
      robots: 'index, follow',
      section: category,
      image: this.selectBestImageFromArticles(recentArticles),
      type: 'website',
      locale: language === 'fr' ? 'fr_FR' : 'en_US',
      modifiedTime: recentArticles[0]?.publishDate || new Date().toISOString()
    };
  }

  // Open Graph tags
  public generateOpenGraphTags(metaTags: SEOMetaTags, url: string): OpenGraphTags {
    return {
      title: metaTags.title,
      description: metaTags.description,
      type: metaTags.type === 'article' ? 'article' : 'website',
      url,
      image: metaTags.image || this.config.defaultImage,
      imageAlt: `Image pour ${metaTags.title}`,
      imageWidth: 1200,
      imageHeight: 630,
      siteName: this.config.siteName,
      locale: metaTags.locale,
      publishedTime: metaTags.publishedTime,
      modifiedTime: metaTags.modifiedTime,
      author: metaTags.author,
      section: metaTags.section,
      tags: metaTags.tags
    };
  }

  // Twitter Card tags
  public generateTwitterCardTags(metaTags: SEOMetaTags): TwitterCardTags {
    return {
      card: 'summary_large_image',
      site: this.config.twitterHandle,
      creator: this.config.twitterHandle,
      title: metaTags.title,
      description: metaTags.description,
      image: metaTags.image || this.config.defaultImage,
      imageAlt: `Image pour ${metaTags.title}`
    };
  }

  // Structured Data pour les articles
  public generateArticleStructuredData(article: Article): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.title,
      description: article.summary,
      image: {
        '@type': 'ImageObject',
        url: article.imageUrl !== '/images/default-article.svg' ? article.imageUrl : this.config.defaultImage,
        width: 1200,
        height: 630
      },
      author: {
        '@type': 'Person',
        name: article.author,
        url: `${this.config.siteUrl}/author/${encodeURIComponent(article.author.toLowerCase().replace(/\s+/g, '-'))}`
      },
      publisher: {
        '@type': 'Organization',
        name: this.config.organization.name,
        url: this.config.organization.url,
        logo: {
          '@type': 'ImageObject',
          url: this.config.organization.logo,
          width: 200,
          height: 60
        }
      },
      datePublished: article.publishDate,
      dateModified: article.publishDate,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${this.config.siteUrl}/article/${article.id}`
      },
      url: `${this.config.siteUrl}/article/${article.id}`,
      articleSection: article.category,
      keywords: article.tags.join(', '),
      wordCount: this.estimateWordCount(article.content),
      inLanguage: 'fr-FR',
      about: {
        '@type': 'Thing',
        name: article.category
      },
      mentions: article.tags.map(tag => ({
        '@type': 'Thing',
        name: tag
      })),
      isPartOf: {
        '@type': 'WebSite',
        name: this.config.siteName,
        url: this.config.siteUrl
      }
    };
  }

  // Structured Data pour le site
  public generateWebsiteStructuredData(): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: this.config.siteName,
      url: this.config.siteUrl,
      description: 'Actualités françaises en temps réel depuis les plus grandes sources d\'information',
      inLanguage: this.config.languages,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${this.config.siteUrl}/search?q={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      },
      publisher: {
        '@type': 'Organization',
        name: this.config.organization.name,
        url: this.config.organization.url,
        logo: {
          '@type': 'ImageObject',
          url: this.config.organization.logo
        },
        sameAs: this.config.organization.sameAs
      }
    };
  }

  // Structured Data pour l'organisation
  public generateOrganizationStructuredData(): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: this.config.organization.name,
      url: this.config.organization.url,
      logo: {
        '@type': 'ImageObject',
        url: this.config.organization.logo,
        width: 200,
        height: 60
      },
      description: 'Plateforme d\'actualités françaises en temps réel',
      sameAs: this.config.organization.sameAs,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: ['French', 'English']
      }
    };
  }

  // Structured Data pour les breadcrumbs
  public generateBreadcrumbStructuredData(breadcrumbs: { name: string; url: string }[]): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url
      }))
    };
  }

  // Génération de sitemap XML
  public generateSitemapXML(
    articles: Article[],
    categories: string[],
    lastModified: string = new Date().toISOString()
  ): string {
    const urls: string[] = [];

    // Page d'accueil
    urls.push(`
    <url>
      <loc>${this.config.siteUrl}</loc>
      <lastmod>${lastModified}</lastmod>
      <changefreq>hourly</changefreq>
      <priority>1.0</priority>
    </url>`);

    // Pages de catégories
    categories.forEach(category => {
      urls.push(`
    <url>
      <loc>${this.config.siteUrl}/category/${encodeURIComponent(category.toLowerCase())}</loc>
      <lastmod>${lastModified}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.8</priority>
    </url>`);
    });

    // Articles (les 1000 plus récents)
    articles.slice(0, 1000).forEach(article => {
      urls.push(`
    <url>
      <loc>${this.config.siteUrl}/article/${article.id}</loc>
      <lastmod>${article.publishDate}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.6</priority>
      <news:news>
        <news:publication>
          <news:name>${this.config.siteName}</news:name>
          <news:language>fr</news:language>
        </news:publication>
        <news:publication_date>${article.publishDate}</news:publication_date>
        <news:title><![CDATA[${article.title}]]></news:title>
        <news:keywords>${article.tags.join(', ')}</news:keywords>
      </news:news>
    </url>`);
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  ${urls.join('')}
</urlset>`;
  }

  // Génération de RSS feed
  public generateRSSFeed(
    articles: Article[],
    category?: string,
    limit = 50
  ): string {
    const feedTitle = category 
      ? `${this.config.siteName} - ${category}`
      : this.config.siteName;
    
    const feedDescription = category
      ? `Actualités ${category.toLowerCase()} en temps réel`
      : 'Actualités françaises en temps réel';

    const feedUrl = category
      ? `${this.config.siteUrl}/category/${encodeURIComponent(category.toLowerCase())}`
      : this.config.siteUrl;

    const filteredArticles = category
      ? articles.filter(a => a.category === category).slice(0, limit)
      : articles.slice(0, limit);

    const items = filteredArticles.map(article => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <description><![CDATA[${article.summary}]]></description>
      <link>${this.config.siteUrl}/article/${article.id}</link>
      <guid>${this.config.siteUrl}/article/${article.id}</guid>
      <pubDate>${new Date(article.publishDate).toUTCString()}</pubDate>
      <author>${article.author}</author>
      <category>${article.category}</category>
      <source url="${article.sourceUrl}">${article.source}</source>
      ${article.imageUrl !== '/images/default-article.svg' ? `<enclosure url="${article.imageUrl}" type="image/jpeg" />` : ''}
    </item>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${feedTitle}</title>
    <description>${feedDescription}</description>
    <link>${feedUrl}</link>
    <atom:link href="${this.config.siteUrl}/rss${category ? `/${encodeURIComponent(category.toLowerCase())}` : ''}.xml" rel="self" type="application/rss+xml" />
    <language>fr-FR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>60</ttl>
    <image>
      <url>${this.config.organization.logo}</url>
      <title>${feedTitle}</title>
      <link>${feedUrl}</link>
      <width>200</width>
      <height>60</height>
    </image>
    ${items}
  </channel>
</rss>`;
  }

  // Génération de robots.txt
  public generateRobotsTxt(): string {
    return `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /private/

# Sitemaps
Sitemap: ${this.config.siteUrl}/sitemap.xml
Sitemap: ${this.config.siteUrl}/sitemap-news.xml

# Crawl delay for respectful crawling
Crawl-delay: 1

# Special rules for news bots
User-agent: Googlebot-News
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Crawl-delay: 2`;
  }

  // Utilitaires privées
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
  }

  private selectBestImageFromArticles(articles: Article[]): string {
    const articlesWithImages = articles.filter(a => 
      a.imageUrl && a.imageUrl !== '/images/default-article.svg'
    );
    
    return articlesWithImages.length > 0 
      ? articlesWithImages[0].imageUrl 
      : this.config.defaultImage;
  }

  private estimateWordCount(content: string): number {
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  // Génération des méta-tags HTML
  public generateHTMLMetaTags(metaTags: SEOMetaTags): string {
    const tags = [
      `<title>${metaTags.title}</title>`,
      `<meta name="description" content="${metaTags.description}" />`,
      `<meta name="keywords" content="${metaTags.keywords.join(', ')}" />`,
      metaTags.canonical ? `<link rel="canonical" href="${metaTags.canonical}" />` : '',
      metaTags.robots ? `<meta name="robots" content="${metaTags.robots}" />` : '',
      metaTags.author ? `<meta name="author" content="${metaTags.author}" />` : '',
      metaTags.publishedTime ? `<meta property="article:published_time" content="${metaTags.publishedTime}" />` : '',
      metaTags.modifiedTime ? `<meta property="article:modified_time" content="${metaTags.modifiedTime}" />` : '',
      metaTags.section ? `<meta property="article:section" content="${metaTags.section}" />` : '',
      metaTags.locale ? `<meta property="og:locale" content="${metaTags.locale}" />` : ''
    ];

    return tags.filter(tag => tag).join('\n    ');
  }

  // Génération des Open Graph tags HTML
  public generateHTMLOpenGraphTags(ogTags: OpenGraphTags): string {
    const tags = [
      `<meta property="og:title" content="${ogTags.title}" />`,
      `<meta property="og:description" content="${ogTags.description}" />`,
      `<meta property="og:type" content="${ogTags.type}" />`,
      `<meta property="og:url" content="${ogTags.url}" />`,
      `<meta property="og:image" content="${ogTags.image}" />`,
      ogTags.imageAlt ? `<meta property="og:image:alt" content="${ogTags.imageAlt}" />` : '',
      ogTags.imageWidth ? `<meta property="og:image:width" content="${ogTags.imageWidth}" />` : '',
      ogTags.imageHeight ? `<meta property="og:image:height" content="${ogTags.imageHeight}" />` : '',
      `<meta property="og:site_name" content="${ogTags.siteName}" />`,
      ogTags.locale ? `<meta property="og:locale" content="${ogTags.locale}" />` : '',
      ogTags.publishedTime ? `<meta property="article:published_time" content="${ogTags.publishedTime}" />` : '',
      ogTags.modifiedTime ? `<meta property="article:modified_time" content="${ogTags.modifiedTime}" />` : '',
      ogTags.author ? `<meta property="article:author" content="${ogTags.author}" />` : '',
      ogTags.section ? `<meta property="article:section" content="${ogTags.section}" />` : ''
    ];

    if (ogTags.tags) {
      ogTags.tags.forEach(tag => {
        tags.push(`<meta property="article:tag" content="${tag}" />`);
      });
    }

    return tags.filter(tag => tag).join('\n    ');
  }

  // Génération des Twitter Card tags HTML
  public generateHTMLTwitterCardTags(twitterTags: TwitterCardTags): string {
    const tags = [
      `<meta name="twitter:card" content="${twitterTags.card}" />`,
      twitterTags.site ? `<meta name="twitter:site" content="${twitterTags.site}" />` : '',
      twitterTags.creator ? `<meta name="twitter:creator" content="${twitterTags.creator}" />` : '',
      `<meta name="twitter:title" content="${twitterTags.title}" />`,
      `<meta name="twitter:description" content="${twitterTags.description}" />`,
      `<meta name="twitter:image" content="${twitterTags.image}" />`,
      twitterTags.imageAlt ? `<meta name="twitter:image:alt" content="${twitterTags.imageAlt}" />` : ''
    ];

    return tags.filter(tag => tag).join('\n    ');
  }
}

// Configuration par défaut
export const defaultSEOConfig: SEOConfiguration = {
  siteName: 'SuperFacts.fr',
  siteUrl: 'https://superfacts.fr',
  defaultImage: 'https://superfacts.fr/og-default-image.jpg',
  twitterHandle: '@SuperFactsFR',
  languages: ['fr', 'en'],
  organization: {
    name: 'SuperFacts',
    url: 'https://superfacts.fr',
    logo: 'https://superfacts.fr/logo-200x60.png',
    sameAs: [
      'https://twitter.com/SuperFactsFR',
      'https://facebook.com/SuperFactsFR'
    ]
  }
};

// Instance singleton
export const seoManager = new SEOManager(defaultSEOConfig);
