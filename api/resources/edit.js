// API endpoint для редактирования ресурса (только для админов)
// Vercel Serverless Function
// Использует PostgreSQL для хранения

import { getResourceById, updateResource } from './ad-slots.js';

export default async function handler(req, res) {
  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Проверка авторизации админа
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

    // Проверка роли админа
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора' });
    }

    const { resourceId } = req.query;
    const {
      title,
      description,
      telegramLink,
      telegramUsername,
      categoryId,
      subcategoryId,
      coverImage,
      isPrivate,
    } = req.body;

    if (!resourceId) {
      return res.status(400).json({ message: 'Укажите ID ресурса' });
    }

    // Проверяем, что ресурс существует
    const resource = await getResourceById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: 'Ресурс не найден' });
    }

    // Формируем объект обновлений
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (telegramLink !== undefined) updates.telegramLink = telegramLink;
    if (telegramUsername !== undefined) updates.telegramUsername = telegramUsername;
    if (categoryId !== undefined) updates.categoryId = categoryId;
    if (subcategoryId !== undefined) updates.subcategoryId = subcategoryId;
    if (coverImage !== undefined) updates.coverImage = coverImage;
    if (isPrivate !== undefined) updates.isPrivate = isPrivate;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'Нет данных для обновления' });
    }

    // Обновляем ресурс
    const updatedResource = await updateResource(resourceId, updates);

    if (!updatedResource) {
      return res.status(500).json({ message: 'Ошибка при обновлении ресурса' });
    }

    console.log('✅ Resource updated by admin:', {
      resourceId,
      updatedBy: user.username,
      updates: Object.keys(updates),
    });

    return res.status(200).json({
      message: 'Ресурс успешно обновлен',
      resource: updatedResource,
    });
  } catch (error) {
    console.error('Error updating resource:', error);
    return res.status(500).json({ message: 'Ошибка при обновлении ресурса' });
  }
}

