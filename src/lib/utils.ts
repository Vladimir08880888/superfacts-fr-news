import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 60) {
    return `il y a ${minutes} min`;
  } else if (hours < 24) {
    return `il y a ${hours}h`;
  } else if (days < 7) {
    return `il y a ${days}j`;
  } else {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  }
}

export function formatReadTime(minutes: number): string {
  return `${minutes} min de lecture`;
}

export function getSentimentColor(sentiment?: string): string {
  switch (sentiment) {
    case 'positive':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'negative':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-blue-600 bg-blue-50 border-blue-200';
  }
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'Politique': 'bg-red-100 text-red-800 border-red-200',
    'Économie': 'bg-green-100 text-green-800 border-green-200',
    'Tech': 'bg-blue-100 text-blue-800 border-blue-200',
    'Sport': 'bg-orange-100 text-orange-800 border-orange-200',
    'Culture': 'bg-purple-100 text-purple-800 border-purple-200',
    'Sciences': 'bg-teal-100 text-teal-800 border-teal-200',
    'Santé': 'bg-pink-100 text-pink-800 border-pink-200',
    'International': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Société': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Actualités': 'bg-gray-100 text-gray-800 border-gray-200',
    'Régional': 'bg-cyan-100 text-cyan-800 border-cyan-200'
  };
  
  return colors[category] || colors['Actualités'];
}
