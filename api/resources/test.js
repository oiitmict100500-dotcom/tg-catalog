// Тестовый endpoint для проверки ресурсов в базе данных
// Vercel Serverless Function
// Доступен по /api/resources/test

import { query, initTables } from '../db.js';

export default async function handler(req, res) {
  console.log('📥 Test endpoint called:', req.method, req.url);
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
    
    // Получаем статистику
    const stats = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE category_id = '1') as channels,
        COUNT(*) FILTER (WHERE category_id = '2') as groups,
        COUNT(*) FILTER (WHERE category_id = '3') as bots,
        COUNT(*) FILTER (WHERE category_id = '4') as stickers,
        COUNT(*) FILTER (WHERE category_id = '5') as emojis
      FROM resources
    `);
    
    const statsRow = stats.rows ? stats.rows[0] : (Array.isArray(stats) ? stats[0] : {});
    
    return res.status(200).json({
      success: true,
      stats: {
        total: parseInt(statsRow.total || statsRow.TOTAL || 0),
        channels: parseInt(statsRow.channels || statsRow.CHANNELS || 0),
        groups: parseInt(statsRow.groups || statsRow.GROUPS || 0),
        bots: parseInt(statsRow.bots || statsRow.BOTS || 0),
        stickers: parseInt(statsRow.stickers || statsRow.STICKERS || 0),
        emojis: parseInt(statsRow.emojis || statsRow.EMOJIS || 0),
      },
      resources: resources.map((row: any) => ({
        id: row.id || row.ID,
        title: row.title || row.TITLE,
        categoryId: row.category_id || row.CATEGORY_ID,
        authorId: row.author_id || row.AUTHOR_ID,
        authorUsername: row.author_username || row.AUTHOR_USERNAME,
        createdAt: row.created_at || row.CREATED_AT,
      })),
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
}

