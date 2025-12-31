// API endpoint для получения ресурсов
// Vercel Serverless Function
// Использует PostgreSQL для хранения

import { getResourceById } from './ad-slots.js';
import { query, initTables } from '../db.js';

// Инициализация таблиц
let tablesInitialized = false;
async function ensureTables() {
  if (!tablesInitialized) {
    try {
      await initTables();
      tablesInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize tables:', error);
    }
  }
}

// Получение ресурсов по категории
async function getResourcesByCategory(categoryId, page = 1, limit = 20) {
  try {
    await ensureTables();
    
    const offset = (page - 1) * limit;
    
    let selectQuery;
    let countQuery;
    let params;
    
    if (categoryId) {
      selectQuery = `
        SELECT *
        FROM resources
        WHERE category_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;
      countQuery = 'SELECT COUNT(*) as total FROM resources WHERE category_id = $1';
      params = [categoryId, limit, offset];
    } else {
      selectQuery = `
        SELECT *
        FROM resources
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;
      countQuery = 'SELECT COUNT(*) as total FROM resources';
      params = [limit, offset];
    }
    
    const result = await query(selectQuery, params);
    const countResult = await query(countQuery, categoryId ? [categoryId] : []);
    
    const rows = result.rows || result;
    const resources = Array.isArray(rows) ? rows : [];
    
    const countRow = countResult.rows ? countResult.rows[0] : (Array.isArray(countResult) ? countResult[0] : {});
    const total = parseInt(countRow.total || countRow.TOTAL || 0);
    
    // Преобразуем строки БД в объекты ресурсов
    const mappedResources = resources.map((row: any) => {
      const categoryId = row.category_id || row.CATEGORY_ID || row.categoryId;
      const categoryMap: Record<string, { type: string; name: string }> = {
        '1': { type: 'channel', name: 'Каналы' },
        '2': { type: 'group', name: 'Группы' },
        '3': { type: 'bot', name: 'Боты' },
        '4': { type: 'sticker', name: 'Стикерпаки' },
        '5': { type: 'emoji', name: 'Эмодзипаки' },
      };
      const categoryInfo = categoryMap[categoryId] || { type: 'other', name: 'Другое' };
      
      return {
        id: row.id || row.ID,
        title: row.title || row.TITLE,
        description: row.description || row.DESCRIPTION || '',
        telegramLink: row.telegram_link || row.TELEGRAM_LINK || row.telegramLink,
        telegramUsername: row.telegram_username || row.TELEGRAM_USERNAME || row.telegramUsername,
        categoryId: categoryId,
        category: {
          id: categoryId,
          ...categoryInfo,
        },
        subcategoryId: row.subcategory_id || row.SUBCATEGORY_ID || row.subcategoryId,
        coverImage: row.cover_image || row.COVER_IMAGE || row.coverImage,
        isPrivate: row.is_private || row.IS_PRIVATE || row.isPrivate || false,
        authorId: row.author_id || row.AUTHOR_ID || row.authorId,
        authorUsername: row.author_username || row.AUTHOR_USERNAME || row.authorUsername,
        isPaid: row.is_paid || row.IS_PAID || row.isPaid || false,
        paidUntil: row.paid_until || row.PAID_UNTIL || row.paidUntil,
        createdAt: row.created_at || row.CREATED_AT || row.createdAt,
        updatedAt: row.updated_at || row.UPDATED_AT || row.updatedAt,
        viewCount: 0,
        rating: 0,
        reviewCount: 0,
      };
    });
    
    return {
      resources: mappedResources,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('❌ Error getting resources by category:', error);
    return {
      resources: [],
      total: 0,
      page: 1,
      totalPages: 1,
    };
  }
}

export default async function handler(req, res) {
  console.log('📥 Resources request received:', {
    method: req.method,
    query: req.query,
    url: req.url,
  });

  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS request, returning 200');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    console.warn('⚠️ Invalid method:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id, category, page = '1' } = req.query;

    // Если запрашивается конкретный ресурс по ID
    if (id) {
      const resource = await getResourceById(id);

      if (!resource) {
        return res.status(404).json({ message: 'Ресурс не найден' });
      }

      return res.status(200).json(resource);
    }

    // Если запрашивается список ресурсов
    const categoryId = category || null;
    const pageNum = parseInt(page as string) || 1;
    
    console.log('📋 Loading resources request:', {
      categoryId: categoryId || 'all',
      page: pageNum,
    });
    
    const result = await getResourcesByCategory(categoryId, pageNum, 20);
    
    console.log('📋 Resources loaded:', {
      categoryId: categoryId || 'all',
      count: result.resources.length,
      total: result.total,
      page: result.page,
      resourceIds: result.resources.map((r: any) => r.id),
      resourceTitles: result.resources.map((r: any) => r.title),
    });
    
    // Если ресурсов нет, проверяем, есть ли они вообще в базе
    if (result.resources.length === 0 && categoryId) {
      try {
        const { query: checkQuery } = await import('../db.js');
        const allResources = await checkQuery('SELECT COUNT(*) as total FROM resources WHERE category_id = $1', [categoryId]);
        const totalInCategory = allResources.rows ? allResources.rows[0].total : (Array.isArray(allResources) ? allResources[0]?.total : 0);
        console.log('🔍 Total resources in category in DB:', totalInCategory);
      } catch (e) {
        console.error('Error checking category resources:', e);
      }
    }

    return res.status(200).json({
      resources: mappedResources,
      data: mappedResources, // Для совместимости
      total: total,
      page: result.page,
      totalPages: result.totalPages,
    });
  } catch (error) {
    console.error('Error loading resources:', error);
    return res.status(500).json({ message: 'Ошибка при загрузке ресурсов' });
  }
}




