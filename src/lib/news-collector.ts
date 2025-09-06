import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  publishDate: string;
  category: string;
  imageUrl: string;
  tags: string[];
  sourceUrl: string;
  source: string;
  isHot: boolean;
  sentiment?: 'positive' | 'negative' | 'neutral';
  readTime?: number;
}

export interface NewsSource {
  name: string;
  url: string;
  category: string;
  logo?: string;
  selector?: {
    title?: string;
    content?: string;
    image?: string;
  };
}

export class FrenchNewsCollector {
  private parser: Parser;
  private articlesDir: string;
  
  // Sources d'actualités françaises complètes
  private sources: NewsSource[] = [
    // Médias généralistes
    { name: 'Le Monde', url: 'https://www.lemonde.fr/rss/une.xml', category: 'Actualités', logo: '/logos/lemonde.png' },
    { name: 'Le Figaro', url: 'https://www.lefigaro.fr/rss/figaro_actualites.xml', category: 'Actualités', logo: '/logos/figaro.png' },
    { name: 'Libération', url: 'https://www.liberation.fr/arc/outboundfeeds/rss/?outputType=xml', category: 'Actualités', logo: '/logos/liberation.png' },
    { name: 'France 24', url: 'https://www.france24.com/fr/rss', category: 'Actualités', logo: '/logos/france24.png' },
    { name: 'France Info', url: 'https://www.francetvinfo.fr/titres.rss', category: 'Actualités', logo: '/logos/franceinfo.png' },
    { name: 'BFM TV', url: 'https://www.bfmtv.com/rss/info/', category: 'Actualités', logo: '/logos/bfmtv.png' },
    { name: 'L\'Express', url: 'https://www.lexpress.fr/rss/unes.xml', category: 'Actualités', logo: '/logos/express.png' },
    { name: 'Marianne', url: 'https://www.marianne.net/rss.xml', category: 'Actualités', logo: '/logos/marianne.png' },
    { name: 'L\'Obs', url: 'https://www.nouvelobs.com/rss.xml', category: 'Actualités', logo: '/logos/obs.png' },

    // Économie et Business
    { name: 'Les Échos', url: 'https://www.lesechos.fr/rss.xml', category: 'Économie', logo: '/logos/echos.png' },
    { name: 'La Tribune', url: 'https://www.latribune.fr/rss/a-la-une.rss', category: 'Économie', logo: '/logos/tribune.png' },
    { name: 'Challenges', url: 'https://www.challenges.fr/rss.xml', category: 'Économie', logo: '/logos/challenges.png' },
    { name: 'Capital', url: 'https://www.capital.fr/rss', category: 'Économie', logo: '/logos/capital.png' },

    // Tech et Sciences
    { name: 'Futura Sciences', url: 'https://www.futura-sciences.com/rss/actualites.xml', category: 'Sciences', logo: '/logos/futura.png' },
    { name: 'Sciences et Avenir', url: 'https://www.sciencesetavenir.fr/rss.xml', category: 'Sciences', logo: '/logos/sciencesetavenir.png' },
    { name: '01net', url: 'https://www.01net.com/rss/info/', category: 'Tech', logo: '/logos/01net.png' },
    { name: 'Clubic', url: 'https://www.clubic.com/feed/', category: 'Tech', logo: '/logos/clubic.png' },

    // Santé et Médecine
    { name: 'Doctissimo', url: 'https://www.doctissimo.fr/rss.xml', category: 'Santé', logo: '/logos/doctissimo.png' },
    { name: 'Top Santé', url: 'https://www.topsante.com/rss.xml', category: 'Santé', logo: '/logos/topsante.png' },
    { name: 'Futura Sciences Santé', url: 'https://www.futura-sciences.com/rss/sante.xml', category: 'Santé', logo: '/logos/futura.png' },
    { name: 'Sciences et Avenir Santé', url: 'https://www.sciencesetavenir.fr/rss/sante.xml', category: 'Santé', logo: '/logos/sciencesetavenir.png' },
    { name: 'Le Figaro Santé', url: 'https://www.lefigaro.fr/rss/figaro_sante.xml', category: 'Santé', logo: '/logos/figaro.png' },
    
    // Sport
    { name: 'L\'Équipe', url: 'https://www.lequipe.fr/rss/actu_rss.xml', category: 'Sport', logo: '/logos/equipe.png' },
    { name: 'RMC Sport', url: 'https://rmcsport.bfmtv.com/rss/', category: 'Sport', logo: '/logos/rmcsport.png' },

    // Culture
    { name: 'Télérama', url: 'https://www.telerama.fr/rss.xml', category: 'Culture', logo: '/logos/telerama.png' },
    { name: 'Les Inrockuptibles', url: 'https://www.lesinrocks.com/rss.xml', category: 'Culture', logo: '/logos/inrocks.png' },

    // Régional et Local
    { name: 'Ouest-France', url: 'https://www.ouest-france.fr/rss-en-continu.xml', category: 'Régional', logo: '/logos/ouestfrance.png' },
    { name: '20 Minutes', url: 'https://www.20minutes.fr/rss-actu.xml', category: 'Actualités', logo: '/logos/20minutes.png' },
    { name: 'Sud Ouest', url: 'https://www.sudouest.fr/rss/', category: 'Régional', logo: '/logos/sudouest.png' },
    { name: 'La Dépêche', url: 'https://www.ladepeche.fr/rss.xml', category: 'Régional', logo: '/logos/ladepeche.png' },
    { name: 'Nice-Matin', url: 'https://www.nicematin.com/rss', category: 'Régional', logo: '/logos/nicematin.png' },
    { name: 'Le Progrès', url: 'https://www.leprogres.fr/rss', category: 'Régional', logo: '/logos/leprogres.png' },
    { name: 'La Voix du Nord', url: 'https://www.lavoixdunord.fr/rss', category: 'Régional', logo: '/logos/voixdunord.png' },
    { name: 'DNA - Dernières Nouvelles d\'Alsace', url: 'https://www.dna.fr/rss/', category: 'Régional', logo: '/logos/dna.png' },
    
    // Médias spécialisés
    { name: 'Mediapart', url: 'https://www.mediapart.fr/articles/feed', category: 'Politique', logo: '/logos/mediapart.png' },
    { name: 'Rue89', url: 'https://www.nouvelobs.com/rue89/rss.xml', category: 'Société', logo: '/logos/rue89.png' },
    { name: 'Alternatives Économiques', url: 'https://www.alternatives-economiques.fr/rss.xml', category: 'Économie', logo: '/logos/alternatives.png' },
    { name: 'Atlantico', url: 'https://atlantico.fr/rss.xml', category: 'Actualités', logo: '/logos/atlantico.png' },
    { name: 'Slate.fr', url: 'https://www.slate.fr/rss.xml', category: 'Actualités', logo: '/logos/slate.png' },
    
    // Tech et Innovation
    { name: 'Numerama', url: 'https://www.numerama.com/feed/', category: 'Tech', logo: '/logos/numerama.png' },
    { name: 'JDN - Journal du Net', url: 'https://www.journaldunet.com/rss/', category: 'Tech', logo: '/logos/jdn.png' },
    { name: 'Frandroid', url: 'https://www.frandroid.com/feed', category: 'Tech', logo: '/logos/frandroid.png' },
    { name: 'ZDNet France', url: 'https://www.zdnet.fr/feeds/rss/', category: 'Tech', logo: '/logos/zdnet.png' },
    { name: 'Presse-citron', url: 'https://www.presse-citron.net/feed/', category: 'Tech', logo: '/logos/pressecitron.png' },
    
    // Sciences et Environnement
    { name: 'Science & Vie', url: 'https://www.science-et-vie.com/rss.xml', category: 'Sciences', logo: '/logos/sciencevie.png' },
    { name: 'La Recherche', url: 'https://www.larecherche.fr/rss.xml', category: 'Sciences', logo: '/logos/larecherche.png' },
    { name: 'Reporterre', url: 'https://reporterre.net/spip.php?page=backend', category: 'Environnement', logo: '/logos/reporterre.png' },
    { name: 'Actu-Environnement', url: 'https://www.actu-environnement.com/ae/rss/news.rss', category: 'Environnement', logo: '/logos/actuenv.png' },
    
    // Sport et Divertissement
    { name: 'Eurosport', url: 'https://www.eurosport.fr/rss.xml', category: 'Sport', logo: '/logos/eurosport.png' },
    { name: 'So Foot', url: 'https://www.sofoot.com/rss.xml', category: 'Sport', logo: '/logos/sofoot.png' },
    { name: 'Première', url: 'https://www.premiere.fr/rss', category: 'Culture', logo: '/logos/premiere.png' },
    { name: 'Les Échos Start', url: 'https://start.lesechos.fr/feed/', category: 'Tech', logo: '/logos/echosstart.png' },
    
    // Société et Lifestyle
    { name: 'Madame Figaro', url: 'https://madame.lefigaro.fr/rss/madame_figaro_une.xml', category: 'Société', logo: '/logos/madamefigaro.png' },
    { name: 'Marie Claire', url: 'https://www.marieclaire.fr/rss.xml', category: 'Société', logo: '/logos/marieclaire.png' },
    { name: 'L\'Internaute', url: 'https://www.linternaute.com/rss/une.xml', category: 'Actualités', logo: '/logos/internaute.png' },
  ];

  constructor() {
    this.parser = new Parser({
      customFields: {
        item: ['description', 'pubDate', 'category', 'enclosure', 'media:content']
      }
    });
    this.articlesDir = path.join(process.cwd(), 'data');
    this.ensureDataDir();
  }

  private async ensureDataDir() {
    if (!existsSync(this.articlesDir)) {
      await mkdir(this.articlesDir, { recursive: true });
    }
  }

  private cleanText(text: string): string {
    if (!text) return '';
    const $ = cheerio.load(text);
    return $.text().replace(/\s+/g, ' ').trim();
  }

  private extractImage(item: any, sourceName?: string): string {
    // Essaie plusieurs sources d'images selon le standard RSS
    if (item.enclosure?.url && this.isImageUrl(item.enclosure.url)) {
      return item.enclosure.url;
    }
    
    if (item['media:content']?.$?.url && this.isImageUrl(item['media:content'].$.url)) {
      return item['media:content'].$.url;
    }

    // Essaie media:thumbnail
    if (item['media:thumbnail']?.$?.url) {
      return item['media:thumbnail'].$.url;
    }

    // Parse le contenu HTML pour trouver des images
    const content = item.content || item.description || item['content:encoded'] || '';
    if (content) {
      const $ = cheerio.load(content);
      
      // Stratégies spécifiques par source
      let imageUrl = this.extractImageBySource($, sourceName || '');
      if (imageUrl) return imageUrl;
      
      // Cherche toutes les balises img et sélectionne la première image de grande taille
      const images = $('img').toArray();
      for (const imgEl of images) {
        const img = $(imgEl);
        let src = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src');
        
        // Résout les URLs relatives
        if (src && src.startsWith('//')) {
          src = 'https:' + src;
        } else if (src && src.startsWith('/') && sourceName) {
          const domain = this.getDomainFromSource(sourceName);
          if (domain) src = domain + src;
        }
        
        if (src && this.isValidImageUrl(src)) {
          const width = parseInt(img.attr('width') || '0', 10);
          const height = parseInt(img.attr('height') || '0', 10);
          
          // Évite les petites images (logos, icônes)
          if (this.isLargeImage(src, width, height)) {
            return src;
          }
        }
      }
      
      // Si aucune grande image, prend la première disponible qui n'est pas un logo
      for (const imgEl of images) {
        const img = $(imgEl);
        let src = img.attr('src') || img.attr('data-src');
        if (src && this.isValidImageUrl(src) && !this.isLikelyLogo(src)) {
          if (src.startsWith('//')) src = 'https:' + src;
          return src;
        }
      }
    }

    // Fallback sur l'image par défaut
    return '/images/default-article.svg';
  }

  private extractImageBySource($: any, sourceName: string): string | null {
    const lowerSource = sourceName.toLowerCase();
    
    // Le Monde - cherche dans les divs spécifiques
    if (lowerSource.includes('monde')) {
      const img = $('.article-image img, .article__media img, .fig__media img').first().attr('src');
      if (img) return this.normalizeImageUrl(img);
    }
    
    // Le Figaro
    if (lowerSource.includes('figaro')) {
      const img = $('.fig-media img, .article-media img').first().attr('src');
      if (img) return this.normalizeImageUrl(img);
    }
    
    // Libération
    if (lowerSource.includes('libération') || lowerSource.includes('liberation')) {
      const img = $('.article-image img, .media img').first().attr('src');
      if (img) return this.normalizeImageUrl(img);
    }
    
    return null;
  }

  private normalizeImageUrl(url: string): string {
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) return url; // Sera traité par getDomainFromSource
    return url;
  }

  private getDomainFromSource(sourceName: string): string | null {
    const domains: { [key: string]: string } = {
      'le monde': 'https://www.lemonde.fr',
      'le figaro': 'https://www.lefigaro.fr',
      'libération': 'https://www.liberation.fr',
      'l\'express': 'https://www.lexpress.fr',
      'ouest-france': 'https://www.ouest-france.fr',
      'futura sciences': 'https://www.futura-sciences.com',
      '20 minutes': 'https://www.20minutes.fr',
      'sud ouest': 'https://www.sudouest.fr',
      'la dépêche': 'https://www.ladepeche.fr',
      'nice-matin': 'https://www.nicematin.com',
      'le progrès': 'https://www.leprogres.fr',
      'la voix du nord': 'https://www.lavoixdunord.fr',
      'dna': 'https://www.dna.fr',
      'mediapart': 'https://www.mediapart.fr',
      'slate.fr': 'https://www.slate.fr',
      'numerama': 'https://www.numerama.com',
      'frandroid': 'https://www.frandroid.com',
      'zdnet france': 'https://www.zdnet.fr',
      'presse-citron': 'https://www.presse-citron.net',
      'reporterre': 'https://reporterre.net',
      'actu-environnement': 'https://www.actu-environnement.com',
      'eurosport': 'https://www.eurosport.fr',
      'so foot': 'https://www.sofoot.com',
      'première': 'https://www.premiere.fr',
      'marie claire': 'https://www.marieclaire.fr',
      'l\'internaute': 'https://www.linternaute.com'
    };
    
    return domains[sourceName.toLowerCase()] || null;
  }

  private isValidImageUrl(url: string): boolean {
    return url.startsWith('http') && this.isImageUrl(url);
  }

  private isLargeImage(src: string, width: number, height: number): boolean {
    // Si pas de dimensions spécifiées, assume que c'est une grande image
    if (width === 0 && height === 0) return true;
    
    // Vérifie les dimensions minimales
    return width > 200 && height > 150;
  }

  private isLikelyLogo(src: string): boolean {
    const logoPatterns = ['/logo', 'logo.', 'avatar', 'icon', 'favicon', 'badge'];
    return logoPatterns.some(pattern => src.toLowerCase().includes(pattern));
  }

  private isImageUrl(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url);
  }

  private categorizeArticle(title: string, content: string, sourceCategory: string): string {
    const text = (title + ' ' + content).toLowerCase();
    
    // Catégories avec mots-clés français
    const categories = {
      'Politique': ['politique', 'président', 'gouvernement', 'ministre', 'macron', 'élection', 'assemblée', 'sénat', 'loi', 'député', 'vote', 'maire', 'conseil', 'municipal'],
      'Économie': ['économie', 'business', 'finance', 'euro', 'bourse', 'entreprise', 'industrie', 'commerce', 'marché', 'inflation', 'croissance', 'startup', 'emploi', 'chômage', 'salaire', 'banque', 'investissement'],
      'International': ['international', 'monde', 'europe', 'ukraine', 'russie', 'chine', 'usa', 'guerre', 'conflit', 'diplomatie', 'brexit', 'otan', 'onu'],
      'Tech': ['technologie', 'intelligence artificielle', 'ia', 'numérique', 'internet', 'google', 'meta', 'apple', 'microsoft', 'startup', 'android', 'iphone', 'app', 'logiciel', 'cyber', 'data', 'blockchain', 'crypto'],
      'Santé': ['santé', 'médecine', 'hôpital', 'médecin', 'maladie', 'covid', 'vaccin', 'virus', 'traitement', 'médicament', 'chirurgie', 'patient', 'infirmier', 'clinique', 'thérapie', 'diagnostic', 'symptôme', 'épidémie', 'prévention', 'nutrition', 'alimentation', 'bien-être', 'mental', 'psychiatrie', 'cancer', 'diabète', 'cardiologie', 'neurologie', 'pédiatrie', 'gériatrie', 'urgences', 'soins'],
      'Sciences': ['science', 'recherche', 'découverte', 'étude', 'espace', 'nasa', 'astronomie', 'physique', 'chimie', 'biologie', 'mathématiques', 'laboratoire', 'scientifique'],
      'Environnement': ['climat', 'environnement', 'écologie', 'carbone', 'pollution', 'biodiversité', 'réchauffement', 'cop', 'énergie', 'renouvelable', 'solaire', 'éolien', 'nucléaire', 'déchets', 'recyclage', 'nature', 'forêt'],
      'Culture': ['culture', 'cinéma', 'film', 'livre', 'musique', 'théâtre', 'art', 'festival', 'exposition', 'concert', 'spectacle', 'littérature', 'acteur', 'réalisateur', 'oscar', 'cannes'],
      'Sport': ['sport', 'football', 'rugby', 'tennis', 'jeux olympiques', 'champion', 'match', 'psg', 'ligue 1', 'basketball', 'handball', 'cyclisme', 'tour de france', 'euro', 'coupe du monde', 'athlétisme'],
      'Société': ['société', 'social', 'éducation', 'école', 'université', 'famille', 'jeunes', 'retraite', 'femme', 'égalité', 'discrimination', 'immigration', 'logement', 'transport'],
      'Régional': ['région', 'local', 'ville', 'département', 'commune', 'municipal', 'territorial']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }

    return sourceCategory || 'Actualités';
  }

  private generateTags(title: string, content: string, category: string): string[] {
    const text = (title + ' ' + content).toLowerCase();
    const tags: string[] = [];
    
    // Ajoute la catégorie
    tags.push(category.toLowerCase());

    // Mots-clés populaires
    const tagKeywords = {
      'france': 'france',
      'paris': 'paris',
      'europe': 'europe',
      'climat': 'climat',
      'macron': 'macron',
      'intelligence artificielle': 'ia',
      'covid': 'covid',
      'ukraine': 'ukraine',
      'économie': 'économie',
      'santé': 'santé',
      'médecine': 'médecine',
      'hôpital': 'hôpital',
      'vaccin': 'vaccin',
      'cancer': 'cancer',
      'mental': 'santé-mentale',
      'nutrition': 'nutrition',
      'chirurgie': 'chirurgie',
      'patient': 'patient',
      'environnement': 'environnement',
      'écologie': 'écologie',
      'pollution': 'pollution',
      'biodiversité': 'biodiversité',
      'réchauffement': 'réchauffement',
      'énergie': 'énergie',
      'renouvelable': 'renouvelable',
      'crypto': 'cryptomonnaie',
      'blockchain': 'blockchain',
      'startup': 'startup',
      'innovation': 'innovation',
      'cinéma': 'cinéma',
      'festival': 'festival',
      'sport': 'sport',
      'football': 'football',
      'régional': 'régional',
      'local': 'local'
    };

    for (const [keyword, tag] of Object.entries(tagKeywords)) {
      if (text.includes(keyword) && !tags.includes(tag)) {
        tags.push(tag);
      }
    }

    return tags.slice(0, 6);
  }

  private calculateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  private determineSentiment(title: string, content: string): 'positive' | 'negative' | 'neutral' {
    const text = (title + ' ' + content).toLowerCase();
    
    const positiveWords = ['succès', 'victoire', 'amélioration', 'croissance', 'innovation', 'record', 'réussite'];
    const negativeWords = ['crise', 'échec', 'problème', 'guerre', 'accident', 'mort', 'violence', 'chute'];
    
    const positiveScore = positiveWords.filter(word => text.includes(word)).length;
    const negativeScore = negativeWords.filter(word => text.includes(word)).length;
    
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  private async isDuplicate(title: string, existingArticles: Article[]): Promise<boolean> {
    const cleanTitle = this.cleanText(title).toLowerCase();
    
    return existingArticles.some(article => {
      const existingTitle = this.cleanText(article.title).toLowerCase();
      const similarity = this.calculateSimilarity(cleanTitle, existingTitle);
      return similarity > 0.8;
    });
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  public async collectNews(): Promise<{ newArticles: number; totalArticles: number; articles: Article[] }> {
    console.log('🚀 Début de la collecte d\'actualités françaises...');
    const allArticles: Article[] = [];
    let currentId = Date.now();

    // Charge les articles existants
    let existingArticles: Article[] = [];
    try {
      const existingData = await readFile(path.join(this.articlesDir, 'articles.json'), 'utf8');
      existingArticles = JSON.parse(existingData);
    } catch (error) {
      console.log('📝 Création d\'un nouveau fichier d\'articles...');
    }

    // Collecte depuis chaque source
    for (const source of this.sources) {
      try {
        console.log(`📰 Collecte depuis ${source.name}...`);
        
        const feed = await this.parser.parseURL(source.url);
        const latestItems = feed.items.slice(0, 8); // Plus d'articles par source

        for (const item of latestItems) {
          const title = this.cleanText(item.title || '');
          if (!title) continue;

          // Vérifie les doublons
          if (await this.isDuplicate(title, [...existingArticles, ...allArticles])) {
            continue;
          }

          const content = this.cleanText(item.contentSnippet || item.content || item.description || '');
          const category = this.categorizeArticle(title, content, source.category);
          const tags = this.generateTags(title, content, category);
          
          const article: Article = {
            id: `${currentId++}`,
            title,
            summary: content.substring(0, 300) + (content.length > 300 ? '...' : ''),
            content: content || 'Contenu indisponible',
            author: source.name,
            publishDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            category,
            imageUrl: this.extractImage(item, source.name),
            tags,
            sourceUrl: item.link || '',
            source: source.name,
            isHot: true,
            sentiment: this.determineSentiment(title, content),
            readTime: this.calculateReadTime(content)
          };

          allArticles.push(article);
        }
      } catch (error) {
        console.error(`❌ Erreur lors de la collecte depuis ${source.name}:`, error);
      }
    }

    // Trie par date
    allArticles.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
    
    // Combine avec les articles existants (limite à 1000 articles)
    const updatedArticles = [...allArticles, ...existingArticles].slice(0, 1000);
    
    // Sauvegarde
    await writeFile(
      path.join(this.articlesDir, 'articles.json'),
      JSON.stringify(updatedArticles, null, 2),
      'utf8'
    );

    console.log(`✅ Collecte terminée : ${allArticles.length} nouveaux articles, ${updatedArticles.length} total`);
    
    return {
      newArticles: allArticles.length,
      totalArticles: updatedArticles.length,
      articles: updatedArticles
    };
  }

  public async getArticles(): Promise<Article[]> {
    try {
      const data = await readFile(path.join(this.articlesDir, 'articles.json'), 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  public async getHotNews(limit: number = 20): Promise<Article[]> {
    const articles = await this.getArticles();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return articles
      .filter(article => article.isHot || new Date(article.publishDate) > oneDayAgo)
      .slice(0, limit);
  }

  public async getArticlesByCategory(category: string): Promise<Article[]> {
    const articles = await this.getArticles();
    return articles.filter(article => 
      article.category.toLowerCase() === category.toLowerCase()
    );
  }
}
