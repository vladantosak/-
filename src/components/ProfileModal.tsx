import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShieldCheck,
  Smartphone,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  UserCheck,
  Camera,
  Star,
  Key,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Building2,
  RefreshCw,
  Radio,
  MessageSquare
} from 'lucide-react';
import { User, WalletTransaction, Review } from '../types';
import { api } from '../lib/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  onUserUpdated: (user: User) => void;
  isDemoMode?: boolean;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  onSelectUser,
  onUserUpdated,
  isDemoMode = true,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'profile' | 'wallet' | 'reviews' | 'verification' | 'switch'>('profile');

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  // Phone auth state
  const [authPhone, setAuthPhone] = useState('+373 777 ');
  const [smsCode, setSmsCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);

  // Wallet state
  const [wallet, setWallet] = useState<{ balance: number; reservedBalance: number; transactions: WalletTransaction[] }>({
    balance: currentUser.balance || 0,
    reservedBalance: currentUser.reserved_balance || 0,
    transactions: [],
  });
  const [topupAmount, setTopupAmount] = useState<string>('100');

  // Verification form state
  const [passportPhotoUrl, setPassportPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80'
  );
  const [selfiePhotoUrl, setSelfiePhotoUrl] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80'
  );
  const [verificationSubmitted, setVerificationSubmitted] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const passportInputRef = useRef<HTMLInputElement | null>(null);
  const selfieInputRef = useRef<HTMLInputElement | null>(null);

  // Load wallet
  const loadWallet = async () => {
    try {
      const data = await api.getWallet();
      setWallet(data);
      onUserUpdated({
        ...currentUser,
        balance: data.balance,
        reserved_balance: data.reservedBalance,
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Load reviews for current user
  const loadReviews = async () => {
    try {
      setIsLoadingReviews(true);
      const revs = await api.getUserReviews(currentUser.id);
      setReviews(revs);
    } catch (e) {
      console.error('Error fetching reviews:', e);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  useEffect(() => {
    loadWallet();
    loadReviews();
  }, [currentUser.id]);

  // Toggle online / offline status
  const handleToggleOnline = async () => {
    const nextStatus = currentUser.is_online === false;
    try {
      setIsLoading(true);
      setStatusMessage(null);
      await api.updateOnlineStatus(nextStatus);
      onUserUpdated({
        ...currentUser,
        is_online: nextStatus,
      });
      setStatusMessage(
        nextStatus
          ? 'Статус обновлен: Вы В СЕТИ и принимаете поручения на карте!'
          : 'Статус обновлен: Вы НЕ В СЕТИ (режим паузы).'
      );
    } catch (err: any) {
      setStatusMessage(err.message || 'Ошибка обновления статуса');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle SMS countdown
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  // Send SMS Code via IDC gateway
  const handleSendCode = async () => {
    try {
      setIsLoading(true);
      setStatusMessage(null);
      const res = await api.sendCode(authPhone);
      setCodeSent(true);
      if (res.code) {
        setSmsCode(res.code); // auto-fill in demo for convenience
      }
      setCountdown(res.waitSeconds || 60);
      setStatusMessage('Код отправлен на номер IDC Приднестровья!');
    } catch (e: any) {
      setStatusMessage(e.message || 'Ошибка отправки кода');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify Code
  const handleVerifyCode = async () => {
    try {
      setIsLoading(true);
      setStatusMessage(null);
      const res = await api.verifyCode(authPhone, smsCode);
      onSelectUser(res.user);
      setStatusMessage(`Успешный вход: ${res.user.full_name}`);
      setCodeSent(false);
    } catch (e: any) {
      setStatusMessage(e.message || 'Неверный код подтверждения');
    } finally {
      setIsLoading(false);
    }
  };

  // Topup Wallet
  const handleTopup = async (amount: number) => {
    try {
      setIsLoading(true);
      setStatusMessage(null);
      const res = await api.topupWallet(amount);
      await loadWallet();
      setStatusMessage(`Баланс успешно пополнен на +${amount} руб. ПМР!`);
    } catch (e: any) {
      setStatusMessage(e.message || 'Ошибка пополнения');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Verification (Passport + Selfie)
  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setStatusMessage(null);
      await api.uploadVerification({
        passport_photo_url: passportPhotoUrl,
        selfie_photo_url: selfiePhotoUrl,
      });
      setVerificationSubmitted(true);
      setStatusMessage('Документы отправлены на проверку Администратору!');
    } catch (e: any) {
      setStatusMessage(e.message || 'Ошибка отправки документов');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePassportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsLoading(true);
      const res = await api.uploadFile(file);
      setPassportPhotoUrl(res.url);
    } catch (err: any) {
      setStatusMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelfieUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsLoading(true);
      const res = await api.uploadFile(file);
      setSelfiePhotoUrl(res.url);
    } catch (err: any) {
      setStatusMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative my-auto animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* User Card Header */}
        <div className="flex items-center gap-3.5 mb-4 pb-4 border-b border-slate-100">
          <div className="relative">
            <img
              src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}
              alt={currentUser.full_name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-200"
            />
            {currentUser.is_verified && (
              <span className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-1 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                {currentUser.full_name}
              </h3>
              {currentUser.is_verified ? (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> Проверен
                </span>
              ) : (
                <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  Не верифицирован
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-slate-400" />
              <span>{currentUser.phone} (IDC ПМР)</span>
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
              <span className="text-amber-500 font-bold flex items-center gap-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {currentUser.rating.toFixed(2)}
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-bold text-slate-800">
                Баланс: {wallet.balance} руб.
              </span>
            </div>

            {/* Online / Offline Status Toggle */}
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleOnline}
                disabled={isLoading}
                title="Переключить статус доступности для заказов"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition border ${
                  currentUser.is_online !== false
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    currentUser.is_online !== false ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                <span>{currentUser.is_online !== false ? 'В сети (принимаю заказы)' : 'Не в сети (пауза)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl mb-4 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 min-w-[70px] py-1.5 rounded-xl transition ${
              activeTab === 'profile' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
            }`}
          >
            Профиль
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`flex-1 min-w-[75px] py-1.5 rounded-xl transition flex items-center justify-center gap-1 ${
              activeTab === 'wallet' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Кошелек</span>
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 min-w-[75px] py-1.5 rounded-xl transition flex items-center justify-center gap-1 ${
              activeTab === 'reviews' ? 'bg-white text-amber-600 shadow-2xs' : 'text-slate-500'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Отзывы {reviews.length > 0 ? `(${reviews.length})` : ''}</span>
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            className={`flex-1 min-w-[75px] py-1.5 rounded-xl transition flex items-center justify-center gap-1 ${
              activeTab === 'verification' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Паспорт</span>
          </button>
          {isDemoMode && (
            <button
              onClick={() => setActiveTab('switch')}
              className={`flex-1 min-w-[70px] py-1.5 rounded-xl transition ${
                activeTab === 'switch' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Тест
            </button>
          )}
        </div>

        {statusMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* TAB 1: PROFILE & IDC AUTH */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-900 mb-1">Специфика аккаунта в ПМР</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Единый аккаунт позволяет одновременно выступать заказчиком поручений и выполнять заказы в качестве мастера или курьера.
              </p>
            </div>

            {/* IDC Phone Auth Section */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-white">
              <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-emerald-600" />
                Вход по номеру IDC (Интерднестрком)
              </h4>

              <div className="space-y-2.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="+373 777 12345"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={isLoading || countdown > 0}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold transition whitespace-nowrap"
                  >
                    {countdown > 0 ? `${countdown} сек.` : 'Запросить SMS'}
                  </button>
                </div>

                {codeSent && (
                  <div className="flex gap-2 animate-in fade-in">
                    <input
                      type="text"
                      placeholder="Код из SMS"
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={isLoading}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                    >
                      Подтвердить
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WALLET & ESCROW */}
        {activeTab === 'wallet' && (
          <div className="space-y-4">
            {/* Balance Card */}
            <div className="bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Баланс счета (АПБ / Клевер / Сбербанк)</span>
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-white">
                {wallet.balance.toLocaleString('ru-RU')}{' '}
                <span className="text-sm font-bold text-emerald-400">руб. ПМР</span>
              </div>
              {wallet.reservedBalance > 0 && (
                <div className="text-xs text-amber-300 mt-1 flex items-center gap-1 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Заморожено в активных эскроу: {wallet.reservedBalance} руб.</span>
                </div>
              )}
            </div>

            {/* Quick Top-up buttons */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                Быстрое пополнение баланса:
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 250, 500].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => handleTopup(amt)}
                    disabled={isLoading}
                    className="py-2.5 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 transition"
                  >
                    +{amt} руб.
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Badges in PMR */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">Платежные шлюзы:</span>
              </div>
              <span className="text-[11px] font-bold text-slate-700">
                Карта «Клевер» • АПБ Онлайн • Сбербанк ПМР
              </span>
            </div>

            {/* Transaction History */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-2">История операций по счету:</h4>
              {wallet.transactions.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-slate-100">
                  Пока нет финансовых операций
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {wallet.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {tx.type === 'topup' || tx.type === 'payout' || tx.type === 'refund' ? (
                          <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{tx.description}</p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(tx.createdAt).toLocaleString('ru-RU', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`font-black ${
                          tx.type === 'topup' || tx.type === 'payout' || tx.type === 'refund'
                            ? 'text-emerald-600'
                            : 'text-slate-800'
                        }`}
                      >
                        {tx.type === 'topup' || tx.type === 'payout' || tx.type === 'refund' ? '+' : '-'}
                        {tx.amount} руб.
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: REVIEWS & REPUTATION */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {/* Rating summary banner */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-2xl p-4 border border-amber-200/60 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="text-xl font-extrabold text-slate-900">
                    {currentUser.rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">/ 5.0</span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Рейтинг формируется на основе честных отзывов реальных заказчиков
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-extrabold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full">
                  {reviews.length} {reviews.length === 1 ? 'отзыв' : reviews.length > 1 && reviews.length < 5 ? 'отзыва' : 'отзывов'}
                </span>
              </div>
            </div>

            {/* Reviews list */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                  Отзывы клиентов
                </h4>
                <button
                  type="button"
                  onClick={loadReviews}
                  disabled={isLoadingReviews}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingReviews ? 'animate-spin' : ''}`} />
                  <span>Обновить</span>
                </button>
              </div>

              {isLoadingReviews ? (
                <div className="text-center py-8 text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                  <span>Загрузка отзывов...</span>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50 p-4">
                  <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Отзывов пока нет</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                    Выполняйте поручения в городах ПМР, чтобы клиенты оставляли оценки и комментарии о вашей работе.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={rev.author_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'}
                            alt={rev.author_name}
                            className="w-6 h-6 rounded-full object-cover border border-slate-200"
                          />
                          <span className="text-xs font-bold text-slate-800">
                            {rev.author_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < rev.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'fill-slate-100 text-slate-200'
                              }`}
                            />
                          ))}
                          <span className="text-xs font-extrabold text-slate-700 ml-1">
                            {rev.rating}
                          </span>
                        </div>
                      </div>

                      {rev.comment && (
                        <p className="text-xs text-slate-600 leading-relaxed pl-8">
                          "{rev.comment}"
                        </p>
                      )}

                      <div className="text-[10px] text-slate-400 text-right">
                        {new Date(rev.created_at).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: VERIFICATION */}
        {activeTab === 'verification' && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Верификация паспорта гражданина ПМР
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Для обеспечения доверия заказчиков исполнители загружают фото паспорта и селфи. Данные проверяются администрацией сервиса.
              </p>
            </div>

            {currentUser.is_verified ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900 text-sm">Ваш профиль верифицирован</h4>
                <p className="text-xs text-emerald-700">
                  У вас есть бейдж надежного исполнителя. Доступны любые заказы.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitVerification} className="space-y-3">
                <input
                  type="file"
                  ref={passportInputRef}
                  onChange={handlePassportUpload}
                  accept="image/*"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={selfieInputRef}
                  onChange={handleSelfieUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    1. Разворот паспорта ПМР
                  </label>
                  <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 flex items-center gap-3">
                    <img
                      src={passportPhotoUrl}
                      alt="Паспорт"
                      className="w-14 h-14 object-cover rounded-lg border border-slate-200"
                    />
                    <div className="flex-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => passportInputRef.current?.click()}
                        className="text-emerald-700 hover:underline font-bold block"
                      >
                        Загрузить файл паспорта ↗
                      </button>
                      <span className="text-slate-400">Четкий снимок страницы с фото</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    2. Селфи с разворотом паспорта
                  </label>
                  <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 flex items-center gap-3">
                    <img
                      src={selfiePhotoUrl}
                      alt="Селфи"
                      className="w-14 h-14 object-cover rounded-lg border border-slate-200"
                    />
                    <div className="flex-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => selfieInputRef.current?.click()}
                        className="text-emerald-700 hover:underline font-bold block"
                      >
                        Загрузить файл селфи ↗
                      </button>
                      <span className="text-slate-400">Лицо и документ видны разборчиво</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm transition"
                >
                  Отправить документы на модерацию
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 4: SWITCH DEMO ACCOUNTS */}
        {activeTab === 'switch' && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-600 block mb-1">
              Переключение между ролями для тестирования:
            </span>
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
              {Array.isArray(allUsers) && allUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    onSelectUser(u);
                    setStatusMessage(`Вы вошли как ${u.full_name}`);
                  }}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition ${
                    currentUser.id === u.id
                      ? 'border-emerald-600 bg-emerald-50/70'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <img
                    src={u.avatar_url}
                    alt={u.full_name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200"
                  />
                  <div className="text-xs truncate flex-1">
                    <span className="font-bold text-slate-900 block truncate">{u.full_name}</span>
                    <span className="text-slate-500 text-[10px] block">
                      {u.role === 'admin'
                        ? 'Администратор (Back-office)'
                        : u.role === 'master'
                        ? 'Мастер / Исполнитель (Рыбница)'
                        : 'Заказчик / Курьер (Тирасполь)'}
                    </span>
                  </div>
                  {currentUser.id === u.id && (
                    <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                      Активен
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
