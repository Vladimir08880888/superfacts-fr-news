import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Article } from '@/lib/news-collector';

export interface PDFOptions {
  includeImage?: boolean;
  includeTags?: boolean;
  includeMetadata?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
  language?: string;
}

export class PDFGenerator {
  private static readonly COLORS = {
    primary: '#1f2937',
    secondary: '#6b7280',
    accent: '#3b82f6',
    light: '#f3f4f6'
  };

  private static readonly MARGINS = {
    top: 20,
    left: 15,
    right: 15,
    bottom: 20
  };

  public static generateArticlePDF(
    article: Article, 
    options: PDFOptions = {},
    translatedContent?: {
      title?: string;
      summary?: string;
      category?: string;
      source?: string;
    }
  ): jsPDF {
    const doc = new jsPDF();
    let yPos = this.MARGINS.top;
    
    const {
      includeImage = true,
      includeTags = true,
      includeMetadata = true,
      fontSize = 'medium',
      language = 'fr'
    } = options;

    // Use translated content if provided
    const title = translatedContent?.title || article.title;
    const summary = translatedContent?.summary || article.summary;
    const category = translatedContent?.category || article.category;
    const source = translatedContent?.source || article.source;

    // Configuration des tailles de police
    const fontSizes = {
      small: { title: 16, subtitle: 12, body: 10, caption: 8 },
      medium: { title: 18, subtitle: 14, body: 11, caption: 9 },
      large: { title: 20, subtitle: 16, body: 12, caption: 10 }
    };
    
    const sizes = fontSizes[fontSize];

    // En-tête avec le logo SuperFacts.fr
    this.addHeader(doc, yPos);
    yPos += 25;

    // Catégorie et badge "Hot"
    if (includeMetadata) {
      yPos = this.addCategoryBadge(doc, yPos, category, article.isHot, sizes);
      yPos += 10;
    }

    // Titre principal
    yPos = this.addTitle(doc, yPos, title, sizes);
    yPos += 15;

    // Métadonnées de l'article
    if (includeMetadata) {
      yPos = this.addMetadata(doc, yPos, article, source, sizes);
      yPos += 15;
    }

    // Image (si demandée et disponible)
    if (includeImage && article.imageUrl && article.imageUrl !== '/images/default-article.svg') {
      yPos = this.addImagePlaceholder(doc, yPos, article.imageUrl);
      yPos += 10;
    }

    // Résumé
    yPos = this.addSummary(doc, yPos, summary, sizes);
    yPos += 15;

    // Contenu principal
    yPos = this.addContent(doc, yPos, article.content, sizes);
    yPos += 15;

    // Tags
    if (includeTags && article.tags.length > 0) {
      yPos = this.addTags(doc, yPos, article.tags, sizes);
      yPos += 10;
    }

    // Sentiment analysis
    if (article.sentiment) {
      yPos = this.addSentimentAnalysis(doc, yPos, article.sentiment, sizes);
      yPos += 10;
    }

    // Pied de page
    this.addFooter(doc, article);

    return doc;
  }

  private static addHeader(doc: jsPDF, yPos: number): void {
    // Logo et nom du site
    doc.setFillColor(59, 130, 246); // Bleu SuperFacts
    doc.rect(this.MARGINS.left, yPos - 5, 180, 20, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SuperFacts.fr', this.MARGINS.left + 5, yPos + 8);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Actualités françaises en temps réel', this.MARGINS.left + 80, yPos + 8);
  }

  private static addCategoryBadge(doc: jsPDF, yPos: number, category: string, isHot: boolean, sizes: any): number {
    doc.setTextColor(67, 56, 202);
    doc.setFontSize(sizes.caption);
    doc.setFont('helvetica', 'bold');
    
    let xPos = this.MARGINS.left;
    
    // Badge catégorie
    doc.setFillColor(239, 246, 255);
    const categoryWidth = doc.getTextWidth(category) + 8;
    doc.roundedRect(xPos, yPos - 3, categoryWidth, 12, 2, 2, 'F');
    doc.text(category, xPos + 4, yPos + 4);
    
    xPos += categoryWidth + 10;
    
    // Badge "Hot" si applicable
    if (isHot) {
      doc.setFillColor(239, 68, 68);
      doc.setTextColor(255, 255, 255);
      const hotWidth = doc.getTextWidth('🔥 HOT') + 8;
      doc.roundedRect(xPos, yPos - 3, hotWidth, 12, 2, 2, 'F');
      doc.text('🔥 HOT', xPos + 4, yPos + 4);
    }
    
    return yPos + 12;
  }

  private static addTitle(doc: jsPDF, yPos: number, title: string, sizes: any): number {
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(sizes.title);
    doc.setFont('helvetica', 'bold');
    
    // Gestion du retour à la ligne pour les titres longs
    const lines = doc.splitTextToSize(title, 180);
    
    for (let i = 0; i < lines.length; i++) {
      doc.text(lines[i], this.MARGINS.left, yPos + (i * 8));
    }
    
    return yPos + (lines.length * 8);
  }

  private static addMetadata(doc: jsPDF, yPos: number, article: Article, source: string, sizes: any): number {
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(sizes.caption);
    doc.setFont('helvetica', 'normal');
    
    const publishDate = new Date(article.publishDate).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let metadataText = `Par ${source} • ${publishDate}`;
    
    if (article.readTime) {
      metadataText += ` • ${article.readTime} min de lecture`;
    }
    
    doc.text(metadataText, this.MARGINS.left, yPos);
    
    // Ligne de séparation
    doc.setDrawColor(229, 231, 235);
    doc.line(this.MARGINS.left, yPos + 5, 195, yPos + 5);
    
    return yPos + 10;
  }

  private static addImagePlaceholder(doc: jsPDF, yPos: number, imageUrl: string): number {
    // Placeholder pour l'image (box avec texte explicatif)
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.rect(this.MARGINS.left, yPos, 180, 60, 'FD');
    
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Image de l\'article', this.MARGINS.left + 80, yPos + 25);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Source: ${imageUrl}`, this.MARGINS.left + 5, yPos + 35);
    
    return yPos + 65;
  }

  private static addSummary(doc: jsPDF, yPos: number, summary: string, sizes: any): number {
    doc.setTextColor(75, 85, 99);
    doc.setFontSize(sizes.subtitle);
    doc.setFont('helvetica', 'bold');
    doc.text('Résumé', this.MARGINS.left, yPos);
    
    yPos += 8;
    
    doc.setFontSize(sizes.body);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    
    const summaryLines = doc.splitTextToSize(summary, 180);
    
    for (let i = 0; i < summaryLines.length; i++) {
      // Vérifier si on a besoin d'une nouvelle page
      if (yPos + 15 > 280) {
        doc.addPage();
        yPos = this.MARGINS.top;
      }
      doc.text(summaryLines[i], this.MARGINS.left, yPos + (i * 6));
    }
    
    return yPos + (summaryLines.length * 6);
  }

  private static addContent(doc: jsPDF, yPos: number, content: string, sizes: any): number {
    doc.setTextColor(75, 85, 99);
    doc.setFontSize(sizes.subtitle);
    doc.setFont('helvetica', 'bold');
    doc.text('Contenu complet', this.MARGINS.left, yPos);
    
    yPos += 8;
    
    doc.setFontSize(sizes.body);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    
    // Nettoyer le contenu et le diviser en paragraphes
    const cleanContent = content.replace(/\s+/g, ' ').trim();
    const paragraphs = cleanContent.split('.').filter(p => p.trim().length > 10);
    
    for (const paragraph of paragraphs.slice(0, 10)) { // Limiter le contenu
      if (paragraph.trim()) {
        const paragraphText = paragraph.trim() + '.';
        const lines = doc.splitTextToSize(paragraphText, 180);
        
        for (let i = 0; i < lines.length; i++) {
          // Vérifier si on a besoin d'une nouvelle page
          if (yPos + 15 > 270) {
            doc.addPage();
            yPos = this.MARGINS.top;
          }
          doc.text(lines[i], this.MARGINS.left, yPos + (i * 5));
        }
        
        yPos += (lines.length * 5) + 3;
      }
    }
    
    return yPos;
  }

  private static addTags(doc: jsPDF, yPos: number, tags: string[], sizes: any): number {
    doc.setTextColor(75, 85, 99);
    doc.setFontSize(sizes.subtitle);
    doc.setFont('helvetica', 'bold');
    doc.text('Tags', this.MARGINS.left, yPos);
    
    yPos += 8;
    
    doc.setFontSize(sizes.caption);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(59, 130, 246);
    
    let xPos = this.MARGINS.left;
    const tagsText = tags.slice(0, 8).map(tag => `#${tag}`).join(' • ');
    
    const tagLines = doc.splitTextToSize(tagsText, 180);
    
    for (let i = 0; i < tagLines.length; i++) {
      doc.text(tagLines[i], this.MARGINS.left, yPos + (i * 5));
    }
    
    return yPos + (tagLines.length * 5);
  }

  private static addSentimentAnalysis(doc: jsPDF, yPos: number, sentiment: string, sizes: any): number {
    doc.setTextColor(75, 85, 99);
    doc.setFontSize(sizes.subtitle);
    doc.setFont('helvetica', 'bold');
    doc.text('Analyse de sentiment', this.MARGINS.left, yPos);
    
    yPos += 8;
    
    const sentimentColors = {
      positive: { color: [34, 197, 94] as [number, number, number], emoji: '😊', text: 'Positif' },
      negative: { color: [239, 68, 68] as [number, number, number], emoji: '😔', text: 'Négatif' },
      neutral: { color: [107, 114, 128] as [number, number, number], emoji: '😐', text: 'Neutre' }
    };
    
    const sentimentData = sentimentColors[sentiment as keyof typeof sentimentColors] || sentimentColors.neutral;
    
    doc.setTextColor(sentimentData.color[0], sentimentData.color[1], sentimentData.color[2]);
    doc.setFontSize(sizes.body);
    doc.setFont('helvetica', 'normal');
    doc.text(`${sentimentData.emoji} ${sentimentData.text}`, this.MARGINS.left, yPos);
    
    return yPos + 5;
  }

  private static addFooter(doc: jsPDF, article: Article): void {
    const pageCount = doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Ligne de séparation
      doc.setDrawColor(229, 231, 235);
      doc.line(this.MARGINS.left, 280, 195, 280);
      
      // Informations de pied de page
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      
      // Gauche: Source originale
      doc.text(`Source: ${article.sourceUrl}`, this.MARGINS.left, 287);
      
      // Droite: Page et date de génération
      const pageText = `Page ${i}/${pageCount} • Généré le ${new Date().toLocaleDateString('fr-FR')}`;
      const pageWidth = doc.getTextWidth(pageText);
      doc.text(pageText, 195 - pageWidth, 287);
      
      // Centre: SuperFacts.fr
      doc.text('SuperFacts.fr', 105 - (doc.getTextWidth('SuperFacts.fr') / 2), 287);
    }
  }

  public static async downloadArticlePDF(
    article: Article, 
    options: PDFOptions = {},
    translatedContent?: {
      title?: string;
      summary?: string;
      category?: string;
      source?: string;
    }
  ): Promise<void> {
    const doc = this.generateArticlePDF(article, options, translatedContent);
    
    // Nom de fichier sécurisé
    const safeTitle = article.title
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    
    const fileName = `SuperFacts-${safeTitle}-${Date.now()}.pdf`;
    
    doc.save(fileName);
  }
}
