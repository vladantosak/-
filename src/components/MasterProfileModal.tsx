import React, { useState } from 'react';
import { MasterProfile, MasterService } from '../data/pmrMasters';
import { EscrowBadge, VerificationPill } from '../design-system/TrustComponents';
import {
  X,
  Star,
  MapPin,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  MessageCircle,
  Sparkles,
} from 'lucide-react';

interface MasterProfileModalProps {
  master: MasterProfile;
  onClose: () => void;
  onBookService?: (master: MasterProfile, service: MasterService, date: string, time: string) => void;
}

export const MasterProfileModal: React.FC<MasterProfileModalProps> = ({
  master,
  onClose,
  onBookService,
}) => {
  const [selectedService, setSelectedService] = useState<MasterService>(master.services[0] || null);
  const [selectedDate, setSelectedDate] = useState<string>('Сегодня');
  const [selectedTime, setSelectedTime] = useState<string>(master.availableTimeSlots[0] || '12:00');
  const [isBookedSuccess, setIsBookedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'services' | 'portfolio' | 'reviews'>('services');

  const handleBookingSubmit = () => {
    setIsBookedSuccess(true);
    if (onBookService && selectedService) {
      onBookService(master, selectedService, selectedDate, selectedTime);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 relative my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Cover & Header */}
        <div className="relative h-44 sm:h-52 bg-slate-900 overflow-hidden shrink-0">
          <img
            src={master.coverUrl || master.avatarUrl}
            alt={master.fullName}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition border border-white/20 z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Verification badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className="bg-white/90 backdrop-blur-md text-slate-900 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <span>{master.categoryEmoji}</span>
              <span>{master.categoryLabel}</span>
            </span>
            <EscrowBadge size="sm" className="bg-white/95" />
          </div>

          {/* Master Info on Cover */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3 text-white">
            <div className="flex items-center gap-3">
              <img
                src={master.avatarUrl}
                alt={master.fullName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shadow-md bg-slate-800 shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight">
                    {master.fullName}
                  </h2>
                  {master.isVerified && (
                    <span title="Личность подтверждена по паспорту" className="text-emerald-400">
                      <ShieldCheck className="w-5 h-5 fill-emerald-500 text-white" />
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200 mt-1">
                  <div className="flex items-center gap-1 bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded-md font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{master.rating}</span>
                    <span className="text-[10px] text-slate-300 font-normal">({master.reviewCount} отзывов)</span>
                  </div>
                  <span className="flex items-center gap-1 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>г. {master.city}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden sm:block text-right">
              <span className="text-[11px] text-slate-300 block">Услуги от</span>
              <span className="text-xl font-extrabold text-amber-400 leading-none">
                {master.startingPrice} ₽
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-4 shrink-0">
          <button
            onClick={() => setActiveTab('services')}
            className={`py-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'services'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Услуги & Запись</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full">
              {master.services.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('portfolio')}
            className={`py-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'portfolio'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Портфолио работ</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full">
              {master.portfolioImages.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Отзывы</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full">
              {master.reviews.length}
            </span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* About description */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              О мастере
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {master.about}
            </p>
            <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{master.address}</span>
              </span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Личность подтверждена
              </span>
            </div>
          </div>

          {/* Success Booking Notice */}
          {isBookedSuccess && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 text-emerald-900 font-bold text-sm mb-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Заявка успешно отправлена мастеру!</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Вы выбрали: <strong>{selectedService?.name}</strong> на{' '}
                <strong>{selectedDate}, {selectedTime}</strong>. Мастер свяжется с вами в течение 15 минут для подтверждения записи.
              </p>
            </div>
          )}

          {/* TAB 1: SERVICES & SCHEDULING */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 mb-2">
                  Выберите услугу:
                </h3>
                <div className="space-y-2">
                  {master.services.map((srv) => {
                    const isSelected = selectedService?.id === srv.id;
                    return (
                      <div
                        key={srv.id}
                        onClick={() => {
                          setSelectedService(srv);
                          setIsBookedSuccess(false);
                        }}
                        className={`cursor-pointer rounded-2xl p-3 sm:p-3.5 border transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/40 shadow-xs ring-1 ring-amber-400'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                              {srv.name}
                            </h4>
                            {srv.description && (
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {srv.description}
                              </p>
                            )}
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                              <Clock className="w-3 h-3" />
                              {srv.durationMinutes} мин.
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm sm:text-base font-extrabold text-slate-900">
                              {srv.price} <span className="text-xs font-semibold text-amber-600">₽</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Schedule Section */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span>Выберите удобный день и время:</span>
                  </h4>
                </div>

                {/* Day selector */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar mb-3">
                  {['Сегодня', 'Завтра', 'Послезавтра', 'Пятница', 'Суббота'].map((day) => (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(day)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                        selectedDate === day
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                {/* Time slot pills */}
                <div className="flex flex-wrap items-center gap-2">
                  {master.availableTimeSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        selectedTime === slot
                          ? 'bg-amber-500 text-white shadow-xs font-bold'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PORTFOLIO */}
          {activeTab === 'portfolio' && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900">
                Фотографии реальных работ мастера:
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {master.portfolioImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="group relative rounded-2xl overflow-hidden aspect-square bg-slate-100 border border-slate-200 shadow-xs"
                  >
                    <img
                      src={img}
                      alt={`Работа ${idx + 1}`}
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">
                  Отзывы клиентов ({master.reviews.length})
                </h3>
                <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{master.rating} из 5.0</span>
                </div>
              </div>

              <div className="space-y-2.5">
                {master.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-slate-900">
                        {rev.authorName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {rev.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-400 mb-1.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < rev.rating ? 'fill-amber-400' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Booking Action Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">
              К оплате мастеру:
            </span>
            <span className="text-base sm:text-lg font-extrabold text-slate-900">
              {selectedService ? selectedService.price : master.startingPrice} <span className="text-xs text-amber-600 font-bold">₽ ПМР</span>
            </span>
            <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Безопасная запись
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${master.phone}`}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition"
              title="Позвонить мастеру"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
            </a>

            <button
              onClick={handleBookingSubmit}
              className="bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm py-2.5 px-6 rounded-2xl shadow-sm transition flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-white/90" />
              <span>Записаться к мастеру</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
