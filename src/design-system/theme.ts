/**
 * Design System Tokens & Constants
 * Application: «ПМР Поручения & Мастера» (Тирасполь, Бендеры, Рыбница)
 * Palette: Deep Navy (#0F172A, #111827), Emerald (#10B981, #00A884), Amber (#F59E0B)
 * Neutrals: #F8FAFC, #F1F5F9, #FFFFFF, Text: #0F172A, #475569, #64748B
 */

export const THEME = {
  colors: {
    // Primary deep navy
    navy: {
      950: '#0B1120',
      900: '#0F172A',
      800: '#1E293B',
      700: '#334155',
    },
    // Primary Emerald / Teal Accent
    emerald: {
      600: '#059669',
      500: '#10B981',
      400: '#34D399',
      teal: '#00A884',
      light: '#ECFDF5',
    },
    // Warning & Secondary Accent
    amber: {
      500: '#F59E0B',
      600: '#D97706',
      light: '#FFFBEB',
    },
    // Neutrals
    background: '#F8FAFC',
    card: '#FFFFFF',
    canvas: '#F1F5F9',
    border: '#E2E8F0',
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      muted: '#64748B',
      light: '#94A3B8',
    },
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    displayFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
  },
  borderRadius: {
    sm: '0.5rem',   // 8px
    md: '0.75rem',  // 12px
    lg: '1rem',     // 16px
    full: '9999px',
  },
} as const;

export interface CategoryMeta {
  id: string;
  name: string;
  shortName: string;
  iconName: string;
  emoji: string;
  colorClass: string;
  badgeClass: string;
  accentBg: string;
}

export const CATEGORIES_CONFIG: Record<string, CategoryMeta> = {
  products: {
    id: 'products',
    name: 'Покупки & Продукты',
    shortName: 'Покупки',
    iconName: 'ShoppingCart',
    emoji: '🛒',
    colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    badgeClass: 'bg-emerald-600 text-white',
    accentBg: '#10B981',
  },
  pharmacy: {
    id: 'pharmacy',
    name: 'Аптека & Лекарства',
    shortName: 'Аптека',
    iconName: 'Pill',
    emoji: '💊',
    colorClass: 'text-rose-700 bg-rose-50 border-rose-200',
    badgeClass: 'bg-rose-600 text-white',
    accentBg: '#E11D48',
  },
  auto_parts: {
    id: 'auto_parts',
    name: 'Автозапчасти & Доставка',
    shortName: 'Автозапчасти',
    iconName: 'Wrench',
    emoji: '🔧',
    colorClass: 'text-blue-700 bg-blue-50 border-blue-200',
    badgeClass: 'bg-blue-600 text-white',
    accentBg: '#2563EB',
  },
  master: {
    id: 'master',
    name: 'Услуги мастера / Ремонт',
    shortName: 'Мастера',
    iconName: 'Hammer',
    emoji: '🔨',
    colorClass: 'text-amber-700 bg-amber-50 border-amber-200',
    badgeClass: 'bg-amber-600 text-white',
    accentBg: '#D97706',
  },
  delivery: {
    id: 'delivery',
    name: 'Курьерская доставка',
    shortName: 'Доставка',
    iconName: 'Package',
    emoji: '📦',
    colorClass: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    badgeClass: 'bg-indigo-600 text-white',
    accentBg: '#4F46E5',
  },
};

export const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  created: {
    label: 'Ожидает исполнителя',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  accepted: {
    label: 'Взят в работу',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  receipt_uploaded: {
    label: 'Чек загружен',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  completed: {
    label: 'Выполнен',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
  disputed: {
    label: 'Спор / Арбитраж',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
  canceled: {
    label: 'Отменен',
    bg: 'bg-slate-100',
    text: 'text-slate-500',
    border: 'border-slate-200',
  },
};

export const TRUST_BADGES = {
  escrow: {
    label: 'Деньги защищены эскроу',
    description: 'Оплата резервируется до прикрепления чека и подтверждения клиентом',
  },
  verification: {
    label: 'Личность подтверждена',
    description: 'Паспорт проверен службой безопасности сервиса',
  },
  phone: {
    label: 'Телефон подтвержден',
    description: 'Номер IDC Приднестровья верифицирован по SMS',
  },
};
