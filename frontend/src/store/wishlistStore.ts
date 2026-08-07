import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WatchListItem } from '../types';

interface WishlistStore {
  items: WatchListItem[];
  addItem: (item: WatchListItem) => void;
  removeItem: (id: number) => void;
  toggleItem: (item: WatchListItem) => void;
  isWishlisted: (id: number) => boolean;
  clearWishlist: () => void;
  count: () => number;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          if (state.items.some((i) => i.id === item.id)) return state;
          return { items: [...state.items, item] };
        }),

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      toggleItem: (item) => {
        const state = get();
        if (state.isWishlisted(item.id)) {
          state.removeItem(item.id);
        } else {
          state.addItem(item);
        }
      },

      isWishlisted: (id) => get().items.some((i) => i.id === id),

      clearWishlist: () => set({ items: [] }),

      count: () => get().items.length,
    }),
    { name: 'lustro-wishlist', version: 1 }
  )
);
