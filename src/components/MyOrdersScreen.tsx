import React, { useState } from 'react';
import {
  Package,
  CheckCircle,
  Clock,
  AlertTriangle,
  Star,
  ChevronRight,
  TrendingUp,
  Wallet,
  ShieldCheck,
  MapPin,
  FileCheck,
  DollarSign
} from 'lucide-react';
import { Order, User, OrderStatus } from '../types';
import { PMR_CATEGORY_NAMES } from '../data/pmrCities';

interface MyOrdersScreenProps {
  orders: Order[];
  currentUser: User;
  onSelectOrder: (order: Order) => void;
  onOpenWallet: () => void;
}

export const MyOrdersScreen: React.FC<MyOrdersScreenProps> = ({
  orders,
  currentUser,
  onSelectOrder,
  onOpenWallet,
}) => {
  const [roleFilter, setRoleFilter] = useState<'all' | 'as_client' | 'as_courier'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'disputed'>('all');

  // Filter orders relevant to current user
  const userOrders = orders.filter((o) => {
    const isClient = o.client_id === currentUser.id;
    const isCourier = o.courier_id === currentUser.id;

    if (roleFilter === 'as_client') return isClient;
    if (roleFilter === 'as_courier') return isCourier;
    return isClient || isCourier;
  });

  // Filter by status
  const filteredOrders = userOrders.filter((o) => {
    if (statusFilter === 'active') {
      return ['created', 'accepted', 'receipt_uploaded'].includes(o.status);
    }
    if (statusFilter === 'completed') {
      return o.status === 'completed';
    }
    if (statusFilter === 'disputed') {
      return o.status === 'disputed';
    }
    return true;
  });

  // Calculate Master / Courier Personal Statistics
  const courierCompletedOrders = orders.filter(
    (o) => o.courier_id === currentUser.id && o.status === 'completed'
  );
  const totalEarned = courierCompletedOrders.reduce((sum, o) => {
    // 90% payout after 10% platform fee
    return sum + (o.budget * 0.9);
  }, 0);

  const clientCreatedOrders = orders.filter((o) => o.client_id === currentUser.id);

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto p-3 sm:p-5 space-y-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Personal Master / Courier Stats Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-700/60 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {currentUser.role === 'master' ? 'Статистика Мастера' : 'Единый P2P Профиль'}
                </span>
                {currentUser.is_verified && (
                  <span className="text-[11px] text-slate-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Верифицирован
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black">{currentUser.full_name}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{currentUser.phone}</p>
            </div>

            {/* Quick Balance & Wallet Top-up */}
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 flex items-center justify-between sm:justify-start gap-4">
              <div>
                <span className="text-[11px] text-slate-300 block font-medium">Баланс кошелька</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black text-white">
                    {currentUser.balance?.toLocaleString('ru-RU') || '0'}
                  </span>
                  <span className="text-xs font-bold text-emerald-400">руб. ПМР</span>
                </div>
                {currentUser.reserved_balance ? (
                  <span className="text-[10px] text-amber-300 block">
                    (в эскроу: {currentUser.reserved_balance} руб.)
                  </span>
                ) : null}
              </div>
              <button
                onClick={onOpenWallet}
                className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5"
              >
                <Wallet className="w-4 h-4" />
                <span>Пополнить</span>
              </button>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-slate-700/60">
            <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/50">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Выполнено</span>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-lg sm:text-xl font-black text-white">
                {courierCompletedOrders.length}
              </div>
              <span className="text-[10px] text-slate-400">заказов мастером</span>
            </div>

            <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/50">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Заработано</span>
                <TrendingUp className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-lg sm:text-xl font-black text-emerald-400">
                {Math.round(totalEarned)} <span className="text-xs">руб.</span>
              </div>
              <span className="text-[10px] text-slate-400">чистая выплата (90%)</span>
            </div>

            <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/50">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Рейтинг</span>
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              </div>
              <div className="text-lg sm:text-xl font-black text-amber-300">
                {currentUser.rating.toFixed(2)} ★
              </div>
              <span className="text-[10px] text-slate-400">по отзывам клиентов</span>
            </div>

            <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/50">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Создано</span>
                <Package className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-lg sm:text-xl font-black text-white">
                {clientCreatedOrders.length}
              </div>
              <span className="text-[10px] text-slate-400">поручений заказчиком</span>
            </div>
          </div>
        </div>

        {/* Filter Controls Header */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Role Filter (Все / Я заказчик / Я исполнитель) */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1 rounded-lg transition ${
                  roleFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Все поручения ({orders.filter((o) => o.client_id === currentUser.id || o.courier_id === currentUser.id).length})
              </button>
              <button
                onClick={() => setRoleFilter('as_client')}
                className={`px-3 py-1 rounded-lg transition ${
                  roleFilter === 'as_client'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Я заказчик ({clientCreatedOrders.length})
              </button>
              <button
                onClick={() => setRoleFilter('as_courier')}
                className={`px-3 py-1 rounded-lg transition ${
                  roleFilter === 'as_courier'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Я мастер/курьер ({orders.filter((o) => o.courier_id === currentUser.id).length})
              </button>
            </div>

            {/* Status Tabs (Все, Активные, Завершенные, Споры) */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  statusFilter === 'all'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Все
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  statusFilter === 'active'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                В работе
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  statusFilter === 'completed'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Завершены
              </button>
              <button
                onClick={() => setStatusFilter('disputed')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  statusFilter === 'disputed'
                    ? 'bg-rose-600 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Споры
              </button>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-base">В этой категории пока нет заказов</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {roleFilter === 'as_courier'
                ? 'Возьмите доступный заказ на вкладке «Карта ПМР» или «Список»!'
                : 'Создайте новое поручение с гарантией безопасной сделки через эскроу.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const isClient = order.client_id === currentUser.id;
              const catMeta = PMR_CATEGORY_NAMES[order.category] || PMR_CATEGORY_NAMES.products;

              return (
                <div
                  key={order.id}
                  onClick={() => onSelectOrder(order)}
                  className="bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 transition shadow-2xs cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${catMeta.badge}`}>
                        {catMeta.label}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">{order.city}</span>

                      {/* Status badge */}
                      {order.status === 'created' && (
                        <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Поиск мастера
                        </span>
                      )}
                      {order.status === 'accepted' && (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" /> В процессе выполнения
                        </span>
                      )}
                      {order.status === 'receipt_uploaded' && (
                        <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <FileCheck className="w-3 h-3" /> Чек загружен
                        </span>
                      )}
                      {order.status === 'completed' && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Завершен
                        </span>
                      )}
                      {order.status === 'disputed' && (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Арбитраж
                        </span>
                      )}

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {isClient ? 'Вы заказчик' : 'Вы исполнитель'}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                      {order.title}
                    </h4>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{order.address}</span>
                    </div>
                  </div>

                  {/* Right side: Budget & Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-medium block">
                        {isClient ? 'Заморожено в эскроу' : 'К выплате (90%)'}
                      </span>
                      <div className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                        {isClient ? order.budget : Math.round(order.budget * 0.9)}{' '}
                        <span className="text-xs text-emerald-600">руб. ПМР</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs mt-1 sm:mt-2">
                      <span>Открыть</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
