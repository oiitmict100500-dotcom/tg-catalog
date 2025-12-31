// API endpoint для получения платных ресурсов
// Vercel Serverless Function
// Использует PostgreSQL для хранения

import { getAllActivePaidResources, getActivePaidResources } from './ad-slots.js';

export default async function handler(req, res) {
  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { categoryId } = req.query;

    let resources;

    if (categoryId) {
      // Получаем платные ресурсы для конкретной категории (максимум 3)
      resources = await getActivePaidResources(categoryId, 3);
    } else {
      // Получаем все активные платные ресурсы
      resources = await getAllActivePaidResources();
    }

    console.log('📋 Paid resources:', {
      categoryId: categoryId || 'all',
      count: resources.length,
    });

    return res.status(200).json(resources);
  } catch (error) {
    console.error('Error loading paid resources:', error);
    return res.status(500).json({ message: 'Ошибка при загрузке платных ресурсов' });
  }
}




