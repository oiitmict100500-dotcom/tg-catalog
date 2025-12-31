// Тестовый endpoint для проверки статусов ресурсов
// GET /api/resources/check-status
// Показывает все ресурсы с их статусами для диагностики

import { query, initTables } from '../db.js';

export default async function handler(req, res) {
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
    await initTables();
    
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
  } catch (error) {
    console.error('Error in check-status:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
}

