// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { useCartStore } from '../src/store/cartStore';
import type { CartItem } from '../src/types';

function makeItem(id: number, price: string, discount_price?: string | null): CartItem {
  return {
    id,
    title: `Watch ${id}`,
    price,
    discount_price,
    brandName: 'Rolex',
    image: '/w.png',
    quantity: 1,
    slug: `watch-${id}`,
  };
}

describe('cartStore', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], savedForLater: [] });
  });

  it('adds an item', () => {
    useCartStore.getState().addItem(makeItem(1, '1000'));
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().totalItems()).toBe(1);
  });

  it('merges duplicate items and caps quantity at 10', () => {
    const store = useCartStore.getState();
    store.addItem({ ...makeItem(1, '1000'), quantity: 7 });
    store.addItem({ ...makeItem(1, '1000'), quantity: 7 });
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(10);
  });

  it('removes an item', () => {
    const store = useCartStore.getState();
    store.addItem(makeItem(1, '1000'));
    store.removeItem(1);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('uses discount price when computing totals', () => {
    const store = useCartStore.getState();
    store.addItem({ ...makeItem(1, '1000', '750'), quantity: 2 });
    expect(useCartStore.getState().totalPrice()).toBe(1500);
  });

  it('decrements quantity to zero removes the item', () => {
    const store = useCartStore.getState();
    store.addItem(makeItem(1, '1000'));
    store.updateQuantity(1, 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('saves for later and moves back', () => {
    const store = useCartStore.getState();
    store.addItem(makeItem(1, '1000'));
    store.saveForLater(1);
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().savedForLater).toHaveLength(1);
    useCartStore.getState().moveToCart(1);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().savedForLater).toHaveLength(0);
  });
});