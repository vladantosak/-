import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Order, OrderCategory } from '../types';
import { PMR_CITIES } from '../data/pmrCities';
import { CATEGORIES_CONFIG, STATUS_CONFIG } from '../design-system/theme';
import { EscrowBadge } from '../design-system/TrustComponents';
import {
  Navigation,
  Plus,
  ShoppingCart,
  Pill,
  Wrench,
  Hammer,
  Package,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  Search,
  CheckCircle2,
  X
} from 'lucide-react';

interface MapScreenProps {
  orders: Order[];
  selectedCity: string;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  radiusKm: number;
  onChangeRadius: (r: number) => void;
  userCoords: { lat: number; lng: number } | null;
  onSelectOrder: (order: Order) => void;
  onCreateOrderAtCoords: (coords: { lat: number; lng: number }) => void;
  onLocateUser: () => void;
}

export const MapScreen: React.FC<MapScreenProps> = ({
  orders,
  selectedCity,
  selectedCategory,
  onSelectCategory,
  radiusKm,
  onChangeRadius,
  userCoords,
  onSelectOrder,
  onCreateOrderAtCoords,
  onLocateUser,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [activePreviewOrder, setActivePreviewOrder] = useState<Order | null>(null);
  const [localSearch, setLocalSearch] = useState('');

  // Filter orders by category and local search
  const visibleOrders = orders.filter((o) => {
    const matchesCategory = selectedCategory === 'all' || o.category === selectedCategory;
    const matchesSearch =
      !localSearch ||
      o.title.toLowerCase().includes(localSearch.toLowerCase()) ||
      o.address.toLowerCase().includes(localSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate approximate distance
  const getDistanceStr = (orderLat: number, orderLng: number) => {
    if (!userCoords) return null;
    const R = 6371; // km
    const dLat = ((orderLat - userCoords.lat) * Math.PI) / 180;
    const dLng = ((orderLng - userCoords.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userCoords.lat * Math.PI) / 180) *
        Math.cos((orderLat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    return dist < 1 ? `${Math.round(dist * 1000)} м` : `${dist.toFixed(1)} км`;
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCity = PMR_CITIES.find((c) => c.name === selectedCity) || PMR_CITIES[0];
    const map = L.map(mapContainerRef.current, {
      center: [initialCity.lat, initialCity.lng],
      zoom: initialCity.zoom,
      zoomControl: false,
    });

    // High quality OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | ПМР',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Click map to create order at clicked location
    map.on('click', (e: L.LeafletMouseEvent) => {
      onCreateOrderAtCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Center map when selectedCity changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const targetCity = PMR_CITIES.find((c) => c.name === selectedCity);
    if (targetCity) {
      mapInstanceRef.current.flyTo([targetCity.lat, targetCity.lng], targetCity.zoom, {
        duration: 1.2,
      });
    }
  }, [selectedCity]);

  // Update user GPS location marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (userCoords) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userCoords.lat, userCoords.lng]);
      } else {
        const userIcon = L.divIcon({
          className: 'user-pin-icon',
          html: `
            <div class="relative flex items-center justify-center">
              <div class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md z-10"></div>
              <div class="absolute w-8 h-8 rounded-full bg-blue-400 opacity-40 animate-ping"></div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], {
          icon: userIcon,
          zIndexOffset: 1000,
        })
          .addTo(mapInstanceRef.current)
          .bindPopup('<div class="text-xs font-semibold text-slate-800">Вы находитесь здесь (GPS)</div>');
      }
    }
  }, [userCoords]);

  // Render Order Markers
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;

    markersLayerRef.current.clearLayers();

    visibleOrders.forEach((order) => {
      const catConfig = CATEGORIES_CONFIG[order.category] || {
        emoji: '📦',
        accentBg: '#10B981',
      };

      const isSelected = activePreviewOrder?.id === order.id;

      const markerHtml = `
        <div class="cursor-pointer group select-none transition-transform duration-150 ${
          isSelected ? 'scale-110' : 'hover:scale-105'
        }">
          <div class="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full shadow-md border ${
            isSelected ? 'border-emerald-600 ring-2 ring-emerald-400/30' : 'border-slate-200/90'
          } transition-all transform -translate-x-1/2 -translate-y-full">
            <span class="w-5 h-5 rounded-full flex items-center justify-center text-xs text-white" style="background-color: ${
              catConfig.accentBg
            }">
              ${catConfig.emoji}
            </span>
            <span class="text-xs font-bold text-slate-900 whitespace-nowrap">
              ${order.budget} руб.
            </span>
          </div>
          <div class="w-2 h-2 bg-slate-900 transform rotate-45 -translate-x-1/2 -translate-y-2 mx-auto"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-order-pin',
        html: markerHtml,
        iconSize: [70, 42],
        iconAnchor: [35, 35],
      });

      const marker = L.marker([order.location.lat, order.location.lng], { icon: customIcon });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setActivePreviewOrder(order);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([order.location.lat, order.location.lng], { animate: true });
        }
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [visibleOrders, activePreviewOrder]);

  return (
    <div className="relative w-full h-full min-h-[500px] flex flex-col bg-slate-100 overflow-hidden select-none">
      {/* Top Floating Controls Container */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-col gap-2 pointer-events-none">
        {/* Row 1: Search + Radius + GPS */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Search Input */}
          <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl px-3 py-1.5 shadow-sm border border-slate-200/90 flex items-center gap-2 flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder={`Поиск в г. ${selectedCity}...`}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none w-full font-medium"
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Radius Selector & GPS */}
          <div className="pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur-md rounded-2xl px-3 py-1.5 shadow-sm border border-slate-200/90">
            <span className="text-[11px] text-slate-500 font-semibold hidden md:inline">Радиус:</span>
            <select
              id="radius-selector"
              value={radiusKm}
              onChange={(e) => onChangeRadius(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer pr-1"
            >
              <option value={3}>до 3 км</option>
              <option value={7}>до 7 км</option>
              <option value={15}>до 15 км</option>
              <option value={35}>до 35 км</option>
              <option value={80}>Весь регион ПМР</option>
            </select>

            <button
              id="btn-locate-user"
              onClick={onLocateUser}
              title="Определить мое местоположение (GPS)"
              className="p-1 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition shrink-0"
            >
              <Navigation className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Row 2: Category Filter Pills */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl p-1 shadow-sm border border-slate-200/90 flex items-center gap-1 overflow-x-auto max-w-full no-scrollbar">
          <button
            id="cat-pill-all"
            onClick={() => onSelectCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Все ({orders.length})
          </button>

          <button
            id="cat-pill-products"
            onClick={() => onSelectCategory('products')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'products'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Покупки</span>
          </button>

          <button
            id="cat-pill-pharmacy"
            onClick={() => onSelectCategory('pharmacy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'pharmacy'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>Аптека</span>
          </button>

          <button
            id="cat-pill-auto"
            onClick={() => onSelectCategory('auto_parts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'auto_parts'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Автозапчасти</span>
          </button>

          <button
            id="cat-pill-master"
            onClick={() => onSelectCategory('master')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'master'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>Мастера</span>
          </button>

          <button
            id="cat-pill-delivery"
            onClick={() => onSelectCategory('delivery')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'delivery'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Доставка</span>
          </button>
        </div>
      </div>

      {/* Main Map Canvas */}
      <div ref={mapContainerRef} className="w-full flex-1 h-full min-h-[480px] z-0" />

      {/* Selected Order Bottom Card / Floating Preview */}
      {activePreviewOrder ? (
        <div className="absolute bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:w-96 z-[400] pointer-events-auto">
          <div className="bg-white/98 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 p-4 transition-all duration-200">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white shadow-2xs"
                  style={{
                    backgroundColor:
                      CATEGORIES_CONFIG[activePreviewOrder.category]?.accentBg || '#10B981',
                  }}
                >
                  {CATEGORIES_CONFIG[activePreviewOrder.category]?.emoji || '📦'}
                </span>
                <span className="text-xs font-bold text-slate-700">
                  {CATEGORIES_CONFIG[activePreviewOrder.category]?.shortName || 'Поручение'}
                </span>
                <EscrowBadge size="sm" />
              </div>

              <button
                onClick={() => setActivePreviewOrder(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 mb-1.5">
              {activePreviewOrder.title}
            </h3>

            <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{activePreviewOrder.address}</span>
              {getDistanceStr(activePreviewOrder.location.lat, activePreviewOrder.location.lng) && (
                <span className="shrink-0 font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                  {getDistanceStr(activePreviewOrder.location.lat, activePreviewOrder.location.lng)}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">
                  Оплата
                </span>
                <span className="text-base font-extrabold text-emerald-700">
                  {activePreviewOrder.budget} руб. ПМР
                </span>
              </div>

              <button
                id="btn-preview-details"
                onClick={() => onSelectOrder(activePreviewOrder)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition shadow-xs flex items-center gap-1.5"
              >
                <span>Подробнее</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Hint Bar at bottom when no order is selected */
        <div className="absolute bottom-4 left-4 right-4 z-[400] pointer-events-none flex justify-center">
          <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md text-white text-xs px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700/60 max-w-md text-center">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-medium">
              Кликните на любую точку на карте города, чтобы мгновенно разместить заказ
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
