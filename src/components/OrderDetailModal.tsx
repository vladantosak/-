import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle,
  Receipt as ReceiptIcon,
  MessageSquare,
  Send,
  Camera,
  Star,
  AlertTriangle,
  FileCheck,
  Phone,
  DollarSign,
  Upload,
  User as UserIcon,
  Sparkles,
  RefreshCw,
  Ban,
  RotateCcw,
  FileText,
  Printer
} from 'lucide-react';
import { Order, User, ChatMessage } from '../types';
import { PMR_CATEGORY_NAMES } from '../data/pmrCities';
import { api } from '../lib/api';
import { ReceiptExportModal } from './ReceiptExportModal';

interface OrderDetailModalProps {
  order: Order;
  currentUser: User;
  onClose: () => void;
  onOrderUpdated: (updated: Order) => void;
  onRepeatOrder?: (order: Order) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  currentUser,
  onClose,
  onOrderUpdated,
  onRepeatOrder,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'chat'>('info');

  // Receipt modal state
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  const [showReceiptExport, setShowReceiptExport] = useState(false);
  const [receiptTotal, setReceiptTotal] = useState(order.budget.toString());
  const [receiptPhotoUrl, setReceiptPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1554415707-9e49016a3e1f?w=600&auto=format&fit=crop&q=80'
  );
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [ocrResultText, setOcrResultText] = useState<string | null>(null);

  // Complete & Review state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewText, setReviewText] = useState('');

  // Dispute state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load chat messages
  useEffect(() => {
    let isMounted = true;
    const loadMessages = async () => {
      try {
        const msgs = await api.getMessages(order.id);
        if (isMounted) setMessages(msgs);
      } catch (e) {
        console.error('Error fetching chat messages', e);
      }
    };
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [order.id]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    try {
      const msg = await api.sendMessage(order.id, {
        text: newMessageText.trim(),
      });
      setMessages((prev) => [...prev, msg]);
      setNewMessageText('');
    } catch (err: any) {
      console.error(err);
    }
  };

  // Courier accepts order
  const handleAcceptOrder = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const updated = await api.acceptOrder(order.id);
      onOrderUpdated(updated);
      setActiveTab('chat');
    } catch (err: any) {
      setError(err.message || 'Ошибка принятия заказа');
    } finally {
      setIsLoading(false);
    }
  };

  // Courier submits receipt
  const handleSubmitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(receiptTotal);
    if (isNaN(total) || total <= 0) {
      setError('Укажите корректную сумму по чеку');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const updated = await api.uploadReceipt(order.id, {
        photo_url: receiptPhotoUrl,
        total_sum: total,
      });
      setShowReceiptUpload(false);
      onOrderUpdated(updated);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки чека');
    } finally {
      setIsLoading(false);
    }
  };

  // Client cancels order
  const handleCancelOrder = async () => {
    if (!confirm('Вы уверены, что хотите отменить заказ? Средства вернутся на ваш баланс.')) return;
    try {
      setIsLoading(true);
      setError(null);
      const updated = await api.cancelOrder(order.id);
      onOrderUpdated(updated);
    } catch (err: any) {
      setError(err.message || 'Ошибка отмены заказа');
    } finally {
      setIsLoading(false);
    }
  };

  // Gemini AI OCR scanner
  const handleRunOcr = async () => {
    try {
      setIsOcrScanning(true);
      setError(null);
      setOcrResultText(null);
      const result = await api.parseReceiptOcr(receiptPhotoUrl);
      if (result.totalSum) {
        setReceiptTotal(result.totalSum.toString());
      }
      setOcrResultText(
        `Распознано: ${result.storeName || 'Магазин ПМР'} • Сумма: ${result.totalSum} руб. ПМР`
      );
    } catch (err: any) {
      setError('Не удалось распознать чек через AI. Пожалуйста, введите сумму вручную.');
    } finally {
      setIsOcrScanning(false);
    }
  };

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setError(null);
      const res = await api.uploadFile(file);
      setReceiptPhotoUrl(res.url);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки изображения');
    } finally {
      setIsLoading(false);
    }
  };

  // Client confirms completion
  const handleCompleteOrder = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const updated = await api.completeOrder(order.id, {
        rating: ratingValue,
        review: reviewText.trim(),
      });
      setShowRatingModal(false);
      onOrderUpdated(updated);
    } catch (err: any) {
      setError(err.message || 'Ошибка завершения заказа');
    } finally {
      setIsLoading(false);
    }
  };

  // Open Dispute
  const handleOpenDispute = async () => {
    if (!disputeReason.trim()) {
      setError('Укажите причину спора');
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const updated = await api.disputeOrder(order.id, {
        reason: disputeReason.trim(),
      });
      setShowDisputeModal(false);
      onOrderUpdated(updated);
    } catch (err: any) {
      setError(err.message || 'Ошибка открытия спора');
    } finally {
      setIsLoading(false);
    }
  };

  const isClient = currentUser.id === order.client_id;
  const isCourier = currentUser.id === order.courier_id;
  const catMeta = PMR_CATEGORY_NAMES[order.category] || PMR_CATEGORY_NAMES.products;

  // Status timeline steps according to prompt
  // 1. Заказ создан -> 2. Исполнитель найден -> 3. Выполняется -> 4. Чек загружен -> 5. Завершён
  const timelineSteps = [
    {
      id: 1,
      label: 'Заказ создан',
      isCompleted: true,
      isActive: order.status === 'created',
    },
    {
      id: 2,
      label: 'Исполнитель найден',
      isCompleted: order.status !== 'created' && order.status !== 'canceled',
      isActive: order.status === 'accepted' && !order.receipt,
    },
    {
      id: 3,
      label: 'Выполняется',
      isCompleted: order.status === 'receipt_uploaded' || order.status === 'completed',
      isActive: order.status === 'accepted',
    },
    {
      id: 4,
      label: 'Чек загружен',
      isCompleted: order.status === 'receipt_uploaded' || order.status === 'completed',
      isActive: order.status === 'receipt_uploaded',
    },
    {
      id: 5,
      label: 'Завершён',
      isCompleted: order.status === 'completed',
      isActive: order.status === 'completed',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 relative my-auto animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${catMeta.badge}`}>
              {catMeta.label}
            </span>
            <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              г. {order.city}
            </span>
            {order.status === 'disputed' && (
              <span className="bg-rose-100 text-rose-800 text-xs font-extrabold px-2 py-0.5 rounded-lg flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-600" /> На споре
              </span>
            )}
            {order.status === 'canceled' && (
              <span className="bg-slate-100 text-slate-600 text-xs font-extrabold px-2 py-0.5 rounded-lg flex items-center gap-1">
                <Ban className="w-3 h-3" /> Отменен
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Бюджет</span>
              <span className="text-base sm:text-lg font-extrabold text-slate-900 leading-none">
                {order.budget} <span className="text-xs text-amber-600 font-bold">₽ ПМР</span>
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher: Info vs Chat */}
        <div className="flex border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'info'
                ? 'border-amber-500 text-amber-700 bg-amber-50/20'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Детали заказа & Чек</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-2 border-b-2 relative ${
              activeTab === 'chat'
                ? 'border-amber-500 text-amber-700 bg-amber-50/20'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Чат с участником</span>
            {messages.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                {messages.length}
              </span>
            )}
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'info' ? (
            <div className="space-y-4">
              {/* Status Timeline as requested */}
              <div className="bg-slate-50 rounded-2xl p-3.5 sm:p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Статус выполнения:
                  </h4>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {order.status === 'created'
                      ? 'Поиск исполнителя'
                      : order.status === 'accepted'
                      ? 'В работе'
                      : order.status === 'receipt_uploaded'
                      ? 'Ожидает подтверждения'
                      : order.status === 'completed'
                      ? 'Завершён успешно'
                      : 'Арбитраж'}
                  </span>
                </div>

                <div className="relative flex items-center justify-between">
                  <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-slate-200 -z-0" />
                  {timelineSteps.map((step) => {
                    return (
                      <div key={step.id} className="flex flex-col items-center flex-1 z-10">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                            step.isCompleted
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : step.isActive
                              ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                              : 'bg-white border-2 border-slate-300 text-slate-400'
                          }`}
                        >
                          {step.isCompleted ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : step.isActive ? (
                            <span className="w-2 h-2 rounded-full bg-white" />
                          ) : (
                            <span className="text-[10px]">{step.id}</span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] sm:text-[11px] font-bold mt-1.5 text-center leading-tight ${
                            step.isCompleted
                              ? 'text-emerald-800'
                              : step.isActive
                              ? 'text-amber-800 font-extrabold'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Escrow Financial Guarantee Box */}
              <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-emerald-950">
                      Безопасная сделка (PMR Escrow)
                    </h4>
                    <p className="text-emerald-800 text-[11px]">
                      Деньги заморожены на счете и переводятся курьеру только после проверки чека
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 text-[11px] font-bold text-emerald-900 shrink-0 bg-white/90 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <span>Выплата: {Math.round(order.budget * 0.9)} ₽</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500">Комиссия (10%): {Math.round(order.budget * 0.1)} ₽</span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200">
                <h3 className="font-extrabold text-base text-slate-900 mb-1.5">
                  {order.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {order.description}
                </p>

                {/* Address */}
                <div className="flex items-start gap-2 text-xs text-slate-800 mt-3 pt-2 border-t border-slate-100">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Адрес / Ориентир: </span>
                    <span>{order.address} ({order.city})</span>
                  </div>
                </div>
              </div>

              {/* Participants info: Courier Card & Client Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Courier Card as requested */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-extrabold text-emerald-700 tracking-wider">
                      Исполнитель
                    </span>
                    {order.courier_id && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        Личность подтверждена
                      </span>
                    )}
                  </div>

                  {order.courier_id ? (
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <img
                          src={order.courier_avatar || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100'}
                          alt="Исполнитель"
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                        />
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                            order.courier_is_online !== false ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                      </div>
                      <div className="text-xs flex-1 min-w-0">
                        <h4 className="font-extrabold text-slate-900 leading-tight truncate">
                          {order.courier_name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-amber-600 font-bold text-[11px] mt-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>4.9</span>
                          <span className="text-slate-400 font-normal">· 127 заказов</span>
                        </div>
                        <span className="text-slate-500 text-[11px] block mt-0.5">{order.courier_phone}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 text-slate-400 text-xs py-2">
                      <UserIcon className="w-6 h-6 stroke-1" />
                      <span>Исполнитель еще не назначен</span>
                    </div>
                  )}

                  {order.courier_id && (
                    <button
                      onClick={() => setActiveTab('chat')}
                      className="mt-3 w-full bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold py-1.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-slate-600" />
                      <span>Написать исполнителю</span>
                    </button>
                  )}
                </div>

                {/* Client Card */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                      Заказчик
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      г. {order.city}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <img
                        src={order.client_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                        alt="Заказчик"
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          order.client_is_online !== false ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                    </div>
                    <div className="text-xs flex-1 min-w-0">
                      <h4 className="font-extrabold text-slate-900 leading-tight truncate">
                        {order.client_name}
                      </h4>
                      <span className="text-slate-500 text-[11px] block mt-0.5">{order.client_phone}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('chat')}
                    className="mt-3 w-full bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold py-1.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-slate-600" />
                    <span>Написать заказчику</span>
                  </button>
                </div>
              </div>

              {/* RECEIPT SECTION WITH DETAILED BREAKDOWN */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ReceiptIcon className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                        Контроль расходов по чеку
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Фотофиксация и финансовая сверка чека
                      </p>
                    </div>
                  </div>

                  {order.receipt && (
                    <span className="text-xs font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-xl">
                      Чек: {order.receipt.total_sum} ₽
                    </span>
                  )}
                </div>

                {order.receipt ? (
                  <div className="space-y-3">
                    {/* Big Photo Preview */}
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-64 flex items-center justify-center shadow-inner">
                      <img
                        src={order.receipt.photo_url}
                        alt="Чек"
                        className="w-full h-full object-contain max-h-64"
                      />
                      <a
                        href={order.receipt.photo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute bottom-2 right-2 bg-slate-900/85 hover:bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition shadow-md"
                      >
                        Открыть оригинал ↗
                      </a>
                    </div>

                    {/* Financial Breakdown as requested */}
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Сумма покупки по чеку:</span>
                        <span className="font-bold text-slate-900">{order.receipt.total_sum} ₽</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Вознаграждение курьера:</span>
                        <span className="font-bold text-slate-900">{Math.round(order.budget * 0.9)} ₽</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-emerald-900 font-extrabold text-sm">
                        <span>Итоговая сумма сделки:</span>
                        <span>{order.receipt.total_sum + Math.round(order.budget * 0.9)} ₽</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <ReceiptIcon className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-slate-700">Чек пока не загружен</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Исполнитель загрузит фото чека после совершения покупки
                    </p>
                  </div>
                )}
              </div>
                ) : (
                  <div className="text-center py-6 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <ReceiptIcon className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                    <p className="text-xs font-medium text-slate-600">Чек пока не загружен</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Исполнитель сфотографирует чек после покупки в магазине
                    </p>
                  </div>
                )}
              </div>

              {/* Review & Rating Display if Completed */}
              {order.status === 'completed' && order.client_rating && (
                <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-center gap-1 text-amber-500 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < (order.client_rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-slate-800 ml-1.5">
                      {order.client_rating}.0
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 italic">"{order.client_review}"</p>
                </div>
              )}

              {/* Dispute Alert if Disputed */}
              {order.status === 'disputed' && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
                  <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Заказ находится в арбитраже
                  </h4>
                  <p className="text-xs text-rose-700">
                    Причина: {order.dispute_reason || 'Несоответствие чека'}
                  </p>
                  <p className="text-[11px] text-rose-500 mt-1">
                    Администратор проверяет фото чека и переписку в чате.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* CHAT TAB */
            <div className="flex flex-col h-[400px]">
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {messages.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    Нет сообщений. Начните диалог!
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_id === currentUser.id;
                    const isSystem = m.sender_id === 'system';
                    if (isSystem) {
                      return (
                        <div key={m.id} className="text-center my-2">
                          <span className="text-[11px] bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200">
                            {m.text}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] text-slate-400 font-medium px-1">
                          {m.sender_name}
                        </span>
                        <div
                          className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                            isMe
                              ? 'bg-emerald-600 text-white rounded-br-none'
                              : 'bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200'
                          }`}
                        >
                          <p>{m.text}</p>
                          {m.image_url && (
                            <img
                              src={m.image_url}
                              alt="Вложение"
                              className="mt-2 rounded-lg max-h-40 object-cover border border-white/20"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  placeholder="Сообщение исполнителю/заказчику..."
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
          {/* Action 1: Take order */}
          {order.status === 'created' && !isClient && (
            <button
              onClick={handleAcceptOrder}
              disabled={isLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Взять заказ в работу ({order.budget} руб. ПМР)</span>
            </button>
          )}

          {/* Action 1b: Cancel order if client created */}
          {order.status === 'created' && isClient && (
            <button
              onClick={handleCancelOrder}
              disabled={isLoading}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-2.5 px-4 rounded-xl transition text-xs flex items-center gap-1.5"
            >
              <Ban className="w-4 h-4" />
              <span>Отменить заказ (возврат {order.budget} руб.)</span>
            </button>
          )}

          {/* Action 2: Courier uploads receipt */}
          {order.status === 'accepted' && isCourier && (
            <div className="flex-1 flex gap-2">
              <button
                onClick={() => setShowReceiptUpload(true)}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition flex items-center justify-center gap-2 text-xs sm:text-sm"
              >
                <Camera className="w-4 h-4" />
                <span>Сфотографировать и прикрепить чек</span>
              </button>
            </div>
          )}

          {/* Action 3: Client confirms completion or disputes */}
          {order.status === 'receipt_uploaded' && isClient && (
            <div className="flex-1 flex flex-wrap gap-2">
              <button
                onClick={() => setShowRatingModal(true)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition flex items-center justify-center gap-2 text-xs sm:text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Подтвердить выполнение и оценить</span>
              </button>
              <button
                onClick={() => setShowDisputeModal(true)}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-2.5 px-3 rounded-xl transition text-xs flex items-center gap-1"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Открыть спор</span>
              </button>
            </div>
          )}

          {order.status === 'completed' && (
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2.5 py-1">
              <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Заказ успешно завершен</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowReceiptExport(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-3 rounded-xl transition text-xs flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Квитанция</span>
                </button>

                {onRepeatOrder && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onRepeatOrder(order);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3.5 rounded-xl transition text-xs flex items-center gap-1.5 shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Повторить заказ</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Repeat option for canceled orders as well */}
          {order.status === 'canceled' && onRepeatOrder && (
            <div className="w-full flex items-center justify-between gap-2 py-1">
              <span className="text-xs text-slate-400">Заказ был отменен</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRepeatOrder(order);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3.5 rounded-xl transition text-xs flex items-center gap-1.5 shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Повторить заказ</span>
              </button>
            </div>
          )}
        </div>

        {/* SUBMODAL 1: Upload Receipt Form with Gemini OCR */}
        {showReceiptUpload && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-20">
            <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-amber-500" />
                  Модуль фиксации чека
                </h3>
                <button
                  onClick={() => setShowReceiptUpload(false)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitReceipt} className="space-y-3">
                {/* Gemini OCR Trigger Button */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 rounded-2xl border border-indigo-100 flex items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-xs text-indigo-950 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Gemini AI OCR
                    </span>
                    <p className="text-[11px] text-indigo-800">
                      Автоматическое распознавание суммы и магазина
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRunOcr}
                    disabled={isOcrScanning}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1 shrink-0"
                  >
                    {isOcrScanning ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{isOcrScanning ? 'Анализ...' : 'Сканировать'}</span>
                  </button>
                </div>

                {ocrResultText && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                    {ocrResultText}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Сумма по чеку (руб. ПМР)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={receiptTotal}
                    onChange={(e) => setReceiptTotal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Фото чека из магазина / аптеки
                  </label>
                  <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 flex items-center gap-3">
                    <img
                      src={receiptPhotoUrl}
                      alt="Превью чека"
                      className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                    />
                    <div className="flex-1 text-[11px] text-slate-500 space-y-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-emerald-700 hover:underline font-bold block"
                      >
                        Загрузить свой файл фото ↗
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setReceiptPhotoUrl(
                            'https://images.unsplash.com/photo-1554415707-9e49016a3e1f?w=600&auto=format&fit=crop&q=80'
                          )
                        }
                        className="text-slate-600 hover:underline block"
                      >
                        Пример 1 (Шериф чек)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setReceiptPhotoUrl(
                            'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&auto=format&fit=crop&q=80'
                          )
                        }
                        className="text-slate-600 hover:underline block"
                      >
                        Пример 2 (Вивафарм аптека)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReceiptUpload(false)}
                    className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Загрузить чек
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SUBMODAL 2: Complete & Rating Form */}
        {showRatingModal && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-20">
            <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  Подтверждение и отзыв
                </h3>
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center py-2">
                <span className="text-xs text-slate-500 font-medium block mb-2">
                  Оцените работу исполнителя
                </span>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingValue(star)}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= ratingValue
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Отзыв о выполнении (необязательно)
                </label>
                <textarea
                  rows={2}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Спасибо за быструю доставку..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRatingModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleCompleteOrder}
                  disabled={isLoading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Подтвердить и перевести оплату
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBMODAL 3: Dispute Form */}
        {showDisputeModal && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-20">
            <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm sm:text-base text-rose-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  Открытие спора в Арбитраж ПМР
                </h3>
                <button
                  onClick={() => setShowDisputeModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Спор заморозит выплату средств до проверки администратором платформы.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Причина спора
                </label>
                <textarea
                  rows={3}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Несоответствие позиций чека, не тот товар, поврежден..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleOpenDispute}
                  disabled={isLoading}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Передать в Арбитраж
                </button>
              </div>
            </div>
          </div>
        )}
        {/* SUBMODAL 4: Receipt Export & Print Modal */}
        <ReceiptExportModal
          isOpen={showReceiptExport}
          onClose={() => setShowReceiptExport(false)}
          order={order}
        />
      </div>
    </div>
  );
};
