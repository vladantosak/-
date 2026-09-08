import React from 'react';
import {
  Bell,
  CheckCircle2,
  Package,
  FileText,
  MessageSquare,
  AlertTriangle,
  Info,
  CheckCheck,
  X,
  ExternalLink,
  Clock
} from 'lucide-react';
import { AppNotification, Order } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onSelectOrderById?: (orderId: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectOrderById,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'order_created_nearby':
        return <Package className="w-5 h-5 text-emerald-600" />;
      case 'order_accepted':
        return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
      case 'order_status_changed':
        return <FileText className="w-5 h-5 text-amber-600" />;
      case 'chat_message':
        return <MessageSquare className="w-5 h-5 text-indigo-600" />;
      case 'system':
      default:
        return <Info className="w-5 h-5 text-slate-600" />;
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - d.getTime()) / (1000 * 60));
      if (diffMinutes < 1) return 'Только что';
      if (diffMinutes < 60) return `${diffMinutes} мин назад`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours} ч назад`;
      return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        id="notifications-modal"
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Уведомления</h2>
                {unreadCount > 0 && (
                  <span className="bg-emerald-500 text-slate-950 font-extrabold text-[11px] px-2 py-0.5 rounded-full">
                    {unreadCount} новых
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">События по вашим заказам и откликам</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                id="btn-mark-all-read"
                onClick={onMarkAllAsRead}
                title="Отметить все как прочитанные"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 px-2.5 py-1 rounded-lg hover:bg-slate-800 transition flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Прочитать все</span>
              </button>
            )}
            <button
              id="btn-close-notifications"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-3 space-y-1">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300 opacity-60" />
              <p className="text-sm font-semibold text-slate-600">Нет уведомлений</p>
              <p className="text-xs text-slate-400 mt-1">
                Здесь будут отображаться отклики курьеров, смена статусов и сообщения
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const orderId = notif.payload?.order_id || notif.payload?.orderId;

              return (
                <div
                  key={notif.id}
                  id={`notification-item-${notif.id}`}
                  onClick={() => {
                    if (!notif.is_read) onMarkAsRead(notif.id);
                    if (orderId && onSelectOrderById) {
                      onSelectOrderById(orderId);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-xl transition cursor-pointer flex items-start gap-3 text-left ${
                    notif.is_read
                      ? 'bg-white hover:bg-slate-50 opacity-80 hover:opacity-100'
                      : 'bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100/80 shadow-2xs'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {notif.title}
                      </h4>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed break-words">
                      {notif.body}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/60">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(notif.created_at)}
                      </span>

                      {orderId && (
                        <span className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5">
                          <span>Открыть заказ #{orderId.replace('ord-', '')}</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Всего уведомлений: {notifications.length}</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 rounded-xl transition shadow-2xs"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
