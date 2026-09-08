import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  Eye,
  MessageSquare,
  Receipt as ReceiptIcon,
  RefreshCw,
  ExternalLink,
  MapPin,
  TrendingUp,
  DollarSign,
  ScrollText,
  Activity,
  User
} from 'lucide-react';
import { Verification, Order, AuditLog } from '../types';
import { api } from '../lib/api';

interface AdminPanelProps {
  onRefreshData: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onRefreshData }) => {
  const [activeTab, setActiveTab] = useState<'verifications' | 'disputes' | 'stats' | 'audit'>('verifications');
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [disputes, setDisputes] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Order | null>(null);
  const [disputeChat, setDisputeChat] = useState<any[]>([]);
  const [adminComment, setAdminComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      const [verList, dispList, statData, logs] = await Promise.all([
        api.getAdminVerifications(),
        api.getAdminDisputes(),
        api.getAdminStats(),
        api.getAdminAuditLogs().catch(() => []),
      ]);
      setVerifications(Array.isArray(verList) ? verList : []);
      setDisputes(Array.isArray(dispList) ? dispList : []);
      setStats(statData);
      setAuditLogs(Array.isArray(logs) ? logs : []);
    } catch (e) {
      console.error('Error loading admin data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Inspect dispute
  const handleInspectDispute = async (order: Order) => {
    setSelectedDispute(order);
    try {
      const msgs = await api.getMessages(order.id);
      setDisputeChat(msgs);
    } catch (e) {
      console.error(e);
    }
  };

  // Review Verification
  const handleReviewVerification = async (id: string, status: 'approved' | 'rejected') => {
    try {
      setIsLoading(true);
      await api.reviewVerification(id, status);
      setActionSuccess(
        status === 'approved' ? 'Заявка одобрена! Пользователь верифицирован.' : 'Заявка отклонена.'
      );
      await loadAdminData();
      onRefreshData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Resolve Dispute
  const handleResolveDispute = async (orderId: string, resolution: 'complete' | 'cancel') => {
    try {
      setIsLoading(true);
      await api.resolveDispute(orderId, resolution, adminComment);
      setActionSuccess(
        resolution === 'complete'
          ? 'Спор решен: заказ закрыт в пользу исполнителя.'
          : 'Спор решен: заказ отменен с возвратом средств.'
      );
      setSelectedDispute(null);
      setAdminComment('');
      await loadAdminData();
      onRefreshData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-900 text-slate-100 overflow-y-auto p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                Back-Office
              </span>
              <span className="text-xs text-slate-400">Управление платформой ПМР</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              Панель Администратора & Арбитраж
            </h1>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab('verifications')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'verifications'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Паспорта ({verifications.filter((v) => v.status === 'pending').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('disputes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'disputes'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Споры ({disputes.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'stats'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Статистика</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'audit'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ScrollText className="w-3.5 h-3.5" />
              <span>Аудит</span>
            </button>
            <button
              onClick={loadAdminData}
              title="Обновить"
              className="p-1.5 text-slate-400 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>

        {actionSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* TAB 1: VERIFICATION REQUESTS */}
        {activeTab === 'verifications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-300">
                Заявки на получение статуса «Проверенный исполнитель»
              </h2>
              <span className="text-xs text-slate-500">
                Всего: {verifications.length}
              </span>
            </div>

            {verifications.length === 0 ? (
              <div className="bg-slate-800/50 rounded-2xl p-10 text-center border border-slate-800">
                <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-400">Нет новых заявок на верификацию</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {verifications.map((v) => (
                  <div
                    key={v.id}
                    className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-sm text-white">{v.user_name}</h3>
                          <span className="text-xs text-slate-400">{v.user_phone}</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            v.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : v.status === 'rejected'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {v.status === 'approved'
                            ? 'Одобрен'
                            : v.status === 'rejected'
                            ? 'Отклонен'
                            : 'Ожидает решения'}
                        </span>
                      </div>

                      {/* Photos grid */}
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                            Разворот паспорта
                          </span>
                          <a href={v.passport_photo_url} target="_blank" rel="noreferrer">
                            <img
                              src={v.passport_photo_url}
                              alt="Паспорт"
                              className="w-full h-28 object-cover rounded-xl border border-slate-700 hover:opacity-90 transition"
                            />
                          </a>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                            Селфи с паспортом
                          </span>
                          <a href={v.selfie_photo_url} target="_blank" rel="noreferrer">
                            <img
                              src={v.selfie_photo_url}
                              alt="Селфи"
                              className="w-full h-28 object-cover rounded-xl border border-slate-700 hover:opacity-90 transition"
                            />
                          </a>
                        </div>
                      </div>
                    </div>

                    {v.status === 'pending' && (
                      <div className="flex gap-2 pt-2 border-t border-slate-700/50">
                        <button
                          onClick={() => handleReviewVerification(v.id, 'approved')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Одобрить</span>
                        </button>
                        <button
                          onClick={() => handleReviewVerification(v.id, 'rejected')}
                          className="flex-1 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Отклонить</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DISPUTES & ARBITRATION */}
        {activeTab === 'disputes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-300">
                Раздел «Арбитраж / Споры» (Проверка чеков и чата)
              </h2>
              <span className="text-xs text-slate-500">На споре: {disputes.length}</span>
            </div>

            {disputes.length === 0 ? (
              <div className="bg-slate-800/50 rounded-2xl p-10 text-center border border-slate-800">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-300">Все заказы проходят штатно</p>
                <p className="text-xs text-slate-500 mt-1">
                  Активных споров между заказчиками и исполнителями в ПМР сейчас нет
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {disputes.map((order) => (
                  <div
                    key={order.id}
                    className="bg-slate-800/80 border border-rose-500/30 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-md border border-rose-500/30">
                          Претензия по заказу
                        </span>
                        <h3 className="font-bold text-sm text-white mt-1">{order.title}</h3>
                        <span className="text-xs text-slate-400">
                          {order.city} • Эскроу бюджет: {order.budget} руб. ПМР
                        </span>
                      </div>
                      <button
                        onClick={() => handleInspectDispute(order)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Детали спора</span>
                      </button>
                    </div>

                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60 text-xs">
                      <span className="font-semibold text-slate-400 block mb-0.5">Причина:</span>
                      <p className="text-slate-200">{order.dispute_reason || 'Несоответствие чека'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Dispute Inspector Modal */}
            {selectedDispute && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
                <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white text-base">Арбитраж: {selectedDispute.title}</h3>
                      <span className="text-xs text-slate-400">
                        Бюджет: {selectedDispute.budget} руб. ПМР ({selectedDispute.city})
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedDispute(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="bg-rose-900/20 border border-rose-800/40 p-3 rounded-xl text-xs">
                      <span className="font-bold text-rose-300 block mb-0.5">Претензия:</span>
                      <span className="text-slate-200">{selectedDispute.dispute_reason}</span>
                    </div>

                    {selectedDispute.receipt ? (
                      <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                        <span className="text-xs font-bold text-slate-300 block mb-2 flex items-center gap-1.5">
                          <ReceiptIcon className="w-4 h-4 text-emerald-400" />
                          Прикрепленный чек: {selectedDispute.receipt.total_sum} руб. ПМР
                        </span>
                        <img
                          src={selectedDispute.receipt.photo_url}
                          alt="Чек"
                          className="w-full max-h-56 object-contain rounded-lg border border-slate-700"
                        />
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic">Чек не прикреплен</div>
                    )}

                    <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/80">
                      <span className="text-xs font-bold text-slate-300 block mb-2 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-indigo-400" />
                        История переписки:
                      </span>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1 text-xs">
                        {disputeChat.map((msg) => (
                          <div key={msg.id} className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                            <span className="font-bold text-indigo-300 mr-2">{msg.sender_name}:</span>
                            <span className="text-slate-200">{msg.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Официальное решение арбитража
                      </label>
                      <input
                        type="text"
                        placeholder="Например: Чек сверен, товар доставлен в полном объеме."
                        value={adminComment}
                        onChange={(e) => setAdminComment(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex gap-2">
                    <button
                      onClick={() => handleResolveDispute(selectedDispute.id, 'complete')}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition"
                    >
                      Завершить в пользу исполнителя
                    </button>
                    <button
                      onClick={() => handleResolveDispute(selectedDispute.id, 'cancel')}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs transition"
                    >
                      Отменить с возвратом средств
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STATISTICS */}
        {activeTab === 'stats' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                <span className="text-xs text-slate-400 block font-medium">Всего заказов</span>
                <span className="text-2xl font-black text-white mt-1 block">{stats.totalOrders}</span>
                <span className="text-[11px] text-emerald-400 font-semibold">100% ПМР сеть</span>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                <span className="text-xs text-slate-400 block font-medium">Оборот по заказам</span>
                <span className="text-2xl font-black text-emerald-400 mt-1 block">
                  {stats.totalVolume} <span className="text-sm font-semibold">руб.</span>
                </span>
                <span className="text-[11px] text-slate-400">Приднестровский рубль</span>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                <span className="text-xs text-slate-400 block font-medium">В процессе / Активны</span>
                <span className="text-2xl font-black text-amber-400 mt-1 block">{stats.activeOrders}</span>
                <span className="text-[11px] text-amber-300">На карте городов</span>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                <span className="text-xs text-slate-400 block font-medium">Верифицировано лиц</span>
                <span className="text-2xl font-black text-indigo-400 mt-1 block">
                  {stats.verifiedUsers} / {stats.totalUsers}
                </span>
                <span className="text-[11px] text-indigo-300">По паспорту ПМР</span>
              </div>
            </div>

            {/* Distribution by Cities in PMR */}
            <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/80">
              <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Распределение поручений по городам Приднестровья
              </h3>

              <div className="space-y-3">
                {stats.cityDistribution &&
                  Object.entries(
                    stats.cityDistribution as Record<string, { count: number; volume: number }>
                  ).map(([cityName, data]) => {
                    const pct = Math.round((data.count / (stats.totalOrders || 1)) * 100);
                    return (
                      <div key={cityName} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-200">{cityName}</span>
                          <span className="text-slate-400">
                            {data.count} заказов ({data.volume} руб. ПМР)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                            style={{ width: `${Math.max(pct, 8)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Category breakdown */}
            <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/80">
              <h3 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Популярность категорий
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Покупки & Шериф</span>
                  <span className="text-base font-bold text-emerald-400">
                    {stats.categoryDistribution?.products || 0}
                  </span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Аптека & Вивафарм</span>
                  <span className="text-base font-bold text-rose-400">
                    {stats.categoryDistribution?.pharmacy || 0}
                  </span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Автозапчасти</span>
                  <span className="text-base font-bold text-blue-400">
                    {stats.categoryDistribution?.auto_parts || 0}
                  </span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Мастера & Ремонт</span>
                  <span className="text-base font-bold text-amber-400">
                    {stats.categoryDistribution?.master || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <ScrollText className="w-4 h-4 text-purple-400" />
                  Системный журнал аудита & Безопасность
                </h2>
                <p className="text-xs text-slate-500">
                  Фиксация всех транзакций, смены статусов и решений арбитража
                </p>
              </div>
              <span className="text-xs text-slate-500">Записей: {auditLogs.length}</span>
            </div>

            {auditLogs.length === 0 ? (
              <div className="bg-slate-800/50 rounded-2xl p-10 text-center border border-slate-800">
                <Activity className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-400">Журнал аудита пока пуст</p>
              </div>
            ) : (
              <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                      <tr>
                        <th className="py-3 px-4">Время</th>
                        <th className="py-3 px-4">Действие</th>
                        <th className="py-3 px-4">Сущность</th>
                        <th className="py-3 px-4">Детали / Payload</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-700/30 transition">
                          <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                            {new Date(log.createdAt).toLocaleString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="bg-slate-900 text-purple-300 font-mono px-2 py-0.5 rounded border border-purple-500/30">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                            {log.entityType} ({log.entityId?.slice(0, 8) || '-'})
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px] truncate max-w-xs">
                            {JSON.stringify(log.details || {})}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
