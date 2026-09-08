export interface MasterService {
  id: string;
  name: string;
  price: number; // in руб. ПМР
  durationMinutes: number;
  description?: string;
}

export interface MasterReview {
  id: string;
  authorName: string;
  rating: number;
  date: string;
  comment: string;
  avatar?: string;
}

export interface MasterProfile {
  id: string;
  fullName: string;
  category: 'manicure' | 'massage' | 'hair' | 'beauty' | 'repair' | 'electrician' | 'plumber' | 'other';
  categoryLabel: string;
  categoryEmoji: string;
  avatarUrl: string;
  coverUrl?: string;
  rating: number;
  reviewCount: number;
  city: string;
  address: string;
  startingPrice: number;
  isVerified: boolean;
  phone: string;
  about: string;
  services: MasterService[];
  portfolioImages: string[];
  reviews: MasterReview[];
  availableTimeSlots: string[];
}

export const PMR_MASTER_CATEGORIES = [
  { id: 'all', label: 'Все мастера', emoji: '✨' },
  { id: 'manicure', label: 'Маникюр', emoji: '💅' },
  { id: 'massage', label: 'Массаж', emoji: '💆' },
  { id: 'hair', label: 'Парикмахер', emoji: '💇' },
  { id: 'beauty', label: 'Красота', emoji: '💄' },
  { id: 'repair', label: 'Ремонт', emoji: '🔧' },
  { id: 'electrician', label: 'Электрик', emoji: '⚡' },
  { id: 'plumber', label: 'Сантехник', emoji: '🚰' },
];

export const PMR_MASTERS: MasterProfile[] = [
  {
    id: 'm-1',
    fullName: 'Анна Иванова',
    category: 'manicure',
    categoryLabel: 'Маникюр & Педикюр',
    categoryEmoji: '💅',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop&q=80',
    rating: 4.95,
    reviewCount: 86,
    city: 'Тирасполь',
    address: 'ул. 25 Октября, 42 (Центр)',
    startingPrice: 250,
    isVerified: true,
    phone: '+373 777 44901',
    about: 'Сертифицированный мастер ногтевого сервиса с опытом более 6 лет. Стерилизация по нормам СЭС (сухожар ГП-10), одноразовые расходники, палитра более 250 оттенков.',
    services: [
      { id: 's1', name: 'Маникюр комбинированный', price: 250, durationMinutes: 60, description: 'Обработка кутикулы аппаратом и ножничками' },
      { id: 's2', name: 'Маникюр + покрытие гель-лаком', price: 400, durationMinutes: 90, description: 'Выравнивание ногтевой пластины и стойкое покрытие' },
      { id: 's3', name: 'Smart-педикюр с обработкой стопы', price: 500, durationMinutes: 80, description: 'Полный уход за пальчиками и стопой с профессиональной косметикой' },
      { id: 's4', name: 'Дизайн ногтей (френч / градиент)', price: 100, durationMinutes: 20, description: 'Элегантный дизайн на ваш выбор' },
    ],
    portfolioImages: [
      'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519014816548-bf7851504fdd?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&auto=format&fit=crop&q=80',
    ],
    reviews: [
      {
        id: 'r1',
        authorName: 'Виктория С.',
        rating: 5,
        date: '3 дня назад',
        comment: 'Очень аккуратная работа! Инструменты в крафт-пакете, открывает при клиенте. Маникюр держится больше месяца без сколов.',
      },
      {
        id: 'r2',
        authorName: 'Ольга П.',
        rating: 5,
        date: 'Неделю назад',
        comment: 'Уютный кабинет в центре Тирасполя, вкусный кофе и идеальный френч. Рекомендую от души!',
      },
      {
        id: 'r3',
        authorName: 'Марина К.',
        rating: 5,
        date: '2 недели назад',
        comment: 'Педикюр просто спасение после лета. Ножки как у младенца. Спасибо, Анна!',
      },
    ],
    availableTimeSlots: ['10:00', '12:30', '15:00', '17:30', '19:30'],
  },
  {
    id: 'm-2',
    fullName: 'Игорь Мельник',
    category: 'plumber',
    categoryLabel: 'Сантехник & Отопление',
    categoryEmoji: '🚰',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&auto=format&fit=crop&q=80',
    rating: 4.98,
    reviewCount: 114,
    city: 'Тирасполь',
    address: 'Выезд по Тирасполю и Бендерам',
    startingPrice: 150,
    isVerified: true,
    phone: '+373 779 44321',
    about: 'Опытный мастер-сантехник. Устранение протечек любой сложности, замена смесителей, установка бойлеров, стиральных машин, разводка труб полипропилен/сшитый полиэтилен.',
    services: [
      { id: 's201', name: 'Устранение засора труб', price: 200, durationMinutes: 45, description: 'Механическая и гидропрочистка сифонов и труб' },
      { id: 's202', name: 'Установка смесителя / сифона', price: 180, durationMinutes: 40, description: 'Качественная герметизация и подключение' },
      { id: 's203', name: 'Установка и подключение бойлера', price: 450, durationMinutes: 90, description: 'Монтаж на капитальную стену, подвод воды и предохранительного клапана' },
      { id: 's204', name: 'Замена унитаза / инсталляции', price: 500, durationMinutes: 120, description: 'Демонтаж старого, установка нового с выравниванием' },
    ],
    portfolioImages: [
      'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
    ],
    reviews: [
      {
        id: 'r201',
        authorName: 'Дмитрий В.',
        rating: 5,
        date: 'Вчера',
        comment: 'Приехал через 30 минут после вызова на Балку, заменил потекший кран за 20 минут. Все чисто и аккуратно.',
      },
      {
        id: 'r202',
        authorName: 'Светлана',
        rating: 5,
        date: '5 дней назад',
        comment: 'Устанавливал бойлер в новострое. Грамотно подобрал фитинги, помог купить недостающие детали в Шерифе.',
      },
    ],
    availableTimeSlots: ['09:00', '11:00', '14:00', '16:30', '18:30'],
  },
  {
    id: 'm-3',
    fullName: 'Елена Васильева',
    category: 'hair',
    categoryLabel: 'Парикмахер-стилист',
    categoryEmoji: '💇',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80',
    rating: 4.91,
    reviewCount: 72,
    city: 'Бендеры',
    address: 'ул. Суворова, 18',
    startingPrice: 200,
    isVerified: true,
    phone: '+373 778 12900',
    about: 'Сложные техники окрашивания (Airtouch, Shatush, Balayage), женские и мужские стрижки, уходовые спа-процедуры для волос (ботокс, кератин, холодное восстановление).',
    services: [
      { id: 's301', name: 'Женская модельная стрижка', price: 200, durationMinutes: 50, description: 'Мытье головы, стрижка, укладка на брашинг' },
      { id: 's302', name: 'Мужская стрижка + борода', price: 180, durationMinutes: 40, description: 'Ножницы, машинка, оформление контуров' },
      { id: 's303', name: 'Сложное окрашивание (Airtouch)', price: 900, durationMinutes: 210, description: 'Индивидуальный подбор формулы, бережное осветление, тонирование' },
      { id: 's304', name: 'Спа-уход "Счастье для волос"', price: 400, durationMinutes: 60, description: 'Глубокое питание и блеск поврежденных волос' },
    ],
    portfolioImages: [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&auto=format&fit=crop&q=80',
    ],
    reviews: [
      {
        id: 'r301',
        authorName: 'Татьяна М.',
        rating: 5,
        date: '4 дня назад',
        comment: 'Идеальный блонд без желтизны! Волосы мягкие и живые. Елена настоящий мастер своего дела.',
      },
      {
        id: 'r302',
        authorName: 'Артем Д.',
        rating: 5,
        date: '10 дней назад',
        comment: 'Хорошая мужская стрижка, четкие переходы. Приятная атмосфера.',
      },
    ],
    availableTimeSlots: ['11:00', '13:00', '16:00', '18:00'],
  },
  {
    id: 'm-4',
    fullName: 'Сергей Бондарь',
    category: 'electrician',
    categoryLabel: 'Электрик & Автоматика',
    categoryEmoji: '⚡',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
    rating: 4.97,
    reviewCount: 95,
    city: 'Тирасполь',
    address: 'Выезд по Тирасполю, Бендерам, Слободзее',
    startingPrice: 120,
    isVerified: true,
    phone: '+373 777 88123',
    about: 'IV группа допуска по электробезопасности. Поиск обрывов проводки, сборка электрощитов с защитой от скачков напряжения (УЗО, реле напряжения Зубр), замена розеток и выключателей.',
    services: [
      { id: 's401', name: 'Установка розеток / выключателей', price: 120, durationMinutes: 30, description: 'Цена за точку, с установкой подрозетника' },
      { id: 's402', name: 'Монтаж люстры / трековых светильников', price: 200, durationMinutes: 45, description: 'Надежное крепление и коммутация' },
      { id: 's403', name: 'Сборка и модернизация электрощита', price: 600, durationMinutes: 120, description: 'Установка автоматов, УЗО, реле защиты техники' },
      { id: 's404', name: 'Диагностика и устранение короткого замыкания', price: 300, durationMinutes: 60, description: 'Поиск неисправности спецприборами' },
    ],
    portfolioImages: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80',
    ],
    reviews: [
      {
        id: 'r401',
        authorName: 'Андрей Г.',
        rating: 5,
        date: 'Неделю назад',
        comment: 'Собрал щиток в квартире идеально ровно, промаркировал каждую группу. Быстро, профессионально!',
      },
    ],
    availableTimeSlots: ['09:30', '12:00', '15:00', '17:00'],
  },
  {
    id: 'm-5',
    fullName: 'Кристина Мороз',
    category: 'massage',
    categoryLabel: 'Массаж & Реабилитация',
    categoryEmoji: '💆',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80',
    rating: 4.99,
    reviewCount: 64,
    city: 'Рыбница',
    address: 'ул. Ленина, 12, каб. 4',
    startingPrice: 300,
    isVerified: true,
    phone: '+373 779 55210',
    about: 'Медицинское образование. Оздоровительный, лимфодренажный и антистресс массаж. Индивидуальный подход при болях в спине и зажимах.',
    services: [
      { id: 's501', name: 'Массаж спины и шейно-воротниковой зоны', price: 300, durationMinutes: 45, description: 'Снятие зажимов и усталости после сидячей работы' },
      { id: 's502', name: 'Общий классический массаж тела', price: 500, durationMinutes: 75, description: 'Проработка всех мышечных групп' },
      { id: 's503', name: 'Лимфодренажный массаж', price: 450, durationMinutes: 60, description: 'Устранение отеков и улучшение тонуса кожи' },
    ],
    portfolioImages: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600&auto=format&fit=crop&q=80',
    ],
    reviews: [
      {
        id: 'r501',
        authorName: 'Наталья',
        rating: 5,
        date: 'Вчера',
        comment: 'Золотые руки! Шея перестала болеть уже после первого сеанса. Очень вежливый специалист.',
      },
    ],
    availableTimeSlots: ['10:00', '12:00', '15:30', '18:00'],
  },
  {
    id: 'm-6',
    fullName: 'Михаил Токарев',
    category: 'repair',
    categoryLabel: 'Ремонт бытовой техники',
    categoryEmoji: '🔧',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    rating: 4.88,
    reviewCount: 51,
    city: 'Бендеры',
    address: 'Выезд: Бендеры, Тирасполь, Парканы',
    startingPrice: 150,
    isVerified: true,
    phone: '+373 775 11994',
    about: 'Ремонт стиральных и посудомоечных машин, холодильников, микроволновок, бойлеров. Оригинальные запчасти в наличии. Гарантия на работу до 1 года.',
    services: [
      { id: 's601', name: 'Диагностика неисправности', price: 150, durationMinutes: 30, description: 'Бесплатно при последующем ремонте' },
      { id: 's602', name: 'Замена ТЭНа / насоса в стиралке', price: 350, durationMinutes: 60, description: 'С установкой качественной детали' },
      { id: 's603', name: 'Заправка холодильника фреоном', price: 450, durationMinutes: 75, description: 'Устранение утечки и дозаправка' },
    ],
    portfolioImages: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    ],
    reviews: [
      {
        id: 'r601',
        authorName: 'Евгений',
        rating: 5,
        date: '2 недели назад',
        comment: 'Стиральная машина перестала сливать воду. Михаил приехал с насосом, всё сделал за 40 минут. Спасибо!',
      },
    ],
    availableTimeSlots: ['09:00', '11:30', '14:00', '17:00'],
  },
];
