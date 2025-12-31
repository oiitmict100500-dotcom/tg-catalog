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
        WHERE category_id = $1 AND status = 'approved'
        ORDER BY is_paid DESC, created_at DESC
        LIMIT $2 OFFSET $3
      `;
      countQuery = "SELECT COUNT(*) as total FROM resources WHERE category_id = $1 AND status = 'approved'";
      params = [categoryId, limit, offset];
    } else {
      selectQuery = `
        SELECT *
        FROM resources
        WHERE status = 'approved'
        ORDER BY is_paid DESC, created_at DESC
        LIMIT $1 OFFSET $2
      `;
      countQuery = "SELECT COUNT(*) as total FROM resources WHERE status = 'approved'";
      params = [limit, offset];
    }
    
    console.log('🔍 Executing query for approved resources:', {
      categoryId: categoryId || 'all',
      query: selectQuery,
      params,
    });
    
    const result = await query(selectQuery, params);
    const countResult = await query(countQuery, categoryId ? [categoryId] : []);
    
    const rows = result.rows || result;
    const resources = Array.isArray(rows) ? rows : [];
    
    const countRow = countResult.rows ? countResult.rows[0] : (Array.isArray(countResult) ? countResult[0] : {});
    const total = parseInt(countRow.total || countRow.TOTAL || 0);
    
    console.log('📊 Query result for approved resources:', {
      resourcesCount: resources.length,
      total: total,
      categoryId: categoryId || 'all',
    });
    
    // Преобразуем строки БД в объекты ресурсов
    const mappedResources = resources.map((row) => {
      const categoryId = row.category_id || row.CATEGORY_ID || row.categoryId;
      const categoryMap = {
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
    category: req.query.category,
    page: req.query.page,
  });

  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // Отключаем кэширование для диагностики
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS request, returning 200');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    console.warn('⚠️ Invalid method:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id, category, page = '1', action } = req.query;

    // Проверка статусов ресурсов (диагностика)
    if (action === 'check-status') {
      await ensureTables();
      
      // Получаем все ресурсы с их статусами
      const allResources = await query('SELECT id, title, status, category_id, author_id, created_at FROM resources ORDER BY created_at DESC LIMIT 50');
      const rows = allResources.rows || allResources;
      const resources = Array.isArray(rows) ? rows : [];
      
      // Статистика по статусам
      const statsQuery = await query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM resources
        GROUP BY status
      `);
      const statsRows = statsQuery.rows || statsQuery;
      const stats = Array.isArray(statsRows) ? statsRows : [];
      
      // Ресурсы по статусам
      const pendingResources = await query("SELECT id, title, category_id FROM resources WHERE status = 'pending' LIMIT 10");
      const approvedResources = await query("SELECT id, title, category_id FROM resources WHERE status = 'approved' LIMIT 10");
      
      return res.status(200).json({
        success: true,
        stats: stats.reduce((acc, row) => {
          const status = row.status || row.STATUS || 'unknown';
          const count = parseInt(row.count || row.COUNT || 0);
          acc[status] = count;
          return acc;
        }, {}),
        totalResources: resources.length,
        recentResources: resources.map(r => ({
          id: r.id || r.ID,
          title: r.title || r.TITLE,
          status: r.status || r.STATUS || 'unknown',
          categoryId: r.category_id || r.CATEGORY_ID,
          authorId: r.author_id || r.AUTHOR_ID,
          createdAt: r.created_at || r.CREATED_AT,
        })),
        pending: {
          count: pendingResources.rows?.length || (Array.isArray(pendingResources) ? pendingResources.length : 0),
          resources: (pendingResources.rows || pendingResources || []).map(r => ({
            id: r.id || r.ID,
            title: r.title || r.TITLE,
            categoryId: r.category_id || r.CATEGORY_ID,
          })),
        },
        approved: {
          count: approvedResources.rows?.length || (Array.isArray(approvedResources) ? approvedResources.length : 0),
          resources: (approvedResources.rows || approvedResources || []).map(r => ({
            id: r.id || r.ID,
            title: r.title || r.TITLE,
            categoryId: r.category_id || r.CATEGORY_ID,
          })),
        },
      });
    }

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
    const pageNum = parseInt(page) || 1;
    
    console.log('📋 Loading resources request:', {
      categoryId: categoryId || 'all',
      page: pageNum,
      query: req.query,
    });
    
    const result = await getResourcesByCategory(categoryId, pageNum, 20);

    console.log('📤 Returning resources:', {
      categoryId: categoryId || 'all',
      count: result.resources.length,
      total: result.total,
      resourceIds: result.resources.map(r => r.id),
      resourceTitles: result.resources.map(r => r.title),
    });

    return res.status(200).json({
      resources: result.resources,
      data: result.resources, // Для совместимости
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    });
  } catch (error) {
    console.error('Error loading resources:', error);
    return res.status(500).json({ message: 'Ошибка при загрузке ресурсов' });
  }
}




