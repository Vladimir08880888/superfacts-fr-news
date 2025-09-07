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
  
  // Sources d'actualités françaises vérifiées et fonctionnelles
  private sources: NewsSource[] = [
    // Médias généralistes - Sources fiables et testées
    { name: 'Le Monde', url: 'https://www.lemonde.fr/rss/une.xml', category: 'Actualités', logo: '/logos/lemonde.png' },
    { name: 'Le Figaro', url: 'https://www.lefigaro.fr/rss/figaro_actualites.xml', category: 'Actualités', logo: '/logos/figaro.png' },
    { name: 'Libération', url: 'https://www.liberation.fr/arc/outboundfeeds/rss/?outputType=xml', category: 'Actualités', logo: '/logos/liberation.png' },
    { name: 'France 24', url: 'https://www.france24.com/fr/rss', category: 'Actualités', logo: '/logos/france24.png' },
    { name: 'France Info', url: 'https://www.francetvinfo.fr/titres.rss', category: 'Actualités', logo: '/logos/franceinfo.png' },
    { name: 'L\'Express', url: 'https://www.lexpress.fr/rss/unes.xml', category: 'Actualités', logo: '/logos/express.png' },
    { name: 'Marianne', url: 'https://www.marianne.net/rss.xml', category: 'Actualités', logo: '/logos/marianne.png' },
    { name: 'L\'Obs', url: 'https://www.nouvelobs.com/rss.xml', category: 'Actualités', logo: '/logos/obs.png' },
    { name: 'Atlantico', url: 'https://atlantico.fr/rss.xml', category: 'Actualités', logo: '/logos/atlantico.png' },
    { name: 'Slate.fr', url: 'https://www.slate.fr/rss.xml', category: 'Actualités', logo: '/logos/slate.png' },

    // Économie et Business
    { name: 'Challenges', url: 'https://www.challenges.fr/rss.xml', category: 'Économie', logo: '/logos/challenges.png' },
    { name: 'Alternatives Économiques', url: 'https://www.alternatives-economiques.fr/rss.xml', category: 'Économie', logo: '/logos/alternatives.png' },

    // Tech et Innovation
    { name: 'Numerama', url: 'https://www.numerama.com/feed/', category: 'Tech', logo: '/logos/numerama.png' },
    { name: 'JDN - Journal du Net', url: 'https://www.journaldunet.com/rss/', category: 'Tech', logo: '/logos/jdn.png' },
    { name: 'Frandroid', url: 'https://www.frandroid.com/feed', category: 'Tech', logo: '/logos/frandroid.png' },
    { name: 'ZDNet France', url: 'https://www.zdnet.fr/feeds/rss/', category: 'Tech', logo: '/logos/zdnet.png' },
    { name: 'Presse-citron', url: 'https://www.presse-citron.net/feed/', category: 'Tech', logo: '/logos/pressecitron.png' },

    // Sciences
    { name: 'Futura Sciences', url: 'https://www.futura-sciences.com/rss/actualites.xml', category: 'Sciences', logo: '/logos/futura.png' },
    { name: 'Sciences et Avenir', url: 'https://www.sciencesetavenir.fr/rss.xml', category: 'Sciences', logo: '/logos/sciencesetavenir.png' },

    // Santé
    { name: 'Le Figaro Santé', url: 'https://www.lefigaro.fr/rss/figaro_sante.xml', category: 'Santé', logo: '/logos/figaro.png' },
    
    // Régional et Local
    { name: 'Ouest-France', url: 'https://www.ouest-france.fr/rss-en-continu.xml', category: 'Régional', logo: '/logos/ouestfrance.png' },
    { name: 'La Dépêche', url: 'https://www.ladepeche.fr/rss.xml', category: 'Régional', logo: '/logos/ladepeche.png' },
    { name: 'Nice-Matin', url: 'https://www.nicematin.com/rss', category: 'Régional', logo: '/logos/nicematin.png' },
    { name: 'Le Progrès', url: 'https://www.leprogres.fr/rss', category: 'Régional', logo: '/logos/leprogres.png' },
    
    // Médias spécialisés
    { name: 'Mediapart', url: 'https://www.mediapart.fr/articles/feed', category: 'Politique', logo: '/logos/mediapart.png' },
    { name: 'Rue89', url: 'https://www.nouvelobs.com/rue89/rss.xml', category: 'Société', logo: '/logos/rue89.png' },
    
    // Environnement
    { name: 'Reporterre', url: 'https://reporterre.net/spip.php?page=backend', category: 'Environnement', logo: '/logos/reporterre.png' },
  ];

  // Sources avec problèmes temporaires - à réessayer périodiquement
  private problematicSources: NewsSource[] = [
    // Sources avec erreurs 403 - peuvent revenir
    { name: 'Les Échos', url: 'https://www.lesechos.fr/rss.xml', category: 'Économie', logo: '/logos/echos.png' },
    { name: '20 Minutes', url: 'https://www.20minutes.fr/rss-actu.xml', category: 'Actualités', logo: '/logos/20minutes.png' },
    { name: 'La Voix du Nord', url: 'https://www.lavoixdunord.fr/rss', category: 'Régional', logo: '/logos/voixdunord.png' },
    { name: 'Les Échos Start', url: 'https://start.lesechos.fr/feed/', category: 'Tech', logo: '/logos/echosstart.png' },
    
    // Sources avec problèmes de parsing - nécessitent investigation
    { name: 'Capital', url: 'https://www.capital.fr/rss', category: 'Économie', logo: '/logos/capital.png' },
    // RMC Sport, Sud Ouest, Science & Vie, Première nécessitent des URLs alternatives
  ];

  constructor() {
    this.parser = new Parser({
      customFields: {
        item: ['description', 'pubDate', 'category', 'enclosure', 'media:content']
      },
      timeout: 10000, // 10 seconds timeout
      maxRedirects: 3,  // Limit redirects
      headers: {
        'User-Agent': 'SuperFacts.fr RSS Reader 1.0 (https://superfacts.fr)'
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

  private categorizeArticle(title: string, content: string, sourceCategory: string, sourceUrl?: string): string {
    const text = (title + ' ' + content).toLowerCase();
    const url = sourceUrl ? sourceUrl.toLowerCase() : '';
    
    // 1. Vérification par URL d'abord (priorité absolue)
    const urlCategory = this.getCategoryFromUrl(url);
    if (urlCategory) return urlCategory;
    
    // 2. Règles d'exclusion et de contexte spécifique
    const contextCategory = this.getContextualCategory(text, title.toLowerCase());
    if (contextCategory) return contextCategory;
    
    // 3. Catégories avec mots-clés organisés par spécificité et poids
    const categoryKeywords = this.getCategoryKeywords();
    
    // 4. Système de scoring avancé
    const categoryScores = this.calculateCategoryScores(text, categoryKeywords);
    
    // 5. Application des règles de priorité et validation
    const finalCategory = this.selectBestCategory(categoryScores, text, sourceCategory);
    
    return finalCategory || sourceCategory || 'Actualités';
  }
  
  private getCategoryFromUrl(url: string): string | null {
    if (!url) return null;
    
    const urlPatterns = {
      'Sport': ['/sport/', '/sports/', '/football/', '/rugby/', '/basket/', '/tennis/', '/cyclisme/', '/atletisme/', '/natation/'],
      'International': ['/international/', '/monde/', '/europe/', '/etranger/', '/geopolitique/'],
      'Politique': ['/politique/', '/gouvernement/', '/election/', '/assemblee/'],
      'Économie': ['/economie/', '/business/', '/bourse/', '/entreprise/', '/finance/', '/immobilier/'],
      'Santé': ['/sante/', '/health/', '/medical/', '/hopital/'],
      'Tech': ['/tech/', '/technologie/', '/numerique/', '/informatique/', '/intelligence-artificielle/', '/cyber/'],
      'Culture': ['/culture/', '/cinema/', '/theatre/', '/musique/', '/spectacle/', '/livre/'],
      'Sciences': ['/science/', '/recherche/', '/espace/', '/astronomie/'],
      'Environnement': ['/environnement/', '/climat/', '/ecologie/', '/nature/'],
      'Société': ['/societe/', '/education/', '/social/', '/famille/'],
      'Régional': ['/regional/', '/local/', '/ville/', '/departement/', '/commune/']
    };
    
    for (const [category, patterns] of Object.entries(urlPatterns)) {
      if (patterns.some(pattern => url.includes(pattern))) {
        return category;
      }
    }
    
    return null;
  }
  
  private getContextualCategory(text: string, title: string): string | null {
    // Règles d'exclusion et de contexte spécifique pour éviter les faux positifs
    
    // Géopolitique/International vs Régional
    if (this.isInternationalContext(text, title)) {
      return 'International';
    }
    
    // Économie vs autres catégories
    if (this.isEconomicContext(text, title)) {
      return 'Économie';
    }
    
    // Tech vs Économie (pour les entreprises tech)
    if (this.isTechContext(text, title)) {
      return 'Tech';
    }
    
    // Sport vs autres (éviter les faux positifs)
    if (this.isSportContext(text, title)) {
      return 'Sport';
    }
    
    return null;
  }
  
  private isInternationalContext(text: string, title: string): boolean {
    const internationalIndicators = [
      // Conflits et géopolitique
      ['ukraine', 'russie'], ['gaza', 'israël'], ['chine', 'taiwan'],
      // Événements internationaux
      ['bombardement', 'frappe'], ['guerre', 'conflit'], ['diplomatie', 'ambassade'],
      // Pays étrangers dans un contexte d'actualité
      ['états-unis', 'washington'], ['londres', 'brexit'], ['berlin', 'allemagne']
    ];
    
    const hasInternationalKeywords = internationalIndicators.some(indicators => 
      indicators.every(indicator => text.includes(indicator))
    );
    
    // Pays/villes étrangers mentionnés
    const foreignCountries = ['ukraine', 'russie', 'chine', 'usa', 'états-unis', 'allemagne', 'italie', 'espagne', 'royaume-uni', 'argentine', 'brésil'];
    const hasForeignCountry = foreignCountries.some(country => text.includes(country));
    
    // Exclusions: si c'est du tourisme français à l'étranger, c'est plutôt économie/société
    const isTourismContext = text.includes('tourisme') || text.includes('voyage') || text.includes('vacances');
    
    return (hasInternationalKeywords || hasForeignCountry) && !isTourismContext;
  }
  
  private isEconomicContext(text: string, title: string): boolean {
    const economicPatterns = [
      // Commerce et entreprises
      ['baguette', 'boulanger'], ['commerce', 'concurrence'], ['startup', 'entreprise'],
      // Automobile et industrie
      ['voiture', 'automobile'], ['tesla', 'électrique'], ['stellantis', 'industrie'],
      // Finance et marché
      ['bourse', 'marché'], ['prix', 'inflation'], ['salaire', 'emploi']
    ];
    
    return economicPatterns.some(pattern => 
      pattern.every(keyword => text.includes(keyword))
    ) || text.includes('guerre de la baguette');
  }
  
  private isTechContext(text: string, title: string): boolean {
    const techPatterns = [
      // IA et technologie avancée
      ['intelligence artificielle', 'ia'], ['algorithme', 'data'], ['blockchain', 'crypto'],
      // Entreprises tech
      ['google', 'tech'], ['meta', 'facebook'], ['apple', 'iphone'], ['microsoft', 'logiciel'],
      // Cybersécurité (priorité haute)
      ['cyber', 'piratage'], ['hacking', 'sécurité'], ['malware', 'virus']
    ];
    
    // Intel est clairement tech
    if (text.includes('intel') && (text.includes('chip') || text.includes('processeur') || text.includes('informatique'))) {
      return true;
    }
    
    return techPatterns.some(pattern => 
      pattern.every(keyword => text.includes(keyword))
    );
  }
  
  private isSportContext(text: string, title: string): boolean {
    // Validation stricte pour éviter les faux positifs
    const sportsKeywords = ['sport', 'match', 'équipe', 'joueur', 'championnat', 'compétition', 'victoire', 'défaite'];
    const specificSports = ['tennis', 'football', 'rugby', 'basketball', 'cyclisme', 'natation', 'athlétisme'];
    
    const hasGeneralSport = sportsKeywords.some(keyword => text.includes(keyword));
    const hasSpecificSport = specificSports.some(sport => text.includes(sport));
    
    // Exclusions: si c'est de l'économie du sport ou de la politique du sport
    const isBusinessContext = text.includes('marché') || text.includes('sponsoring') || text.includes('contrat');
    
    return hasSpecificSport || (hasGeneralSport && !isBusinessContext);
  }
  
  private getCategoryKeywords() {
    return {
      'International': {
        high: ['ukraine', 'russie', 'gaza', 'palestine', 'israël', 'chine', 'états-unis', 'guerre', 'conflit armé', 'diplomatie', 'otan', 'onu'],
        medium: ['europe', 'monde', 'international', 'étranger', 'ambassade', 'visa', 'immigration'],
        low: ['londres', 'berlin', 'madrid', 'washington', 'moscou']
      },
      'Sport': {
        high: ['tennis', 'football', 'rugby', 'basketball', 'cyclisme', 'natation', 'athlétisme', 'jeux olympiques', 'paralympiques'],
        medium: ['sport', 'championnat', 'compétition', 'match', 'équipe', 'finale', 'champion'],
        low: ['joueur', 'entraîneur', 'club', 'victoire', 'performance']
      },
      'Économie': {
        high: ['économie', 'business', 'finance', 'bourse', 'entreprise', 'industrie', 'commerce'],
        medium: ['marché', 'inflation', 'croissance', 'emploi', 'investissement', 'startup'],
        low: ['prix', 'budget', 'salaire', 'chômage']
      },
      'Tech': {
        high: ['intelligence artificielle', 'cybersécurité', 'blockchain', 'algorithme', 'cybercriminels', 'piratage'],
        medium: ['technologie', 'numérique', 'informatique', 'logiciel', 'ia'],
        low: ['tech', 'digital', 'internet', 'app']
      },
      'Politique': {
        high: ['politique', 'président', 'gouvernement', 'ministre', 'élection', 'assemblée'],
        medium: ['député', 'sénat', 'vote', 'parti', 'candidat'],
        low: ['maire', 'conseil', 'municipal']
      },
      'Santé': {
        high: ['santé', 'médecine', 'hôpital', 'médecin', 'covid', 'vaccin', 'virus'],
        medium: ['maladie', 'traitement', 'patient', 'chirurgie', 'thérapie'],
        low: ['symptôme', 'prévention', 'nutrition']
      },
      'Sciences': {
        high: ['science', 'recherche', 'découverte', 'espace', 'nasa', 'astronomie'],
        medium: ['physique', 'chimie', 'biologie', 'laboratoire'],
        low: ['étude', 'scientifique']
      },
      'Environnement': {
        high: ['climat', 'environnement', 'écologie', 'réchauffement', 'cop'],
        medium: ['pollution', 'biodiversité', 'énergie', 'renouvelable'],
        low: ['nature', 'conservation']
      },
      'Culture': {
        high: ['cinéma', 'festival', 'théâtre', 'musique', 'art'],
        medium: ['film', 'concert', 'spectacle', 'exposition'],
        low: ['culture', 'littérature']
      },
      'Société': {
        high: ['éducation', 'école', 'université', 'famille'],
        medium: ['société', 'social', 'jeunes', 'retraite'],
        low: ['logement', 'transport']
      },
      'Régional': {
        high: ['région', 'département', 'commune'],
        medium: ['local', 'ville', 'municipal'],
        low: ['territorial']
      }
    };
  }
  
  private calculateCategoryScores(text: string, categoryKeywords: any): { [key: string]: number } {
    const scores: { [key: string]: number } = {};
    
    for (const [category, levels] of Object.entries(categoryKeywords)) {
      scores[category] = 0;
      
      // Mots-clés haute priorité (score x3)
      for (const keyword of (levels as any).high) {
        if (text.includes(keyword)) {
          scores[category] += 3 * (keyword.length > 8 ? 2 : 1);
        }
      }
      
      // Mots-clés moyenne priorité (score x2)
      for (const keyword of (levels as any).medium) {
        if (text.includes(keyword)) {
          scores[category] += 2 * (keyword.length > 6 ? 1.5 : 1);
        }
      }
      
      // Mots-clés basse priorité (score x1)
      for (const keyword of (levels as any).low) {
        if (text.includes(keyword)) {
          scores[category] += 1;
        }
      }
    }
    
    return scores;
  }
  
  private selectBestCategory(categoryScores: { [key: string]: number }, text: string, sourceCategory: string): string | null {
    // Trouve les meilleures catégories
    const sortedCategories = Object.entries(categoryScores)
      .filter(([_, score]) => score > 0)
      .sort(([_, a], [__, b]) => b - a);
    
    if (sortedCategories.length === 0) return null;
    
    const [bestCategory, bestScore] = sortedCategories[0];
    const [secondCategory, secondScore] = sortedCategories[1] || ['', 0];
    
    // Si le score est très proche, utilise des règles de priorité
    if (secondScore > 0 && (bestScore - secondScore) <= 1) {
      return this.resolveCategoryConflict(bestCategory, secondCategory, text);
    }
    
    // Validation finale: évite les catégories inappropriées
    if (this.shouldRejectCategory(bestCategory, text)) {
      return secondCategory && secondScore > 2 ? secondCategory : null;
    }
    
    return bestScore >= 2 ? bestCategory : null;
  }
  
  private resolveCategoryConflict(cat1: string, cat2: string, text: string): string {
    // Règles de priorité en cas de conflit
    const priorityRules = [
      // International > Régional
      { higher: 'International', lower: 'Régional' },
      // Tech > Économie (pour les entreprises tech)
      { higher: 'Tech', lower: 'Économie' },
      // Sport > autres (si contexte sportif clair)
      { higher: 'Sport', lower: 'Économie' }
    ];
    
    for (const rule of priorityRules) {
      if ((cat1 === rule.higher && cat2 === rule.lower) || (cat1 === rule.lower && cat2 === rule.higher)) {
        return rule.higher;
      }
    }
    
    return cat1; // Par défaut, garde la première
  }
  
  private shouldRejectCategory(category: string, text: string): boolean {
    // Règles de rejet pour éviter les faux positifs
    if (category === 'Régional' && (text.includes('ukraine') || text.includes('gaza') || text.includes('russie'))) {
      return true;
    }
    
    if (category === 'Sport' && !this.isSportContext(text, '')) {
      return true;
    }
    
    return false;
  }

  private generateTags(title: string, content: string, category: string): string[] {
    const text = (title + ' ' + content).toLowerCase();
    const tags: string[] = [];
    
    // Ajoute la catégorie
    tags.push(category.toLowerCase());

    // Mots-clés populaires avec plus de contexte et validation contextuelle
    const tagKeywords = {
      // Lieux
      'france': 'france',
      'paris': 'paris',
      'europe': 'europe',
      'gaza': 'gaza',
      'palestine': 'palestine',
      'ukraine': 'ukraine',
      'londres': 'londres',
      'argentine': 'argentine',
      'turquie': 'turquie',
      'espagne': 'espagne',
      'géorgie': 'géorgie',
      'afrique du sud': 'afrique-du-sud',
      'suisse': 'suisse',
      
      // Politique
      'macron': 'macron',
      'le pen': 'le-pen',
      'bayrou': 'bayrou',
      'gouvernement': 'gouvernement',
      
      // Sports spécifiques (avec validation contextuelle)
      'tennis': 'tennis',
      'us open': 'us-open',
      'sabalenka': 'sabalenka',
      'football': 'football',
      'handball': 'handball',
      'basketball': 'basketball',
      'basket': 'basketball',
      'eurobasket': 'eurobasket',
      'rugby': 'rugby',
      'cyclisme': 'cyclisme',
      'vtt': 'vtt',
      'descente': 'descente',
      'champion': 'champion',
      'finale': 'finale',
      'mondial': 'mondial',
      'coupe du monde': 'coupe-du-monde',
      'qualification': 'qualification',
      'quart de finale': 'quart-de-finale',
      'demi-finale': 'demi-finale',
      'championnat': 'championnat',
      'match': 'match',
      'compétition': 'compétition',
      'xv de france': 'xv-de-france',
      
      // Combat sports (seulement si contexte approprié)
      'ufc': 'ufc',
      'boxe': 'boxe',
      
      // Santé
      'santé': 'santé',
      'médecine': 'médecine',
      'hôpital': 'hôpital',
      'vaccin': 'vaccin',
      'cancer': 'cancer',
      'mental': 'santé-mentale',
      'nutrition': 'nutrition',
      'chirurgie': 'chirurgie',
      'patient': 'patient',
      'dermatose': 'maladie-animale',
      'bovine': 'élevage',
      
      // Environnement
      'climat': 'climat',
      'environnement': 'environnement',
      'écologie': 'écologie',
      'pollution': 'pollution',
      'biodiversité': 'biodiversité',
      'réchauffement': 'réchauffement',
      'énergie': 'énergie',
      'renouvelable': 'renouvelable',
      'rhinocéros': 'conservation',
      
      // Tech
      'intelligence artificielle': 'ia',
      'crypto': 'cryptomonnaie',
      'blockchain': 'blockchain',
      'google': 'google',
      'pixel': 'smartphone',
      'caméra': 'photographie',
      
      // Économie
      'économie': 'économie',
      'stellantis': 'automobile',
      'voiture': 'automobile',
      'électrique': 'véhicule-électrique',
      'boulangerie': 'commerce',
      'concurrence': 'business',
      'artisan': 'artisanat',
      
      // Culture
      'cinéma': 'cinéma',
      'festival': 'festival',
      'venise': 'festival-venise',
      'jarmusch': 'réalisateur',
      'lion d\'or': 'prix-cinéma',
      'orchestre': 'musique-classique',
      
      // Société
      'prostitution': 'protection-enfance',
      'mineurs': 'enfance',
      'éducation': 'éducation',
      'parents': 'famille',
      'coéducation': 'école',
      
      // Autres
      'startup': 'startup',
      'innovation': 'innovation',
      'régional': 'régional',
      'local': 'local',
      'covid': 'covid'
    };

    // Logique de validation contextuelle pour éviter les tags inappropriés
    for (const [keyword, tag] of Object.entries(tagKeywords)) {
      if (text.includes(keyword) && !tags.includes(tag)) {
        // Validation spéciale pour MMA et combat sports
        if ((keyword === 'mma' || keyword === 'combat') && !this.isSportsRelated(text)) {
          continue;
        }
        
        // Validation pour les sports en général
        if (['champion', 'finale', 'match', 'championnat', 'compétition', 'qualification'].includes(tag) && 
            category !== 'Sport' && 
            !this.isSportsRelated(text)) {
          continue;
        }
        
        // Validation spécifique pour les sports
        if (['football', 'basketball', 'rugby', 'tennis', 'cyclisme', 'vtt'].includes(tag) && 
            category !== 'Sport') {
          continue;
        }
        
        // Validation pour les compétitions internationales
        if (['mondial', 'coupe-du-monde', 'eurobasket'].includes(tag) && 
            !this.isSportsRelated(text)) {
          continue;
        }
        
        tags.push(tag);
      }
    }

    return tags.slice(0, 8);
  }

  // Méthode helper pour valider le contexte sportif (mise à jour)
  private isSportsRelated(text: string): boolean {
    const sportsIndicators = [
      'sport', 'match', 'équipe', 'joueur', 'entraîneur', 'club', 'stade', 'terrain',
      'victoire', 'défaite', 'performance', 'championnat', 'tournoi', 'finale',
      'compétition', 'adversaire', 'score', 'résultat'
    ];
    
    const specificSports = ['tennis', 'football', 'rugby', 'basketball', 'cyclisme', 'natation', 'athlétisme', 'jeux olympiques'];
    
    return sportsIndicators.some(indicator => text.includes(indicator)) || 
           specificSports.some(sport => text.includes(sport));
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

  private categorizeError(error: any): string {
    if (error.code === 'ENOTFOUND' || error.code === 'EAI_FAIL') {
      return 'Domain not found';
    }
    if (error.code === 'ECONNREFUSED') {
      return 'Connection refused';
    }
    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      return 'Request timeout';
    }
    if (error.response?.status) {
      return `Status code ${error.response.status}`;
    }
    if (error.message?.includes('redirect')) {
      return 'Too many redirects';
    }
    if (error.message?.includes('Unexpected close tag') || error.message?.includes('Column:')) {
      return error.message.split('\n')[0]; // First line only for parsing errors
    }
    return error.message || 'Unknown error';
  }

  public async collectNews(): Promise<{ newArticles: number; totalArticles: number; articles: Article[]; errors: string[] }> {
    console.log('🚀 Début de la collecte d\'actualités françaises...');
    const allArticles: Article[] = [];
    const errors: string[] = [];
    let currentId = Date.now();
    let successCount = 0;
    let failCount = 0;

    // Charge les articles existants
    let existingArticles: Article[] = [];
    try {
      const existingData = await readFile(path.join(this.articlesDir, 'articles.json'), 'utf8');
      existingArticles = JSON.parse(existingData);
    } catch (error) {
      console.log('📝 Création d\'un nouveau fichier d\'articles...');
    }

    // Collecte depuis chaque source avec gestion d'erreur améliorée
    for (let i = 0; i < this.sources.length; i++) {
      const source = this.sources[i];
      try {
        console.log(`Testing ${i + 1}/${this.sources.length}: ${source.name}...`);
        
        const feed = await this.parser.parseURL(source.url);
        const latestItems = feed.items.slice(0, 8); // Plus d'articles par source
        let articleCount = 0;

        for (const item of latestItems) {
          const title = this.cleanText(item.title || '');
          if (!title) continue;

          // Vérifie les doublons
          if (await this.isDuplicate(title, [...existingArticles, ...allArticles])) {
            continue;
          }

          const content = this.cleanText(item.contentSnippet || item.content || item.description || '');
          const category = this.categorizeArticle(title, content, source.category, item.link);
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
          articleCount++;
        }
        
        console.log(`✅ ${source.name} - ${articleCount} articles`);
        successCount++;
      } catch (error: any) {
        const errorMessage = this.categorizeError(error);
        console.error(`❌ ${source.name} - FAILED: ${errorMessage}`);
        errors.push(`${source.name}: ${errorMessage}`);
        failCount++;
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

    // Rapport final
    console.log(`\n📊 SUMMARY:`);
    console.log(`Total sources: ${this.sources.length}`);
    console.log(`Working sources: ${successCount}`);
    console.log(`Failed sources: ${failCount}`);
    console.log(`Articles collected: ${allArticles.length}`);
    console.log(`Total articles: ${updatedArticles.length}`);
    
    return {
      newArticles: allArticles.length,
      totalArticles: updatedArticles.length,
      articles: updatedArticles,
      errors
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
