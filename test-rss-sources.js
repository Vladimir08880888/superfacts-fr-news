const Parser = require('rss-parser');
const axios = require('axios');

// Sources from news-collector.ts
const sources = [
  // Médias généralistes
  { name: 'Le Monde', url: 'https://www.lemonde.fr/rss/une.xml', category: 'Actualités' },
  { name: 'Le Figaro', url: 'https://www.lefigaro.fr/rss/figaro_actualites.xml', category: 'Actualités' },
  { name: 'Libération', url: 'https://www.liberation.fr/arc/outboundfeeds/rss/?outputType=xml', category: 'Actualités' },
  { name: 'France 24', url: 'https://www.france24.com/fr/rss', category: 'Actualités' },
  { name: 'France Info', url: 'https://www.francetvinfo.fr/titres.rss', category: 'Actualités' },
  { name: 'BFM TV', url: 'https://www.bfmtv.com/rss/info/', category: 'Actualités' },
  { name: 'L\'Express', url: 'https://www.lexpress.fr/rss/unes.xml', category: 'Actualités' },
  { name: 'Marianne', url: 'https://www.marianne.net/rss.xml', category: 'Actualités' },
  { name: 'L\'Obs', url: 'https://www.nouvelobs.com/rss.xml', category: 'Actualités' },

  // Économie et Business
  { name: 'Les Échos', url: 'https://www.lesechos.fr/rss.xml', category: 'Économie' },
  { name: 'La Tribune', url: 'https://www.latribune.fr/rss/a-la-une.rss', category: 'Économie' },
  { name: 'Challenges', url: 'https://www.challenges.fr/rss.xml', category: 'Économie' },
  { name: 'Capital', url: 'https://www.capital.fr/rss', category: 'Économie' },

  // Tech et Sciences
  { name: 'Futura Sciences', url: 'https://www.futura-sciences.com/rss/actualites.xml', category: 'Sciences' },
  { name: 'Sciences et Avenir', url: 'https://www.sciencesetavenir.fr/rss.xml', category: 'Sciences' },
  { name: '01net', url: 'https://www.01net.com/rss/info/', category: 'Tech' },
  { name: 'Clubic', url: 'https://www.clubic.com/feed/', category: 'Tech' },

  // Santé et Médecine
  { name: 'Doctissimo', url: 'https://www.doctissimo.fr/rss.xml', category: 'Santé' },
  { name: 'Top Santé', url: 'https://www.topsante.com/rss.xml', category: 'Santé' },
  { name: 'Futura Sciences Santé', url: 'https://www.futura-sciences.com/rss/sante.xml', category: 'Santé' },
  { name: 'Sciences et Avenir Santé', url: 'https://www.sciencesetavenir.fr/rss/sante.xml', category: 'Santé' },
  { name: 'Le Figaro Santé', url: 'https://www.lefigaro.fr/rss/figaro_sante.xml', category: 'Santé' },
    
  // Sport
  { name: 'L\'Équipe', url: 'https://www.lequipe.fr/rss/actu_rss.xml', category: 'Sport' },
  { name: 'RMC Sport', url: 'https://rmcsport.bfmtv.com/rss/', category: 'Sport' },

  // Culture
  { name: 'Télérama', url: 'https://www.telerama.fr/rss.xml', category: 'Culture' },
  { name: 'Les Inrockuptibles', url: 'https://www.lesinrocks.com/rss.xml', category: 'Culture' },

  // Régional et Local
  { name: 'Ouest-France', url: 'https://www.ouest-france.fr/rss-en-continu.xml', category: 'Régional' },
  { name: '20 Minutes', url: 'https://www.20minutes.fr/rss-actu.xml', category: 'Actualités' },
  { name: 'Sud Ouest', url: 'https://www.sudouest.fr/rss/', category: 'Régional' },
  { name: 'La Dépêche', url: 'https://www.ladepeche.fr/rss.xml', category: 'Régional' },
  { name: 'Nice-Matin', url: 'https://www.nicematin.com/rss', category: 'Régional' },
  { name: 'Le Progrès', url: 'https://www.leprogres.fr/rss', category: 'Régional' },
  { name: 'La Voix du Nord', url: 'https://www.lavoixdunord.fr/rss', category: 'Régional' },
  { name: 'DNA - Dernières Nouvelles d\'Alsace', url: 'https://www.dna.fr/rss/', category: 'Régional' },
    
  // Médias spécialisés
  { name: 'Mediapart', url: 'https://www.mediapart.fr/articles/feed', category: 'Politique' },
  { name: 'Rue89', url: 'https://www.nouvelobs.com/rue89/rss.xml', category: 'Société' },
  { name: 'Alternatives Économiques', url: 'https://www.alternatives-economiques.fr/rss.xml', category: 'Économie' },
  { name: 'Atlantico', url: 'https://atlantico.fr/rss.xml', category: 'Actualités' },
  { name: 'Slate.fr', url: 'https://www.slate.fr/rss.xml', category: 'Actualités' },
    
  // Tech et Innovation
  { name: 'Numerama', url: 'https://www.numerama.com/feed/', category: 'Tech' },
  { name: 'JDN - Journal du Net', url: 'https://www.journaldunet.com/rss/', category: 'Tech' },
  { name: 'Frandroid', url: 'https://www.frandroid.com/feed', category: 'Tech' },
  { name: 'ZDNet France', url: 'https://www.zdnet.fr/feeds/rss/', category: 'Tech' },
  { name: 'Presse-citron', url: 'https://www.presse-citron.net/feed/', category: 'Tech' },
    
  // Sciences et Environnement
  { name: 'Science & Vie', url: 'https://www.science-et-vie.com/rss.xml', category: 'Sciences' },
  { name: 'La Recherche', url: 'https://www.larecherche.fr/rss.xml', category: 'Sciences' },
  { name: 'Reporterre', url: 'https://reporterre.net/spip.php?page=backend', category: 'Environnement' },
  { name: 'Actu-Environnement', url: 'https://www.actu-environnement.com/ae/rss/news.rss', category: 'Environnement' },
    
  // Sport et Divertissement
  { name: 'Eurosport', url: 'https://www.eurosport.fr/rss.xml', category: 'Sport' },
  { name: 'So Foot', url: 'https://www.sofoot.com/rss.xml', category: 'Sport' },
  { name: 'Première', url: 'https://www.premiere.fr/rss', category: 'Culture' },
  { name: 'Les Échos Start', url: 'https://start.lesechos.fr/feed/', category: 'Tech' },
    
  // Société et Lifestyle
  { name: 'Madame Figaro', url: 'https://madame.lefigaro.fr/rss/madame_figaro_une.xml', category: 'Société' },
  { name: 'Marie Claire', url: 'https://www.marieclaire.fr/rss.xml', category: 'Société' },
  { name: 'L\'Internaute', url: 'https://www.linternaute.com/rss/une.xml', category: 'Actualités' },
];

async function testRSSSource(source, parser) {
  try {
    const feed = await parser.parseURL(source.url);
    if (feed && feed.items && feed.items.length > 0) {
      return {
        name: source.name,
        url: source.url,
        category: source.category,
        status: 'OK',
        articlesCount: feed.items.length,
        lastUpdated: feed.items[0]?.pubDate || 'Unknown'
      };
    }
    return {
      name: source.name,
      url: source.url, 
      category: source.category,
      status: 'EMPTY',
      articlesCount: 0,
      error: 'No articles found'
    };
  } catch (error) {
    return {
      name: source.name,
      url: source.url,
      category: source.category,
      status: 'FAILED',
      articlesCount: 0,
      error: error.message
    };
  }
}

async function testAllSources() {
  const parser = new Parser({
    customFields: {
      item: ['description', 'pubDate', 'category', 'enclosure', 'media:content']
    }
  });

  console.log('🧪 Testing all RSS sources...\n');
  
  const results = [];
  let workingCount = 0;
  
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    console.log(`Testing ${i + 1}/${sources.length}: ${source.name}...`);
    
    const result = await testRSSSource(source, parser);
    results.push(result);
    
    if (result.status === 'OK') {
      workingCount++;
      console.log(`✅ ${source.name} - ${result.articlesCount} articles`);
    } else {
      console.log(`❌ ${source.name} - ${result.status}: ${result.error}`);
    }
    
    // Small delay to avoid overwhelming servers
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 SUMMARY:');
  console.log(`Total sources: ${sources.length}`);
  console.log(`Working sources: ${workingCount}`);
  console.log(`Failed sources: ${sources.length - workingCount}`);
  
  console.log('\n✅ Working sources:');
  results.filter(r => r.status === 'OK').forEach((r, i) => {
    console.log(`${i + 1}. ${r.name} (${r.articlesCount} articles) - ${r.category}`);
  });
  
  console.log('\n❌ Failed sources:');
  results.filter(r => r.status !== 'OK').forEach((r, i) => {
    console.log(`${i + 1}. ${r.name} - ${r.error}`);
  });

  return results;
}

testAllSources().catch(console.error);
