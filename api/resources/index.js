// API endpoint для получения ресурса по ID
// Vercel Serverless Function
// Использует PostgreSQL для хранения

import { getResourceById } from './ad-slots.js';

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
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: 'Укажите ID ресурса' });
    }

    const resource = await getResourceById(id);

    if (!resource) {
      return res.status(404).json({ message: 'Ресурс не найден' });
    }

    // Загружаем категорию для ресурса
    try {
      const categoriesResponse = await fetch(`${req.headers.host ? 'https://' + req.headers.host : ''}/api/categories`);
      // Для упрощения, просто возвращаем ресурс
      // В будущем можно добавить загрузку категории
    } catch (e) {
      // Игнорируем ошибку загрузки категории
    }

    return res.status(200).json(resource);
  } catch (error) {
    console.error('Error loading resource:', error);
    return res.status(500).json({ message: 'Ошибка при загрузке ресурса' });
  }
}




