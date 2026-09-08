export type UserRole = 'user' | 'master' | 'admin';

export interface User {
  id: string;
  phone?: string;
  full_name: string;
  role: UserRole;
  rating: number;
  is_verified: boolean;
  is_online?: boolean;
  avatar_url: string;
  balance?: number; // in руб. ПМР
  reserved_balance?: number; // in руб. ПМР
  created_at?: string;
}

export interface AppConfig {
  isDemoMode: boolean;
  platformFeePercent: number;
  appName: string;
}

export type OrderCategory = 'products' | 'pharmacy' | 'auto_parts' | 'master';

export type OrderStatus =
  | 'created'
  | 'accepted'
  | 'receipt_uploaded'
  | 'completed'
  | 'disputed'
  | 'canceled';

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface Order {
  id: string;
  client_id: string;
  client_name: string;
  client_phone: string;
  client_avatar?: string;
  courier_id?: string | null;
  courier_name?: string | null;
  courier_phone?: string | null;
  courier_avatar?: string | null;
  category: OrderCategory;
  title: string;
  description: string;
  budget: number; // in руб. ПМР
  city: string;
  location: GeoLocation;
  address: string;
  status: OrderStatus;
  created_at: string;
  receipt?: Receipt | null;
  client_rating?: number;
  client_review?: string;
  courier_rating?: number;
  courier_review?: string;
  dispute_reason?: string;
  distance_km?: number;
}

export interface Receipt {
  id: string;
  order_id: string;
  photo_url: string;
  total_sum: number; // in руб. ПМР
  uploaded_at: string;
}

export interface Verification {
  id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  passport_photo_url: string;
  selfie_photo_url: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  order_id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  image_url?: string;
  created_at: string;
}

export interface PMRCity {
  name: string;
  lat: number;
  lng: number;
  zoom: number;
  popularPlaces: string[];
}

export interface WalletTransaction {
  id: string;
  userId: string;
  orderId?: string | null;
  type: 'reserve' | 'release' | 'payout' | 'fee' | 'topup' | 'refund';
  amount: number;
  description: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_name: string;
  action: string;
  target_id: string;
  details: string;
  created_at: string;
}

export interface AdminStats {
  totalOrders: number;
  completedOrders: number;
  activeOrders: number;
  disputedOrders: number;
  disputeRate: number;
  totalVolume: number;
  totalFees: number;
  cityDistribution: Record<string, { count: number; volume: number }>;
  categoryDistribution: Record<string, number>;
  totalUsers: number;
  verifiedUsers: number;
}

export type NotificationType =
  | 'order_created_nearby'
  | 'order_accepted'
  | 'order_status_changed'
  | 'chat_message'
  | 'system';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  payload?: any;
  is_read: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  order_id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  target_user_id: string;
  rating: number;
  comment: string;
  created_at: string;
}
