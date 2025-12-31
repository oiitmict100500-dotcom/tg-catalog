// API endpoint для покупки рекламного слота
// Vercel Serverless Function
// Использует PostgreSQL для хранения

import {
  getActivePaidSlotsCount,
  setResourceAsPaid,
  createAdSlotPurchase,
  getUserResources,
  getResourceById,
} from './ad-slots.js';

const MAX_PAID_SLOTS_PER_CATEGORY = 3;

export default async function handler(req, res) {
  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Проверка авторизации
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Требуется авторизация' });
    }

    const token = authHeader.substring(7);
    let user;
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      user = decoded;
    } catch (e) {
      return res.status(401).json({ message: 'Неверный токен' });
    }

    const { categoryId, durationDays, resourceId } = req.body;

    // Валидация
    if (!categoryId) {
      return res.status(400).json({ message: 'Укажите категорию' });
    }

    if (!durationDays || durationDays < 1) {
      return res.status(400).json({ message: 'Укажите срок размещения (минимум 1 день)' });
    }

    // Проверяем количество активных слотов в категории
    const activeSlotsCount = await getActivePaidSlotsCount(categoryId);
    
    console.log('📊 Active paid slots in category:', {
      categoryId,
      count: activeSlotsCount,
      max: MAX_PAID_SLOTS_PER_CATEGORY,
    });

    // Если все слоты заняты
    if (activeSlotsCount >= MAX_PAID_SLOTS_PER_CATEGORY) {
      return res.status(400).json({
        success: false,
        message: `Все рекламные слоты в этой категории заняты (максимум ${MAX_PAID_SLOTS_PER_CATEGORY}). Ваш ресурс будет размещен по очереди после окончания текущих размещений.`,
      });
    }

    // Если resourceId не указан, нужно сначала создать ресурс
    if (!resourceId) {
      return res.status(400).json({
        success: false,
        message: 'Сначала создайте ресурс через форму добавления, затем купите рекламный слот для него.',
        requiresResource: true,
      });
    }

    // Проверяем, что ресурс существует и принадлежит пользователю
    const resource = await getResourceById(resourceId);
    
    if (!resource) {
      return res.status(404).json({ message: 'Ресурс не найден' });
    }

    if (resource.authorId !== user.id.toString()) {
      return res.status(403).json({ message: 'Этот ресурс не принадлежит вам' });
    }

    if (resource.categoryId !== categoryId) {
      return res.status(400).json({ message: 'Категория ресурса не совпадает с выбранной категорией' });
    }

    // Проверяем, не является ли ресурс уже платным
    if (resource.isPaid && resource.paidUntil) {
      const paidUntil = new Date(resource.paidUntil);
      if (paidUntil > new Date()) {
        return res.status(400).json({
          message: 'Этот ресурс уже имеет активный рекламный слот. Срок действия: ' + paidUntil.toLocaleDateString('ru-RU'),
        });
      }
    }

    // Вычисляем цену (логика ценообразования)
    const PRICES: Record<string, number> = {
      '1': 500, // channel
      '2': 400, // group
      '3': 300, // bot
      '4': 250, // sticker
      '5': 200, // emoji
    };

    const basePrice = PRICES[categoryId] || 300;
    const discountPercent = durationDays >= 30 ? 20 : durationDays >= 14 ? 15 : durationDays >= 7 ? 10 : durationDays >= 3 ? 5 : 0;
    const discount = (basePrice * durationDays * discountPercent) / 100;
    const totalPrice = basePrice * durationDays - discount;

    // TODO: Интеграция с платежной системой (ЮKassa, Stripe и т.д.)
    // Пока симулируем успешную оплату
    const paymentId = 'payment-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    // Устанавливаем ресурс как платный
    const updatedResource = await setResourceAsPaid(resourceId, durationDays);
    
    if (!updatedResource) {
      return res.status(500).json({ message: 'Ошибка при обновлении ресурса' });
    }

    // Создаем запись о покупке
    const purchase = await createAdSlotPurchase(
      user.id.toString(),
      resourceId,
      categoryId,
      durationDays,
      totalPrice,
      paymentId
    );

    if (!purchase) {
      return res.status(500).json({ message: 'Ошибка при создании записи о покупке' });
    }

    console.log('✅ Ad slot purchased:', {
      purchaseId: purchase.id,
      resourceId,
      categoryId,
      durationDays,
      price: totalPrice,
    });

    return res.status(200).json({
      success: true,
      message: 'Рекламный слот успешно куплен! Ваш ресурс будет размещен в платном разделе.',
      purchase: {
        id: purchase.id,
        resourceId: purchase.resourceId,
        durationDays: purchase.durationDays,
        price: purchase.price,
        expiresAt: purchase.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error purchasing ad slot:', error);
    return res.status(500).json({ message: 'Ошибка при покупке рекламного слота' });
  }
}

