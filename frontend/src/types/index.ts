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
  currency?: string;
  movement: MovementType;
  movement_type?: string;
  case_size: string;
  case_material: string;
  dial_color: string;
  strap_material: string;
  water_resistance: string;
  description: string;
  gender: GenderType;
  warranty_period: string;
  availability?: string;
  source?: string;
  sources?: string;
  data_quality?: string;
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
  currency?: string;
  movement: MovementType;
  movement_type?: string;
  gender: GenderType;
  in_stock: boolean;
  availability?: string;
  source?: string;
  sources?: string;
  data_quality?: string;
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
  user: number | null;
  first_name: string;
  rating: number;
  title: string;
  body: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
}

// ---------- User ----------
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  role: 'customer' | 'seller' | 'admin';
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

export type PaymentMethod = 'card' | 'cod';

export interface OrderItem {
  id: number;
  watch: number;
  title: string;
  brand_name: string;
  image: string;
  quantity: number;
  unit_price: string;
  total_price: string;
}

export interface Order {
  order_number: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: 'pending' | 'paid' | 'failed';
  subtotal: string;
  discount: string;
  shipping_fee: string;
  total: string;
  full_name: string;
  email: string;
  phone_number: string;
  address_line: string;
  city: string;
  postal_code: string;
  country: string;
  gift_wrapping: boolean;
  notes: string;
  items: OrderItem[];
  created_at: string;
}

export interface Coupon {
  id: number;
  code: string;
  discount_percent: number;
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
  sources: string[];
  minPrice: number;
  maxPrice: number;
  inStockOnly: boolean;
  onSaleOnly: boolean;
  search: string;
  sort: SortOption;
  page: number;
  view: 'grid' | 'list';
  newArrival?: boolean;
  trending?: boolean;
  featured?: boolean;
  bestSeller?: boolean;
}

export interface SourceFacet {
  slug: string;
  name: string;
  status: string;
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
