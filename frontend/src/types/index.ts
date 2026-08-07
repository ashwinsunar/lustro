// ============================================================
// Lustro — Centralized Type Definitions
// ============================================================

// ---------- Brand ----------
export interface Brand {
  id: number;
  name: string;
  slug: string;
  description: string;
  logo: string | null;
  founded_year?: number;
  country?: string;
  watch_count?: number;
}

// ---------- Category ----------
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string | null;
  watch_count?: number;
}

// ---------- Collection ----------
export interface Collection {
  id: number;
  name: string;
  slug: string;
  description: string;
  cover_image: string | null;
  featured: boolean;
}

// ---------- Watch Image ----------
export interface WatchImage {
  id: number;
  image: string;
  alt_text?: string;
  is_primary: boolean;
  order: number;
}

// ---------- Watch Video ----------
export interface WatchVideo {
  id: number;
  video: string;
  thumbnail: string | null;
  title: string;
}

// ---------- Watch ----------
export type MovementType = 'automatic' | 'manual' | 'quartz' | 'spring_drive';
export type GenderType = 'men' | 'women' | 'unisex';

export interface Watch {
  id: number;
  title: string;
  slug: string;
  brand: Brand;
  category: Category;
  collection?: Collection | null;
  price: string;
  discount_price: string | null;
  reference_number: string;
  movement: MovementType;
  case_size: string;
  case_material: string;
  dial_color: string;
  strap_material: string;
  water_resistance: string;
  description: string;
  gender: GenderType;
  warranty_period: string;
  is_featured: boolean;
  is_trending: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  in_stock: boolean;
  stock_count: number;
  rating: string;
  review_count: number;
  created_at: string;
  updated_at: string;
  images: WatchImage[];
  videos?: WatchVideo[];
}

// ---------- Watch List Item (lighter) ----------
export interface WatchListItem {
  id: number;
  title: string;
  slug: string;
  brand: Pick<Brand, 'id' | 'name' | 'slug'>;
  category: Pick<Category, 'id' | 'name' | 'slug'>;
  price: string;
  discount_price: string | null;
  movement: MovementType;
  gender: GenderType;
  in_stock: boolean;
  is_featured: boolean;
  is_trending: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  rating: string;
  review_count: number;
  images: WatchImage[];
}

// ---------- Cart ----------
export interface CartItem {
  id: number;
  title: string;
  price: string;
  discount_price?: string | null;
  brandName: string;
  image: string;
  quantity: number;
  slug: string;
}

// ---------- Review ----------
export interface Review {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    avatar?: string | null;
  };
  watch: number;
  rating: number;
  title: string;
  body: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  photos?: string[];
  created_at: string;
  reply?: string | null;
  reply_at?: string | null;
}

// ---------- User ----------
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar?: string | null;
  role: 'customer' | 'seller' | 'admin';
  is_verified: boolean;
  created_at: string;
}

// ---------- Address ----------
export interface Address {
  id: number;
  user: number;
  label: string;
  full_name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

// ---------- Order ----------
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface OrderItem {
  id: number;
  watch: WatchListItem;
  quantity: number;
  unit_price: string;
  total_price: string;
}

export interface Order {
  id: number;
  order_number: string;
  user: User;
  items: OrderItem[];
  shipping_address: Address;
  status: OrderStatus;
  payment_method: string;
  payment_status: string;
  subtotal: string;
  shipping_fee: string;
  discount: string;
  total: string;
  notes?: string;
  gift_wrapping: boolean;
  created_at: string;
  updated_at: string;
}

// ---------- Pagination ----------
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ---------- Filter State ----------
export interface WatchFilters {
  brands: string[];
  categories: string[];
  movements: string[];
  genders: string[];
  minPrice: number;
  maxPrice: number;
  inStockOnly: boolean;
  onSaleOnly: boolean;
  search: string;
  sort: SortOption;
  page: number;
  view: 'grid' | 'list';
}

export type SortOption =
  | 'newest'
  | 'price_asc'
  | 'price_desc'
  | 'rating'
  | 'popularity'
  | 'alphabetical';

// ---------- Auth ----------
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
