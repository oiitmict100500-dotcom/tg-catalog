// Объединенный API endpoint для модерации
// Обрабатывает все запросы модерации: pending, approve, reject
// Vercel Serverless Function
// Использует PostgreSQL - работает с таблицей resources со статусами

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

// Получение заявок на модерацию (resources со статусом 'pending')
async function getPendingSubmissions() {
  await ensureTables();
  
  const selectQuery = `
    SELECT * FROM resources
    WHERE status = 'pending'
    ORDER BY created_at DESC
  `;
  
  const result = await query(selectQuery);
  const rows = result.rows || result;
  const submissions = Array.isArray(rows) ? rows : [];
  
  return submissions.map(mapRowToSubmission);
}

// Получение заявки по ID
async function getSubmissionById(id) {
  await ensureTables();
  
  const selectQuery = 'SELECT * FROM resources WHERE id = $1';
  const result = await query(selectQuery, [id]);
  
  if (result.rows && result.rows.length > 0) {
    return mapRowToSubmission(result.rows[0]);
  }
  
  if (Array.isArray(result) && result.length > 0) {
    return mapRowToSubmission(result[0]);
  }
  
  return null;
}

// Обновление статуса ресурса
async function updateResourceStatus(resourceId, status, moderatorInfo = null, rejectionReason = null) {
  await ensureTables();
  
  console.log('🔄 updateResourceStatus called:', {
    resourceId,
    status,
    hasModeratorInfo: !!moderatorInfo,
    hasRejectionReason: !!rejectionReason,
  });
  
  const updateFields = [`status = $1`, `updated_at = CURRENT_TIMESTAMP`];
  const updateValues = [status];
  let paramIndex = 2;
  
  if (moderatorInfo) {
    updateFields.push(`moderated_by_id = $${paramIndex++}`);
    updateFields.push(`moderated_by = $${paramIndex++}`);
    updateFields.push(`moderated_at = $${paramIndex++}`);
    updateValues.push(moderatorInfo.id, moderatorInfo.username, new Date().toISOString());
  }
  
  if (rejectionReason) {
    updateFields.push(`rejection_reason = $${paramIndex++}`);
    updateValues.push(rejectionReason);
  }
  
  updateValues.push(resourceId);
  
  const updateQuery = `
    UPDATE resources
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;
  
  console.log('💾 Executing UPDATE query:', {
    query: updateQuery.substring(0, 200),
    params: updateValues,
  });
  
  try {
    const result = await query(updateQuery, updateValues);
    
    console.log('📊 UPDATE query result:', {
      hasRows: !!result.rows,
      rowsLength: result.rows?.length || 0,
      isArray: Array.isArray(result),
    });
    
    const updatedResource = result.rows && result.rows.length > 0 
      ? result.rows[0] 
      : (Array.isArray(result) && result.length > 0 ? result[0] : null);
    
    if (!updatedResource) {
      console.error('❌ UPDATE returned no rows');
      return null;
    }
    
    console.log('✅ Resource status updated:', {
      id: updatedResource.id || updatedResource.ID,
      title: updatedResource.title || updatedResource.TITLE,
      status: updatedResource.status || updatedResource.STATUS,
    });
    
    return mapRowToSubmission(updatedResource);
  } catch (error) {
    console.error('❌ Error in updateResourceStatus:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });
    throw error;
  }
}

// Преобразование строки БД в объект заявки
function mapRowToSubmission(row) {
  if (!row) return null;
  
  return {
    id: row.id || row.ID,
    title: row.title || row.TITLE,
    description: row.description || row.DESCRIPTION || '',
    telegramLink: row.telegram_link || row.TELEGRAM_LINK || row.telegramLink,
    telegramUsername: row.telegram_username || row.TELEGRAM_USERNAME || row.telegramUsername,
    categoryId: row.category_id || row.CATEGORY_ID || row.categoryId,
    subcategoryId: row.subcategory_id || row.SUBCATEGORY_ID || row.subcategoryId,
    coverImage: row.cover_image || row.COVER_IMAGE || row.coverImage,
    isPrivate: row.is_private || row.IS_PRIVATE || row.isPrivate || false,
    authorId: row.author_id || row.AUTHOR_ID || row.authorId,
    authorUsername: row.author_username || row.AUTHOR_USERNAME || row.authorUsername,
    status: row.status || row.STATUS || 'pending',
    createdAt: row.created_at || row.CREATED_AT || row.createdAt,
    moderatedById: row.moderated_by_id || row.MODERATED_BY_ID || row.moderatedById,
    moderatedBy: row.moderated_by || row.MODERATED_BY || row.moderatedBy,
    moderatedAt: row.moderated_at || row.MODERATED_AT || row.moderatedAt,
    rejectionReason: row.rejection_reason || row.REJECTION_REASON || row.rejectionReason,
  };
}

export default async function handler(req, res) {
  console.log('📥 Moderation API request:', {
    method: req.method,
    url: req.url,
    hasBody: !!req.body,
    bodyKeys: req.body ? Object.keys(req.body) : [],
    query: req.query,
  });

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('⚠️ No authorization header');
      return res.status(401).json({ message: 'Требуется авторизация' });
    }

    const token = authHeader.substring(7);
    let user;
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      user = decoded;
    } catch (e) {
      console.error('❌ Token decode error:', e);
      return res.status(401).json({ message: 'Неверный токен' });
    }

    if (user.role !== 'admin') {
      console.warn('⚠️ Non-admin user attempted access:', user.username);
      return res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора' });
    }

    const action = req.query.action || req.body?.action;
    console.log('🎯 Action determined:', action);

    // GET /api/moderation?action=pending - получение заявок на модерацию
    if (req.method === 'GET' && (!action || action === 'pending')) {
      const pendingSubmissions = await getPendingSubmissions();
      return res.status(200).json({
        submissions: pendingSubmissions,
        count: pendingSubmissions.length,
      });
    }

    // POST /api/moderation с action=approve - одобрение заявки
    if (req.method === 'POST' && action === 'approve') {
      console.log('🎯 APPROVE ACTION TRIGGERED');
      console.log('Request body:', JSON.stringify(req.body));
      
      const { submissionId } = req.body;

      if (!submissionId) {
        console.error('❌ No submissionId provided');
        return res.status(400).json({ message: 'Укажите ID заявки' });
      }

      console.log('🔍 Fetching resource:', submissionId);
      const resource = await getSubmissionById(submissionId);

      if (!resource) {
        console.error('❌ Resource not found:', submissionId);
        return res.status(404).json({ message: 'Заявка не найдена' });
      }

      console.log('📄 Resource found:', {
        id: resource.id,
        title: resource.title,
        status: resource.status,
        authorId: resource.authorId,
      });

      if (resource.status !== 'pending') {
        console.warn('⚠️ Resource already processed:', resource.status);
        return res.status(400).json({ message: 'Заявка уже обработана' });
      }

      console.log('💾 Updating resource status to approved...');
      const updated = await updateResourceStatus(submissionId, 'approved', {
        id: user.id,
        username: user.username,
      });
      
      if (!updated) {
        console.error('❌ Failed to update resource status');
        return res.status(500).json({ message: 'Ошибка при обновлении статуса' });
      }

      console.log('✅ Resource approved successfully:', {
        id: updated.id,
        title: updated.title,
        status: updated.status,
      });

      return res.status(200).json({
        message: 'Заявка одобрена',
        resource: {
          id: updated.id,
          title: updated.title,
          status: updated.status,
        },
      });
    }

    // POST /api/moderation с action=reject - отклонение заявки
    if (req.method === 'POST' && action === 'reject') {
      const { submissionId, reason } = req.body;

      if (!submissionId) {
        return res.status(400).json({ message: 'Укажите ID заявки' });
      }

      const resource = await getSubmissionById(submissionId);

      if (!resource) {
        return res.status(404).json({ message: 'Заявка не найдена' });
      }

      if (resource.status !== 'pending') {
        return res.status(400).json({ message: 'Заявка уже обработана' });
      }

      const updated = await updateResourceStatus(
        submissionId,
        'rejected',
        {
          id: user.id,
          username: user.username,
        },
        reason || 'Причина не указана'
      );

      if (!updated) {
        return res.status(500).json({ message: 'Ошибка при обновлении статуса' });
      }

      return res.status(200).json({
        message: 'Заявка отклонена',
        resource: {
          id: updated.id,
          title: updated.title,
          status: updated.status,
        },
      });
    }

    return res.status(400).json({ message: 'Неверный action. Используйте: pending, approve, reject' });
  } catch (error) {
    console.error('Error in moderation API:', error);
    return res.status(500).json({ message: 'Ошибка при обработке запроса' });
  }
}

