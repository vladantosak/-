import React, { useState } from 'react';
import { Order, OrderCategory } from '../types';
import { PMR_CATEGORY_NAMES } from '../data/pmrCities';
import { EscrowBadge } from '../design-system/TrustComponents';
import { Search, MapPin, Clock, ArrowRight, ShieldCheck, ChevronRight, User } from 'lucide-react';

interface OrderListProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedCity: string;
}

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  onSelectOrder,
  selectedCategory,
  onSelectCategory,
  selectedCity
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'created':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Ожидает исполнителя
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Взят в работу
          </span>
        );
      case 'receipt_uploaded':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Чек загружен
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Выполнен
          </span>
        );
      case 'disputed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Спор / Арбитраж
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto p-3 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Search & Status Filters */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-200/80 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск по названию, адресу, магазину (Шериф, Аптека...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100/70 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  filterStatus === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Все статусы
              </button>
              <button
                onClick={() => setFilterStatus('created')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  filterStatus === 'created'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Свободные
              </button>
              <button
                onClick={() => setFilterStatus('accepted')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  filterStatus === 'accepted'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                В работе
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  filterStatus === 'completed'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Завершенные
              </button>
            </div>

            <span className="text-slate-400 font-medium text-[11px]">
              Найдено: {filteredOrders.length}
            </span>
          </div>
        </div>

        {/* Order Cards List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-xl">
              📦
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">Нет активных заказов</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              В выбранном городе и категории пока нет поручений. Вы можете стать первым и создать заказ!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredOrders.map((order) => {
              const catMeta = PMR_CATEGORY_NAMES[order.category] || PMR_CATEGORY_NAMES.products;
              return (
                <div
                  key={order.id}
                  onClick={() => onSelectOrder(order)}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    {/* Header: Category & Budget */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${catMeta.badge}`}>
                          {catMeta.label}
                        </span>
                        <EscrowBadge size="sm" />
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-base font-extrabold text-slate-900 leading-none block">
                          {order.budget} <span className="text-xs font-semibold text-emerald-600">руб.</span>
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-sm text-slate-900 leading-snug group-hover:text-emerald-700 transition line-clamp-2 mb-1.5">
                      {order.title}
                    </h3>

                    {/* Description preview */}
                    <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                      {order.description}
                    </p>
                  </div>

                  {/* Footer details */}
                  <div className="pt-2.5 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-1 truncate max-w-[200px]">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{order.city}, {order.address}</span>
                      </div>
                      {order.distance_km !== undefined && (
                        <span className="font-semibold text-emerald-600 shrink-0">
                          {order.distance_km} км
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>{getStatusBadge(order.status)}</div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-900 group-hover:text-emerald-600 transition">
                        <span>Открыть</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
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
