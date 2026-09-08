import React from 'react';
import {
  ShieldCheck,
  MapPin,
  Smartphone,
  LayoutDashboard,
  UserCheck,
  RefreshCw,
  Wallet,
  Wifi,
  Bell
} from 'lucide-react';
import { User } from '../types';
import { PMR_CITIES } from '../data/pmrCities';

interface NavbarProps {
  currentUser: User;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  selectedCity: string;
  onSelectCity: (city: string) => void;
  activeView: 'mobile' | 'admin';
  onChangeView: (view: 'mobile' | 'admin') => void;
  onOpenProfile: () => void;
  onOpenWallet: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  onRefresh: () => void;
  isRefreshing?: boolean;
  isConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  selectedCity,
  onSelectCity,
  activeView,
  onChangeView,
  onOpenProfile,
  onOpenWallet,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  onRefresh,
  isRefreshing,
  isConnected = true,
}) => {
  return (
    <header className="bg-slate-900 text-white sticky top-0 z-50 border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & City */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-sm flex items-center justify-center shadow-xs">
              ПМР
            </div>
            <div>
              <div className="font-bold text-sm sm:text-base leading-tight tracking-tight flex items-center gap-1.5 font-display">
                <span>ПМР Поручения &amp; Мастера</span>
                <span className="hidden lg:inline-block text-[10px] font-bold bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wide">
                  Эскроу защита
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1.5">
                <span>Сервис поручений, доставки и мастеров</span>
                {isConnected && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.2 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    В сети
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* City Selector */}
          <div className="relative flex items-center bg-slate-800/90 hover:bg-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 border border-slate-700/80 text-xs sm:text-sm transition">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 mr-1.5 shrink-0" />
            <select
              id="city-selector"
              value={selectedCity}
              onChange={(e) => onSelectCity(e.target.value)}
              className="bg-transparent text-white border-none outline-none cursor-pointer pr-1 text-xs sm:text-sm font-semibold"
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

        {/* View switcher & User controls */}
        <div className="flex items-center gap-2">
          {/* Quick Wallet Balance Badge */}
          <button
            onClick={onOpenWallet}
            title="Баланс кошелька (нажмите для пополнения)"
            className="hidden sm:flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-800 text-emerald-300 px-2.5 py-1.5 rounded-xl border border-emerald-500/30 text-xs font-bold transition shadow-xs"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span>{currentUser.balance?.toLocaleString('ru-RU') || '0'} руб.</span>
          </button>

          {/* Notifications Bell */}
          {onOpenNotifications && (
            <button
              id="btn-notifications-bell"
              onClick={onOpenNotifications}
              title="Уведомления"
              className="relative p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-rose-500 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center px-1 shadow-xs animate-pulse">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            title="Обновить данные"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Mode Switcher: Mobile Client vs Admin Web Panel */}
          <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700">
            <button
              id="btn-switch-mobile"
              onClick={() => onChangeView('mobile')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                activeView === 'mobile'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Клиент</span>
            </button>
            <button
              id="btn-switch-admin"
              onClick={() => onChangeView('admin')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                activeView === 'admin'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Админка</span>
            </button>
          </div>

          {/* Switch User dropdown for instant testing of roles */}
          <div className="hidden lg:flex items-center bg-slate-800/80 rounded-lg px-2 py-1 border border-slate-700 text-xs">
            <span className="text-slate-400 mr-1.5">Тест роль:</span>
            <select
              value={currentUser.id}
              onChange={(e) => {
                const list = Array.isArray(allUsers) ? allUsers : [];
                const found = list.find((u) => u.id === e.target.value);
                if (found) onSelectUser(found);
              }}
              className="bg-transparent text-emerald-300 font-medium border-none outline-none cursor-pointer"
            >
              {Array.isArray(allUsers) && allUsers.map((u) => (
                <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                  {u.full_name} ({u.role === 'admin' ? 'Админ' : u.role === 'master' ? 'Мастер' : 'Заказчик/Курьер'})
                </option>
              ))}
            </select>
          </div>

          {/* Current User profile badge */}
          <button
            id="user-profile-button"
            onClick={onOpenProfile}
            className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700 transition text-left"
          >
            <div className="relative">
              <img
                src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                alt={currentUser.full_name}
                className="w-7 h-7 rounded-full object-cover border border-slate-600"
              />
              {currentUser.is_verified && (
                <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5" title="Паспорт верифицирован">
                  <ShieldCheck className="w-2.5 h-2.5" />
                </span>
              )}
            </div>
            <div className="hidden sm:block text-left leading-none">
              <div className="text-xs font-semibold text-white flex items-center gap-1">
                <span className="truncate max-w-[100px]">{currentUser.full_name.split(' ')[0]}</span>
                {currentUser.is_verified && <UserCheck className="w-3 h-3 text-emerald-400" />}
              </div>
              <span className="text-[10px] text-amber-300 font-medium">★ {currentUser.rating.toFixed(1)}</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
