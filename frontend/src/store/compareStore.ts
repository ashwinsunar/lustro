import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WatchListItem } from '../types';

const MAX_COMPARE = 3;

interface CompareStore {
  items: WatchListItem[];
  addItem: (item: WatchListItem) => boolean; // returns false if at limit
  removeItem: (id: number) => void;
  toggleItem: (item: WatchListItem) => boolean;
  isComparing: (id: number) => boolean;
  clearCompare: () => void;
  count: () => number;
  isFull: () => boolean;
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const state = get();
        if (state.items.length >= MAX_COMPARE) return false;
        if (state.items.some((i) => i.id === item.id)) return true;
        set((s) => ({ items: [...s.items, item] }));
        return true;
      },

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      toggleItem: (item) => {
        const state = get();
        if (state.isComparing(item.id)) {
          state.removeItem(item.id);
          return true;
        }
        return state.addItem(item);
      },

      isComparing: (id) => get().items.some((i) => i.id === id),

      clearCompare: () => set({ items: [] }),

      count: () => get().items.length,

      isFull: () => get().items.length >= MAX_COMPARE,
    }),
    { name: 'lustro-compare', version: 1 }
  )
);
