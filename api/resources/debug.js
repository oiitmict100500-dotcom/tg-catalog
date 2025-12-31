// Диагностический endpoint для проверки ресурсов
// Vercel Serverless Function

import { query, initTables } from '../db.js';

export default async function handler(req, res) {
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
    await initTables();
    
    // Получаем все ресурсы
    const allResources = await query('SELECT * FROM resources ORDER BY created_at DESC');
    const rows = allResources.rows || allResources;
    const resources = Array.isArray(rows) ? rows : [];
    
    // Получаем статистику по категориям
    const statsByCategory = await query(`
      SELECT 
        category_id,
        COUNT(*) as count
      FROM resources
      GROUP BY category_id
      ORDER BY category_id
    `);
    
    const statsRows = statsByCategory.rows || statsByCategory;
    const stats = Array.isArray(statsRows) ? statsRows : [];
    
    // Получаем последние 10 ресурсов
    const recentResources = resources.slice(0, 10).map((row: any) => ({
      id: row.id || row.ID,
      title: row.title || row.TITLE,
      categoryId: row.category_id || row.CATEGORY_ID,
      authorId: row.author_id || row.AUTHOR_ID,
      createdAt: row.created_at || row.CREATED_AT,
    }));
    
    return res.status(200).json({
      success: true,
      total: resources.length,
      statsByCategory: stats.map((s: any) => ({
        categoryId: s.category_id || s.CATEGORY_ID,
        count: parseInt(s.count || s.COUNT || 0),
      })),
      recentResources,
      allResources: resources.map((row: any) => ({
        id: row.id || row.ID,
        title: row.title || row.TITLE,
        categoryId: row.category_id || row.CATEGORY_ID,
        subcategoryId: row.subcategory_id || row.SUBCATEGORY_ID,
        authorId: row.author_id || row.AUTHOR_ID,
        authorUsername: row.author_username || row.AUTHOR_USERNAME,
        isPaid: row.is_paid || row.IS_PAID || false,
        createdAt: row.created_at || row.CREATED_AT,
        updatedAt: row.updated_at || row.UPDATED_AT,
      })),
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
}

