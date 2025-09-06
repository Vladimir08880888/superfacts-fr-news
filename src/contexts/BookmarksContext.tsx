'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Article } from '@/types/article';

interface BookmarksContextType {
  bookmarks: Article[];
  addBookmark: (article: Article) => void;
  removeBookmark: (articleId: string) => void;
  isBookmarked: (articleId: string) => boolean;
  clearBookmarks: () => void;
}

const BookmarksContext = createContext<BookmarksContextType | undefined>(undefined);

export function BookmarksProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<Article[]>([]);

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedBookmarks = localStorage.getItem('superfacts-bookmarks');
      if (savedBookmarks) {
        try {
          const parsedBookmarks = JSON.parse(savedBookmarks);
          setBookmarks(parsedBookmarks);
        } catch (error) {
          console.error('Failed to load bookmarks:', error);
        }
      }
    }
  }, []);

  // Save bookmarks to localStorage whenever bookmarks change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('superfacts-bookmarks', JSON.stringify(bookmarks));
    }
  }, [bookmarks]);

  const addBookmark = (article: Article) => {
    setBookmarks(prev => {
      // Check if article is already bookmarked
      if (prev.some(bookmark => bookmark.id === article.id)) {
        return prev;
      }
      // Add timestamp for when it was bookmarked
      const bookmarkedArticle = {
        ...article,
        bookmarkedAt: new Date().toISOString(),
      };
      return [bookmarkedArticle, ...prev];
    });
  };

  const removeBookmark = (articleId: string) => {
    setBookmarks(prev => prev.filter(bookmark => bookmark.id !== articleId));
  };

  const isBookmarked = (articleId: string) => {
    return bookmarks.some(bookmark => bookmark.id === articleId);
  };

  const clearBookmarks = () => {
    setBookmarks([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('superfacts-bookmarks');
    }
  };

  return (
    <BookmarksContext.Provider
      value={{
        bookmarks,
        addBookmark,
        removeBookmark,
        isBookmarked,
        clearBookmarks,
      }}
    >
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarksContext);
  if (context === undefined) {
    throw new Error('useBookmarks must be used within a BookmarksProvider');
  }
  return context;
}
