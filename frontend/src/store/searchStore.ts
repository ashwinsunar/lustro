import { create } from 'zustand';
import type { WatchListItem } from '../types';

interface SearchStore {
  query: string;
  suggestions: WatchListItem[];
  isSearchOpen: boolean;
  isLoading: boolean;
  setQuery: (q: string) => void;
  setSuggestions: (items: WatchListItem[]) => void;
  setIsLoading: (loading: boolean) => void;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  query: '',
  suggestions: [],
  isSearchOpen: false,
  isLoading: false,

  setQuery: (q) => set({ query: q }),
  setSuggestions: (items) => set({ suggestions: items }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false, query: '', suggestions: [] }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  clearSearch: () => set({ query: '', suggestions: [] }),
}));
