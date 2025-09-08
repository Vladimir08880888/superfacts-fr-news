const fs = require('fs');
const path = require('path');

// Create sample advertisements
const sampleAds = [
  {
    id: 'header-tech-promo',
    type: 'banner',
    title: 'Découvrez les dernières innovations Tech',
    content: 'Smartphones, laptops, gadgets - Jusqu\'à 40% de réduction !',
    imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=728&h=90&fit=crop',
    targetUrl: 'https://example.com/tech-promo',
    advertiser: {
      id: 'tech-retailer-1',
      name: 'TechWorld FR',
      email: 'pub@techworld.fr',
      company: 'TechWorld France',
      website: 'https://techworld.fr',
      contactInfo: {
        phone: '+33 1 23 45 67 89',
        address: '123 Avenue des Champs-Élysées',
        city: 'Paris',
        country: 'France',
        postalCode: '75008'
      },
      billingInfo: {
        paymentMethod: 'credit_card',
        billingCycle: 'monthly',
        currency: 'EUR'
      },
      createdAt: new Date().toISOString(),
      isVerified: true
    },
    campaign: {
      id: 'spring-tech-2024',
      name: 'Campagne Printemps Tech 2024',
      description: 'Promotion de printemps sur tous les produits tech',
      budget: 10000,
      dailyBudget: 200,
      spentAmount: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    },
    targeting: {
      categories: ['Tech', 'Économie', 'Innovation'],
      languages: ['fr'],
      countries: ['FR'],
      devices: ['mobile', 'desktop', 'tablet'],
      keywords: ['technologie', 'innovation', 'gadget', 'smartphone']
    },
    placement: 'header',
    pricing: {
      model: 'cpm',
      rate: 3.5,
      currency: 'EUR',
      minBudget: 200
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'sidebar-formation',
    type: 'banner',
    title: 'Formation Développement Web',
    content: 'Devenez développeur en 6 mois. Formations certifiantes avec garantie emploi !',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=250&fit=crop',
    targetUrl: 'https://example.com/formation-dev',
    advertiser: {
      id: 'formation-center-1',
      name: 'CodeAcademy Paris',
      email: 'contact@codeacademy-paris.com',
      company: 'CodeAcademy Paris SARL',
      website: 'https://codeacademy-paris.com',
      contactInfo: {
        phone: '+33 1 45 67 89 01',
        address: '42 Rue de Rivoli',
        city: 'Paris',
        country: 'France',
        postalCode: '75001'
      },
      billingInfo: {
        paymentMethod: 'bank_transfer',
        billingCycle: 'monthly',
        currency: 'EUR'
      },
      createdAt: new Date().toISOString(),
      isVerified: true
    },
    campaign: {
      id: 'formation-dev-2024',
      name: 'Campagne Formation Développeur 2024',
      description: 'Promouvoir nos formations en développement web',
      budget: 8000,
      dailyBudget: 150,
      spentAmount: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    },
    targeting: {
      categories: ['Tech', 'Éducation', 'Carrière'],
      languages: ['fr'],
      countries: ['FR'],
      devices: ['desktop', 'tablet'],
      keywords: ['formation', 'développement', 'programmation', 'carrière', 'emploi']
    },
    placement: 'sidebar',
    pricing: {
      model: 'cpc',
      rate: 2.25,
      currency: 'EUR',
      minBudget: 300
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'mobile-banking-app',
    type: 'banner',
    title: 'Banque Mobile',
    content: 'Nouvelle app bancaire gratuite',
    imageUrl: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=320&h=50&fit=crop',
    targetUrl: 'https://example.com/banking-app',
    advertiser: {
      id: 'neobank-1',
      name: 'NeoBanque FR',
      email: 'marketing@neobanque.fr',
      company: 'NeoBanque France SA',
      website: 'https://neobanque.fr',
      contactInfo: {
        phone: '+33 1 89 67 45 23',
        address: '15 Place Vendôme',
        city: 'Paris',
        country: 'France',
        postalCode: '75001'
      },
      billingInfo: {
        paymentMethod: 'credit_card',
        billingCycle: 'monthly',
        currency: 'EUR'
      },
      createdAt: new Date().toISOString(),
      isVerified: true
    },
    campaign: {
      id: 'mobile-banking-launch',
      name: 'Lancement App Mobile Banking',
      description: 'Campagne de lancement de notre nouvelle app mobile',
      budget: 15000,
      dailyBudget: 300,
      spentAmount: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    },
    targeting: {
      categories: ['Économie', 'Finance', 'Tech'],
      languages: ['fr'],
      countries: ['FR'],
      devices: ['mobile'],
      keywords: ['banque', 'mobile', 'finance', 'gratuit', 'app']
    },
    placement: 'mobile_sticky',
    pricing: {
      model: 'cpm',
      rate: 4.0,
      currency: 'EUR',
      minBudget: 500
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'native-investment-guide',
    type: 'native',
    title: 'Guide Complet : Investir en 2024 - Les 10 Erreurs à Éviter',
    content: 'Découvrez les stratégies d\'investissement qui fonctionnent réellement en 2024. Notre guide gratuit révèle les erreurs les plus courantes et comment les éviter pour maximiser vos gains.',
    excerpt: 'Les experts révèlent enfin les stratégies d\'investissement qui marchent en 2024. Téléchargez notre guide gratuit et évitez les 10 erreurs les plus coûteuses.',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop',
    targetUrl: 'https://example.com/guide-investissement',
    author: 'Marie Dubois, Experte Financière',
    publishDate: new Date().toISOString(),
    category: 'Finance',
    isSponsored: true,
    readTime: 8,
    advertiser: {
      id: 'investment-platform-1',
      name: 'InvestSmart FR',
      email: 'content@investsmart.fr',
      company: 'InvestSmart France',
      website: 'https://investsmart.fr',
      contactInfo: {
        phone: '+33 1 56 78 90 12',
        address: '88 Avenue des Champs-Élysées',
        city: 'Paris',
        country: 'France',
        postalCode: '75008'
      },
      billingInfo: {
        paymentMethod: 'credit_card',
        billingCycle: 'monthly',
        currency: 'EUR'
      },
      createdAt: new Date().toISOString(),
      isVerified: true
    },
    campaign: {
      id: 'investment-education-2024',
      name: 'Campagne Éducation Investissement 2024',
      description: 'Promouvoir notre plateforme d\'investissement via du contenu éducatif',
      budget: 12000,
      dailyBudget: 250,
      spentAmount: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 48 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    },
    targeting: {
      categories: ['Économie', 'Finance', 'Investissement'],
      languages: ['fr'],
      countries: ['FR'],
      devices: ['desktop', 'tablet'],
      keywords: ['investissement', 'finance', 'épargne', 'bourse', 'patrimoine']
    },
    placement: 'between_articles',
    pricing: {
      model: 'cpc',
      rate: 3.5,
      currency: 'EUR',
      minBudget: 600
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 48 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'footer-ecommerce-sale',
    type: 'banner',
    title: 'Soldes d\'Été 2024 - Jusqu\'à 70% de réduction',
    content: 'Mode, Maison, High-Tech : Profitez des meilleures offres avant qu\'il ne soit trop tard !',
    imageUrl: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=728&h=90&fit=crop',
    targetUrl: 'https://example.com/soldes-ete-2024',
    advertiser: {
      id: 'ecommerce-giant-1',
      name: 'MegaShop FR',
      email: 'pub@megashop.fr',
      company: 'MegaShop France SAS',
      website: 'https://megashop.fr',
      contactInfo: {
        phone: '+33 1 34 56 78 90',
        address: '200 Rue de la Paix',
        city: 'Lyon',
        country: 'France',
        postalCode: '69000'
      },
      billingInfo: {
        paymentMethod: 'bank_transfer',
        billingCycle: 'monthly',
        currency: 'EUR'
      },
      createdAt: new Date().toISOString(),
      isVerified: true
    },
    campaign: {
      id: 'summer-sale-2024',
      name: 'Soldes Été 2024',
      description: 'Grande campagne de soldes d\'été tous produits',
      budget: 25000,
      dailyBudget: 500,
      spentAmount: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    },
    targeting: {
      categories: ['Shopping', 'Mode', 'Tech', 'Maison'],
      languages: ['fr'],
      countries: ['FR'],
      devices: ['mobile', 'desktop', 'tablet'],
      keywords: ['soldes', 'promotion', 'réduction', 'shopping', 'mode']
    },
    placement: 'footer',
    pricing: {
      model: 'cpm',
      rate: 2.8,
      currency: 'EUR',
      minBudget: 1000
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Write sample ads to file
const adsFilePath = path.join(dataDir, 'ads.json');
fs.writeFileSync(adsFilePath, JSON.stringify(sampleAds, null, 2));

console.log('✅ Sample ads created successfully!');
console.log(`📄 File: ${adsFilePath}`);
console.log(`📊 Total ads: ${sampleAds.length}`);

// Create initial performance data (empty)
const performanceFilePath = path.join(dataDir, 'ad-performance.json');
if (!fs.existsSync(performanceFilePath)) {
  fs.writeFileSync(performanceFilePath, '[]');
  console.log('✅ Empty performance file created!');
}

console.log('\n🚀 You can now run your app and see sample ads!');
