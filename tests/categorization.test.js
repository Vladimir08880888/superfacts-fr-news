const { FrenchNewsCollector } = require('../src/lib/news-collector');

describe('News Categorization Tests', () => {
    let collector;

    beforeAll(() => {
        collector = new FrenchNewsCollector();
    });

    describe('Economic Articles', () => {
        test('should categorize bakery competition as Economy', () => {
            const category = collector.categorizeArticle(
                'REPORTAGE. Guerre de la baguette : "Pour survivre, il faut se diversifier…"',
                'Face à la baisse de consommation du pain et à la concurrence des grandes enseignes, les boulangeries artisanales doivent sans cesse se réinventer.'
            );
            expect(category).toBe('Économie');
        });

        test('should categorize business articles as Economy', () => {
            const category = collector.categorizeArticle(
                'Les entreprises face à la concurrence',
                'Les petites entreprises doivent s\'adapter pour survivre face aux grands groupes.'
            );
            expect(category).toBe('Économie');
        });

        test('should categorize market articles as Economy', () => {
            const category = collector.categorizeArticle(
                'Le marché français en difficulté',
                'Les prix augmentent et la consommation baisse'
            );
            expect(category).toBe('Économie');
        });
    });

    describe('Tag Generation', () => {
        test('should not include MMA tag for bakery articles', () => {
            const tags = collector.generateTags(
                'REPORTAGE. Guerre de la baguette',
                'Face à la concurrence entre boulangeries',
                '',
                'Économie'
            );
            expect(tags).not.toContain('mma');
            expect(tags).toContain('économie');
        });

        test('should include appropriate tags for economic articles', () => {
            const tags = collector.generateTags(
                'Les entreprises en difficulté',
                'Face à la concurrence, les petites entreprises doivent innover',
                '',
                'Économie'
            );
            expect(tags).toContain('économie');
            expect(tags).toContain('entreprise');
        });

        test('should not include international tag for local business articles', () => {
            const tags = collector.generateTags(
                'Les boulangeries locales',
                'Commerce local, entreprises françaises, marché national',
                '',
                'Économie'
            );
            expect(tags).toContain('économie');
            expect(tags).not.toContain('international');
        });
    });

    describe('Priority System', () => {
        test('economic patterns should have priority over international for business contexts', () => {
            const category = collector.categorizeArticle(
                'Guerre des prix dans le commerce',
                'Les entreprises se livrent une bataille commerciale acharnée'
            );
            expect(category).toBe('Économie');
        });

        test('should correctly categorize sports articles', () => {
            const category = collector.categorizeArticle(
                'Match France-Espagne',
                'Le football français affronte l\'Espagne en finale'
            );
            expect(category).toBe('Sport');
        });

        test('should correctly categorize technology articles', () => {
            const category = collector.categorizeArticle(
                'Intelligence artificielle en France',
                'Les nouvelles technologies transforment les entreprises'
            );
            expect(category).toBe('Technologie');
        });
    });

    describe('Edge Cases', () => {
        test('should handle articles with conflicting keywords', () => {
            const category = collector.categorizeArticle(
                'Guerre économique entre entreprises',
                'Une bataille commerciale fait rage sur le marché français'
            );
            expect(category).toBe('Économie'); // Should prioritize economic context
        });

        test('should handle international business articles correctly', () => {
            const category = collector.categorizeArticle(
                'Commerce international : la France exporte',
                'Les entreprises françaises conquièrent les marchés étrangers'
            );
            expect(category).toBe('Économie'); // Business context prioritized
        });
    });
});

module.exports = {};
