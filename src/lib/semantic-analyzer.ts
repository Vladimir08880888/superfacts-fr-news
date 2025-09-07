/**
 * Analyseur sémantique avancé pour la reconnaissance d'entités nommées
 * et l'analyse des relations sémantiques dans les textes d'actualité français
 */

export interface SemanticEntity {
  name: string;
  type: 'person' | 'place' | 'organization' | 'topic';
  confidence: number;
  mentions: number;
  contexts: string[];
}

export interface SemanticRelation {
  subject: string;
  predicate: string;
  object: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  strength: number;
}

export interface TopicSentiment {
  topic: string;
  positive: number;
  negative: number;
  neutral: number;
  dominantSentiment: 'positive' | 'negative' | 'neutral';
  relatedEntities: string[];
}

export class SemanticAnalyzer {
  private frenchStopWords = new Set([
    'le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour',
    'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'plus',
    'par', 'grand', 'ce', 'le', 'premier', 'vous', 'ou', 'son', 'lui', 'nous'
  ]);

  private personTitles = [
    'président', 'présidente', 'ministre', 'premier ministre', 'première ministre',
    'secrétaire d\'état', 'maire', 'gouverneur', 'ambassadeur', 'ambassadrice',
    'consul', 'préfet', 'préfète', 'directeur', 'directrice', 'pdg', 'ceo', 'dg',
    'professeur', 'professeure', 'docteur', 'maître', 'avocat', 'avocate',
    'capitaine', 'colonel', 'générale', 'général', 'amiral', 'amirale',
    'député', 'députée', 'sénateur', 'sénatrice', 'commissaire',
    'porte-parole', 'chef', 'responsable', 'leader', 'patron', 'patronne'
  ];

  private frenchPlaces = new Set([
    'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg',
    'Montpellier', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Le Havre',
    'Saint-Étienne', 'Toulon', 'Grenoble', 'Dijon', 'Angers', 'Nîmes',
    'Villeurbanne', 'Saint-Denis', 'Le Mans', 'Aix-en-Provence', 'Clermont-Ferrand',
    'Brest', 'Limoges', 'Tours', 'Amiens', 'Perpignan', 'Metz', 'Besançon',
    'France', 'Europe', 'Union européenne', 'États-Unis', 'Allemagne', 'Italie',
    'Espagne', 'Royaume-Uni', 'Belgique', 'Suisse', 'Canada', 'Japon', 'Chine',
    'Île-de-France', 'Provence-Alpes-Côte d\'Azur', 'Auvergne-Rhône-Alpes',
    'Nouvelle-Aquitaine', 'Occitanie', 'Hauts-de-France', 'Grand Est',
    'Normandie', 'Bretagne', 'Pays de la Loire', 'Centre-Val de Loire',
    'Bourgogne-Franche-Comté', 'Corse', 'Élysée', 'Matignon', 'Assemblée nationale',
    'Sénat', 'Conseil constitutionnel', 'Cour de cassation', 'Conseil d\'État'
  ]);

  private frenchOrganizations = new Set([
    'SNCF', 'EDF', 'Orange', 'Total', 'TotalEnergies', 'Renault', 'Peugeot', 
    'Citroën', 'Airbus', 'Thales', 'Safran', 'Carrefour', 'Auchan', 'Leclerc',
    'BNP Paribas', 'Crédit Agricole', 'Société Générale', 'Crédit Mutuel',
    'France Télévisions', 'Radio France', 'Arte', 'Canal+', 'TF1', 'M6',
    'Le Figaro', 'Le Monde', 'Libération', 'L\'Express', 'Le Point',
    'Université de la Sorbonne', 'Sciences Po', 'ENS', 'CNRS', 'INSERM',
    'Ministère', 'Cour de cassation', 'Conseil d\'État', 'UEFA', 'FIFA',
    'Fédération française de football', 'Roland-Garros', 'Tour de France',
    'RATP', 'Air France', 'Michelin', 'L\'Oréal', 'Danone', 'Nestlé France'
  ]);

  private topicKeywords = {
    'politique': [
      'politique', 'gouvernement', 'élection', 'vote', 'démocratie', 'parlement',
      'député', 'sénateur', 'assemblée', 'sénat', 'conseil', 'municipales',
      'présidentielle', 'législatives', 'européennes', 'parti', 'opposition',
      'majorité', 'coalition', 'réforme', 'loi', 'décret', 'ordonnance'
    ],
    'économie': [
      'économie', 'finance', 'entreprise', 'emploi', 'chômage', 'croissance',
      'inflation', 'récession', 'bourse', 'action', 'investissement', 'startup',
      'industrie', 'commerce', 'export', 'import', 'dette', 'budget', 'fiscal',
      'taxe', 'impôt', 'tva', 'pib', 'banque', 'crédit', 'emprunt', 'euro'
    ],
    'santé': [
      'santé', 'médecine', 'hôpital', 'covid', 'coronavirus', 'vaccin', 'vaccination',
      'traitement', 'médicament', 'épidémie', 'pandémie', 'virus', 'maladie',
      'chirurgie', 'médecin', 'infirmier', 'patient', 'clinique', 'urgence',
      'sécurité sociale', 'assurance maladie', 'recherche médicale'
    ],
    'éducation': [
      'éducation', 'école', 'université', 'formation', 'enseignement', 'professeur',
      'étudiant', 'élève', 'classe', 'cours', 'examen', 'diplôme', 'baccalauréat',
      'licence', 'master', 'doctorat', 'recherche', 'campus', 'lycée', 'collège',
      'primaire', 'maternelle', 'réforme scolaire', 'éducation nationale'
    ],
    'environnement': [
      'environnement', 'climat', 'écologie', 'pollution', 'développement durable',
      'émission', 'carbone', 'co2', 'réchauffement', 'biodiversité', 'énergie',
      'renouvelable', 'solaire', 'éolien', 'nucléaire', 'transition énergétique',
      'cop', 'accord de paris', 'déchets', 'recyclage', 'plastique', 'eau'
    ],
    'technologie': [
      'technologie', 'intelligence artificielle', 'ia', 'numérique', 'digital',
      'innovation', 'startup', 'tech', 'internet', 'web', 'application', 'app',
      'smartphone', 'ordinateur', 'logiciel', 'data', 'données', 'algorithme',
      'robotique', 'automatisation', '5g', 'fibre', 'cybersécurité', 'blockchain'
    ],
    'culture': [
      'culture', 'art', 'cinéma', 'film', 'théâtre', 'musique', 'concert',
      'festival', 'littérature', 'livre', 'roman', 'exposition', 'musée',
      'patrimoine', 'monument', 'spectacle', 'danse', 'opéra', 'artiste',
      'créateur', 'œuvre', 'création', 'culturel', 'artistique', 'cannes'
    ],
    'sport': [
      'sport', 'football', 'rugby', 'tennis', 'basketball', 'handball', 'volleyball',
      'natation', 'athlétisme', 'cyclisme', 'jeux olympiques', 'championnat',
      'coupe', 'match', 'équipe', 'joueur', 'sportif', 'entraîneur', 'victoire',
      'défaite', 'performance', 'record', 'médaille', 'competition'
    ],
    'international': [
      'international', 'europe', 'européen', 'monde', 'mondial', 'diplomatique',
      'relations', 'ambassade', 'traité', 'accord', 'sommet', 'g7', 'g20',
      'otan', 'onu', 'union européenne', 'brexit', 'états-unis', 'chine',
      'russie', 'afrique', 'asie', 'amérique', 'océanie', 'coopération'
    ],
    'justice': [
      'justice', 'tribunal', 'procès', 'juridique', 'droit', 'loi', 'jugement',
      'avocat', 'juge', 'magistrat', 'condamnation', 'acquittement', 'appel',
      'cassation', 'constitutionnel', 'pénal', 'civil', 'administratif',
      'enquête', 'instruction', 'police', 'gendarmerie', 'crime', 'délit'
    ]
  };

  /**
   * Analyse sémantique complète d'un texte
   */
  public analyzeText(text: string): {
    entities: SemanticEntity[];
    relations: SemanticRelation[];
    topicSentiments: TopicSentiment[];
    keyPhrases: string[];
    semanticDensity: number;
  } {
    const entities = this.extractAllEntities(text);
    const relations = this.extractSemanticRelations(text, entities);
    const topicSentiments = this.analyzeTopicSentiments(text, entities);
    const keyPhrases = this.extractKeyPhrases(text);
    const semanticDensity = this.calculateSemanticDensity(text, entities);

    return {
      entities,
      relations,
      topicSentiments,
      keyPhrases,
      semanticDensity
    };
  }

  /**
   * Extraction complète des entités
   */
  private extractAllEntities(text: string): SemanticEntity[] {
    const entities: SemanticEntity[] = [];

    // Extraction des personnes
    const persons = this.extractPersonEntities(text);
    entities.push(...persons);

    // Extraction des lieux
    const places = this.extractPlaceEntities(text);
    entities.push(...places);

    // Extraction des organisations
    const organizations = this.extractOrganizationEntities(text);
    entities.push(...organizations);

    // Extraction des sujets/thèmes
    const topics = this.extractTopicEntities(text);
    entities.push(...topics);

    return entities.sort((a, b) => b.confidence - a.confidence).slice(0, 25);
  }

  /**
   * Extraction des entités personnes avec analyse contextuelle
   */
  private extractPersonEntities(text: string): SemanticEntity[] {
    const persons: Map<string, SemanticEntity> = new Map();

    // Recherche par titres officiels
    this.personTitles.forEach(title => {
      const titleRegex = new RegExp(`\\b(?:${title})\\s+([A-ZÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜ][a-zàáâäèéêëìíîïòóôöùúûü]+(?:\\s+[A-ZÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜ][a-zàáâäèéêëìíîïòóôöùúûü]+)*)`, 'gi');
      const matches = [...text.matchAll(titleRegex)];
      
      matches.forEach(match => {
        const name = match[1].trim();
        if (name.length > 2 && !this.isCommonWord(name)) {
          const context = this.extractEntityContext(text, name);
          const existing = persons.get(name);
          
          if (existing) {
            existing.mentions++;
            existing.contexts.push(context);
            existing.confidence = Math.min(1, existing.confidence + 0.1);
          } else {
            persons.set(name, {
              name,
              type: 'person',
              confidence: 0.8,
              mentions: 1,
              contexts: [context]
            });
          }
        }
      });
    });

    // Recherche de noms propres avec patterns
    const namePattern = /\b([A-ZÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜ][a-zàáâäèéêëìíîïòóôöùúûü]+\s+[A-ZÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜ][a-zàáâäèéêëìíîïòóôöùúûü]+)\b/g;
    const nameMatches = [...text.matchAll(namePattern)];
    
    nameMatches.forEach(match => {
      const name = match[1];
      if (!this.isCommonPhrase(name) && !this.frenchPlaces.has(name)) {
        const context = this.extractEntityContext(text, name);
        if (this.isLikelyPerson(context)) {
          const existing = persons.get(name);
          
          if (existing) {
            existing.mentions++;
            existing.contexts.push(context);
          } else {
            persons.set(name, {
              name,
              type: 'person',
              confidence: 0.6,
              mentions: 1,
              contexts: [context]
            });
          }
        }
      }
    });

    return Array.from(persons.values());
  }

  /**
   * Extraction des entités lieux
   */
  private extractPlaceEntities(text: string): SemanticEntity[] {
    const places: Map<string, SemanticEntity> = new Map();

    // Lieux connus
    this.frenchPlaces.forEach(place => {
      const placeRegex = new RegExp(`\\b${place}\\b`, 'gi');
      const matches = [...text.matchAll(placeRegex)];
      
      if (matches.length > 0) {
        const context = this.extractEntityContext(text, place);
        places.set(place, {
          name: place,
          type: 'place',
          confidence: 0.9,
          mentions: matches.length,
          contexts: [context]
        });
      }
    });

    // Patterns géographiques
    const geoPatterns = [
      /\b(région\s+[A-ZÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜ][a-zàáâäèéêëìíîïòóôöùúûü-]+)/gi,
      /\b(département\s+(?:d[eu]\s+)?[A-ZÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜ][a-zàáâäèéêëìíîïòóôöùúûü-]+)/gi,
      /\b([A-ZÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜ][a-zàáâäèéêëìíîïòóôöùúûü]+(?:-[A-ZÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜ][a-zàáâäèéêëìíîïòóôöùúûü]+)*)\s*\([0-9]{2,3}\)/g
    ];

    geoPatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        const placeName = match[1];
        const context = this.extractEntityContext(text, placeName);
        
        places.set(placeName, {
          name: placeName,
          type: 'place',
          confidence: 0.7,
          mentions: 1,
          contexts: [context]
        });
      });
    });

    return Array.from(places.values());
  }

  /**
   * Extraction des entités organisations
   */
  private extractOrganizationEntities(text: string): SemanticEntity[] {
    const orgs: Map<string, SemanticEntity> = new Map();

    // Organisations connues
    this.frenchOrganizations.forEach(org => {
      const orgRegex = new RegExp(`\\b${org}\\b`, 'gi');
      const matches = [...text.matchAll(orgRegex)];
      
      if (matches.length > 0) {
        const context = this.extractEntityContext(text, org);
        orgs.set(org, {
          name: org,
          type: 'organization',
          confidence: 0.9,
          mentions: matches.length,
          contexts: [context]
        });
      }
    });

    // Patterns organisationnels
    const orgPatterns = [
      /\b(Ministère\s+d[eu]\s+[A-ZÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜ][a-zàáâäèéêëìíîïòóôöùúûü\s]+)/gi,
      /\b(Agence\s+[A-ZÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜ][a-zàáâäèéêëìíîïòóôöùúûü\s]+)/gi,
      /\b(Fédération\s+[A-ZÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜ][a-zàáâäèéêëìíîïòóôöùúûü\s]+)/gi,
      /\b(Association\s+[A-ZÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜ][a-zàáâäèéêëìíîïòóôöùúûü\s]+)/gi,
      /\b(Syndicat\s+[A-ZÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜ][a-zàáâäèéêëìíîïòóôöùúûü\s]+)/gi,
      /\b([A-ZÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜ][a-zàáâäèéêëìíîïòóôöùúûü]+\s+(?:SAS|SA|SARL|EURL|SNC))\b/gi
    ];

    orgPatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        const orgName = match[1].trim();
        const context = this.extractEntityContext(text, orgName);
        
        orgs.set(orgName, {
          name: orgName,
          type: 'organization',
          confidence: 0.7,
          mentions: 1,
          contexts: [context]
        });
      });
    });

    return Array.from(orgs.values());
  }

  /**
   * Extraction des entités sujets/thèmes
   */
  private extractTopicEntities(text: string): SemanticEntity[] {
    const topics: Map<string, SemanticEntity> = new Map();
    const lowerText = text.toLowerCase();

    Object.entries(this.topicKeywords).forEach(([topic, keywords]) => {
      let mentions = 0;
      const contexts: string[] = [];

      keywords.forEach(keyword => {
        const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = [...lowerText.matchAll(keywordRegex)];
        mentions += matches.length;

        if (matches.length > 0) {
          contexts.push(this.extractEntityContext(text, keyword));
        }
      });

      if (mentions > 0) {
        const confidence = Math.min(1, mentions * 0.1 + 0.5);
        topics.set(topic, {
          name: topic,
          type: 'topic',
          confidence,
          mentions,
          contexts: contexts.slice(0, 3)
        });
      }
    });

    return Array.from(topics.values());
  }

  /**
   * Extraction des relations sémantiques entre entités
   */
  private extractSemanticRelations(text: string, entities: SemanticEntity[]): SemanticRelation[] {
    const relations: SemanticRelation[] = [];
    const sentences = text.split(/[.!?]+/);

    sentences.forEach(sentence => {
      const sentenceEntities = entities.filter(entity =>
        sentence.toLowerCase().includes(entity.name.toLowerCase())
      );

      if (sentenceEntities.length >= 2) {
        for (let i = 0; i < sentenceEntities.length - 1; i++) {
          for (let j = i + 1; j < sentenceEntities.length; j++) {
            const subject = sentenceEntities[i];
            const object = sentenceEntities[j];
            
            const relation = this.analyzeRelationSentiment(sentence, subject.name, object.name);
            
            if (relation) {
              relations.push({
                subject: subject.name,
                predicate: relation.predicate,
                object: object.name,
                sentiment: relation.sentiment,
                strength: relation.strength
              });
            }
          }
        }
      }
    });

    return relations.slice(0, 30);
  }

  /**
   * Analyse le sentiment des relations entre entités
   */
  private analyzeRelationSentiment(sentence: string, subject: string, object: string): {
    predicate: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    strength: number;
  } | null {
    const lowerSentence = sentence.toLowerCase();
    const subjectPos = lowerSentence.indexOf(subject.toLowerCase());
    const objectPos = lowerSentence.indexOf(object.toLowerCase());

    if (subjectPos === -1 || objectPos === -1) return null;

    const relationStart = Math.min(subjectPos, objectPos);
    const relationEnd = Math.max(subjectPos, objectPos);
    const relationText = lowerSentence.slice(relationStart, relationEnd);

    // Analyse du sentiment dans la relation
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    let strength = 0.5;

    const positiveTerms = ['soutient', 'aide', 'collabore', 'partenariat', 'alliance', 'coopération'];
    const negativeTerms = ['critique', 'oppose', 'conflit', 'rivalité', 'tension', 'désaccord'];

    if (positiveTerms.some(term => relationText.includes(term))) {
      sentiment = 'positive';
      strength = 0.7;
    } else if (negativeTerms.some(term => relationText.includes(term))) {
      sentiment = 'negative';
      strength = 0.7;
    }

    return {
      predicate: relationText.trim() || 'associé à',
      sentiment,
      strength
    };
  }

  /**
   * Analyse des sentiments par sujet/thème
   */
  private analyzeTopicSentiments(text: string, entities: SemanticEntity[]): TopicSentiment[] {
    const topicSentiments: TopicSentiment[] = [];
    const topics = entities.filter(entity => entity.type === 'topic');

    topics.forEach(topic => {
      let positive = 0;
      let negative = 0;
      let neutral = 0;
      const relatedEntities: Set<string> = new Set();

      const sentences = text.split(/[.!?]+/);
      sentences.forEach(sentence => {
        if (sentence.toLowerCase().includes(topic.name)) {
          // Analyse simplifiée du sentiment de la phrase
          const sentimentScore = this.analyzeSentenceSentiment(sentence);
          
          if (sentimentScore > 0.2) positive++;
          else if (sentimentScore < -0.2) negative++;
          else neutral++;

          // Identifier les entités liées dans cette phrase
          entities.forEach(entity => {
            if (entity.type !== 'topic' && sentence.toLowerCase().includes(entity.name.toLowerCase())) {
              relatedEntities.add(entity.name);
            }
          });
        }
      });

      const total = positive + negative + neutral;
      let dominantSentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      
      if (total > 0) {
        if (positive > negative && positive > neutral) dominantSentiment = 'positive';
        else if (negative > positive && negative > neutral) dominantSentiment = 'negative';
      }

      topicSentiments.push({
        topic: topic.name,
        positive,
        negative,
        neutral,
        dominantSentiment,
        relatedEntities: Array.from(relatedEntities).slice(0, 5)
      });
    });

    return topicSentiments;
  }

  /**
   * Extraction des phrases-clés importantes
   */
  private extractKeyPhrases(text: string): string[] {
    const sentences = text.split(/[.!?]+/);
    const phrases: Array<{ text: string, score: number }> = [];

    sentences.forEach(sentence => {
      if (sentence.trim().length > 10) {
        const score = this.calculatePhraseImportance(sentence.trim());
        phrases.push({ text: sentence.trim(), score });
      }
    });

    return phrases
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(p => p.text);
  }

  /**
   * Calcul de l'importance d'une phrase
   */
  private calculatePhraseImportance(sentence: string): number {
    let score = 0;
    const words = sentence.toLowerCase().split(/\s+/);

    // Longueur optimale
    if (words.length >= 8 && words.length <= 25) score += 0.3;

    // Présence d'entités importantes
    if (this.personTitles.some(title => sentence.toLowerCase().includes(title))) score += 0.4;
    if (Array.from(this.frenchPlaces).some(place => sentence.includes(place))) score += 0.3;

    // Mots-clés d'importance
    const importantWords = ['annonce', 'décision', 'mesure', 'réforme', 'nouveau', 'première'];
    importantWords.forEach(word => {
      if (sentence.toLowerCase().includes(word)) score += 0.2;
    });

    return Math.min(score, 1);
  }

  /**
   * Calcul de la densité sémantique du texte
   */
  private calculateSemanticDensity(text: string, entities: SemanticEntity[]): number {
    const words = text.split(/\s+/).length;
    const entityMentions = entities.reduce((sum, entity) => sum + entity.mentions, 0);
    const uniqueEntities = entities.length;

    // Densité basée sur le ratio entités/mots et diversité des entités
    const mentionDensity = entityMentions / words;
    const entityDiversity = uniqueEntities / Math.max(entityMentions, 1);

    return Math.min(mentionDensity * 2 + entityDiversity * 0.5, 1);
  }

  // Méthodes utilitaires

  private extractEntityContext(text: string, entity: string): string {
    const entityIndex = text.toLowerCase().indexOf(entity.toLowerCase());
    if (entityIndex === -1) return '';

    const contextStart = Math.max(0, entityIndex - 100);
    const contextEnd = Math.min(text.length, entityIndex + entity.length + 100);

    return text.slice(contextStart, contextEnd);
  }

  private isCommonWord(word: string): boolean {
    return this.frenchStopWords.has(word.toLowerCase());
  }

  private isCommonPhrase(phrase: string): boolean {
    const commonPhrases = [
      'Le Monde', 'Le Figaro', 'La France', 'Les Français', 'La République',
      'Un Homme', 'Une Femme', 'Tout Le', 'Dans Le', 'Pour La', 'Selon Les'
    ];

    return commonPhrases.some(common =>
      phrase.toLowerCase() === common.toLowerCase()
    );
  }

  private isLikelyPerson(context: string): boolean {
    const personIndicators = [
      'dit', 'déclare', 'affirme', 'explique', 'précise', 'ajoute',
      'selon', 'pour', 'monsieur', 'madame', 'mme', 'm.'
    ];

    return personIndicators.some(indicator =>
      context.toLowerCase().includes(indicator)
    );
  }

  private analyzeSentenceSentiment(sentence: string): number {
    const positiveWords = [
      'bon', 'bien', 'excellent', 'succès', 'victoire', 'progrès',
      'amélioration', 'croissance', 'positif', 'favorable'
    ];

    const negativeWords = [
      'mauvais', 'mal', 'échec', 'crise', 'problème', 'difficulté',
      'baisse', 'chute', 'négatif', 'défavorable'
    ];

    const words = sentence.toLowerCase().split(/\s+/);
    let score = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });

    return score / Math.max(words.length, 1);
  }
}
