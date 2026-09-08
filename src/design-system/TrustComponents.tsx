import React from 'react';
import { ShieldCheck, Lock, CheckCircle2, Phone, Star } from 'lucide-react';

/**
 * Escrow Security Badge - Communicates financial safety without clutter
 */
export const EscrowBadge: React.FC<{ size?: 'sm' | 'md'; className?: string }> = ({
  size = 'sm',
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 ${
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      } ${className}`}
    >
      <Lock className={size === 'sm' ? 'w-2.5 h-2.5 text-emerald-600' : 'w-3.5 h-3.5 text-emerald-600'} />
      <span>Деньги защищены • Эскроу</span>
    </span>
  );
};

/**
 * Identity Verification Pill
 */
export const VerificationPill: React.FC<{ isVerified: boolean; className?: string }> = ({
  isVerified,
  className = '',
}) => {
  if (!isVerified) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 ${className}`}
      title="Паспорт и личность проверены"
    >
      <ShieldCheck className="w-3 h-3 text-emerald-600" />
      <span>Личность подтверждена</span>
    </span>
  );
};

/**
 * Reassuring Escrow Trust Banner for First Screen / Map Screen
 */
export const EscrowTrustBanner: React.FC<{
  budget?: number;
  onDismiss?: () => void;
  className?: string;
}> = ({ budget, onDismiss, className = '' }) => {
  return (
    <div
      className={`bg-white/95 backdrop-blur-md rounded-2xl border border-emerald-200/80 shadow-sm p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-800 ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
          <Lock className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-900">
            <span>Безопасная сделка Приднестровья</span>
            <span className="text-[10px] uppercase tracking-wider font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
              PMR Escrow
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            {budget
              ? `Сумма ${budget} руб. замораживается до подтверждения чека из магазина и передачи заказа.`
              : 'Оплата резервируется сервисом. Исполнитель получает деньги только после проверки чека и вашего подтверждения.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-600 self-end sm:self-auto shrink-0">
        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded-lg">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Чек обязателен</span>
        </span>
      </div>
    </div>
  );
};

/**
 * Rating Star Pill
 */
export const RatingPill: React.FC<{ rating: number; reviewCount?: number }> = ({
  rating,
  reviewCount,
}) => {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg">
      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
      <span>{rating.toFixed(1)}</span>
      {reviewCount !== undefined && <span className="text-[10px] text-slate-400 font-normal">({reviewCount})</span>}
    </span>
  );
};
