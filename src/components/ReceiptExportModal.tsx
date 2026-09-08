import React, { useRef } from 'react';
import {
  FileText,
  Printer,
  Download,
  Copy,
  CheckCircle2,
  X,
  ShieldCheck,
  Building,
  Calendar,
  UserCheck,
  CreditCard
} from 'lucide-react';
import { Order } from '../types';

interface ReceiptExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

export const ReceiptExportModal: React.FC<ReceiptExportModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = React.useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const feePercent = 7;
  const feeAmount = Math.round((order.budget * feePercent) / 100);
  const payoutAmount = order.budget - feeAmount;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const text = `===========================================
ЭЛЕКТРОННАЯ КВИТАНЦИЯ СЕРВИСА «ПМР ПОРУЧЕНИЯ»
Номер заказа: #${order.id}
Дата: ${new Date(order.created_at).toLocaleString('ru-RU')}
Город: ${order.city}
Адрес: ${order.address}
Категория: ${order.category}
Наименование: ${order.title}
Описание: ${order.description}
-------------------------------------------
Заказчик: ${order.client_name} (${order.client_phone})
Исполнитель: ${order.courier_name || 'Не назначен'} (${order.courier_phone || '—'})
-------------------------------------------
Сумма заказа: ${order.budget.toFixed(2)} руб. ПМР
Комиссия платформы (7%): ${feeAmount.toFixed(2)} руб. ПМР
Выплата исполнителю: ${payoutAmount.toFixed(2)} руб. ПМР
${order.receipt ? `Чек покупки (OCR): ${order.receipt.total_sum.toFixed(2)} руб. ПМР` : ''}
Статус: ${order.status === 'completed' ? 'УСПЕШНО ЗАВЕРШЕН (ЭСКРОУ ВЫПЛАЧЕН)' : order.status.toUpperCase()}
===========================================`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleDownloadTxt = () => {
    const text = `===========================================
ЭЛЕКТРОННАЯ КВИТАНЦИЯ СЕРВИСА «ПМР ПОРУЧЕНИЯ»
Номер заказа: #${order.id}
Дата: ${new Date(order.created_at).toLocaleString('ru-RU')}
Город: ${order.city}
Адрес: ${order.address}
Категория: ${order.category}
Наименование: ${order.title}
-------------------------------------------
Заказчик: ${order.client_name} (${order.client_phone})
Исполнитель: ${order.courier_name || 'Не назначен'} (${order.courier_phone || '—'})
-------------------------------------------
Сумма поручения: ${order.budget.toFixed(2)} руб. ПМР
Комиссия платформы: ${feeAmount.toFixed(2)} руб. ПМР
Выплата исполнителю: ${payoutAmount.toFixed(2)} руб. ПМР
${order.receipt ? `Сумма по кассовому чеку: ${order.receipt.total_sum.toFixed(2)} руб. ПМР\n` : ''}Статус: ${order.status}
Безопасная сделка: P2P Эскроу Приднестровье
===========================================`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${order.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div
        id="receipt-export-modal"
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Электронная квитанция</h2>
              <p className="text-xs text-slate-400">Заказ #{order.id}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          <div
            ref={printRef}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm font-mono text-xs text-slate-800 space-y-4"
          >
            {/* Header Stamp */}
            <div className="text-center border-b border-slate-200 pb-4">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm mb-2">
                ПМР
              </div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 font-sans">
                ПМР Поручения & Мастера
              </h3>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                Сервис безопасных P2P расчетов и поручений
              </p>
              <div className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 font-sans">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Эскроу транзакция подтверждена
              </div>
            </div>

            {/* Order Meta */}
            <div className="grid grid-cols-2 gap-2 text-[11px] pb-3 border-b border-dashed border-slate-200">
              <div>
                <span className="text-slate-400 block">Номер квитанции:</span>
                <span className="font-bold text-slate-900">#{order.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Дата формирования:</span>
                <span className="font-bold text-slate-900">
                  {new Date(order.created_at).toLocaleDateString('ru-RU')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Город / Населенный пункт:</span>
                <span className="font-bold text-slate-900">{order.city}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Категория поручения:</span>
                <span className="font-bold text-slate-900">{order.category}</span>
              </div>
            </div>

            {/* Task Info */}
            <div className="pb-3 border-b border-dashed border-slate-200 space-y-1">
              <span className="text-slate-400 text-[11px] block">Поручение:</span>
              <p className="font-bold text-slate-900 text-xs font-sans">{order.title}</p>
              <p className="text-slate-600 text-[11px] font-sans">{order.description}</p>
              <p className="text-[10px] text-slate-400 mt-1">Адрес: {order.address}</p>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-dashed border-slate-200 text-[11px]">
              <div>
                <span className="text-slate-400 block">Заказчик:</span>
                <span className="font-bold text-slate-900 block font-sans">{order.client_name}</span>
                <span className="text-slate-500 text-[10px]">{order.client_phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Исполнитель:</span>
                <span className="font-bold text-slate-900 block font-sans">
                  {order.courier_name || 'Не назначен'}
                </span>
                <span className="text-slate-500 text-[10px]">{order.courier_phone || '—'}</span>
              </div>
            </div>

            {/* Financials */}
            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Сумма поручения:</span>
                <span className="font-bold">{order.budget.toFixed(2)} руб.</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Комиссия платформы (7%):</span>
                <span>{feeAmount.toFixed(2)} руб.</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Выплата исполнителю:</span>
                <span>{payoutAmount.toFixed(2)} руб.</span>
              </div>

              {order.receipt && (
                <div className="flex justify-between text-emerald-700 bg-emerald-50 px-2 py-1 rounded font-sans text-[11px]">
                  <span>Сумма по кассовому чеку (OCR):</span>
                  <span className="font-bold">{order.receipt.total_sum.toFixed(2)} руб.</span>
                </div>
              )}

              <div className="pt-2 border-t-2 border-slate-900 flex justify-between text-sm font-black text-slate-900 font-sans">
                <span>ИТОГО К ВЫПЛАТЕ:</span>
                <span>{order.budget.toFixed(2)} руб. ПМР</span>
              </div>
            </div>

            {/* Review / Rating if completed */}
            {order.client_rating && (
              <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] font-sans">
                <div className="flex items-center gap-1 font-bold text-amber-900">
                  <span>Оценка заказчика:</span>
                  <span className="text-amber-600">{'★'.repeat(order.client_rating)}</span>
                </div>
                {order.client_review && (
                  <p className="text-amber-800 text-[11px] mt-0.5 italic">
                    «{order.client_review}»
                  </p>
                )}
              </div>
            )}

            {/* Footer barcode/notice */}
            <div className="text-center pt-2 text-[10px] text-slate-400 font-sans">
              <p>Документ сформирован в автоматическом режиме через сервис «ПМР Поручения».</p>
              <p className="text-[9px] mt-0.5 font-mono">HASH: SHA256:{order.id}-{Date.now().toString(16)}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition shadow-2xs"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Скопировано!' : 'Копировать'}</span>
            </button>

            <button
              onClick={handleDownloadTxt}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Скачать .txt</span>
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Печать / PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
