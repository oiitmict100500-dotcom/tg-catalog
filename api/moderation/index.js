// Объединенный API endpoint для модерации
// Обрабатывает все запросы модерации: pending, approve, reject
// Vercel Serverless Function
// Использует PostgreSQL для хранения заявок

import { getPendingSubmissions, getSubmissionById, updateSubmission } from './db-storage.js';
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

// Создание ресурса из одобренной заявки
async function createResourceFromSubmission(submission) {
  try {
    await ensureTables();
    
    const resourceId = 'resource-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    const insertQuery = `
      INSERT INTO resources (
        id, title, description, telegram_link, telegram_username,
        category_id, subcategory_id, cover_image, is_private,
        author_id, author_username
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const result = await query(insertQuery, [
      resourceId,
      submission.title,
      submission.description || '',
      submission.telegramLink || null,
      submission.telegramUsername || null,
      submission.categoryId,
      submission.subcategoryId,
      submission.coverImage,
      submission.isPrivate || false,
      submission.authorId,
      submission.authorUsername,
    ]);
    
    if (result.rows && result.rows.length > 0) {
      return result.rows[0];
    }
    
    if (Array.isArray(result) && result.length > 0) {
      return result[0];
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error creating resource from submission:', error);
    return null;
  }
}

export default async function handler(req, res) {
  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

    // Определяем действие по query параметру или body
    const action = req.query.action || req.body?.action;

    // GET /api/moderation?action=pending - получение заявок на модерацию
    if (req.method === 'GET' && (!action || action === 'pending')) {
      const pendingSubmissions = await getPendingSubmissions();
      
      console.log('📋 Pending submissions result:', {
        count: pendingSubmissions.length,
        ids: pendingSubmissions.map(s => s.id),
      });

      return res.status(200).json({
        submissions: pendingSubmissions,
        count: pendingSubmissions.length,
      });
    }

    // POST /api/moderation с action=approve - одобрение заявки
    if (req.method === 'POST' && action === 'approve') {
      const { submissionId } = req.body;

      if (!submissionId) {
        return res.status(400).json({ message: 'Укажите ID заявки' });
      }

      const submission = await getSubmissionById(submissionId);

      if (!submission) {
        return res.status(404).json({ message: 'Заявка не найдена' });
      }

      if (submission.status !== 'pending') {
        return res.status(400).json({ message: 'Заявка уже обработана' });
      }

      const updated = await updateSubmission(submissionId, {
        status: 'approved',
        moderatedById: user.id,
        moderatedBy: user.username,
        moderatedAt: new Date().toISOString(),
      });

      // Создаем ресурс из одобренной заявки
      const resource = await createResourceFromSubmission(updated);
      
      if (!resource) {
        console.error('❌ Failed to create resource from approved submission');
        return res.status(500).json({ message: 'Заявка одобрена, но не удалось создать ресурс' });
      }

      console.log('✅ Resource created from approved submission:', {
        resourceId: resource.id || resource.ID,
        submissionId: updated.id,
      });

      return res.status(200).json({
        message: 'Заявка одобрена и ресурс создан',
        submission: updated,
        resource: {
          id: resource.id || resource.ID,
          title: resource.title || resource.TITLE,
        },
      });
    }

    // POST /api/moderation с action=reject - отклонение заявки
    if (req.method === 'POST' && action === 'reject') {
      const { submissionId, reason } = req.body;

      if (!submissionId) {
        return res.status(400).json({ message: 'Укажите ID заявки' });
      }

      const submission = await getSubmissionById(submissionId);

      if (!submission) {
        return res.status(404).json({ message: 'Заявка не найдена' });
      }

      if (submission.status !== 'pending') {
        return res.status(400).json({ message: 'Заявка уже обработана' });
      }

      const updated = await updateSubmission(submissionId, {
        status: 'rejected',
        rejectionReason: reason || 'Причина не указана',
        moderatedById: user.id,
        moderatedBy: user.username,
        moderatedAt: new Date().toISOString(),
      });

      return res.status(200).json({
        message: 'Заявка отклонена',
        submission: updated,
      });
    }

    return res.status(400).json({ message: 'Неверный action. Используйте: pending, approve, reject' });
  } catch (error) {
    console.error('Error in moderation API:', error);
    return res.status(500).json({ message: 'Ошибка при обработке запроса' });
  }
}

