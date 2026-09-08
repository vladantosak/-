import { db } from './index.ts';
import { users, orders, receipts, verifications, messages, transactions, notifications, reviews } from './schema.ts';
import { count } from 'drizzle-orm';

export async function seedDatabase() {
  try {
    const userCountResult = await db.select({ value: count() }).from(users);
    const existingUsers = Number(userCountResult[0]?.value || 0);

    if (existingUsers > 0) {
      console.log('Database already has data. Skipping seed.');
      return;
    }

    console.log('Seeding PMR orders database with initial test data...');

    // 1. Seed Users (PMR IDC phone numbers)
    await db.insert(users).values([
      {
        id: 'u-1',
        phone: '+373 777 12345',
        fullName: 'Александр Ковалев',
        role: 'user',
        rating: 4.95,
        isVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        balance: 1500.0,
        reservedBalance: 0.0,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      },
      {
        id: 'u-2',
        phone: '+373 778 98765',
        fullName: 'Максим Шестаков (Курьер / Студент)',
        role: 'user',
        rating: 4.92,
        isVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
        balance: 850.0,
        reservedBalance: 0.0,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
      },
      {
        id: 'u-3',
        phone: '+373 779 44321',
        fullName: 'Игорь Сантехник & Электрик',
        role: 'master',
        rating: 4.98,
        isVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        balance: 1200.0,
        reservedBalance: 0.0,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
      },
      {
        id: 'u-4',
        phone: '+373 775 55001',
        fullName: 'Елена Смирнова',
        role: 'user',
        rating: 5.0,
        isVerified: false,
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        balance: 1000.0,
        reservedBalance: 220.0,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10),
      },
      {
        id: 'admin-1',
        phone: '+373 533 99000',
        fullName: 'Ольга Администратор (Арбитраж ПМР)',
        role: 'admin',
        rating: 5.0,
        isVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        balance: 5000.0,
        reservedBalance: 0.0,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100),
      },
    ]);

    // 2. Seed Orders
    await db.insert(orders).values([
      {
        id: 'ord-101',
        clientId: 'u-1',
        courierId: null,
        category: 'products',
        title: 'Купить продукты в Шериф-15 (Центр) и привезти на ул. Правды',
        description: 'Нужно купить: молоко "Тираспольский молочный комбинат" 2.5% (2 пачки), хлеб нарезной белый, яйца 10 шт, сыр российский (300г). Чек обязателен!',
        budget: 180,
        city: 'Тирасполь',
        lat: 46.8375,
        lng: 29.6200,
        address: 'ул. 25 Октября, 118 (Шериф-15) -> ул. Правды, 24, кв. 15',
        status: 'created',
        createdAt: new Date(Date.now() - 1000 * 60 * 35),
      },
      {
        id: 'ord-102',
        clientId: 'u-4',
        courierId: 'u-2',
        category: 'pharmacy',
        title: 'Срочно лекарства из дежурной аптеки Вивафарм',
        description: 'Ибупрофен 400 мг, Парацетамол, спрей для горла Лисобакт и Аква Марис. Пожалуйста, чек сфотографируйте в чат перед оплатой.',
        budget: 220,
        city: 'Тирасполь',
        lat: 46.8430,
        lng: 29.6350,
        address: 'пл. Суворова, аптека "Вивафарм" -> ул. Юности (Балка), 8',
        status: 'receipt_uploaded',
        createdAt: new Date(Date.now() - 1000 * 60 * 90),
      },
      {
        id: 'ord-103',
        clientId: 'u-1',
        courierId: 'u-3',
        category: 'master',
        title: 'Замена смесителя на кухне и прочистка сифона',
        description: 'Подтекает кран на кухне под раковиной, новый смеситель уже куплен. Нужен сантехник со своими инструментами и паклей/лентой ФУМ.',
        budget: 250,
        city: 'Тирасполь',
        lat: 46.8340,
        lng: 29.6105,
        address: 'ул. Карла Либкнехта, 142, кв. 38',
        status: 'accepted',
        createdAt: new Date(Date.now() - 1000 * 60 * 120),
      },
      {
        id: 'ord-104',
        clientId: 'u-4',
        courierId: null,
        category: 'auto_parts',
        title: 'Забрать тормозные колодки из Автомаркета "Шериф"',
        description: 'Заказ №7412 оформлен и оплачен на складе. Нужно только забрать коробку и доставить в СТО на ул. Суворова.',
        budget: 150,
        city: 'Бендеры',
        lat: 46.8277,
        lng: 29.4797,
        address: 'г. Бендеры, ул. Суворова, Автомаркет -> Автосервис "Форсаж"',
        status: 'created',
        createdAt: new Date(Date.now() - 1000 * 60 * 45),
      },
      {
        id: 'ord-105',
        clientId: 'u-1',
        courierId: 'u-2',
        category: 'products',
        title: 'Доставка фруктов и овощей с Зеленого Рынка',
        description: 'Яблоки "Айдаред" 2 кг, картофель приднестровский 5 кг, свежая зелень. Все свежее, спасибо!',
        budget: 195,
        city: 'Тирасполь',
        lat: 46.8385,
        lng: 29.6235,
        address: 'Зеленый Рынок, ряд 4 -> пер. Набережный 3',
        status: 'completed',
        clientRating: 5.0,
        clientReview: 'Отличный курьер, все свежее и быстро доставил! Сдача копейка в копейку.',
        courierRating: 5.0,
        courierReview: 'Приятный заказчик, встретил у подъезда.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
      },
      {
        id: 'ord-106',
        clientId: 'u-4',
        courierId: 'u-2',
        category: 'pharmacy',
        title: 'Лекарства из Аптеки №1 в Рыбнице',
        description: 'Мазь Троксевазин и эластичный бинт 5м. Доставка в район Вершигоры.',
        budget: 120,
        city: 'Рыбница',
        lat: 47.7667,
        lng: 29.0000,
        address: 'г. Рыбница, ул. Ленина, 14 -> ул. Вершигоры, 77',
        status: 'created',
        createdAt: new Date(Date.now() - 1000 * 60 * 15),
      },
    ]);

    // 3. Seed Receipts
    await db.insert(receipts).values([
      {
        id: 'rec-1',
        orderId: 'ord-102',
        photoUrl: 'https://images.unsplash.com/photo-1554415707-9e49016a3e1f?w=600&auto=format&fit=crop&q=80',
        totalSum: 204.5,
        uploadedAt: new Date(Date.now() - 1000 * 60 * 40),
      },
      {
        id: 'rec-2',
        orderId: 'ord-105',
        photoUrl: 'https://images.unsplash.com/photo-1554415707-9e49016a3e1f?w=600&auto=format&fit=crop&q=80',
        totalSum: 185.0,
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
      },
    ]);

    // 4. Seed Verifications
    await db.insert(verifications).values([
      {
        id: 'ver-1',
        userId: 'u-4',
        passportPhotoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
        selfiePhotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80',
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 120),
      },
    ]);

    // 5. Seed Messages
    await db.insert(messages).values([
      {
        id: 'msg-1',
        orderId: 'ord-102',
        senderId: 'u-4',
        text: 'Здравствуйте! Если не будет Лисобакта, возьмите аналог Граммидин без анестетика.',
        createdAt: new Date(Date.now() - 1000 * 60 * 80),
      },
      {
        id: 'msg-2',
        orderId: 'ord-102',
        senderId: 'u-2',
        text: 'Добрый день! Понял вас, уже в аптеке на площади. Лисобакт в наличии, чек выложил в заказ на сумму 204.50 руб. ПМР.',
        imageUrl: 'https://images.unsplash.com/photo-1554415707-9e49016a3e1f?w=600&auto=format&fit=crop&q=80',
        createdAt: new Date(Date.now() - 1000 * 60 * 40),
      },
    ]);

    // 6. Seed initial transactions
    await db.insert(transactions).values([
      {
        id: 'tx-1',
        userId: 'u-1',
        orderId: 'ord-105',
        type: 'release',
        amount: 195.0,
        description: 'Оплата поручения "Зеленый Рынок" (списано из эскроу)',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
      },
      {
        id: 'tx-2',
        userId: 'u-2',
        orderId: 'ord-105',
        type: 'payout',
        amount: 175.5,
        description: 'Выплата за выполненный заказ #ord-105 (за вычетом 10% комиссии)',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
      },
      {
        id: 'tx-3',
        userId: 'u-4',
        orderId: 'ord-102',
        type: 'reserve',
        amount: 220.0,
        description: 'Резервирование средств в эскроу под заказ в Аптеке Вивафарм',
        createdAt: new Date(Date.now() - 1000 * 60 * 90),
      },
    ]);

    // 7. Seed Initial Notifications
    await db.insert(notifications).values([
      {
        id: 'notif-1',
        userId: 'u-1',
        type: 'order_status_changed',
        title: 'Заказ #ord-105 успешно завершен!',
        body: 'Курьер Максим Шестаков завершил заказ «Купить свежий судак на Зеленом Рынке». Сумма 195 руб. ПМР переведена исполнителю.',
        payload: JSON.stringify({ order_id: 'ord-105' }),
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
      },
      {
        id: 'notif-2',
        userId: 'u-1',
        type: 'order_created_nearby',
        title: 'Новое поручение рядом: Тирасполь',
        body: 'В центре Тирасполя создан заказ: "Купить продукты в Шериф-15". Бюджет: 180 руб. ПМР.',
        payload: JSON.stringify({ order_id: 'ord-101' }),
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
      },
      {
        id: 'notif-3',
        userId: 'u-2',
        type: 'order_status_changed',
        title: 'Оплата по эскроу поступила',
        body: 'Вам начислена выплата 175.50 руб. ПМР за выполненный заказ #ord-105.',
        payload: JSON.stringify({ order_id: 'ord-105' }),
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
      },
      {
        id: 'notif-4',
        userId: 'u-2',
        type: 'order_created_nearby',
        title: 'Новый заказ в Тирасполе: Доставка лекарств',
        body: 'Срочная доставка из аптеки Вивафарм, бюджет 220 руб. ПМР.',
        payload: JSON.stringify({ order_id: 'ord-102' }),
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 50),
      },
      {
        id: 'notif-5',
        userId: 'u-4',
        type: 'order_accepted',
        title: 'Курьер принял ваш заказ',
        body: 'Максим Шестаков взял в работу ваш заказ в аптеке "Вивафарм".',
        payload: JSON.stringify({ order_id: 'ord-102' }),
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 45),
      },
      {
        id: 'notif-6',
        userId: 'u-4',
        type: 'order_status_changed',
        title: 'Чек из аптеки загружен',
        body: 'Курьер загрузил чек на сумму 204.50 руб. ПМР. Проверьте фото чека.',
        payload: JSON.stringify({ order_id: 'ord-102' }),
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 38),
      },
    ]);

    // 8. Seed Initial Reviews
    await db.insert(reviews).values([
      {
        id: 'rev-1',
        orderId: 'ord-105',
        authorId: 'u-1',
        targetUserId: 'u-2',
        rating: 5.0,
        comment: 'Отличная доставка! Рыбу привез свежую с Зеленого Рынка, упаковал в термопакет, чек приложил до копейки. Очень вежливый парень, рекомендую!',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
      },
      {
        id: 'rev-2',
        orderId: 'ord-103',
        authorId: 'u-1',
        targetUserId: 'u-3',
        rating: 5.0,
        comment: 'Игорь оперативно приехал в Рыбницу, быстро заменил смеситель и прокладку на кухне. Работой доволен на все 100%!',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
      },
    ]);

    console.log('PMR database successfully seeded!');
  } catch (err) {
    console.error('Seed error:', err);
  }
}
