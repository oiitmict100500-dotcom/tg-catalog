// API endpoint для получения заявок на модерацию
// Vercel Serverless Function
import { getPendingSubmissions } from './storage.js';

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

    // Загружаем заявки на модерацию
    const pendingSubmissions = getPendingSubmissions();
    
    // Загружаем все заявки для диагностики
    const { loadSubmissions } = await import('./storage.js');
    const allSubmissions = loadSubmissions();
    
    console.log('📋 Loading pending submissions:', {
      count: pendingSubmissions.length,
      ids: pendingSubmissions.map(s => s.id),
      titles: pendingSubmissions.map(s => s.title),
    });
    
    console.log('📊 All submissions in storage:', {
      total: allSubmissions.length,
      byStatus: {
        pending: allSubmissions.filter(s => s.status === 'pending').length,
        approved: allSubmissions.filter(s => s.status === 'approved').length,
        rejected: allSubmissions.filter(s => s.status === 'rejected').length,
      },
      allIds: allSubmissions.map(s => s.id),
      hasGlobalStorage: typeof global !== 'undefined' && !!global.moderationStorage,
      globalStorageCount: typeof global !== 'undefined' && global.moderationStorage ? global.moderationStorage.submissions?.length : 0,
    });
    
    // Если заявок нет, логируем для отладки
    if (pendingSubmissions.length === 0) {
      console.log('⚠️ No pending submissions found');
      console.log('💡 This might be because:');
      console.log('   1. Submissions are saved on a different Vercel instance');
      console.log('   2. Storage is not persisting between function calls');
      console.log('   3. Submissions were not saved correctly');
      console.log('💡 Solution: Use a database (PostgreSQL, MongoDB) or external storage service');
    }

    return res.status(200).json({
      submissions: pendingSubmissions,
      count: pendingSubmissions.length,
    });
  } catch (error) {
    console.error('Error loading pending submissions:', error);
    return res.status(500).json({ message: 'Ошибка при загрузке заявок' });
  }
}

// Экспортируем функции для доступа из других модулей
export { addSubmission, getSubmissionById, updateSubmission } from './storage.js';

