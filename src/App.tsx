import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { MapScreen } from './components/MapScreen';
import { OrderList } from './components/OrderList';
import { MyOrdersScreen } from './components/MyOrdersScreen';
import { CreateOrderModal } from './components/CreateOrderModal';
import { OrderDetailModal } from './components/OrderDetailModal';
import { ProfileModal } from './components/ProfileModal';
import { AdminPanel } from './components/AdminPanel';
import { NotificationsModal } from './components/NotificationsModal';
import { EscrowBadge } from './design-system/TrustComponents';
import { User, Order, OrderCategory, AppNotification } from './types';
import { api, getAuthToken } from './lib/api';
import { useWebSocket } from './hooks/useWebSocket';
import { PMR_CITIES } from './data/pmrCities';
import {
  Map,
  List,
  PlusCircle,
  User as UserIcon,
  ShieldCheck,
  Navigation,
  Layers,
  Sparkles,
  ShoppingBag,
  Briefcase
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'u-1',
    phone: '+373 777 12345',
    full_name: 'Александр Ковалев',
    role: 'user',
    rating: 4.95,
    is_verified: true,
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    balance: 1250,
    reserved_balance: 0,
    created_at: new Date().toISOString(),
  });

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('Тирасполь');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [radiusKm, setRadiusKm] = useState<number>(15);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>({
    lat: 46.8403,
    lng: 29.6267,
  });

  // Views & Modals
  const [activeView, setActiveView] = useState<'mobile' | 'admin'>('mobile');
  const [mobileDisplayMode, setMobileDisplayMode] = useState<'map' | 'list' | 'my_orders'>('map');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [repeatOrderData, setRepeatOrderData] = useState<Partial<Order> | null>(null);
  const [clickedMapCoords, setClickedMapCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isDemoMode, setIsDemoMode] = useState(true);

  // Real-time WebSocket integration
  const handleWsOrderCreated = useCallback((newOrder: Order) => {
    setOrders((prev) => {
      if (prev.some((o) => o.id === newOrder.id)) return prev;
      return [newOrder, ...prev];
    });
  }, []);

  const handleWsOrderUpdated = useCallback((updatedOrder: Order) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
    );
    setSelectedOrder((cur) => (cur?.id === updatedOrder.id ? updatedOrder : cur));
  }, []);

  const handleWsWalletUpdated = useCallback((data: { userId: string; balance: number; reservedBalance: number }) => {
    setCurrentUser((cur) => {
      if (cur.id === data.userId) {
        return {
          ...cur,
          balance: data.balance,
          reserved_balance: data.reservedBalance,
        };
      }
      return cur;
    });
  }, []);

  const handleWsVerificationReviewed = useCallback((data: any) => {
    setCurrentUser((cur) => {
      if (cur.id === data.userId) {
        return {
          ...cur,
          is_verified: data.status === 'approved',
        };
      }
      return cur;
    });
  }, []);

  const handleWsNotification = useCallback((notif: AppNotification) => {
    setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
  }, []);

  const { isConnected, authenticate } = useWebSocket({
    onOrderCreated: handleWsOrderCreated,
    onOrderUpdated: handleWsOrderUpdated,
    onWalletUpdated: handleWsWalletUpdated,
    onVerificationReviewed: handleWsVerificationReviewed,
    onNotification: handleWsNotification,
  });

  // Notifications handlers
  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch {
      // ignore
    }
  };

  const handleMarkNotificationAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    try {
      await api.markNotificationRead(id);
    } catch (err) {
      console.warn('Failed to mark notification read', err);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await api.markAllNotificationsRead();
    } catch (err) {
      console.warn('Failed to mark all notifications read', err);
    }
  };

  const handleSelectOrderById = (orderId: string) => {
    const found = orders.find((o) => o.id === orderId);
    if (found) {
      setSelectedOrder(found);
      setIsNotificationsModalOpen(false);
    }
  };

  const handleRepeatOrder = (order: Order) => {
    setRepeatOrderData({
      category: order.category,
      title: order.title,
      description: order.description,
      budget: order.budget,
      city: order.city,
      location: order.location,
      address: order.address,
    });
    setClickedMapCoords(null);
    setIsCreateModalOpen(true);
  };

  // Fetch initial users & orders
  const loadData = async () => {
    try {
      setIsRefreshing(true);
      const [usersData, ordersData, configData] = await Promise.all([
        api.getUsers(),
        api.getNearbyOrders({
          city: selectedCity !== 'Все города' ? selectedCity : undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          lat: userCoords?.lat,
          lng: userCoords?.lng,
          radius: radiusKm,
        }),
        api.getConfig().catch(() => ({ isDemoMode: true, platformFeePercent: 7, appName: 'ПМР Поручения & Мастера' })),
      ]);
      setAllUsers(Array.isArray(usersData) ? usersData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      if (configData) {
        setIsDemoMode(configData.isDemoMode);
      }

      // Keep currentUser in sync with full wallet balance from /api/auth/me
      try {
        const me = await api.getMe();
        if (me) {
          setCurrentUser(me);
        }
      } catch {
        // Unauthenticated or demo default
      }
      // Load unread notifications
      loadNotifications();
    } catch (err) {
      console.warn('Failed to load initial data', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Ensure auth session is initialized on mount, then load data
  useEffect(() => {
    let active = true;
    const init = async () => {
      if (!getAuthToken()) {
        try {
          const res = await api.switchUser(currentUser.id || 'u-1');
          if (active) {
            setCurrentUser(res.user);
            authenticate(res.token);
          }
        } catch {
          // guest or production mode
        }
      }
      if (active) {
        await loadData();
      }
    };
    init();
    return () => {
      active = false;
    };
  }, []);

  // Reload data when filters change (after initial mount)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    loadData();
  }, [selectedCity, selectedCategory, radiusKm]);

  // Authenticate as selected user in demo
  const handleSelectUser = async (u: User) => {
    try {
      const res = await api.switchUser(u.id);
      setCurrentUser(res.user);
      authenticate(res.token);
      if (res.user.role === 'admin') {
        setActiveView('admin');
      }
    } catch (e) {
      setCurrentUser(u);
    }
  };

  // Handle order creation
  const handleCreateOrder = async (orderData: {
    category: OrderCategory;
    title: string;
    description: string;
    budget: number;
    city: string;
    location: { lat: number; lng: number };
    address: string;
  }) => {
    const created = await api.createOrder(orderData);
    setOrders((prev) => [created, ...prev]);
    setSelectedOrder(created);
  };

  // Click empty point on map
  const handleMapPointClick = (coords: { lat: number; lng: number }) => {
    setClickedMapCoords(coords);
    setIsCreateModalOpen(true);
  };

  // GPS Locate user
  const handleLocateUser = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          // Fallback to Tiraspol center
          setUserCoords({ lat: 46.8403, lng: 29.6267 });
        }
      );
    }
  };

  // Count active orders for current user
  const myActiveOrdersCount = orders.filter(
    (o) =>
      (o.client_id === currentUser.id || o.courier_id === currentUser.id) &&
      ['created', 'accepted', 'receipt_uploaded'].includes(o.status)
  ).length;

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 overflow-hidden font-sans text-slate-900 select-none">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        allUsers={allUsers}
        onSelectUser={handleSelectUser}
        selectedCity={selectedCity}
        onSelectCity={(city) => setSelectedCity(city)}
        activeView={activeView}
        onChangeView={(view) => setActiveView(view)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenWallet={() => setIsProfileModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
        unreadNotificationsCount={notifications.filter((n) => !n.is_read).length}
        onRefresh={loadData}
        isRefreshing={isRefreshing}
        isConnected={isConnected}
      />

      {/* Main Container */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
        {activeView === 'admin' ? (
          <AdminPanel onRefreshData={loadData} />
        ) : (
          <div className="flex-1 flex flex-col relative overflow-hidden">
            {/* View Switcher: Map vs List vs My Orders */}
            <div className="bg-white px-3 sm:px-6 py-2 border-b border-slate-200 flex items-center justify-between z-10 shadow-2xs">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  id="tab-map-view"
                  onClick={() => setMobileDisplayMode('map')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    mobileDisplayMode === 'map'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Map className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Карта ПМР</span>
                </button>
                <button
                  id="tab-list-view"
                  onClick={() => setMobileDisplayMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    mobileDisplayMode === 'list'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <List className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Все заказы ({orders.length})</span>
                </button>
                <button
                  id="tab-my-orders-view"
                  onClick={() => setMobileDisplayMode('my_orders')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition relative ${
                    mobileDisplayMode === 'my_orders'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Мои заказы</span>
                  {myActiveOrdersCount > 0 && (
                    <span className="ml-0.5 bg-emerald-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                      {myActiveOrdersCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Middle/Right: Trust Badge & Quick Create Order button in header */}
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center">
                  <EscrowBadge size="md" />
                </div>

                <button
                  id="btn-create-order-header"
                  onClick={() => {
                    setClickedMapCoords(null);
                    setIsCreateModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Создать поручение</span>
                  <span className="sm:hidden">+ Заказ</span>
                </button>
              </div>
            </div>

            {/* Display Screen */}
            <div className="flex-1 relative overflow-hidden flex flex-col">
              {mobileDisplayMode === 'map' ? (
                <MapScreen
                  orders={orders}
                  selectedCity={selectedCity}
                  selectedCategory={selectedCategory}
                  onSelectCategory={(cat) => setSelectedCategory(cat)}
                  radiusKm={radiusKm}
                  onChangeRadius={(r) => setRadiusKm(r)}
                  userCoords={userCoords}
                  onSelectOrder={(order) => setSelectedOrder(order)}
                  onCreateOrderAtCoords={handleMapPointClick}
                  onLocateUser={handleLocateUser}
                />
              ) : mobileDisplayMode === 'list' ? (
                <OrderList
                  orders={orders}
                  onSelectOrder={(order) => setSelectedOrder(order)}
                  selectedCategory={selectedCategory}
                  onSelectCategory={(cat) => setSelectedCategory(cat)}
                  selectedCity={selectedCity}
                />
              ) : (
                <MyOrdersScreen
                  orders={orders}
                  currentUser={currentUser}
                  onSelectOrder={(order) => setSelectedOrder(order)}
                  onOpenWallet={() => setIsProfileModalOpen(true)}
                  onRepeatOrder={handleRepeatOrder}
                />
              )}
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <div className="sm:hidden bg-white border-t border-slate-200 py-2 px-4 flex items-center justify-around z-40 shadow-lg">
              <button
                onClick={() => setMobileDisplayMode('map')}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
                  mobileDisplayMode === 'map' ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                <Map className="w-5 h-5" />
                <span>Карта</span>
              </button>

              <button
                onClick={() => setMobileDisplayMode('list')}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
                  mobileDisplayMode === 'list' ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                <List className="w-5 h-5" />
                <span>Лента</span>
              </button>

              <button
                onClick={() => {
                  setRepeatOrderData(null);
                  setClickedMapCoords(null);
                  setIsCreateModalOpen(true);
                }}
                className="flex flex-col items-center justify-center -mt-5 bg-emerald-600 text-white w-12 h-12 rounded-full shadow-lg active:scale-95 transition"
              >
                <PlusCircle className="w-6 h-6" />
              </button>

              <button
                onClick={() => setMobileDisplayMode('my_orders')}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-bold relative ${
                  mobileDisplayMode === 'my_orders' ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                <Briefcase className="w-5 h-5" />
                <span>Мои</span>
                {myActiveOrdersCount > 0 && (
                  <span className="absolute -top-1 right-1 w-2 h-2 rounded-full bg-emerald-600" />
                )}
              </button>

              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-400"
              >
                <UserIcon className="w-5 h-5" />
                <span>Профиль</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: Create Order Modal */}
      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setClickedMapCoords(null);
          setRepeatOrderData(null);
        }}
        currentUser={currentUser}
        selectedCity={selectedCity}
        initialCoords={clickedMapCoords}
        initialOrder={repeatOrderData}
        onSubmitOrder={handleCreateOrder}
      />

      {/* MODAL 2: Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          currentUser={currentUser}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdated={(updated) => {
            setOrders((prev) =>
              prev.map((o) => (o.id === updated.id ? updated : o))
            );
            setSelectedOrder(updated);
          }}
          onRepeatOrder={handleRepeatOrder}
        />
      )}

      {/* MODAL 3: User Profile, Wallet & Verification */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        allUsers={allUsers}
        onSelectUser={handleSelectUser}
        onUserUpdated={(u) => setCurrentUser(u)}
        isDemoMode={isDemoMode}
      />

      {/* MODAL 4: Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkNotificationAsRead}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onSelectOrderById={handleSelectOrderById}
      />
    </div>
  );
}
