import React, { useState } from 'react';
import { User, Order, OrderCategory } from '../types';
import { PMR_CITIES, PMR_CATEGORY_NAMES } from '../data/pmrCities';
import { PMR_MASTERS, MasterProfile } from '../data/pmrMasters';
import { EscrowBadge, EscrowTrustBanner } from '../design-system/TrustComponents';
import {
  Search,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  Bell,
  Wallet,
  Sparkles,
  ChevronRight,
  Map,
  CheckCircle2,
  AlertCircle,
  User as UserIcon,
} from 'lucide-react';

interface HomeScreenProps {
  currentUser: User;
  orders: Order[];
  selectedCity: string;
  onSelectCity: (city: string) => void;
  onOpenCreateOrder: (prefillCategory?: OrderCategory) => void;
  onSelectOrder: (order: Order) => void;
  onNavigateToTab: (tab: 'home' | 'orders' | 'map' | 'masters' | 'profile') => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onSelectMaster: (master: MasterProfile) => void;
  unreadNotificationsCount: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  currentUser,
  orders,
  selectedCity,
  onSelectCity,
  onOpenCreateOrder,
  onSelectOrder,
  onNavigateToTab,
  onOpenNotifications,
  onOpenProfile,
  onSelectMaster,
  unreadNotificationsCount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Popular category cards definition
  const popularCategories: Array<{
    id: OrderCategory | 'other';
    title: string;
    emoji: string;
    bgClass: string;
    description: string;
  }> = [
    {
      id: 'pharmacy',
      title: 'Аптека',
      emoji: '💊',
      bgClass: 'bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100/70',
      description: 'Лекарства, Вивафарм',
    },
    {
      id: 'products',
      title: 'Покупки',
      emoji: '🛒',
      bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/70',
      description: 'Шериф, рынок, продукты',
    },
    {
      id: 'auto_parts',
      title: 'Запчасти',
      emoji: '🚗',
      bgClass: 'bg-blue-50 text-blue-700 border-blue-200/80 hover:bg-blue-100/70',
      description: 'Автодетали, срочная доставка',
    },
    {
      id: 'products',
      title: 'Доставка',
      emoji: '📦',
      bgClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 hover:bg-indigo-100/70',
      description: 'Посылки, документы',
    },
    {
      id: 'master',
      title: 'Мастер',
      emoji: '🔧',
      bgClass: 'bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100/70',
      description: 'Сантехник, электрик, ремонт',
    },
    {
      id: 'other',
      title: 'Ещё...',
      emoji: '•••',
      bgClass: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/70',
      description: 'Любое поручение',
    },
  ];

  // Filter orders for "Заказы рядом"
  const nearbyOrders = orders
    .filter((o) => {
      if (selectedCity && selectedCity !== 'Все города' && o.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return o.title.toLowerCase().includes(q) || o.address.toLowerCase().includes(q);
      }
      return true;
    })
    .slice(0, 5);

  // Status badge helper
  const renderStatusPill = (status: string) => {
    switch (status) {
      case 'created':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Ожидает курьера</span>
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Исполнитель найден</span>
          </span>
        );
      case 'receipt_uploaded':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>Чек загружен</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Завершён</span>
          </span>
        );
      case 'disputed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>На арбитраже</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getCategoryEmoji = (cat: string) => {
    switch (cat) {
      case 'pharmacy':
        return '💊';
      case 'auto_parts':
        return '🚗';
      case 'master':
        return '🔧';
      case 'products':
      default:
        return '🛒';
    }
  };

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto pb-24 sm:pb-12 select-none">
      {/* Top Header Card */}
      <div className="bg-slate-900 text-white pt-5 pb-7 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-5xl mx-auto">
          {/* Row 1: Greeting + City + Profile/Notifications */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                  alt={currentUser.full_name}
                  onClick={onOpenProfile}
                  className="w-11 h-11 rounded-2xl object-cover border-2 border-emerald-400 cursor-pointer shadow-xs"
                />
                {currentUser.is_verified && (
                  <span
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] shadow-xs"
                    title="Личность подтверждена"
                  >
                    ✓
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                    Привет, {currentUser.full_name ? currentUser.full_name.split(' ')[0] : 'друг'}! 👋
                  </h1>
                </div>

                {/* City Picker Pill */}
                <div className="flex items-center gap-1 text-xs text-slate-300 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <select
                    value={selectedCity}
                    onChange={(e) => onSelectCity(e.target.value)}
                    className="bg-transparent text-slate-200 font-semibold text-xs border-none outline-none cursor-pointer pr-1"
                  >
                    <option value="Все города" className="bg-slate-900 text-white">Все города ПМР</option>
                    {PMR_CITIES.map((c) => (
                      <option key={c.name} value={c.name} className="bg-slate-900 text-white">
                        г. {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Right side: Balance + Bell */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={onOpenProfile}
                className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-2xl px-3 py-1.5 text-right transition"
                title="Кошелек пользователя"
              >
                <span className="text-[10px] text-slate-400 block font-medium">Баланс</span>
                <span className="text-xs sm:text-sm font-extrabold text-emerald-400 leading-none">
                  {currentUser.balance ?? 1250} <span className="text-[11px] font-semibold">₽</span>
                </span>
              </button>

              <button
                onClick={onOpenNotifications}
                className="relative w-9 h-9 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-200 transition"
                title="Уведомления"
              >
                <Bell className="w-4 h-4 text-slate-200" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px] flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Row 2: "Что нужно сделать?" + Action Search Bar */}
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-2 tracking-tight">
              Что нужно сделать?
            </h2>

            <div className="relative flex items-center bg-white rounded-2xl p-1.5 shadow-xl border border-slate-200">
              <div className="flex items-center gap-2 flex-1 px-3">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Найти услугу или создать поручение..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      onOpenCreateOrder();
                    }
                  }}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none font-medium py-1.5"
                />
              </div>

              {/* Main Warm Orange CTA Button */}
              <button
                id="btn-home-create-cta"
                onClick={() => onOpenCreateOrder()}
                className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-xs sm:text-sm px-4 sm:px-6 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0"
              >
                <PlusCircle className="w-4 h-4 text-white" />
                <span>Создать поручение</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-6 space-y-7">
        {/* ESCROW TRUST BANNER */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-emerald-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                  🔒 Деньги защищены до завершения заказа
                </h4>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md">
                  PMR Escrow
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-snug">
                Средства резервируются сервисом и передаются исполнителю только после фото проверки чека и вашего подтверждения.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('map')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-3 py-1.5 rounded-xl transition flex items-center gap-1 shrink-0 self-start sm:self-auto"
          >
            <Map className="w-3.5 h-3.5" />
            <span>Карта ПМР</span>
          </button>
        </div>

        {/* POPULAR CATEGORIES SECTION */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
              Популярные категории
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              Выберите категорию для быстрого заказа
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-3">
            {popularCategories.map((cat) => (
              <button
                key={cat.title}
                onClick={() => {
                  if (cat.id === 'master') {
                    onNavigateToTab('masters');
                  } else {
                    onOpenCreateOrder(cat.id === 'other' ? undefined : (cat.id as OrderCategory));
                  }
                }}
                className={`flex flex-col items-center text-center p-3.5 sm:p-4 rounded-2xl border transition-all duration-150 active:scale-95 shadow-2xs group ${cat.bgClass}`}
              >
                <span className="text-3xl sm:text-4xl mb-2 transition-transform duration-200 group-hover:scale-110">
                  {cat.emoji}
                </span>
                <span className="font-extrabold text-xs sm:text-sm leading-tight text-slate-900">
                  {cat.title}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                  {cat.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* SECTION: ORDERS NEARBY ("Заказы рядом") */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                Заказы рядом
              </h3>
              <p className="text-xs text-slate-500">
                {selectedCity !== 'Все города'
                  ? `Актуальные поручения в г. ${selectedCity}`
                  : 'Все доступные поручения по Приднестровью'}
              </p>
            </div>

            <button
              onClick={() => onNavigateToTab('orders')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition"
            >
              <span>Смотреть все ({orders.length})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {nearbyOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2 text-xl">
                📦
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">
                Нет доступных заказов в этом районе
              </h4>
              <p className="text-xs text-slate-500 mt-1 mb-3 max-w-sm mx-auto">
                Будьте первым, кто создаст поручение в городе {selectedCity}!
              </p>
              <button
                onClick={() => onOpenCreateOrder()}
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold py-2 px-4 rounded-xl shadow-xs"
              >
                + Создать поручение
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {nearbyOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => onSelectOrder(order)}
                  className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200 hover:border-amber-400 shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition">
                      {getCategoryEmoji(order.category)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          {PMR_CATEGORY_NAMES[order.category]?.label || 'Поручение'}
                        </span>
                        {renderStatusPill(order.status)}
                      </div>

                      <h4 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug group-hover:text-amber-600 transition truncate max-w-md">
                        {order.title}
                      </h4>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5">
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{order.address}</span>
                        </span>
                        <span className="flex items-center gap-1 shrink-0 text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>Сегодня</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">
                        Оплата
                      </span>
                      <span className="text-base sm:text-lg font-extrabold text-slate-900">
                        {order.budget} <span className="text-xs text-amber-600 font-bold">₽</span>
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectOrder(order);
                      }}
                      className="bg-slate-100 group-hover:bg-amber-500 text-slate-800 group-hover:text-white font-extrabold text-xs py-2 px-4 rounded-xl transition flex items-center gap-1"
                    >
                      <span>Подробнее</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION: PROVEN MASTERS PREVIEW */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 flex items-center gap-1.5">
                <span>Проверенные мастера рядом</span>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                  ТОП
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Специалисты с подтвержденным паспортом и отзывами
              </p>
            </div>

            <button
              onClick={() => onNavigateToTab('masters')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition"
            >
              <span>Все мастера ({PMR_MASTERS.length})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {PMR_MASTERS.slice(0, 3).map((master) => (
              <div
                key={master.id}
                onClick={() => onSelectMaster(master)}
                className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-amber-400 shadow-2xs hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3 mb-2.5">
                    <img
                      src={master.avatarUrl}
                      alt={master.fullName}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <h4 className="font-extrabold text-sm text-slate-900 truncate">
                          {master.fullName}
                        </h4>
                        {master.isVerified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                      </div>
                      <span className="text-xs text-amber-700 font-semibold block">
                        {master.categoryEmoji} {master.categoryLabel}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        г. {master.city}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                    {master.about}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">
                    от <span className="text-amber-600">{master.startingPrice} ₽</span>
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectMaster(master);
                    }}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-0.5"
                  >
                    <span>Записаться</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
