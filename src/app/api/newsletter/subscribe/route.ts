import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface NewsletterSubscription {
  id: string;
  email: string;
  categories: string[];
  frequency: 'daily' | 'weekly';
  language: string;
  subscribedAt: Date;
  isActive: boolean;
  unsubscribeToken: string;
}

const NEWSLETTER_DATA_FILE = path.join(process.cwd(), 'data', 'newsletter-subscriptions.json');

// Ensure data directory and file exist
function ensureDataFile() {
  const dataDir = path.dirname(NEWSLETTER_DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(NEWSLETTER_DATA_FILE)) {
    fs.writeFileSync(NEWSLETTER_DATA_FILE, '[]');
  }
}

function getSubscriptions(): NewsletterSubscription[] {
  ensureDataFile();
  try {
    const data = fs.readFileSync(NEWSLETTER_DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading newsletter subscriptions:', error);
    return [];
  }
}

function saveSubscriptions(subscriptions: NewsletterSubscription[]) {
  ensureDataFile();
  try {
    fs.writeFileSync(NEWSLETTER_DATA_FILE, JSON.stringify(subscriptions, null, 2));
  } catch (error) {
    console.error('Error saving newsletter subscriptions:', error);
    throw new Error('Failed to save subscription');
  }
}

function generateUnsubscribeToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const { email, categories, frequency, language } = await request.json();

    // Validation
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Adresse email invalide' },
        { status: 400 }
      );
    }

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Veuillez sélectionner au moins une catégorie' },
        { status: 400 }
      );
    }

    if (!frequency || !['daily', 'weekly'].includes(frequency)) {
      return NextResponse.json(
        { success: false, error: 'Fréquence invalide' },
        { status: 400 }
      );
    }

    const subscriptions = getSubscriptions();
    
    // Check if email already exists
    const existingSubscription = subscriptions.find(sub => sub.email === email);
    
    if (existingSubscription) {
      if (existingSubscription.isActive) {
        return NextResponse.json(
          { success: false, error: 'Cette adresse email est déjà abonnée' },
          { status: 409 }
        );
      } else {
        // Reactivate existing subscription
        existingSubscription.isActive = true;
        existingSubscription.categories = categories;
        existingSubscription.frequency = frequency;
        existingSubscription.subscribedAt = new Date();
        saveSubscriptions(subscriptions);
        
        return NextResponse.json({
          success: true,
          message: 'Abonnement réactivé avec succès'
        });
      }
    }

    // Create new subscription
    const newSubscription: NewsletterSubscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      email,
      categories,
      frequency,
      language: language || 'fr',
      subscribedAt: new Date(),
      isActive: true,
      unsubscribeToken: generateUnsubscribeToken()
    };

    subscriptions.push(newSubscription);
    saveSubscriptions(subscriptions);

    // Here you would typically send a welcome email
    // await sendWelcomeEmail(newSubscription);

    return NextResponse.json({
      success: true,
      message: 'Abonnement confirmé avec succès',
      subscriptionId: newSubscription.id
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// Get subscription statistics (for analytics)
export async function GET() {
  try {
    const subscriptions = getSubscriptions();
    const activeSubscriptions = subscriptions.filter(sub => sub.isActive);
    
    const stats = {
      total: activeSubscriptions.length,
      daily: activeSubscriptions.filter(sub => sub.frequency === 'daily').length,
      weekly: activeSubscriptions.filter(sub => sub.frequency === 'weekly').length,
      categories: activeSubscriptions.reduce((acc: Record<string, number>, sub) => {
        sub.categories.forEach(cat => {
          acc[cat] = (acc[cat] || 0) + 1;
        });
        return acc;
      }, {}),
      languages: activeSubscriptions.reduce((acc: Record<string, number>, sub) => {
        acc[sub.language] = (acc[sub.language] || 0) + 1;
        return acc;
      }, {}),
      recentSubscriptions: activeSubscriptions
        .sort((a, b) => new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime())
        .slice(0, 10)
        .map(sub => ({
          id: sub.id,
          subscribedAt: sub.subscribedAt,
          categories: sub.categories,
          frequency: sub.frequency
        }))
    };

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Newsletter stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch newsletter statistics' },
      { status: 500 }
    );
  }
}
