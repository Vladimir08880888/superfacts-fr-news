const fs = require('fs');
const path = require('path');

// Importer la logique de catégorisation améliorée
function categorizeArticle(title, summary = '', content = '') {
    const text = (title + ' ' + summary + ' ' + content).toLowerCase();
    
    // Patterns spécifiques en français avec priorité
    const categoryPatterns = {
        'Économie': {
            priority: 10,
            patterns: [
                // Commerce et entreprises
                /\b(boulang(?:erie|er)|commerce|entreprise|affaires?|business|économie?|marché|vente|achat|prix|coût|budget|finance|banque|bourse|investissement|profit|bénéfice|chiffre d'affaires|ca\b)/i,
                // Secteurs économiques
                /\b(industrie|agriculture|tourisme|immobilier|start-?up|pme|startup)/i,
                // Termes commerciaux
                /\b(concurrent(?:e|s)?|concurrence|client(?:e|s)?|fournisseur|marque|produit|service|consommateur|consommation)/i,
                // Finance
                /\b(euro?s?|dollar|devise|monnaie|inflation|déflation|récession|croissance|pib|emploi|chômage|salar(?:ié|ier)|syndical?)/i,
                // Commerce spécialisé - doit être prioritaire sur "guerre"
                /guerre\s+(?:de\s+)?(?:la\s+)?(?:baguette|prix|marché)/i,
                /bataille\s+(?:commerciale|économique|des\s+prix)/i
            ]
        },
        'Politique': {
            priority: 9,
            patterns: [
                /\b(politique|politicien|gouvernement|ministre|président|élu|député|sénateur|assemblée|parlement|élection|vote|campagne|parti|droite|gauche|macron|le pen|mélenchon)/i,
                /\b(réforme|loi|projet de loi|décret|ordonnance|constitution|république|démocratie|opposition|majorité|coalition)/i,
                /\b(municipal|régional|national|européen|international|diplomatie|ambassade|consulat)/i
            ]
        },
        'International': {
            priority: 8,
            patterns: [
                // Pays et régions
                /\b(états-unis|usa|chine|russie|japon|allemagne|royaume-uni|italie|espagne|brexit|ue|union européenne)/i,
                /\b(afrique|asie|amérique|europe|océanie|moyen-orient|maghreb)/i,
                // Relations internationales
                /\b(diplomatie|ambassade|consulat|traité|accord|sommet|g7|g20|otan|onu|unesco)/i,
                // Conflits internationaux - mais pas commerciaux
                /\b(?:guerre|conflit|tension)(?!\s+(?:de\s+)?(?:la\s+)?(?:baguette|prix|marché|commerciale))\s+(?:en|au|de|du|des)\s+\w+/i,
                // Géopolitique
                /\b(géopolit|ukraine|palestine|israël|syrie|afghanistan|iran|corée)/i
            ]
        },
        'Sport': {
            priority: 10, // Priorité plus élevée pour les sports
            patterns: [
                // Sports spécifiques avec priorité élevée
                /\b(tennis|us open|open|finale|grand chelem|sabalenka|djokovic|nadal|federer)/i,
                /\b(football|soccer|psg|marseille|lyon|ligue 1|champions league|euro|coupe du monde|mondial)/i,
                /\b(rugby|top 14|six nations|xv de france)/i,
                /\b(basketball|basket|nba|euroleague|eurobasket|fiba)/i,
                /\b(handball|proligue|championship)/i,
                /\b(cyclisme|vtt|tour de france|giro|vuelta|descente)/i,
                /\b(athlétisme|marathon|sprint)/i,
                /\b(natation|piscine|nageur)/i,
                /\b(jeux olympiques|paralympiques|jo)/i,
                // Termes généraux sportifs
                /\b(sport|champion|championnat|match|victoire|défaite|performance)/i,
                /\b(équipe|joueur|entraîneur|club|stade|terrain|compétition)/i,
                /\b(quart de finale|demi-finale|poule|qualification|qualifié)/i,
                // Combat sports
                /\b(ufc|mma|combat|boxe|karaté|judo)/i,
                // Autres sports
                /\b(golf|formule 1|f1|moto gp|ski|snowboard|escalade)/i
            ]
        },
        'Technologie': {
            priority: 6,
            patterns: [
                /\b(technologie|tech|numérique|digital|informatique|internet|web|site|application|app|logiciel|software)/i,
                /\b(ia|intelligence artificielle|robot|drone|blockchain|crypto|bitcoin|nft)/i,
                /\b(smartphone|iphone|android|ordinateur|pc|mac|tablet|console|gaming)/i,
                /\b(google|apple|microsoft|amazon|facebook|meta|twitter|tiktok|netflix)/i,
                /\b(startup|licorne|innovation|recherche|développement|r&d)/i
            ]
        },
        'Santé': {
            priority: 5,
            patterns: [
                /\b(santé|médic|médicament|hôpital|clinique|docteur|médecin|infirmier|patient|maladie|virus|bactérie)/i,
                /\b(covid|coronavirus|pandémie|épidémie|vaccin|vaccination|traitement|thérapie|chirurgie|opération)/i,
                /\b(cancer|diabète|hypertension|alzheimer|parkinson|sclérose|dépression|anxiété)/i,
                /\b(nutrition|régime|obésité|sport|exercice|bien-être|mental|psychologie)/i
            ]
        },
        'Culture': {
            priority: 4,
            patterns: [
                /\b(culture|culturel|art|artiste|musée|exposition|théâtre|cinéma|film|livre|littérature|musique)/i,
                /\b(festival|concert|spectacle|opéra|danse|ballet|peinture|sculpture|photographie)/i,
                /\b(histoire|historique|patrimoine|monument|château|église|cathédrale|archéologie)/i,
                /\b(netflix|disney|prime|streaming|série|documentaire|acteur|réalisateur|producteur)/i
            ]
        },
        'Sciences': {
            priority: 3,
            patterns: [
                /\b(science|scientifique|recherche|étude|laboratoire|université|cnrs|inserm|cern)/i,
                /\b(physique|chimie|biologie|mathématiques|astronomie|espace|nasa|esa|mars|lune)/i,
                /\b(climat|environnement|écologie|biodiversité|réchauffement|carbone|énergies?)/i,
                /\b(découverte|invention|innovation|expérience|test|analyse|résultat)/i
            ]
        },
        'Environnement': {
            priority: 2,
            patterns: [
                /\b(environnement|écologie|écologique|vert|durable|climat|climatique|météo|pollution)/i,
                /\b(réchauffement|carbone|co2|effet de serre|énergies? renouvelables?|solaire|éolien)/i,
                /\b(biodiversité|faune|flore|forêt|océan|mer|rivière|eau|agriculture bio)/i,
                /\b(déchet|recyclage|plastique|tri|compost|énergie|transition)/i
            ]
        },
        'Régional': {
            priority: 1,
            patterns: [
                /\b(région|régional|département|commune|ville|village|quartier|arrondissement)/i,
                /\b(maire|conseil municipal|préfet|sous-préfet|local|territorial)/i,
                /\b(bretagne|normandie|alsace|provence|aquitaine|languedoc|rhône|loire|nord|pas-de-calais)/i,
                /\b(paris|lyon|marseille|toulouse|nice|nantes|strasbourg|montpellier|bordeaux)/i
            ]
        }
    };

    // Chercher la catégorie avec la plus haute priorité qui match
    let bestMatch = { category: 'Actualités', priority: 0, matches: 0 };
    
    for (const [category, config] of Object.entries(categoryPatterns)) {
        let matches = 0;
        for (const pattern of config.patterns) {
            if (pattern.test(text)) {
                matches++;
            }
        }
        
        // Si on trouve des matches et que la priorité est plus élevée
        // ou si même priorité mais plus de matches
        if (matches > 0 && (config.priority > bestMatch.priority || 
                           (config.priority === bestMatch.priority && matches > bestMatch.matches))) {
            bestMatch = { category, priority: config.priority, matches };
        }
    }

    return bestMatch.category;
}

function generateTags(title, summary = '', content = '', category) {
    const text = (title + ' ' + summary + ' ' + content).toLowerCase();
    const tags = new Set();
    
    // Tags basés sur la catégorie
    tags.add(category.toLowerCase());
    
    // Tags contextuels améliorés avec validation
    const tagPatterns = {
        // Géographie et pays
        'france': /\b(france|français|français|hexagone|république française)/i,
        'europe': /\b(europe|européen|ue|union européenne|brexit|eurozone)/i,
        'international': /\b(international|mondial|global|planète|pays|nation)/i,
        'ukraine': /\b(ukraine|ukrainien|kiev|zelensky|donbass)/i,
        'turquie': /\b(turquie|turc|istanbul|ankara)/i,
        'espagne': /\b(espagne|espagnol|madrid|barcelone)/i,
        'géorgie': /\b(géorgie|géorgien|tbilisi)/i,
        'afrique du sud': /\b(afrique du sud|sud-africain)/i,
        'suisse': /\b(suisse|hélvétique|genève|zurich)/i,
        
        // Politique et institutions
        'gouvernement': /\b(gouvernement|ministre|ministère|état|pouvoir)/i,
        'élection': /\b(élection|électoral|vote|scrutin|urne|candidat)/i,
        'parlement': /\b(parlement|assemblée|sénat|député|sénateur)/i,
        
        // Économie
        'entreprise': /\b(entreprise|société|compagnie|business|pme|startup)/i,
        'emploi': /\b(emploi|travail|chômage|salarié|employeur|syndicat)/i,
        'marché': /\b(marché|bourse|finance|investissement|économie)/i,
        
        // Sports spécifiques
        'football': /\b(football|foot|fifa|ballon|terrain|match|équipe)/i,
        'rugby': /\b(rugby|ovale|mêlée|essai|championnat|xv)/i,
        'basketball': /\b(basketball|basket|nba|euroleague|eurobasket|fiba)/i,
        'tennis': /\b(tennis|raquette|court|tournoi|wimbledon|roland)/i,
        'cyclisme': /\b(cyclisme|vtt|vélo|descente|tour de france)/i,
        'handball': /\b(handball|proligue)/i,
        'champion': /\b(champion|championnat|titre|victoire|médaille)/i,
        'finale': /\b(finale|quart|demi|phase finale)/i,
        'mondial': /\b(mondial|coupe du monde|qualification)/i,
        'eurobasket': /\b(eurobasket|championnat d'europe de basket)/i,
        'compétition': /\b(compétition|tournoi|championnat)/i,
        
        // Technologie
        'numérique': /\b(numérique|digital|tech|technologie|innovation)/i,
        'internet': /\b(internet|web|site|online|en ligne|réseau)/i,
        'intelligence artificielle': /\b(intelligence artificielle|ia|robot|automatisation)/i,
        
        // Santé
        'médical': /\b(médical|médicament|thérapie|traitement|hôpital)/i,
        'patient': /\b(patient|malade|soin|consultation|diagnostic)/i,
        'covid': /\b(covid|coronavirus|pandémie|vaccin|confinement)/i,
        
        // Culture
        'cinéma': /\b(cinéma|film|acteur|réalisateur|festival|cannes)/i,
        'musique': /\b(musique|chanson|concert|album|artiste|musicien)/i,
        'livre': /\b(livre|littérature|auteur|écrivain|roman|prix)/i,
        
        // Sciences
        'recherche': /\b(recherche|étude|scientifique|laboratoire|découverte)/i,
        'climat': /\b(climat|climatique|réchauffement|carbone|environnement)/i,
        'espace': /\b(espace|spatial|nasa|mars|lune|satellite)/i,
        
        // Événements
        'festival': /\b(festival|événement|manifestation|célébration)/i,
        'accident': /\b(accident|collision|crash|incident|blessé)/i,
        'procès': /\b(procès|tribunal|justice|jugement|condamnation)/i
    };
    
    // IMPORTANT: Validation des tags inappropriés
    const inappropriateTags = {
        'mma': /\b(mma|mixed martial arts|combat|arts martiaux mixtes)/i,
        'guerre': /\b(?:guerre|conflit|bataille)\s+(?:de\s+)?(?:la\s+)?baguette/i // "guerre de la baguette" n'est PAS un conflit militaire
    };
    
    // Ajouter les tags appropriés
    for (const [tag, pattern] of Object.entries(tagPatterns)) {
        if (pattern.test(text)) {
            // Vérification spéciale pour éviter les faux positifs
            if (tag === 'international' && /boulang|commerce|entreprise|marché/i.test(text)) {
                // Ne pas ajouter "international" pour des sujets commerciaux locaux
                continue;
            }
            tags.add(tag);
        }
    }
    
    // Supprimer les tags inappropriés
    for (const [inappropriateTag, pattern] of Object.entries(inappropriateTags)) {
        if (pattern.test(text) && tags.has(inappropriateTag)) {
            tags.delete(inappropriateTag);
        }
        // Ne pas ajouter ce tag même s'il apparaît dans les patterns normaux
        if (text.includes('boulang') && inappropriateTag === 'mma') {
            tags.delete('mma');
        }
    }
    
    return Array.from(tags).slice(0, 5); // Limite à 5 tags
}

async function recategorizeArticles() {
    const articlesPath = path.join(__dirname, '../data/articles.json');
    
    try {
        // Lire les articles existants
        const articlesData = fs.readFileSync(articlesPath, 'utf8');
        const articles = JSON.parse(articlesData);
        
        let updatedCount = 0;
        let problematicArticles = [];
        
        console.log(`🔄 Recatégorisation de ${articles.length} articles...`);
        
        // Recatégoriser chaque article
        articles.forEach((article, index) => {
            const oldCategory = article.category;
            const oldTags = [...(article.tags || [])];
            
            // Nouvelle catégorisation
            const newCategory = categorizeArticle(article.title, article.summary, article.content);
            const newTags = generateTags(article.title, article.summary, article.content, newCategory);
            
            // Mettre à jour si changement
            if (oldCategory !== newCategory || JSON.stringify(oldTags) !== JSON.stringify(newTags)) {
                article.category = newCategory;
                article.tags = newTags;
                updatedCount++;
                
                console.log(`📝 Article ${index + 1}: "${article.title.substring(0, 60)}..."`);
                console.log(`   Catégorie: ${oldCategory} → ${newCategory}`);
                console.log(`   Tags: [${oldTags.join(', ')}] → [${newTags.join(', ')}]`);
                console.log('');
                
                // Identifier les articles problématiques pour vérification
                if (oldCategory === 'International' && newCategory === 'Économie') {
                    problematicArticles.push({
                        title: article.title,
                        oldCategory,
                        newCategory,
                        oldTags,
                        newTags
                    });
                }
            }
        });
        
        // Sauvegarder les modifications
        if (updatedCount > 0) {
            fs.writeFileSync(articlesPath, JSON.stringify(articles, null, 2));
            console.log(`✅ ${updatedCount} articles mis à jour et sauvegardés !`);
            
            if (problematicArticles.length > 0) {
                console.log('\n🎯 Articles corrigés (International → Économie):');
                problematicArticles.forEach(article => {
                    console.log(`- "${article.title.substring(0, 80)}..."`);
                });
            }
        } else {
            console.log('✨ Aucune modification nécessaire, tous les articles sont déjà bien catégorisés !');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la recatégorisation:', error.message);
    }
}

// Exécuter le script
recategorizeArticles();
