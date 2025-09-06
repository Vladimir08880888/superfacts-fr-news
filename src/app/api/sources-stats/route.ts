import { NextRequest, NextResponse } from 'next/server';
import { FrenchNewsCollector } from '@/lib/news-collector';
import type { Article } from '@/lib/news-collector';

interface SourceStats {
  name: string;
  category: string;
  logo: string;
  url: string;
  status: 'active' | 'inactive' | 'error';
  totalArticles: number;
  todayArticles: number;
  lastArticleDate?: string;
  avgArticlesPerDay: number;
  categoriesDistribution: { [key: string]: number };
  sentimentDistribution: { 
    positive: number; 
    negative: number; 
    neutral: number; 
  };
  rating: number; // Sur 5 étoiles basé sur la qualité et fréquence
  responseTime?: number;
  reliability: number; // Pourcentage de succès des collectes
  topTags: Array<{ tag: string; count: number; }>;
}

interface GlobalStats {
  totalSources: number;
  activeSources: number;
  totalArticles: number;
  todayArticles: number;
  avgArticlesPerSource: number;
  topCategories: Array<{ category: string; count: number; }>;
  lastUpdateTime: string;
}

export async function GET(request: NextRequest) {
  try {
    const collector = new FrenchNewsCollector();
    const allArticles = await collector.getArticles();
    
    // Sources définies dans le collector
    const sources = [
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

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Calcul des statistiques pour chaque source
    const sourcesStats: SourceStats[] = sources.map(source => {
      const sourceArticles = allArticles.filter(article => article.source === source.name);
      const todayArticles = sourceArticles.filter(article => 
        new Date(article.publishDate) >= todayStart
      );
      const weekArticles = sourceArticles.filter(article => 
        new Date(article.publishDate) >= oneWeekAgo
      );

      // Distribution des catégories
      const categoriesDistribution: { [key: string]: number } = {};
      sourceArticles.forEach(article => {
        categoriesDistribution[article.category] = (categoriesDistribution[article.category] || 0) + 1;
      });

      // Distribution des sentiments
      const sentimentDistribution = {
        positive: sourceArticles.filter(a => a.sentiment === 'positive').length,
        negative: sourceArticles.filter(a => a.sentiment === 'negative').length,
        neutral: sourceArticles.filter(a => a.sentiment === 'neutral').length,
      };

      // Top tags
      const tagCount: { [key: string]: number } = {};
      sourceArticles.forEach(article => {
        article.tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      });
      
      const topTags = Object.entries(tagCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count }));

      // Calcul du rating basé sur la fréquence, récence, et qualité
      let rating = 0;
      if (sourceArticles.length > 0) {
        const avgArticlesPerDay = weekArticles.length / 7;
        const lastArticleDate = sourceArticles[0] ? new Date(sourceArticles[0].publishDate) : null;
        const daysSinceLastArticle = lastArticleDate ? 
          (now.getTime() - lastArticleDate.getTime()) / (1000 * 60 * 60 * 24) : 999;
        
        // Rating basé sur : fréquence (40%), récence (40%), diversité des catégories (20%)
        const frequencyScore = Math.min(avgArticlesPerDay / 2, 2); // Max 2 points
        const recencyScore = Math.max(2 - (daysSinceLastArticle / 7), 0); // Max 2 points
        const diversityScore = Math.min(Object.keys(categoriesDistribution).length / 5, 1); // Max 1 point
        
        rating = frequencyScore + recencyScore + diversityScore;
        rating = Math.min(rating, 5); // Limite à 5
      }

      const avgArticlesPerDay = weekArticles.length / 7;
      const lastArticleDate = sourceArticles.length > 0 ? 
        sourceArticles.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())[0].publishDate : 
        undefined;

      return {
        name: source.name,
        category: source.category,
        logo: source.logo || '/logos/default.png',
        url: source.url,
        status: sourceArticles.length > 0 ? 'active' : 'inactive',
        totalArticles: sourceArticles.length,
        todayArticles: todayArticles.length,
        lastArticleDate,
        avgArticlesPerDay,
        categoriesDistribution,
        sentimentDistribution,
        rating: Math.round(rating * 10) / 10,
        reliability: sourceArticles.length > 0 ? 95 : 0, // Simplifiée pour le moment
        topTags
      };
    });

    // Statistiques globales
    const totalTodayArticles = allArticles.filter(article => 
      new Date(article.publishDate) >= todayStart
    ).length;

    const categoryCount: { [key: string]: number } = {};
    allArticles.forEach(article => {
      categoryCount[article.category] = (categoryCount[article.category] || 0) + 1;
    });

    const topCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([category, count]) => ({ category, count }));

    const globalStats: GlobalStats = {
      totalSources: sources.length,
      activeSources: sourcesStats.filter(s => s.status === 'active').length,
      totalArticles: allArticles.length,
      todayArticles: totalTodayArticles,
      avgArticlesPerSource: Math.round(allArticles.length / sources.length * 10) / 10,
      topCategories,
      lastUpdateTime: new Date().toISOString()
    };

    // Trie les sources par rating décroissant
    sourcesStats.sort((a, b) => b.rating - a.rating);

    return NextResponse.json({
      success: true,
      globalStats,
      sourcesStats
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques des sources:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des statistiques' 
      },
      { status: 500 }
    );
  }
}
