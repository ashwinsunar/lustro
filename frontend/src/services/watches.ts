import api from './api';
import type { Watch, WatchListItem, PaginatedResponse, WatchFilters } from '../types';

export const fetchWatches = async (params?: Partial<WatchFilters>): Promise<PaginatedResponse<WatchListItem>> => {
  const queryParams = new URLSearchParams();
  
  if (params) {
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.sort) queryParams.append('ordering', getSortOrdering(params.sort));
    
    // Convert arrays to comma-separated strings for backend (or append multiple depending on DRF setup)
    if (params.brands?.length) queryParams.append('brands', params.brands.join(','));
    if (params.categories?.length) queryParams.append('categories', params.categories.join(','));
    if (params.movements?.length) queryParams.append('movements', params.movements.join(','));
    if (params.genders?.length) queryParams.append('genders', params.genders.join(','));
    
    if (params.minPrice) queryParams.append('min_price', params.minPrice.toString());
    if (params.maxPrice) queryParams.append('max_price', params.maxPrice.toString());
    if (params.inStockOnly) queryParams.append('in_stock', 'true');
    if (params.onSaleOnly) queryParams.append('on_sale', 'true');
  }

  const { data } = await api.get<PaginatedResponse<WatchListItem>>(`/api/v1/watches/?${queryParams.toString()}`);
  return data;
};

export const fetchWatch = async (slug: string): Promise<Watch> => {
  const { data } = await api.get<Watch>(`/api/v1/watches/${slug}/`);
  return data;
};

export const fetchFeaturedWatches = async (): Promise<WatchListItem[]> => {
  const { data } = await api.get<PaginatedResponse<WatchListItem>>('/api/v1/watches/?is_featured=true&page_size=6');
  return data.results || data; // handle both paginated and non-paginated backend responses
};

export const fetchNewArrivals = async (): Promise<WatchListItem[]> => {
  const { data } = await api.get<PaginatedResponse<WatchListItem>>('/api/v1/watches/?is_new_arrival=true&page_size=8');
  return data.results || data;
};

export const fetchTrending = async (): Promise<WatchListItem[]> => {
  const { data } = await api.get<PaginatedResponse<WatchListItem>>('/api/v1/watches/?is_trending=true&page_size=6');
  return data.results || data;
};

export const fetchBestSellers = async (): Promise<WatchListItem[]> => {
  const { data } = await api.get<PaginatedResponse<WatchListItem>>('/api/v1/watches/?is_best_seller=true&page_size=5');
  return data.results || data;
};

export const fetchRelated = async (watchId: number, brandSlug: string): Promise<WatchListItem[]> => {
  const { data } = await api.get<PaginatedResponse<WatchListItem>>(`/api/v1/watches/?brand=${brandSlug}&exclude=${watchId}&page_size=4`);
  return data.results || data;
};

export const searchWatches = async (q: string): Promise<WatchListItem[]> => {
  if (!q) return [];
  const { data } = await api.get<PaginatedResponse<WatchListItem>>(`/api/v1/watches/?search=${q}`);
  return data.results || data;
};

function getSortOrdering(sort: string): string {
  switch (sort) {
    case 'newest': return '-created_at';
    case 'price_asc': return 'price';
    case 'price_desc': return '-price';
    case 'rating': return '-rating';
    case 'popularity': return '-review_count';
    case 'alphabetical': return 'title';
    default: return '-created_at';
  }
}
