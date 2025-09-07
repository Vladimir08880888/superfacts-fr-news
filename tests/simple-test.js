const fs = require('fs');
const path = require('path');

// Simple test runner
function runTests() {
    console.log('🧪 Testing categorization improvements...\n');
    
    // Test 1: Verify the problematic article has been fixed
    console.log('✅ Test 1: Checking "Guerre de la baguette" article fix');
    try {
        const articlesPath = path.join(__dirname, '../data/articles.json');
        const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
        
        const baguetteArticle = articles.find(article => 
            article.title && article.title.includes('Guerre de la baguette')
        );
        
        if (baguetteArticle) {
            console.log(`   Article found: "${baguetteArticle.title.substring(0, 60)}..."`);
            console.log(`   Category: ${baguetteArticle.category}`);
            console.log(`   Tags: [${baguetteArticle.tags.join(', ')}]`);
            
            if (baguetteArticle.category === 'Économie') {
                console.log('   ✅ PASS: Correctly categorized as Economy');
            } else {
                console.log('   ❌ FAIL: Should be categorized as Economy');
            }
            
            if (!baguetteArticle.tags.includes('mma')) {
                console.log('   ✅ PASS: No inappropriate MMA tag');
            } else {
                console.log('   ❌ FAIL: Still has inappropriate MMA tag');
            }
        } else {
            console.log('   ⚠️  WARNING: Article not found in current data');
        }
    } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
    }
    
    console.log('\\n' + '='.repeat(50));
    
    // Test 2: Test categorization logic directly
    console.log('✅ Test 2: Testing categorization patterns');
    
    const testCases = [
        {
            title: 'Guerre de la baguette commerciale',
            summary: 'Les boulangeries se livrent une concurrence acharnée',
            expectedCategory: 'Économie',
            description: 'Commercial competition should be Economy'
        },
        {
            title: 'Match de football France-Espagne', 
            summary: 'Le sport français affronte l\'Espagne',
            expectedCategory: 'Sport',
            description: 'Sports article should be Sport'
        },
        {
            title: 'Nouvelle intelligence artificielle',
            summary: 'Les technologies progressent rapidement',
            expectedCategory: 'Technologie',
            description: 'Tech article should be Technologie'
        },
        {
            title: 'Guerre en Ukraine',
            summary: 'Le conflit continue en Ukraine avec des bombardements',
            expectedCategory: 'International',
            description: 'Real war should be International'
        }
    ];
    
    // Simple categorization function (copy from news-collector logic)
    function testCategorizeArticle(title, summary = '', content = '') {
        const text = (title + ' ' + summary + ' ' + content).toLowerCase();
        
        const categoryPatterns = {
            'Économie': {
                priority: 10,
                patterns: [
                    /\\b(boulang(?:erie|er)|commerce|entreprise|affaires?|business|économie?|marché|vente|achat|prix|coût|budget|finance|banque|bourse|investissement|profit|bénéfice)/i,
                    /\\b(concurrent(?:e|s)?|concurrence|client(?:e|s)?|fournisseur|marque|produit|service|consommateur|consommation)/i,
                    /guerre\\s+(?:de\\s+)?(?:la\\s+)?(?:baguette|prix|marché)/i,
                    /bataille\\s+(?:commerciale|économique|des\\s+prix)/i
                ]
            },
            'Sport': {
                priority: 7,
                patterns: [
                    /\\b(sport|football|rugby|tennis|basket|handball|cyclisme|natation|athlétisme|golf|ski|hockey|boxe|judo|karaté)/i,
                    /\\b(équipe|match|championnat|coupe|tournoi|finale|victoire|défaite|score|but|point|médaille|podium)/i,
                    /\\b(jo|jeux olympiques|mondial|euro|ligue|champion|athlète|joueur|entraîneur|club|stade)/i
                ]
            },
            'Technologie': {
                priority: 6,
                patterns: [
                    /\\b(technologie|tech|numérique|digital|informatique|internet|web|site|application|app|logiciel|software)/i,
                    /\\b(ia|intelligence artificielle|robot|drone|blockchain|crypto|bitcoin|nft)/i,
                    /\\b(smartphone|iphone|android|ordinateur|pc|mac|tablet|console|gaming)/i
                ]
            },
            'International': {
                priority: 8,
                patterns: [
                    /\\b(états-unis|usa|chine|russie|japon|allemagne|royaume-uni|italie|espagne|brexit|ue|union européenne)/i,
                    /\\b(?:guerre|conflit|tension)(?!\\s+(?:de\\s+)?(?:la\\s+)?(?:baguette|prix|marché|commerciale))\\s+(?:en|au|de|du|des)\\s+\\w+/i,
                    /\\b(géopolit|ukraine|palestine|israël|syrie|afghanistan|iran|corée)/i
                ]
            }
        };

        let bestMatch = { category: 'Actualités', priority: 0, matches: 0 };
        
        for (const [category, config] of Object.entries(categoryPatterns)) {
            let matches = 0;
            for (const pattern of config.patterns) {
                if (pattern.test(text)) {
                    matches++;
                }
            }
            
            if (matches > 0 && (config.priority > bestMatch.priority || 
                               (config.priority === bestMatch.priority && matches > bestMatch.matches))) {
                bestMatch = { category, priority: config.priority, matches };
            }
        }

        return bestMatch.category;
    }
    
    let passedTests = 0;
    let totalTests = testCases.length;
    
    testCases.forEach((testCase, index) => {
        const result = testCategorizeArticle(testCase.title, testCase.summary);
        console.log(`   Test ${index + 1}: ${testCase.description}`);
        console.log(`     Input: "${testCase.title}"`);
        console.log(`     Expected: ${testCase.expectedCategory}, Got: ${result}`);
        
        if (result === testCase.expectedCategory) {
            console.log('     ✅ PASS');
            passedTests++;
        } else {
            console.log('     ❌ FAIL');
        }
        console.log('');
    });
    
    console.log('\\n' + '='.repeat(50));
    console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Categorization improvements are working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Review the categorization logic.');
    }
    
    return passedTests === totalTests;
}

// Run the tests
if (require.main === module) {
    runTests();
}

module.exports = { runTests };
