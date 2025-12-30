// API endpoint для получения заявок на модерацию
// Vercel Serverless Function
import { getPendingSubmissions, loadSubmissions, getStorageInfo } from './shared-storage.js';

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

    // Получаем информацию о хранилище
    const storageInfo = getStorageInfo();
    console.log('📊 Storage info:', storageInfo);
    
    // Загружаем все заявки
    const allSubmissions = loadSubmissions();
    console.log('📋 All submissions:', {
      total: allSubmissions.length,
      ids: allSubmissions.map(s => s.id),
      titles: allSubmissions.map(s => s.title),
      statuses: allSubmissions.map(s => s.status),
    });
    
    // Загружаем заявки на модерацию
    const pendingSubmissions = getPendingSubmissions();
    
    console.log('📋 Pending submissions result:', {
      count: pendingSubmissions.length,
      ids: pendingSubmissions.map(s => s.id),
      titles: pendingSubmissions.map(s => s.title),
    });
    
    // Если заявок нет, логируем для отладки
    if (pendingSubmissions.length === 0 && allSubmissions.length === 0) {
      console.log('⚠️ No submissions found in storage at all');
      console.log('💡 This means:');
      console.log('   1. Either no submissions have been saved yet');
      console.log('   2. Or submissions are saved on a different Vercel instance');
      console.log('   3. Or storage is not persisting between function calls');
      console.log('💡 Solution: Use a database (PostgreSQL, MongoDB) or external storage service');
    } else if (pendingSubmissions.length === 0 && allSubmissions.length > 0) {
      console.log('⚠️ Submissions exist but none are pending');
      console.log('💡 All submissions have been processed (approved/rejected)');
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
export { addSubmission, getSubmissionById, updateSubmission } from './shared-storage.js';

