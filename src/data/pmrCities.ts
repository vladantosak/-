import { PMRCity } from '../types';

export const PMR_CITIES: PMRCity[] = [
  {
    name: 'Тирасполь',
    lat: 46.8403,
    lng: 29.6267,
    zoom: 14,
    popularPlaces: [
      'Супермаркет Шериф-15 (ул. 25 Октября)',
      'Зеленый Рынок (ул. Карла Либкнехта)',
      'Центральная аптека "Вивафарм" (пл. Суворова)',
      'ТРК "Россия" / Парк Екатерининский',
      'Район Октябрьский (Балка), ТЦ "Тернополь"'
    ]
  },
  {
    name: 'Бендеры',
    lat: 46.8277,
    lng: 29.4797,
    zoom: 14,
    popularPlaces: [
      'Центральный рынок Бендер',
      'Шериф-1 (ул. Суворова)',
      'Бендерская Крепость (ул. Панина)',
      'Микрорайон "Шелковый", Автовокзал',
      'Микрорайон "Ленинский", ТЦ "Пассаж"'
    ]
  },
  {
    name: 'Рыбница',
    lat: 47.7667,
    lng: 29.0000,
    zoom: 14,
    popularPlaces: [
      'Центр, площадь Победы',
      'Шериф-8 (ул. Ленина)',
      'Городская больница (ул. Грибоедова)',
      'Район Вершигоры'
    ]
  },
  {
    name: 'Дубоссары',
    lat: 47.2667,
    lng: 29.1667,
    zoom: 14,
    popularPlaces: [
      'Шериф (ул. Дзержинского)',
      'Дубоссарская ГЭС',
      'Автостанция Дубоссары'
    ]
  },
  {
    name: 'Слободзея',
    lat: 46.7269,
    lng: 29.7042,
    zoom: 14,
    popularPlaces: [
      'Центральная ул. Фрунзе',
      'Супермаркет Шериф',
      'Русская часть, Районная больница'
    ]
  },
  {
    name: 'Григориополь',
    lat: 47.1472,
    lng: 29.2944,
    zoom: 14,
    popularPlaces: [
      'Шериф (ул. Ленина)',
      'Центральный рынок Григориополь'
    ]
  },
  {
    name: 'Каменка',
    lat: 48.0333,
    lng: 28.7000,
    zoom: 14,
    popularPlaces: [
      'Санаторий "Днестр"',
      'Центр, ул. Ленина'
    ]
  },
  {
    name: 'Днестровск',
    lat: 46.6167,
    lng: 29.9167,
    zoom: 14,
    popularPlaces: [
      'Молдавская ГРЭС',
      'Бульвар Энергетиков, Шериф'
    ]
  }
];

export const PMR_CATEGORY_NAMES: Record<string, { label: string; icon: string; color: string; badge: string }> = {
  products: {
    label: 'Покупки & Продукты',
    icon: 'ShoppingCart',
    color: 'bg-emerald-500 text-white',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  pharmacy: {
    label: 'Аптека & Лекарства',
    icon: 'Pill',
    color: 'bg-rose-500 text-white',
    badge: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  auto_parts: {
    label: 'Автозапчасти & Доставка',
    icon: 'Wrench',
    color: 'bg-blue-500 text-white',
    badge: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  master: {
    label: 'Услуги мастера / Ремонт',
    icon: 'Hammer',
    color: 'bg-amber-500 text-white',
    badge: 'bg-amber-50 text-amber-700 border-amber-200'
  }
};
