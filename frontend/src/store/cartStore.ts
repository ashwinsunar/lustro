import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '../types';

interface CartStore {
  items: CartItem[];
  savedForLater: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  saveForLater: (id: number) => void;
  moveToCart: (id: number) => void;
  removeSaved: (id: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      savedForLater: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id
                  ? { ...i, quantity: Math.min(i.quantity + item.quantity, 10) }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: Math.min(item.quantity, 10) }] };
        }),

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQuantity: (id, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => i.id !== id) };
          }
          return {
            items: state.items.map((i) =>
              i.id === id ? { ...i, quantity: Math.min(quantity, 10) } : i
            ),
          };
        }),

      saveForLater: (id) =>
        set((state) => {
          const item = state.items.find((i) => i.id === id);
          if (!item) return state;
          return {
            items: state.items.filter((i) => i.id !== id),
            savedForLater: [...state.savedForLater.filter((i) => i.id !== id), item],
          };
        }),

      moveToCart: (id) =>
        set((state) => {
          const item = state.savedForLater.find((i) => i.id === id);
          if (!item) return state;
          const existingInCart = state.items.find((i) => i.id === id);
          return {
            savedForLater: state.savedForLater.filter((i) => i.id !== id),
            items: existingInCart
              ? state.items.map((i) =>
                  i.id === id ? { ...i, quantity: Math.min(i.quantity + 1, 10) } : i
                )
              : [...state.items, { ...item, quantity: 1 }],
          };
        }),

      removeSaved: (id) =>
        set((state) => ({
          savedForLater: state.savedForLater.filter((i) => i.id !== id),
        })),

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, item) => {
          const price = parseFloat(item.discount_price ?? item.price);
          return sum + price * item.quantity;
        }, 0),
    }),
    { name: 'lustro-cart', version: 2 }
  )
);
