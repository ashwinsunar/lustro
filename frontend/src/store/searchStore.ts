import { create } from 'zustand';

interface SearchStore {
  query: string;
  isSearchOpen: boolean;
  setQuery: (q: string) => void;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  query: '',
  isSearchOpen: false,

  setQuery: (q) => set({ query: q }),

  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false, query: '' }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  clearSearch: () => set({ query: '' }),
}));