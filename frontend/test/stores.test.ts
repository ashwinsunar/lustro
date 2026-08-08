// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { useCompareStore } from '../src/store/compareStore';
import { useWishlistStore } from '../src/store/wishlistStore';
import type { WatchListItem } from '../src/types';

function watch(id: number): WatchListItem {
  return {
    id,
    title: `Watch ${id}`,
    slug: `watch-${id}`,
    brand: { id: 1, name: 'Rolex', slug: 'rolex' },
    category: { id: 1, name: 'Dive', slug: 'dive' },
    price: '10000',
    discount_price: null,
    movement: 'automatic',
    gender: 'men',
    in_stock: true,
    is_featured: false,
    is_trending: false,
    is_new_arrival: false,
    is_best_seller: false,
    rating: '4.5',
    review_count: 2,
    images: [],
  };
}

describe('compareStore', () => {
  beforeEach(() => {
    useCompareStore.setState({ items: [] });
  });

  it('enforces a maximum of three compared pieces', () => {
    const store = useCompareStore.getState();
    expect(store.addItem(watch(1))).toBe(true);
    expect(store.addItem(watch(2))).toBe(true);
    expect(store.addItem(watch(3))).toBe(true);
    expect(store.addItem(watch(4))).toBe(false);
    expect(useCompareStore.getState().count()).toBe(3);
    expect(useCompareStore.getState().isFull()).toBe(true);
  });

  it('toggles a piece on and off', () => {
    const store = useCompareStore.getState();
    expect(store.toggleItem(watch(1))).toBe(true);
    expect(useCompareStore.getState().isComparing(1)).toBe(true);
    expect(store.toggleItem(watch(1))).toBe(true);
    expect(useCompareStore.getState().isComparing(1)).toBe(false);
  });

  it('clears the list', () => {
    const store = useCompareStore.getState();
    store.addItem(watch(1));
    store.clearCompare();
    expect(useCompareStore.getState().count()).toBe(0);
  });
});

describe('wishlistStore', () => {
  beforeEach(() => {
    useWishlistStore.setState({ items: [] });
  });

  it('adds and removes items', () => {
    const store = useWishlistStore.getState();
    store.toggleItem(watch(1));
    expect(useWishlistStore.getState().isWishlisted(1)).toBe(true);
    store.toggleItem(watch(1));
    expect(useWishlistStore.getState().isWishlisted(1)).toBe(false);
    expect(useWishlistStore.getState().count()).toBe(0);
  });

  it('does not duplicate an item on add', () => {
    const store = useWishlistStore.getState();
    store.addItem(watch(1));
    store.addItem(watch(1));
    expect(useWishlistStore.getState().count()).toBe(1);
  });

  it('clears the wishlist', () => {
    const store = useWishlistStore.getState();
    store.addItem(watch(1));
    store.addItem(watch(2));
    store.clearWishlist();
    expect(useWishlistStore.getState().count()).toBe(0);
  });
});