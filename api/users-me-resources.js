// API endpoint для получения ресурсов текущего пользователя
// Vercel Serverless Function
// Альтернативный путь: /api/users-me-resources (без вложенных путей)
// Использует PostgreSQL для хранения

import { getUserResources } from './resources/ad-slots.js';

export default async function handler(req, res) {
  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
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

    // Получаем ресурсы пользователя
    const userId = String(user.id);
    console.log('🔍 Loading resources for user:', {
      userId: userId,
      userRawId: user.id,
      username: user.username,
    });
    
    const resources = await getUserResources(userId);

    console.log('📋 User resources loaded:', {
      userId: userId,
      userRawId: user.id,
      count: resources.length,
      resourceIds: resources.map(r => r.id),
      resourceTitles: resources.map(r => r.title),
      resources: resources.map(r => ({
        id: r.id,
        title: r.title,
        categoryId: r.categoryId,
        authorId: r.authorId,
      })),
    });

    // Преобразуем ресурсы для фронтенда
    const mappedResources = resources.map((resource) => {
      const categoryId = resource.categoryId;
      const categoryMap = {
        '1': { type: 'channel', name: 'Каналы' },
        '2': { type: 'group', name: 'Группы' },
        '3': { type: 'bot', name: 'Боты' },
        '4': { type: 'sticker', name: 'Стикерпаки' },
        '5': { type: 'emoji', name: 'Эмодзипаки' },
      };
      const categoryInfo = categoryMap[categoryId] || { type: 'other', name: 'Другое' };
      
      return {
        ...resource,
        category: {
          id: categoryId,
          ...categoryInfo,
        },
        isPublished: true, // Все ресурсы из БД считаются опубликованными
      };
    });

    return res.status(200).json(mappedResources);
  } catch (error) {
    console.error('Error loading user resources:', error);
    return res.status(500).json({ message: 'Ошибка при загрузке ресурсов' });
  }
}

