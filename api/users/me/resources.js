// API endpoint для получения ресурсов текущего пользователя
// Vercel Serverless Function
// Использует PostgreSQL для хранения

import { getUserResources } from '../../resources/ad-slots.js';

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
    const resources = await getUserResources(user.id.toString());

    console.log('📋 User resources:', {
      userId: user.id,
      count: resources.length,
    });

    return res.status(200).json(resources);
  } catch (error) {
    console.error('Error loading user resources:', error);
    return res.status(500).json({ message: 'Ошибка при загрузке ресурсов' });
  }
}

