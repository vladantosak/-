import { z } from 'zod';

export const sendCodeSchema = z.object({
  phone: z.string().min(8, 'Номер телефона обязателен').max(20),
});

export const verifyCodeSchema = z.object({
  phone: z.string().min(8).max(20),
  code: z.string().length(4, 'Код подтверждения должен состоять из 4 цифр'),
});

export const createOrderSchema = z.object({
  category: z.enum(['products', 'pharmacy', 'auto_parts', 'master']),
  title: z.string().min(5, 'Заголовок должен содержать минимум 5 символов').max(200),
  description: z.string().min(10, 'Описание должно содержать минимум 10 символов').max(2000),
  budget: z.number().positive('Бюджет должен быть больше 0').max(100000, 'Максимальный бюджет 100 000 руб. ПМР'),
  city: z.string().min(2).max(50),
  location: z.object({
    lat: z.number().min(45).max(49),
    lng: z.number().min(28).max(31),
  }),
  address: z.string().min(5).max(300),
});

export const uploadReceiptSchema = z.object({
  photo_url: z.string().min(5),
  total_sum: z.number().positive('Сумма чека должна быть больше 0').max(100000),
});

export const completeOrderSchema = z.object({
  rating: z.number().min(1).max(5).default(5),
  review: z.string().max(1000).optional(),
});

export const disputeOrderSchema = z.object({
  reason: z.string().min(5, 'Укажите причину спора').max(1000),
});

export const sendMessageSchema = z.object({
  text: z.string().min(1).max(2000),
  image_url: z.string().optional(),
});

export const uploadVerificationSchema = z.object({
  passport_photo_url: z.string().min(5),
  selfie_photo_url: z.string().min(5),
});

export const resolveDisputeSchema = z.object({
  resolution: z.enum(['complete', 'cancel']),
  admin_comment: z.string().max(1000).optional(),
});

export const topupSchema = z.object({
  amount: z.number().positive('Сумма пополнения должна быть больше 0').max(50000),
});
