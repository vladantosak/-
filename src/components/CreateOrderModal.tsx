import React, { useState, useEffect } from 'react';
import { X, MapPin, Plus, AlertCircle, ShoppingCart, Pill, Wrench, Hammer, Check, RotateCcw } from 'lucide-react';
import { OrderCategory, User, Order } from '../types';
import { PMR_CITIES, PMR_CATEGORY_NAMES } from '../data/pmrCities';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  selectedCity: string;
  initialCoords?: { lat: number; lng: number } | null;
  initialOrder?: Partial<Order> | null;
  onSubmitOrder: (data: {
    category: OrderCategory;
    title: string;
    description: string;
    budget: number;
    city: string;
    location: { lat: number; lng: number };
    address: string;
  }) => Promise<void>;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  selectedCity,
  initialCoords,
  initialOrder,
  onSubmitOrder
}) => {
  if (!isOpen) return null;

  const currentCityObj =
    PMR_CITIES.find((c) => c.name === selectedCity) || PMR_CITIES[0];

  const [category, setCategory] = useState<OrderCategory>(initialOrder?.category || 'products');
  const [city, setCity] = useState<string>(
    initialOrder?.city || (selectedCity !== 'Все города' ? selectedCity : 'Тирасполь')
  );
  const [title, setTitle] = useState(initialOrder?.title || '');
  const [description, setDescription] = useState(initialOrder?.description || '');
  const [budget, setBudget] = useState(initialOrder?.budget ? String(initialOrder.budget) : '150');
  const [address, setAddress] = useState(initialOrder?.address || '');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(
    initialOrder?.location || initialCoords || { lat: currentCityObj.lat, lng: currentCityObj.lng }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialOrder) {
      setCategory(initialOrder.category || 'products');
      setCity(initialOrder.city || (selectedCity !== 'Все города' ? selectedCity : 'Тирасполь'));
      setTitle(initialOrder.title || '');
      setDescription(initialOrder.description || '');
      setBudget(initialOrder.budget ? String(initialOrder.budget) : '150');
      setAddress(initialOrder.address || '');
      if (initialOrder.location) setCoords(initialOrder.location);
    }
  }, [initialOrder]);

  const handleCityChange = (newCityName: string) => {
    setCity(newCityName);
    const foundCity = PMR_CITIES.find((c) => c.name === newCityName);
    if (foundCity) {
      setCoords({ lat: foundCity.lat, lng: foundCity.lng });
    }
  };

  const handleQuickLandmark = (landmark: string) => {
    setAddress(landmark);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Укажите название заказа');
      return;
    }
    if (!description.trim()) {
      setError('Опишите, что именно требуется сделать или купить');
      return;
    }
    const numBudget = parseFloat(budget);
    if (isNaN(numBudget) || numBudget <= 0) {
      setError('Укажите корректный бюджет в рублях ПМР');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmitOrder({
        category,
        title: title.trim(),
        description: description.trim(),
        budget: numBudget,
        city,
        location: coords,
        address: address.trim() || `${city}, центр`
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка создания заказа');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCityData = PMR_CITIES.find((c) => c.name === city) || PMR_CITIES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="mb-5">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            {initialOrder ? <><RotateCcw className="w-3.5 h-3.5" /> Повтор поручения</> : 'Новое поручение в ПМР'}
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
            {initialOrder ? 'Повторить заказ' : 'Опубликовать заказ'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {initialOrder ? 'Параметры скопированы из предыдущего заказа. Вы можете скорректировать бюджет или описание.' : 'Свободные курьеры и мастера в вашем городе увидят его на карте'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Категория услуги
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setCategory('products')}
                className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition ${
                  category === 'products'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 font-semibold ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <ShoppingCart className="w-4 h-4 mb-1 text-emerald-600" />
                <span className="text-xs">Покупки</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('pharmacy')}
                className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition ${
                  category === 'pharmacy'
                    ? 'border-rose-600 bg-rose-50/70 text-rose-900 font-semibold ring-1 ring-rose-500'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Pill className="w-4 h-4 mb-1 text-rose-600" />
                <span className="text-xs">Аптека</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('auto_parts')}
                className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition ${
                  category === 'auto_parts'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold ring-1 ring-blue-500'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Wrench className="w-4 h-4 mb-1 text-blue-600" />
                <span className="text-xs">Автозапчасти</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('master')}
                className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition ${
                  category === 'master'
                    ? 'border-amber-600 bg-amber-50/70 text-amber-900 font-semibold ring-1 ring-amber-500'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Hammer className="w-4 h-4 mb-1 text-amber-600" />
                <span className="text-xs">Мастер</span>
              </button>
            </div>
          </div>

          {/* City Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Город ПМР
              </label>
              <select
                value={city}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {PMR_CITIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Budget */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Бюджет (руб. ПМР)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="10"
                  step="5"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full pl-3 pr-14 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-700">
                  руб.
                </span>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Название поручения
            </label>
            <input
              type="text"
              placeholder="Например: Доставить лекарства из дежурной аптеки"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Подробное описание и список товаров
            </label>
            <textarea
              rows={3}
              placeholder="Укажите список товаров, особые пожелания, требования к чеку..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Address & Landmark quick picks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Адрес или ориентир в г. {city}
            </label>
            <div className="relative mb-2">
              <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="ул. 25 Октября, возле Шериф-15"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Landmarks in current city */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Ориентиры:</span>
              {activeCityData.popularPlaces.slice(0, 3).map((place) => (
                <button
                  key={place}
                  type="button"
                  onClick={() => handleQuickLandmark(place)}
                  className="text-[11px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 px-2 py-0.5 rounded-md transition truncate max-w-[200px]"
                >
                  {place}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Публикация...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Опубликовать заказ ({budget} руб. ПМР)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
