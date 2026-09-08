import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Order, OrderCategory } from '../types';
import { PMR_CITIES, PMR_CATEGORY_NAMES } from '../data/pmrCities';
import { Navigation, Plus, Eye, ShoppingCart, Pill, Wrench, Hammer } from 'lucide-react';

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
  onLocateUser
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center: Tiraspol (PMR capital)
    const initialCity = PMR_CITIES.find((c) => c.name === selectedCity) || PMR_CITIES[0];
    const map = L.map(mapContainerRef.current, {
      center: [initialCity.lat, initialCity.lng],
      zoom: initialCity.zoom,
      zoomControl: false
    });

    // Clean OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | ПМР',
      maxZoom: 19
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

  // Update map view when selectedCity changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const targetCity = PMR_CITIES.find((c) => c.name === selectedCity);
    if (targetCity) {
      mapInstanceRef.current.flyTo([targetCity.lat, targetCity.lng], targetCity.zoom, {
        duration: 1.2
      });
    }
  }, [selectedCity]);

  // Update User Location marker
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
              <div class="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-lg z-10"></div>
              <div class="absolute w-8 h-8 rounded-full bg-blue-400 opacity-40 animate-ping"></div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], {
          icon: userIcon,
          zIndexOffset: 1000
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

    orders.forEach((order) => {
      const getCategoryIconSvg = (cat: OrderCategory) => {
        switch (cat) {
          case 'products':
            return '🛒';
          case 'pharmacy':
            return '💊';
          case 'auto_parts':
            return '⚙️';
          case 'master':
            return '🔨';
          default:
            return '📦';
        }
      };

      const getCategoryBg = (cat: OrderCategory) => {
        switch (cat) {
          case 'products':
            return 'bg-emerald-600';
          case 'pharmacy':
            return 'bg-rose-600';
          case 'auto_parts':
            return 'bg-blue-600';
          case 'master':
            return 'bg-amber-600';
          default:
            return 'bg-purple-600';
        }
      };

      const statusBadge = () => {
        switch (order.status) {
          case 'created':
            return '<span class="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-semibold">Новый</span>';
          case 'accepted':
            return '<span class="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-semibold">Взят</span>';
          case 'receipt_uploaded':
            return '<span class="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-semibold">Чек прикреплен</span>';
          case 'completed':
            return '<span class="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-semibold">Выполнен</span>';
          case 'disputed':
            return '<span class="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 font-semibold">Спор</span>';
          default:
            return '';
        }
      };

      const customIcon = L.divIcon({
        className: 'custom-order-pin',
        html: `
          <div class="cursor-pointer group">
            <div class="flex items-center gap-1 bg-white px-2 py-1 rounded-full shadow-lg border border-slate-200 hover:scale-105 transition transform -translate-x-1/2 -translate-y-full">
              <span class="w-5 h-5 rounded-full ${getCategoryBg(order.category)} text-white flex items-center justify-center text-xs shadow-xs">
                ${getCategoryIconSvg(order.category)}
              </span>
              <span class="text-xs font-bold text-slate-900">${order.budget} руб</span>
            </div>
            <div class="w-2 h-2 bg-slate-800 transform rotate-45 -translate-x-1/2 -translate-y-2 mx-auto"></div>
          </div>
        `,
        iconSize: [60, 40],
        iconAnchor: [30, 30]
      });

      const marker = L.marker([order.location.lat, order.location.lng], { icon: customIcon });

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 max-w-[240px] text-slate-900 font-sans';
      popupContent.innerHTML = `
        <div class="flex items-center justify-between gap-1 mb-1.5">
          ${statusBadge()}
          <span class="font-extrabold text-sm text-emerald-700">${order.budget} руб. ПМР</span>
        </div>
        <h4 class="font-semibold text-xs leading-snug mb-1 text-slate-900 line-clamp-2">${order.title}</h4>
        <p class="text-[11px] text-slate-500 mb-2 truncate">${order.address}</p>
        <button id="open-order-${order.id}" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 transition">
          <span>Подробнее</span> &rarr;
        </button>
      `;

      // Handle button click in popup
      popupContent.querySelector(`#open-order-${order.id}`)?.addEventListener('click', () => {
        onSelectOrder(order);
      });

      marker.bindPopup(popupContent);
      markersLayerRef.current.addLayer(marker);
    });
  }, [orders, onSelectOrder]);

  return (
    <div className="relative w-full h-full min-h-[500px] flex flex-col">
      {/* Top Filter Overlay */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center gap-2 pointer-events-none">
        {/* Category Pills */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl p-1.5 shadow-lg border border-slate-200/80 flex items-center gap-1 overflow-x-auto max-w-full">
          <button
            onClick={() => onSelectCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Все ({orders.length})
          </button>
          <button
            onClick={() => onSelectCategory('products')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'products'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Покупки</span>
          </button>
          <button
            onClick={() => onSelectCategory('pharmacy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'pharmacy'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>Аптека</span>
          </button>
          <button
            onClick={() => onSelectCategory('auto_parts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'auto_parts'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Автозапчасти</span>
          </button>
          <button
            onClick={() => onSelectCategory('master')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'master'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>Мастера</span>
          </button>
        </div>

        {/* Radius Filter & GPS Locate */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl px-3 py-1.5 shadow-lg border border-slate-200/80 flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap hidden sm:inline">Радиус:</span>
          <select
            value={radiusKm}
            onChange={(e) => onChangeRadius(Number(e.target.value))}
            className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer"
          >
            <option value={3}>до 3 км</option>
            <option value={7}>до 7 км</option>
            <option value={15}>до 15 км</option>
            <option value={35}>до 35 км</option>
            <option value={80}>Весь регион ПМР</option>
          </select>
          <button
            onClick={onLocateUser}
            title="Определить мое местоположение (GPS)"
            className="p-1 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full flex-1 h-full min-h-[460px] z-0" />

      {/* Map Bottom Hint Banner */}
      <div className="absolute bottom-4 left-4 right-4 z-[400] pointer-events-none flex justify-center">
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md text-white text-xs px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700/60 max-w-md text-center">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
          <span>Кликните на любую точку на карте города, чтобы мгновенно разместить заказ</span>
        </div>
      </div>
    </div>
  );
};
