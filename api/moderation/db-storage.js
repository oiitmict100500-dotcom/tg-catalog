// Хранилище заявок на модерацию в PostgreSQL
import { query, initTables } from '../db.js';

// Инициализация таблиц при первом импорте
let tablesInitialized = false;
async function ensureTables() {
  if (!tablesInitialized) {
    try {
      await initTables();
      tablesInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize tables:', error);
      // Не бросаем ошибку, чтобы приложение могло работать
      // даже если база данных недоступна
    }
  }
}

// Добавление новой заявки
export async function addSubmission(submission) {
  try {
    await ensureTables();
    
    console.log('➕ addSubmission (PostgreSQL):', {
      id: submission.id,
      title: submission.title,
    });

    const insertQuery = `
      INSERT INTO moderation_submissions (
        id, title, description, telegram_link, telegram_username,
        category_id, subcategory_id, cover_image, is_private,
        author_id, author_username, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        telegram_link = EXCLUDED.telegram_link,
        telegram_username = EXCLUDED.telegram_username,
        category_id = EXCLUDED.category_id,
        subcategory_id = EXCLUDED.subcategory_id,
        cover_image = EXCLUDED.cover_image,
        is_private = EXCLUDED.is_private
      RETURNING *
    `;

    const result = await query(insertQuery, [
      submission.id,
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
      submission.status || 'pending',
      submission.createdAt || new Date().toISOString(),
    ]);

    const saved = mapRowToSubmission(result.rows ? result.rows[0] : result);
    
    console.log('✅ Submission saved to PostgreSQL:', {
      id: saved.id,
      title: saved.title,
    });

    return saved;
  } catch (error) {
    console.error('❌ Error in addSubmission (PostgreSQL):', error);
    throw error;
  }
}

// Получение заявки по ID
export async function getSubmissionById(id) {
  try {
    await ensureTables();
    
    const selectQuery = 'SELECT * FROM moderation_submissions WHERE id = $1';
    const result = await query(selectQuery, [id]);
    
    if (result.rows && result.rows.length > 0) {
      return mapRowToSubmission(result.rows[0]);
    }
    
    // Для Vercel Postgres может быть другой формат
    if (Array.isArray(result) && result.length > 0) {
      return mapRowToSubmission(result[0]);
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error in getSubmissionById:', error);
    return null;
  }
}

// Обновление заявки
export async function updateSubmission(id, updates) {
  try {
    await ensureTables();
    
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      updateValues.push(updates.status);
    }
    if (updates.moderatedBy !== undefined) {
      updateFields.push(`moderated_by = $${paramIndex++}`);
      updateValues.push(updates.moderatedBy);
    }
    if (updates.moderatedById !== undefined) {
      updateFields.push(`moderated_by_id = $${paramIndex++}`);
      updateValues.push(updates.moderatedById);
    }
    if (updates.moderatedAt !== undefined) {
      updateFields.push(`moderated_at = $${paramIndex++}`);
      updateValues.push(updates.moderatedAt);
    }
    if (updates.rejectionReason !== undefined) {
      updateFields.push(`rejection_reason = $${paramIndex++}`);
      updateValues.push(updates.rejectionReason);
    }

    if (updateFields.length === 0) {
      return getSubmissionById(id);
    }

    updateValues.push(id);
    const updateQuery = `
      UPDATE moderation_submissions
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);
    
    if (result.rows && result.rows.length > 0) {
      return mapRowToSubmission(result.rows[0]);
    }
    
    if (Array.isArray(result) && result.length > 0) {
      return mapRowToSubmission(result[0]);
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error in updateSubmission:', error);
    return null;
  }
}

// Получение заявок со статусом pending
export async function getPendingSubmissions() {
  try {
    await ensureTables();
    
    const selectQuery = `
      SELECT * FROM moderation_submissions
      WHERE status = $1
      ORDER BY created_at DESC
    `;
    
    const result = await query(selectQuery, ['pending']);
    
    const rows = result.rows || result;
    const submissions = Array.isArray(rows) ? rows : [];
    
    console.log('🔍 getPendingSubmissions (PostgreSQL):', {
      count: submissions.length,
      ids: submissions.map(s => s.id || s.ID),
    });
    
    return submissions.map(mapRowToSubmission);
  } catch (error) {
    console.error('❌ Error in getPendingSubmissions:', error);
    return [];
  }
}

// Загрузка всех заявок (для совместимости)
export async function loadSubmissions() {
  try {
    await ensureTables();
    
    const selectQuery = 'SELECT * FROM moderation_submissions ORDER BY created_at DESC';
    const result = await query(selectQuery);
    
    const rows = result.rows || result;
    const submissions = Array.isArray(rows) ? rows : [];
    
    return submissions.map(mapRowToSubmission);
  } catch (error) {
    console.error('❌ Error in loadSubmissions:', error);
    return [];
  }
}

// Получение информации о хранилище (для диагностики)
export async function getStorageInfo() {
  try {
    await ensureTables();
    
    const countQuery = 'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = $1) as pending FROM moderation_submissions';
    const result = await query(countQuery, ['pending']);
    
    const row = result.rows ? result.rows[0] : (Array.isArray(result) ? result[0] : {});
    
    return {
      type: 'postgresql',
      total: parseInt(row.total || row.TOTAL || 0),
      pending: parseInt(row.pending || row.PENDING || 0),
      hasConnection: true,
    };
  } catch (error) {
    console.error('❌ Error in getStorageInfo:', error);
    return {
      type: 'postgresql',
      total: 0,
      pending: 0,
      hasConnection: false,
      error: error.message,
    };
  }
}

// Преобразование строки БД в объект заявки
function mapRowToSubmission(row) {
  if (!row) return null;
  
  // Обрабатываем разные форматы (snake_case и camelCase)
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

