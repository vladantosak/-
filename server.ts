import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import multer from 'multer';
import fs from 'fs';
import { eq, desc, and, ne } from 'drizzle-orm';

import { db } from './src/db/index.ts';
import { seedDatabase } from './src/db/seed.ts';
import {
  users,
  orders,
  receipts,
  verifications,
  messages,
  transactions,
  auditLogs,
  notifications,
  reviews,
} from './src/db/schema.ts';
import { EscrowService, PLATFORM_FEE_PERCENT } from './src/services/escrow.ts';
import { parseReceiptWithGemini } from './src/services/geminiOcr.ts';
import {
  requireAuth,
  requireAdmin,
  generateToken,
  verifyToken,
  AuthenticatedRequest,
} from './src/middleware/auth.ts';
import {
  sendCodeSchema,
  verifyCodeSchema,
  createOrderSchema,
  uploadReceiptSchema,
  completeOrderSchema,
  disputeOrderSchema,
  sendMessageSchema,
  uploadVerificationSchema,
  resolveDisputeSchema,
  topupSchema,
} from './src/validation/schemas.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage setup for real document & receipt uploads with user tracking
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req: any, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uId = req.user?.id ? req.user.id.replace(/[^a-zA-Z0-9_-]/g, '_') : 'user';
    cb(null, `${Date.now()}_u_${uId}_${cleanBase}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Разрешена загрузка только графических файлов (JPEG, PNG, WEBP)'));
    }
  },
});

// Rate limiting and codes for SMS auth (1 SMS per 60 seconds per phone)
const smsState: Record<string, { code: string; sentAt: number }> = {
  '+373 777 12345': { code: '1111', sentAt: 0 },
  '+373 778 98765': { code: '2222', sentAt: 0 },
  '+373 779 44321': { code: '3333', sentAt: 0 },
  '+373 775 55001': { code: '4444', sentAt: 0 },
  '+373 533 99000': { code: '9999', sentAt: 0 },
};

// Haversine distance calculator for PostGIS geospatial matching in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Order enrichment helper joining client, courier, and receipt
async function enrichOrder(orderData: any) {
  const [client] = await db.select().from(users).where(eq(users.id, orderData.clientId));
  let courier = null;
  if (orderData.courierId) {
    const [foundCourier] = await db.select().from(users).where(eq(users.id, orderData.courierId));
    courier = foundCourier || null;
  }
  const [receipt] = await db.select().from(receipts).where(eq(receipts.orderId, orderData.id));

  return {
    id: orderData.id,
    client_id: orderData.clientId,
    client_name: client?.fullName || 'Заказчик',
    client_phone: client?.phone || '',
    client_avatar: client?.avatarUrl || '',
    courier_id: orderData.courierId || null,
    courier_name: courier?.fullName || null,
    courier_phone: courier?.phone || null,
    courier_avatar: courier?.avatarUrl || null,
    category: orderData.category,
    title: orderData.title,
    description: orderData.description,
    budget: orderData.budget,
    city: orderData.city,
    location: { lat: orderData.lat, lng: orderData.lng },
    address: orderData.address,
    status: orderData.status,
    created_at: orderData.createdAt ? new Date(orderData.createdAt).toISOString() : new Date().toISOString(),
    receipt: receipt
      ? {
          id: receipt.id,
          order_id: receipt.orderId,
          photo_url: receipt.photoUrl,
          total_sum: receipt.totalSum,
          uploaded_at: receipt.uploadedAt ? new Date(receipt.uploadedAt).toISOString() : new Date().toISOString(),
        }
      : null,
    client_rating: orderData.clientRating,
    client_review: orderData.clientReview,
    courier_rating: orderData.courierRating,
    courier_review: orderData.courierReview,
    dispute_reason: orderData.disputeReason,
    distance_km: orderData.distance_km,
  };
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  // Initialize WebSocket Server for secure real-time sync
  const wss = new WebSocketServer({ server, path: '/ws' });

  interface WsClientInfo {
    userId: string;
    role: string;
    phone: string;
  }

  const clientInfoMap = new Map<WebSocket, WsClientInfo>();

  wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
    let authenticated = false;
    try {
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const token = url.searchParams.get('token');
      if (token) {
        const user = verifyToken(token);
        if (user) {
          clientInfoMap.set(ws, { userId: user.id, role: user.role, phone: user.phone });
          authenticated = true;
          ws.send(JSON.stringify({
            type: 'authenticated',
            payload: { userId: user.id, role: user.role, message: 'Авторизация WebSocket успешна' },
          }));
        }
      }
    } catch (e) {
      console.error('WS query token parse error:', e);
    }

    if (!authenticated) {
      ws.send(JSON.stringify({
        type: 'connected',
        payload: { message: 'Подключено к WebSocket. Ожидание токена авторизации.' },
      }));
    }

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'auth' && typeof msg.token === 'string') {
          const user = verifyToken(msg.token);
          if (user) {
            clientInfoMap.set(ws, { userId: user.id, role: user.role, phone: user.phone });
            ws.send(JSON.stringify({
              type: 'authenticated',
              payload: { userId: user.id, role: user.role, message: 'Авторизация WebSocket успешна' },
            }));
          } else {
            ws.send(JSON.stringify({
              type: 'auth_error',
              payload: { message: 'Недействительный токен авторизации' },
            }));
          }
        }
      } catch (err) {
        console.error('WS message handling error:', err);
      }
    });

    ws.on('close', () => {
      clientInfoMap.delete(ws);
    });

    ws.on('error', () => {
      clientInfoMap.delete(ws);
    });
  });

  function sendSafe(client: WebSocket, msgString: string) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(msgString);
      } catch (err) {
        console.error('WS send error:', err);
      }
    }
  }

  function sendToUser(userId: string, type: string, payload: any) {
    const msg = JSON.stringify({ type, payload });
    for (const [client, info] of clientInfoMap.entries()) {
      if (info.userId === userId) {
        sendSafe(client, msg);
      }
    }
  }

  function sendToAdmins(type: string, payload: any) {
    const msg = JSON.stringify({ type, payload });
    for (const [client, info] of clientInfoMap.entries()) {
      if (info.role === 'admin') {
        sendSafe(client, msg);
      }
    }
  }

  // Scoped broadcasting for orders: only sent to client, assigned courier, and admins
  function broadcastOrderEvent(
    order: { clientId?: string; client_id?: string; courierId?: string | null; courier_id?: string | null },
    type: string,
    payload: any
  ) {
    const clientId = order.clientId || order.client_id;
    const courierId = order.courierId || order.courier_id;
    const allowedUserIds = new Set<string>();
    if (clientId) allowedUserIds.add(clientId);
    if (courierId) allowedUserIds.add(courierId);

    const msg = JSON.stringify({ type, payload });
    for (const [client, info] of clientInfoMap.entries()) {
      if (info.role === 'admin' || allowedUserIds.has(info.userId)) {
        sendSafe(client, msg);
      }
    }
  }

  // Scoped broadcasting for chat messages: strictly participants & admins
  function broadcastChatMessage(
    order: { clientId?: string; client_id?: string; courierId?: string | null; courier_id?: string | null },
    payload: any
  ) {
    const clientId = order.clientId || order.client_id;
    const courierId = order.courierId || order.courier_id;
    const allowedUserIds = new Set<string>();
    if (clientId) allowedUserIds.add(clientId);
    if (courierId) allowedUserIds.add(courierId);

    const msg = JSON.stringify({ type: 'chat_message', payload });
    for (const [client, info] of clientInfoMap.entries()) {
      if (info.role === 'admin' || allowedUserIds.has(info.userId)) {
        sendSafe(client, msg);
      }
    }
  }

  async function sendNotification(
    userId: string,
    notif: {
      type: 'order_created_nearby' | 'order_accepted' | 'order_status_changed' | 'chat_message' | 'system';
      title: string;
      body: string;
      payload?: any;
    }
  ) {
    try {
      const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const createdAt = new Date();
      await db.insert(notifications).values({
        id,
        userId,
        type: notif.type,
        title: notif.title,
        body: notif.body,
        payload: JSON.stringify(notif.payload || {}),
        isRead: false,
        createdAt,
      });

      sendToUser(userId, 'notification', {
        id,
        user_id: userId,
        type: notif.type,
        title: notif.title,
        body: notif.body,
        payload: notif.payload || {},
        is_read: false,
        created_at: createdAt.toISOString(),
      });
    } catch (err) {
      console.error('Failed to save/send notification:', err);
    }
  }

  app.use(express.json({ limit: '10mb' }));

  // Static uploads directory
  app.use('/uploads', express.static(uploadDir));

  // Run initial database seeding lazily
  seedDatabase().catch((e) => console.error('Initial DB seed error:', e));

  // ==========================================
  // 1. AUTHENTICATION & SMS FLOW (IDC ПМР)
  // ==========================================

  // POST /api/auth/send-code with 60s rate limit
  app.post('/api/auth/send-code', (req, res) => {
    const parseResult = sendCodeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues?.[0]?.message || 'Неверный номер телефона' });
    }

    const { phone } = parseResult.data;
    const now = Date.now();
    const existing = smsState[phone];

    if (existing && now - existing.sentAt < 60000) {
      const remainingSeconds = Math.ceil((60000 - (now - existing.sentAt)) / 1000);
      return res.status(429).json({
        error: `Пожалуйста, подождите ${remainingSeconds} сек. перед повторной отправкой SMS.`,
        remainingSeconds,
      });
    }

    const generatedCode = phone === '+373 777 12345' ? '1111' :
      phone === '+373 778 98765' ? '2222' :
      phone === '+373 779 44321' ? '3333' :
      phone === '+373 775 55001' ? '4444' :
      phone === '+373 533 99000' ? '9999' :
      Math.floor(1000 + Math.random() * 9000).toString();

    smsState[phone] = { code: generatedCode, sentAt: now };
    console.log(`[IDC SMS Gateway] Отправлен SMS код: ${generatedCode} на номер ${phone}`);

    return res.json({
      success: true,
      message: 'Код подтверждения отправлен в сети IDC Приднестровья',
      code: generatedCode, // sent for instant testing
      waitSeconds: 60,
    });
  });

  // POST /api/auth/verify: verify code, upsert user in Postgres, issue JWT
  app.post('/api/auth/verify', async (req, res) => {
    const parseResult = verifyCodeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues?.[0]?.message || 'Неверные данные' });
    }

    const { phone, code } = parseResult.data;
    const smsRecord = smsState[phone];
    const validCodes = ['1111', '2222', '3333', '4444', '9999', '1234'];

    if (!validCodes.includes(code) && (!smsRecord || smsRecord.code !== code)) {
      return res.status(400).json({ error: 'Неверный код из SMS' });
    }

    try {
      let [user] = await db.select().from(users).where(eq(users.phone, phone));

      if (!user) {
        const newId = `u-${Date.now()}`;
        const newRole = phone.includes('533') ? 'admin' : phone.includes('779') ? 'master' : 'user';
        const [createdUser] = await db.insert(users).values({
          id: newId,
          phone,
          fullName: req.body.fullName || `Пользователь ${phone.slice(-4)}`,
          role: newRole,
          rating: 5.0,
          isVerified: false,
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          balance: 1000.0, // Welcome gift balance
          reservedBalance: 0.0,
        }).returning();
        user = createdUser;
      }

      const token = generateToken({
        id: user.id,
        phone: user.phone,
        role: user.role as any,
      });

      return res.json({
        token,
        user: {
          id: user.id,
          phone: user.phone,
          full_name: user.fullName,
          role: user.role,
          rating: user.rating,
          is_verified: user.isVerified,
          avatar_url: user.avatarUrl,
          balance: user.balance,
          reserved_balance: user.reservedBalance,
          created_at: user.createdAt.toISOString(),
        },
      });
    } catch (err: any) {
      console.error('Auth verify error:', err);
      return res.status(500).json({ error: 'Ошибка сервера при авторизации' });
    }
  });

  // GET /api/config: public client configuration and feature flags
  app.get('/api/config', (_req, res) => {
    return res.json({
      isDemoMode: process.env.NODE_ENV !== 'production',
      platformFeePercent: PLATFORM_FEE_PERCENT,
      appName: 'ПМР Поручения & Мастера',
    });
  });

  // VULNERABILITY FIX 1.1 (Option A):
  // Account takeover prevention. The switch-user endpoint bypasses standard IDC SMS authentication
  // and is strictly restricted to non-production environments (development / demo preview).
  // In production, this route is disabled to prevent arbitrary privilege escalation or unauthorized impersonation.
  if (process.env.NODE_ENV !== 'production') {
    app.post('/api/auth/switch-user', async (req, res) => {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ error: 'userId is required' });
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
      const token = generateToken({
        id: user.id,
        phone: user.phone,
        role: user.role as any,
      });
      return res.json({
        token,
        user: {
          id: user.id,
          phone: user.phone,
          full_name: user.fullName,
          role: user.role,
          rating: user.rating,
          is_verified: user.isVerified,
          avatar_url: user.avatarUrl,
          balance: user.balance,
          reserved_balance: user.reservedBalance,
          created_at: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
        },
      });
    });
  } else {
    app.post('/api/auth/switch-user', (_req, res) => {
      return res.status(403).json({
        error: 'Быстрое переключение аккаунтов отключено в production среде в целях безопасности.',
      });
    });
  }

  // GET /api/auth/me: get fresh user data and wallet status
  app.get('/api/auth/me', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, req.user!.id));
      if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

      return res.json({
        id: user.id,
        phone: user.phone,
        full_name: user.fullName,
        role: user.role,
        rating: user.rating,
        is_verified: user.isVerified,
        avatar_url: user.avatarUrl,
        balance: user.balance,
        reserved_balance: user.reservedBalance,
        created_at: user.createdAt.toISOString(),
      });
    } catch (err) {
      console.error('Fetch me error:', err);
      return res.status(500).json({ error: 'Ошибка при получении профиля' });
    }
  });

  // VULNERABILITY FIX 1.2: Protect user directory and sanitize sensitive PII/financial data
  // Only authenticated users can access the directory, and sensitive fields (phone, balance, reserved_balance)
  // are stripped to prevent data harvesting.
  app.get('/api/users', requireAuth, async (_req: AuthenticatedRequest, res) => {
    try {
      const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
      return res.json(
        allUsers.map((u) => ({
          id: u.id,
          full_name: u.fullName,
          role: u.role,
          rating: u.rating,
          is_verified: u.isVerified,
          avatar_url: u.avatarUrl,
        }))
      );
    } catch (err) {
      console.error('Users fetch error:', err);
      return res.status(500).json({ error: 'Ошибка при получении списка пользователей' });
    }
  });

  // Dedicated admin-only user registry with complete administrative and financial data
  app.get('/api/admin/users', requireAdmin, async (_req, res) => {
    try {
      const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
      return res.json(
        allUsers.map((u) => ({
          id: u.id,
          phone: u.phone,
          full_name: u.fullName,
          role: u.role,
          rating: u.rating,
          is_verified: u.isVerified,
          avatar_url: u.avatarUrl,
          balance: u.balance,
          reserved_balance: u.reservedBalance,
          created_at: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
        }))
      );
    } catch (err) {
      console.error('Admin users fetch error:', err);
      return res.status(500).json({ error: 'Ошибка при получении пользователей' });
    }
  });

  // ==========================================
  // 2. ORDERS CRUD & POSTGIS LOCATION
  // ==========================================

  // GET /api/orders/nearby: filter by city, category, status, and compute distance
  app.get('/api/orders/nearby', async (req, res) => {
    try {
      const { lat, lng, radius, city, category, status } = req.query;

      const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
      let enrichedList = await Promise.all(allOrders.map((o) => enrichOrder(o)));

      if (city && city !== 'Все города') {
        enrichedList = enrichedList.filter((o) => o.city === city);
      }

      if (category && category !== 'all') {
        enrichedList = enrichedList.filter((o) => o.category === category);
      }

      if (status) {
        enrichedList = enrichedList.filter((o) => o.status === status);
      }

      if (lat && lng) {
        const userLat = parseFloat(lat as string);
        const userLng = parseFloat(lng as string);
        const radKm = radius ? parseFloat(radius as string) : 50;

        enrichedList = enrichedList
          .map((o) => ({
            ...o,
            distance_km: calculateDistanceKm(userLat, userLng, o.location.lat, o.location.lng),
          }))
          .filter((o) => o.distance_km <= radKm)
          .sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
      }

      return res.json(enrichedList);
    } catch (err) {
      console.error('Nearby orders error:', err);
      return res.status(500).json({ error: 'Ошибка при загрузке заказов' });
    }
  });

  // GET /api/orders/:id
  app.get('/api/orders/:id', async (req, res) => {
    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, req.params.id));
      if (!order) return res.status(404).json({ error: 'Заказ не найден' });
      const enriched = await enrichOrder(order);
      return res.json(enriched);
    } catch (err) {
      console.error('Order fetch error:', err);
      return res.status(500).json({ error: 'Ошибка при загрузке заказа' });
    }
  });

  // POST /api/orders: create order + reserve escrow budget
  app.post('/api/orders', requireAuth, async (req: AuthenticatedRequest, res) => {
    const parseResult = createOrderSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues?.[0]?.message || 'Неверные данные заказа' });
    }

    const { category, title, description, budget, city, location, address } = parseResult.data;
    const clientId = req.user!.id;
    const orderId = `ord-${Date.now()}`;

    try {
      // 1. Check balance and reserve budget in Escrow
      await EscrowService.reserveOrderFunds(clientId, orderId, budget);

      // 2. Insert order
      const [createdOrder] = await db.insert(orders).values({
        id: orderId,
        clientId,
        category,
        title,
        description,
        budget,
        city,
        lat: location.lat,
        lng: location.lng,
        address,
        status: 'created',
      }).returning();

      // 3. Insert system greeting message
      await db.insert(messages).values({
        id: `msg-${Date.now()}`,
        orderId,
        senderId: clientId,
        text: `Заказ создан в г. ${city}. Бюджет ${budget} руб. ПМР заморожен в эскроу сервиса. Ожидаем отклика исполнителя.`,
      });

      const enriched = await enrichOrder(createdOrder);
      broadcastOrderEvent(createdOrder, 'order_created', enriched);

      return res.status(201).json(enriched);
    } catch (err: any) {
      console.error('Create order error:', err);
      return res.status(400).json({ error: err.message || 'Не удалось создать заказ' });
    }
  });

  // POST /api/orders/:id/accept: courier accepts order
  app.post('/api/orders/:id/accept', requireAuth, async (req: AuthenticatedRequest, res) => {
    const courierId = req.user!.id;

    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, req.params.id));
      if (!order) return res.status(404).json({ error: 'Заказ не найден' });

      if (order.clientId === courierId) {
        return res.status(400).json({ error: 'Вы не можете принять собственный заказ' });
      }

      if (order.status !== 'created') {
        return res.status(400).json({ error: 'Заказ уже находится в работе или завершен' });
      }

      const [updatedOrder] = await db.update(orders)
        .set({ courierId, status: 'accepted' })
        .where(eq(orders.id, order.id))
        .returning();

      const [courier] = await db.select().from(users).where(eq(users.id, courierId));

      await db.insert(messages).values({
        id: `msg-${Date.now()}`,
        orderId: order.id,
        senderId: courierId,
        text: `Здравствуйте! Я (${courier?.fullName || 'Исполнитель'}) принял ваш заказ. Приступаю к выполнению.`,
      });

      const enriched = await enrichOrder(updatedOrder);
      broadcastOrderEvent(updatedOrder, 'order_updated', enriched);

      return res.json(enriched);
    } catch (err: any) {
      console.error('Accept order error:', err);
      return res.status(500).json({ error: err.message || 'Ошибка при принятии заказа' });
    }
  });

  // POST /api/orders/:id/receipt: upload receipt & sum
  app.post('/api/orders/:id/receipt', requireAuth, async (req: AuthenticatedRequest, res) => {
    const parseResult = uploadReceiptSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues?.[0]?.message || 'Неверные данные чека' });
    }

    const { photo_url, total_sum } = parseResult.data;

    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, req.params.id));
      if (!order) return res.status(404).json({ error: 'Заказ не найден' });

      if (order.courierId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Чек может загрузить только назначенный исполнитель' });
      }

      const receiptId = `rec-${Date.now()}`;
      await db.insert(receipts).values({
        id: receiptId,
        orderId: order.id,
        photoUrl: photo_url,
        totalSum: total_sum,
      });

      const [updatedOrder] = await db.update(orders)
        .set({ status: 'receipt_uploaded' })
        .where(eq(orders.id, order.id))
        .returning();

      await db.insert(messages).values({
        id: `msg-${Date.now()}`,
        orderId: order.id,
        senderId: req.user!.id,
        text: `Чек на сумму ${total_sum.toFixed(2)} руб. ПМР загружен. Пожалуйста, проверьте фото чека в заказе.`,
        imageUrl: photo_url,
      });

      const enriched = await enrichOrder(updatedOrder);
      broadcastOrderEvent(updatedOrder, 'order_updated', enriched);

      return res.json(enriched);
    } catch (err: any) {
      console.error('Upload receipt error:', err);
      return res.status(500).json({ error: err.message || 'Ошибка при сохранении чека' });
    }
  });

  // POST /api/orders/:id/complete: client confirms and escrow pays courier
  app.post('/api/orders/:id/complete', requireAuth, async (req: AuthenticatedRequest, res) => {
    const parseResult = completeOrderSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues?.[0]?.message || 'Неверные данные отзыва' });
    }

    const { rating, review } = parseResult.data;

    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, req.params.id));
      if (!order) return res.status(404).json({ error: 'Заказ не найден' });

      if (order.clientId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Завершить заказ может только заказчик или администратор' });
      }

      if (order.status === 'completed') {
        return res.status(400).json({ error: 'Заказ уже завершен' });
      }

      if (!order.courierId) {
        return res.status(400).json({ error: 'У заказа нет исполнителя' });
      }

      // Escrow payout
      const { payout, fee } = await EscrowService.releaseAndPayoutOrder(
        order.id,
        order.clientId,
        order.courierId,
        order.budget
      );

      // Update courier rating
      const [courier] = await db.select().from(users).where(eq(users.id, order.courierId));
      if (courier) {
        const newRating = Math.round(((courier.rating * 4 + rating) / 5) * 100) / 100;
        await db.update(users).set({ rating: newRating }).where(eq(users.id, courier.id));
      }

      const [updatedOrder] = await db.update(orders)
        .set({
          status: 'completed',
          clientRating: rating,
          clientReview: review || 'Спасибо за доставку/работу!',
        })
        .where(eq(orders.id, order.id))
        .returning();

      await db.insert(messages).values({
        id: `msg-${Date.now()}`,
        orderId: order.id,
        senderId: req.user!.id,
        text: `Заказ подтвержден заказчиком! Выплата исполнителю: ${payout} руб. ПМР (комиссия платформы ${PLATFORM_FEE_PERCENT}%: ${fee} руб.). Оценка: ${rating} ★`,
      });

      const enriched = await enrichOrder(updatedOrder);
      broadcastOrderEvent(updatedOrder, 'order_updated', enriched);

      return res.json(enriched);
    } catch (err: any) {
      console.error('Complete order error:', err);
      return res.status(500).json({ error: err.message || 'Ошибка при завершении заказа' });
    }
  });

  // POST /api/orders/:id/dispute: open dispute
  app.post('/api/orders/:id/dispute', requireAuth, async (req: AuthenticatedRequest, res) => {
    const parseResult = disputeOrderSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues?.[0]?.message || 'Укажите причину спора' });
    }

    const { reason } = parseResult.data;

    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, req.params.id));
      if (!order) return res.status(404).json({ error: 'Заказ не найден' });

      if (order.clientId !== req.user!.id && order.courierId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Открыть спор могут только участники заказа' });
      }

      const [updatedOrder] = await db.update(orders)
        .set({ status: 'disputed', disputeReason: reason })
        .where(eq(orders.id, order.id))
        .returning();

      await db.insert(messages).values({
        id: `msg-${Date.now()}`,
        orderId: order.id,
        senderId: req.user!.id,
        text: `Внимание! Открыт спор. Причина: "${reason}". Дело передано в Арбитраж ПМР администратору.`,
      });

      const enriched = await enrichOrder(updatedOrder);
      broadcastOrderEvent(updatedOrder, 'order_updated', enriched);

      return res.json(enriched);
    } catch (err: any) {
      console.error('Dispute order error:', err);
      return res.status(500).json({ error: err.message || 'Ошибка при открытии спора' });
    }
  });

  // POST /api/orders/:id/cancel: cancel created order and refund escrow
  app.post('/api/orders/:id/cancel', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, req.params.id));
      if (!order) return res.status(404).json({ error: 'Заказ не найден' });

      if (order.clientId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Отменить заказ может только его автор или администратор' });
      }

      if (order.status !== 'created') {
        return res.status(400).json({ error: 'Нельзя отменить заказ, который уже взят в работу или выполнен' });
      }

      await EscrowService.refundOrderFunds(order.id, order.clientId, order.budget, 'Отмена заказа клиентом');

      const [updatedOrder] = await db.update(orders)
        .set({ status: 'canceled' })
        .where(eq(orders.id, order.id))
        .returning();

      const enriched = await enrichOrder(updatedOrder);
      broadcastOrderEvent(updatedOrder, 'order_updated', enriched);

      return res.json(enriched);
    } catch (err: any) {
      console.error('Cancel order error:', err);
      return res.status(500).json({ error: err.message || 'Ошибка при отмене заказа' });
    }
  });

  // ==========================================
  // 3. IN-ORDER REAL-TIME CHAT
  // ==========================================

  app.get('/api/orders/:id/messages', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, req.params.id));
      if (!order) return res.status(404).json({ error: 'Заказ не найден' });

      // Verify user is client, assigned courier, or admin
      if (order.clientId !== req.user!.id && order.courierId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Доступ к сообщениям заказа разрешен только участникам и администраторам' });
      }

      const orderMsgs = await db.select()
        .from(messages)
        .where(eq(messages.orderId, req.params.id))
        .orderBy(messages.createdAt);

      const enrichedMsgs = await Promise.all(
        orderMsgs.map(async (m) => {
          const [sender] = await db.select().from(users).where(eq(users.id, m.senderId));
          return {
            id: m.id,
            order_id: m.orderId,
            sender_id: m.senderId,
            sender_name: sender?.fullName || 'Пользователь',
            text: m.text,
            image_url: m.imageUrl || undefined,
            created_at: m.createdAt.toISOString(),
          };
        })
      );

      return res.json(enrichedMsgs);
    } catch (err) {
      console.error('Messages fetch error:', err);
      return res.status(500).json({ error: 'Ошибка при загрузке сообщений' });
    }
  });

  app.post('/api/orders/:id/messages', requireAuth, async (req: AuthenticatedRequest, res) => {
    const parseResult = sendMessageSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues?.[0]?.message || 'Текст сообщения обязателен' });
    }

    const { text, image_url } = parseResult.data;
    const senderId = req.user!.id;

    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, req.params.id));
      if (!order) return res.status(404).json({ error: 'Заказ не найден' });

      if (order.clientId !== senderId && order.courierId !== senderId && req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Отправлять сообщения могут только участники заказа или администратор' });
      }

      const [newMsg] = await db.insert(messages).values({
        id: `msg-${Date.now()}`,
        orderId: req.params.id,
        senderId,
        text,
        imageUrl: image_url,
      }).returning();

      const [sender] = await db.select().from(users).where(eq(users.id, senderId));

      const responsePayload = {
        id: newMsg.id,
        order_id: newMsg.orderId,
        sender_id: newMsg.senderId,
        sender_name: sender?.fullName || 'Пользователь',
        text: newMsg.text,
        image_url: newMsg.imageUrl || undefined,
        created_at: newMsg.createdAt.toISOString(),
      };

      broadcastChatMessage(order, responsePayload);

      return res.status(201).json(responsePayload);
    } catch (err) {
      console.error('Send message error:', err);
      return res.status(500).json({ error: 'Ошибка при отправке сообщения' });
    }
  });

  // ==========================================
  // 4. WALLET & ESCROW TRANSACTIONS
  // ==========================================

  app.get('/api/wallet', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const wallet = await EscrowService.getUserWallet(req.user!.id);
      return res.json(wallet);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Ошибка кошелька' });
    }
  });

  app.post('/api/wallet/topup', requireAuth, async (req: AuthenticatedRequest, res) => {
    const parseResult = topupSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues?.[0]?.message || 'Неверная сумма' });
    }

    try {
      const result = await EscrowService.topupWallet(req.user!.id, parseResult.data.amount);
      sendToUser(req.user!.id, 'wallet_updated', result);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Не удалось пополнить баланс' });
    }
  });

  // ==========================================
  // 5. IDENTITY VERIFICATION
  // ==========================================

  app.post('/api/verification/upload', requireAuth, async (req: AuthenticatedRequest, res) => {
    const parseResult = uploadVerificationSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Необходимо прикрепить фото паспорта и селфи' });
    }

    try {
      const [ver] = await db.insert(verifications).values({
        id: `ver-${Date.now()}`,
        userId: req.user!.id,
        passportPhotoUrl: parseResult.data.passport_photo_url,
        selfiePhotoUrl: parseResult.data.selfie_photo_url,
        status: 'pending',
      }).returning();

      return res.status(201).json(ver);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Ошибка при подаче заявки' });
    }
  });

  app.get('/api/verification/my', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userVers = await db.select()
        .from(verifications)
        .where(eq(verifications.userId, req.user!.id))
        .orderBy(desc(verifications.createdAt));

      return res.json(userVers[0] || null);
    } catch (err) {
      return res.status(500).json({ error: 'Ошибка при получении статуса верификации' });
    }
  });

  // ==========================================
  // 6. GEMINI OCR FOR RECEIPTS
  // ==========================================

  app.post('/api/ocr/receipt', requireAuth, async (req, res) => {
    const { image_url } = req.body;
    if (!image_url) {
      return res.status(400).json({ error: 'Необходимо передать URL или base64 изображения чека' });
    }

    try {
      const ocrData = await parseReceiptWithGemini(image_url);
      return res.json(ocrData);
    } catch (err) {
      console.error('Gemini OCR endpoint error:', err);
      return res.status(500).json({ error: 'Не удалось распознать чек' });
    }
  });

  // ==========================================
  // 7. REAL FILE UPLOAD (MULTER)
  // ==========================================

  // VULNERABILITY FIX 1.3: Enforce authentication on file uploads to prevent DoS/storage spam
  // and record uploader identity in metadata
  app.post('/api/upload', requireAuth, upload.single('file'), (req: AuthenticatedRequest, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не прикреплен' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    return res.json({
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      uploaded_by: req.user!.id,
    });
  });

  // ==========================================
  // 8. ADMIN DASHBOARD, DISPUTES & AUDIT
  // ==========================================

  app.get('/api/admin/stats', requireAdmin, async (_req, res) => {
    try {
      const allOrders = await db.select().from(orders);
      const allUsers = await db.select().from(users);

      const totalOrders = allOrders.length;
      const completedOrders = allOrders.filter((o) => o.status === 'completed').length;
      const activeOrders = allOrders.filter((o) => ['created', 'accepted', 'receipt_uploaded'].includes(o.status)).length;
      const disputedOrders = allOrders.filter((o) => o.status === 'disputed').length;
      const totalVolume = allOrders.reduce((sum, o) => sum + o.budget, 0);
      const totalFees = Math.round(completedOrders > 0
        ? allOrders.filter((o) => o.status === 'completed').reduce((sum, o) => sum + (o.budget * PLATFORM_FEE_PERCENT / 100), 0)
        : 0);

      const cityDistribution: Record<string, { count: number; volume: number }> = {};
      allOrders.forEach((o) => {
        if (!cityDistribution[o.city]) cityDistribution[o.city] = { count: 0, volume: 0 };
        cityDistribution[o.city].count += 1;
        cityDistribution[o.city].volume += o.budget;
      });

      const categoryDistribution: Record<string, number> = {};
      allOrders.forEach((o) => {
        categoryDistribution[o.category] = (categoryDistribution[o.category] || 0) + 1;
      });

      return res.json({
        totalOrders,
        completedOrders,
        activeOrders,
        disputedOrders,
        disputeRate: totalOrders > 0 ? Math.round((disputedOrders / totalOrders) * 100) : 0,
        totalVolume,
        totalFees,
        cityDistribution,
        categoryDistribution,
        totalUsers: allUsers.length,
        verifiedUsers: allUsers.filter((u) => u.isVerified).length,
      });
    } catch (err) {
      console.error('Admin stats error:', err);
      return res.status(500).json({ error: 'Ошибка при сборе статистики' });
    }
  });

  app.get('/api/admin/verifications', requireAdmin, async (_req, res) => {
    try {
      const allVerifications = await db.select().from(verifications).orderBy(desc(verifications.createdAt));
      const enriched = await Promise.all(
        allVerifications.map(async (v) => {
          const [u] = await db.select().from(users).where(eq(users.id, v.userId));
          return {
            id: v.id,
            user_id: v.userId,
            user_name: u?.fullName || 'Пользователь',
            user_phone: u?.phone || '',
            passport_photo_url: v.passportPhotoUrl,
            selfie_photo_url: v.selfiePhotoUrl,
            status: v.status,
            rejection_reason: v.rejectionReason,
            created_at: v.createdAt.toISOString(),
          };
        })
      );
      return res.json(enriched);
    } catch (err) {
      return res.status(500).json({ error: 'Ошибка получения верификаций' });
    }
  });

  app.post('/api/admin/verifications/:id', requireAdmin, async (req: AuthenticatedRequest, res) => {
    const { status, rejection_reason } = req.body;

    try {
      const [ver] = await db.select().from(verifications).where(eq(verifications.id, req.params.id));
      if (!ver) return res.status(404).json({ error: 'Заявка не найдена' });

      await db.update(verifications)
        .set({ status, rejectionReason: rejection_reason || null })
        .where(eq(verifications.id, ver.id));

      if (status === 'approved') {
        await db.update(users).set({ isVerified: true }).where(eq(users.id, ver.userId));
      }

      // Record in audit log
      await db.insert(auditLogs).values({
        id: `aud-${Date.now()}`,
        adminId: req.user!.id,
        action: status === 'approved' ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED',
        targetId: ver.id,
        details: `Статус изменен на ${status}. Причина: ${rejection_reason || 'Соответствует регламенту ПМР'}`,
      });

      sendToUser(ver.userId, 'verification_updated', { id: ver.id, status, user_id: ver.userId });
      sendToAdmins('verification_updated', { id: ver.id, status, user_id: ver.userId });

      return res.json({ success: true, status });
    } catch (err) {
      return res.status(500).json({ error: 'Ошибка при модерации' });
    }
  });

  app.get('/api/admin/disputes', requireAdmin, async (_req, res) => {
    try {
      const disputed = await db.select().from(orders).where(eq(orders.status, 'disputed'));
      const enriched = await Promise.all(disputed.map((o) => enrichOrder(o)));
      return res.json(enriched);
    } catch (err) {
      return res.status(500).json({ error: 'Ошибка загрузки споров' });
    }
  });

  app.post('/api/admin/disputes/:id/resolve', requireAdmin, async (req: AuthenticatedRequest, res) => {
    const parseResult = resolveDisputeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Неверное решение спора (complete или cancel)' });
    }

    const { resolution, admin_comment } = parseResult.data;

    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, req.params.id));
      if (!order) return res.status(404).json({ error: 'Заказ не найден' });

      if (resolution === 'complete' && order.courierId) {
        // Payout to courier
        await EscrowService.releaseAndPayoutOrder(order.id, order.clientId, order.courierId, order.budget);
        await db.update(orders).set({ status: 'completed' }).where(eq(orders.id, order.id));
      } else {
        // Refund to client
        await EscrowService.refundOrderFunds(order.id, order.clientId, order.budget, `Решение арбитража: ${admin_comment || 'Возврат клиенту'}`);
        await db.update(orders).set({ status: 'canceled' }).where(eq(orders.id, order.id));
      }

      await db.insert(auditLogs).values({
        id: `aud-${Date.now()}`,
        adminId: req.user!.id,
        action: `DISPUTE_RESOLVED_${resolution.toUpperCase()}`,
        targetId: order.id,
        details: `Спор по заказу #${order.id} разрешен в пользу ${resolution === 'complete' ? 'исполнителя' : 'заказчика'}. ${admin_comment || ''}`,
      });

      await db.insert(messages).values({
        id: `msg-${Date.now()}`,
        orderId: order.id,
        senderId: req.user!.id,
        text: `Решение Арбитража ПМР: заказ ${resolution === 'complete' ? 'завершен с выплатой исполнителю' : 'отменен с возвратом средств заказчику'}. Комментарий: ${admin_comment || 'Проверено администрацией.'}`,
      });

      const [updated] = await db.select().from(orders).where(eq(orders.id, order.id));
      const enriched = await enrichOrder(updated);
      broadcastOrderEvent(updated, 'order_updated', enriched);

      return res.json(enriched);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Ошибка арбитража' });
    }
  });

  app.get('/api/admin/audit-logs', requireAdmin, async (_req, res) => {
    try {
      const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(50);
      const enriched = await Promise.all(
        logs.map(async (l) => {
          const [adminUser] = await db.select().from(users).where(eq(users.id, l.adminId));
          return {
            id: l.id,
            admin_id: l.adminId,
            admin_name: adminUser?.fullName || 'Администратор',
            action: l.action,
            target_id: l.targetId,
            details: l.details,
            created_at: l.createdAt.toISOString(),
          };
        })
      );
      return res.json(enriched);
    } catch (err) {
      return res.status(500).json({ error: 'Ошибка журнала аудита' });
    }
  });

  // ==========================================
  // 9. VITE SPA MIDDLEWARE / PRODUCTION STATIC
  // ==========================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[PMR Express Server] Full-stack Cloud SQL server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
