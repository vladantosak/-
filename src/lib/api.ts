import {
  Order,
  OrderCategory,
  Receipt,
  Verification,
  ChatMessage,
  User,
  WalletTransaction,
  AuditLog,
  AdminStats,
  AppConfig,
  AppNotification,
  Review,
} from '../types';

let currentToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('pmr_jwt_token') : null;

export const setAuthToken = (token: string | null) => {
  currentToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('pmr_jwt_token', token);
    } else {
      localStorage.removeItem('pmr_jwt_token');
    }
  }
};

export const getAuthToken = () => currentToken;

const getHeaders = (isJson = true): HeadersInit => {
  const headers: Record<string, string> = {};
  if (isJson) headers['Content-Type'] = 'application/json';
  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }
  return headers;
};

export const api = {
  // Auth
  async sendCode(phone: string): Promise<{ success: boolean; message: string; code?: string; waitSeconds?: number }> {
    const res = await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Ошибка отправки SMS');
    }
    return data;
  },

  async verifyCode(phone: string, code: string, fullName?: string): Promise<{ token: string; user: User }> {
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ phone, code, fullName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Ошибка авторизации');
    }
    const data = await res.json();
    setAuthToken(data.token);
    return data;
  },

  async getMe(): Promise<User> {
    const res = await fetch('/api/auth/me', {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Сессия недействительна');
    return res.json();
  },

  async switchUser(userId: string): Promise<{ token: string; user: User }> {
    const res = await fetch('/api/auth/switch-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Ошибка смены пользователя');
    }
    const data = await res.json();
    setAuthToken(data.token);
    return data;
  },

  async getUsers(): Promise<User[]> {
    try {
      const res = await fetch('/api/users', {
        headers: getHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async getAdminUsers(): Promise<User[]> {
    try {
      const res = await fetch('/api/admin/users', {
        headers: getHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async getConfig(): Promise<AppConfig> {
    try {
      const res = await fetch('/api/config');
      if (!res.ok) {
        return { isDemoMode: true, platformFeePercent: 7, appName: 'ПМР Поручения & Мастера' };
      }
      return await res.json();
    } catch {
      return { isDemoMode: true, platformFeePercent: 7, appName: 'ПМР Поручения & Мастера' };
    }
  },

  // Orders
  async getNearbyOrders(params: {
    lat?: number;
    lng?: number;
    radius?: number;
    city?: string;
    category?: string;
    status?: string;
  }): Promise<Order[]> {
    try {
      const query = new URLSearchParams();
      if (params.lat !== undefined && params.lng !== undefined) {
        query.set('lat', params.lat.toString());
        query.set('lng', params.lng.toString());
        if (params.radius) query.set('radius', params.radius.toString());
      }
      if (params.city) query.set('city', params.city);
      if (params.category) query.set('category', params.category);
      if (params.status) query.set('status', params.status);

      const res = await fetch(`/api/orders/nearby?${query.toString()}`, {
        headers: getHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async getOrder(id: string): Promise<Order> {
    const res = await fetch(`/api/orders/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Заказ не найден');
    return res.json();
  },

  async createOrder(orderData: {
    category: OrderCategory;
    title: string;
    description: string;
    budget: number;
    city: string;
    location: { lat: number; lng: number };
    address: string;
  }): Promise<Order> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(orderData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Ошибка при создании заказа');
    }
    return data;
  },

  async acceptOrder(orderId: string): Promise<Order> {
    const res = await fetch(`/api/orders/${orderId}/accept`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Не удалось принять заказ');
    }
    return data;
  },

  async uploadReceipt(orderId: string, data: { photo_url: string; total_sum: number }): Promise<Order> {
    const res = await fetch(`/api/orders/${orderId}/receipt`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Ошибка загрузки чека');
    }
    return result;
  },

  async completeOrder(orderId: string, data: { rating: number; review?: string }): Promise<Order> {
    const res = await fetch(`/api/orders/${orderId}/complete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Ошибка при завершении заказа');
    }
    return result;
  },

  async disputeOrder(orderId: string, data: { reason: string }): Promise<Order> {
    const res = await fetch(`/api/orders/${orderId}/dispute`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Ошибка при открытии спора');
    }
    return result;
  },

  async cancelOrder(orderId: string): Promise<Order> {
    const res = await fetch(`/api/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({}),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Ошибка при отмене заказа');
    }
    return result;
  },

  // Chat
  async getMessages(orderId: string): Promise<ChatMessage[]> {
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`, {
        headers: getHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async sendMessage(orderId: string, message: { text: string; image_url?: string }): Promise<ChatMessage> {
    const res = await fetch(`/api/orders/${orderId}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(message),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Ошибка при отправке сообщения');
    }
    return data;
  },

  // Wallet & Escrow
  async getWallet(): Promise<{ balance: number; reservedBalance: number; transactions: WalletTransaction[] }> {
    const res = await fetch('/api/wallet', {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Ошибка загрузки кошелька');
    return res.json();
  },

  async topupWallet(amount: number): Promise<{ balance: number; transaction: WalletTransaction }> {
    const res = await fetch('/api/wallet/topup', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка пополнения');
    return data;
  },

  // Verification
  async uploadVerification(data: { passport_photo_url: string; selfie_photo_url: string }): Promise<Verification> {
    const res = await fetch('/api/verification/upload', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Ошибка отправки документов');
    return result;
  },

  async getMyVerification(): Promise<Verification | null> {
    const res = await fetch('/api/verification/my', {
      headers: getHeaders(),
    });
    if (!res.ok) return null;
    return res.json();
  },

  // OCR with Gemini
  async parseReceiptOcr(imageUrl: string): Promise<{
    totalSum: number;
    storeName?: string;
    items?: Array<{ name: string; price: number; quantity?: number }>;
    recognizedText?: string;
  }> {
    const res = await fetch('/api/ocr/receipt', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ image_url: imageUrl }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Ошибка распознавания чека');
    return result;
  },

  // File Upload
  async uploadFile(file: File): Promise<{ url: string; filename: string; size: number }> {
    const formData = new FormData();
    formData.append('file', file);
    const headers: Record<string, string> = {};
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers,
      body: formData,
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Ошибка загрузки файла');
    return result;
  },

  // Admin
  async getAdminVerifications(): Promise<Verification[]> {
    try {
      const res = await fetch('/api/admin/verifications', {
        headers: getHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async reviewVerification(id: string, status: 'approved' | 'rejected', reason?: string): Promise<any> {
    const res = await fetch(`/api/admin/verifications/${id}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ status, rejection_reason: reason }),
    });
    return res.json();
  },

  async getAdminDisputes(): Promise<Order[]> {
    try {
      const res = await fetch('/api/admin/disputes', {
        headers: getHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async resolveDispute(orderId: string, resolution: 'complete' | 'cancel', adminComment?: string): Promise<Order> {
    const res = await fetch(`/api/admin/disputes/${orderId}/resolve`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ resolution, admin_comment: adminComment }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Ошибка арбитража');
    return result;
  },

  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch('/api/admin/stats', {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Ошибка загрузки статистики');
    return res.json();
  },

  async getAdminAuditLogs(): Promise<AuditLog[]> {
    try {
      const res = await fetch('/api/admin/audit-logs', {
        headers: getHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  // Online / Offline status
  async updateOnlineStatus(isOnline: boolean): Promise<{ success: boolean; is_online: boolean }> {
    const res = await fetch('/api/users/status', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ is_online: isOnline }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Не удалось обновить статус');
    }
    return res.json();
  },

  // Notifications
  async getNotifications(): Promise<AppNotification[]> {
    try {
      const res = await fetch('/api/notifications', {
        headers: getHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async markNotificationRead(id: string): Promise<any> {
    const res = await fetch(`/api/notifications/${id}/read`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return res.json().catch(() => ({}));
  },

  async markAllNotificationsRead(): Promise<any> {
    const res = await fetch('/api/notifications/read-all', {
      method: 'POST',
      headers: getHeaders(),
    });
    return res.json().catch(() => ({}));
  },

  // Reviews
  async submitReview(orderId: string, rating: number, comment: string): Promise<Review> {
    const res = await fetch(`/api/orders/${orderId}/review`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ rating, comment }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Ошибка сохранения отзыва');
    return result;
  },

  async getUserReviews(userId: string): Promise<Review[]> {
    try {
      const res = await fetch(`/api/users/${userId}/reviews`, {
        headers: getHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
};
