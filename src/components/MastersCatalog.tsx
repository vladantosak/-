import React, { useState } from 'react';
import { MasterProfile, PMR_MASTERS, PMR_MASTER_CATEGORIES } from '../data/pmrMasters';
import { EscrowBadge, VerificationPill } from '../design-system/TrustComponents';
import {
  Search,
  Star,
  MapPin,
  ShieldCheck,
  Calendar,
  Sparkles,
  Phone,
  Filter,
  CheckCircle2,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

interface MastersCatalogProps {
  selectedCity: string;
  onSelectMaster: (master: MasterProfile) => void;
  onRequestMasterOrder?: (category: string) => void;
}

export const MastersCatalog: React.FC<MastersCatalogProps> = ({
  selectedCity,
  onSelectMaster,
  onRequestMasterOrder,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter masters
  const filteredMasters = PMR_MASTERS.filter((m) => {
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesCity = selectedCity === 'Все города' || m.city.toLowerCase() === selectedCity.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.about.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.services.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesCity && matchesSearch;
  });

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto pb-20 sm:pb-8">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white px-4 sm:px-6 py-6 border-b border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xl">💅 💆 🔧</span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Проверенные специалисты ПМР
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                Каталог мастеров на дому и услуг
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                Прямая запись к проверенным мастерам Тирасполя, Бендер и Рыбницы. Паспортная верификация, реальные отзывы и безопасная сделка.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 text-xs text-slate-300">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-0.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>100% проверенные мастера</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Паспорта и квалификация подтверждены модераторами сервиса
                </p>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-5 max-w-2xl bg-white rounded-2xl p-1.5 flex items-center gap-2 shadow-lg">
            <Search className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
            <input
              type="text"
              placeholder="Поиск мастера (маникюр, электрик, сантехник, массаж)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-slate-700 px-2"
              >
                Очистить
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Categories Horizontal Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-2.5 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
          {PMR_MASTER_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-bold text-slate-500">
            Найдено мастеров:{' '}
            <span className="text-slate-900 font-extrabold">{filteredMasters.length}</span>
            {selectedCity !== 'Все города' && <span> в г. {selectedCity}</span>}
          </div>
        </div>

        {filteredMasters.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 max-w-md mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 text-2xl">
              🔍
            </div>
            <h3 className="font-extrabold text-slate-900 text-base mb-1">
              Мастера не найдены
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Попробуйте сбросить фильтры поиска или выбрать другой город ПМР
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              Показать всех мастеров
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredMasters.map((master) => (
              <div
                key={master.id}
                onClick={() => onSelectMaster(master)}
                className="bg-white rounded-3xl border border-slate-200/90 hover:border-amber-400 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex flex-col group"
              >
                {/* Master Cover & Avatar */}
                <div className="relative h-40 bg-slate-900 overflow-hidden">
                  <img
                    src={master.coverUrl || master.avatarUrl}
                    alt={master.fullName}
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105 opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                  {/* Category Pill */}
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-slate-900 flex items-center gap-1 shadow-xs">
                    <span>{master.categoryEmoji}</span>
                    <span>{master.categoryLabel}</span>
                  </div>

                  {/* Verified pill */}
                  {master.isVerified && (
                    <div className="absolute top-3 right-3 bg-emerald-500 text-white p-1 rounded-full shadow-xs" title="Личность подтверждена">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Price Tag */}
                  <div className="absolute bottom-2.5 right-3 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-xl text-white font-extrabold text-xs">
                    от <span className="text-amber-400 text-sm">{master.startingPrice} ₽</span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col">
                  <div className="flex items-start gap-3 mb-2.5">
                    <img
                      src={master.avatarUrl}
                      alt={master.fullName}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-xs -mt-8 relative z-10 shrink-0 bg-slate-100"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                          {master.fullName}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">г. {master.city}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating & Reviews */}
                  <div className="flex items-center gap-2 text-xs mb-3">
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-md border border-amber-200/80">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{master.rating}</span>
                    </span>
                    <span className="text-slate-400">({master.reviewCount} отзывов)</span>
                    <span className="text-emerald-700 text-[11px] font-semibold ml-auto flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Проверен
                    </span>
                  </div>

                  {/* Short About Description */}
                  <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                    {master.about}
                  </p>

                  {/* Portfolio Preview Mini Grid */}
                  {master.portfolioImages && master.portfolioImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-1.5 mb-4">
                      {master.portfolioImages.slice(0, 3).map((img, i) => (
                        <div
                          key={i}
                          className="h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-100"
                        >
                          <img
                            src={img}
                            alt="Пример работы"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer & CTA Button */}
                  <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">
                      Свободные окна: {master.availableTimeSlots.slice(0, 2).join(', ')}...
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectMaster(master);
                      }}
                      className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-xs transition flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Записаться</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
