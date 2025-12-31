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
  console.log('🔨 createResourceFromSubmission CALLED with:', {
    submissionId: submission.id,
    title: submission.title,
    categoryId: submission.categoryId,
    hasData: !!submission,
  });
  
  try {
    await ensureTables();
    console.log('✅ Tables ensured');
    
    const resourceId = 'resource-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    // Убеждаемся, что authorId - строка
    const authorId = String(submission.authorId || '');
    
    console.log('🔨 Creating resource from submission:', {
      resourceId,
      title: submission.title,
      categoryId: submission.categoryId,
      subcategoryId: submission.subcategoryId,
      authorId: authorId,
      authorUsername: submission.authorUsername,
      hasTelegramLink: !!submission.telegramLink,
      hasTelegramUsername: !!submission.telegramUsername,
      isPrivate: submission.isPrivate || false,
      hasCoverImage: !!submission.coverImage,
    });
    
    // Проверяем, что все обязательные поля есть
    if (!submission.title || !submission.categoryId) {
      console.error('❌ Missing required fields:', {
        hasTitle: !!submission.title,
        hasCategoryId: !!submission.categoryId,
      });
      throw new Error('Missing required fields: title or categoryId');
    }
    
    const insertQuery = `
      INSERT INTO resources (
        id, title, description, telegram_link, telegram_username,
        category_id, subcategory_id, cover_image, is_private,
        author_id, author_username, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const insertParams = [
      resourceId,
      submission.title,
      submission.description || '',
      submission.telegramLink || null,
      submission.telegramUsername || null,
      submission.categoryId,
      submission.subcategoryId || null,
      submission.coverImage || null,
      submission.isPrivate || false,
      authorId,
      submission.authorUsername || null,
    ];
    
    console.log('🔍 Executing insert query with params:', {
      paramCount: insertParams.length,
      title: insertParams[1],
      categoryId: insertParams[5],
      allParams: insertParams.map((p, i) => ({ index: i, value: typeof p === 'string' ? p.substring(0, 50) : p })),
    });
    
    let result;
    try {
      result = await query(insertQuery, insertParams);
      console.log('✅ Query executed successfully');
    } catch (queryError) {
      console.error('❌ Query execution failed:', queryError);
      console.error('Query:', insertQuery);
      console.error('Params:', insertParams);
      throw queryError;
    }
    
    console.log('🔍 Query result structure:', {
      hasResult: !!result,
      resultType: typeof result,
      isArray: Array.isArray(result),
      hasRows: !!result.rows,
      rowsLength: result.rows?.length,
      resultKeys: result ? Object.keys(result) : [],
      firstRow: result.rows?.[0] ? Object.keys(result.rows[0]) : null,
    });
    
    const createdResource = result.rows && result.rows.length > 0 
      ? result.rows[0] 
      : (Array.isArray(result) && result.length > 0 ? result[0] : null);
    
    console.log('🔍 Created resource extracted:', {
      hasResource: !!createdResource,
      resourceId: createdResource?.id || createdResource?.ID,
      resourceKeys: createdResource ? Object.keys(createdResource) : [],
    });
    
    if (createdResource) {
      console.log('✅ Resource created successfully:', {
        id: createdResource.id || createdResource.ID,
        title: createdResource.title || createdResource.TITLE,
        categoryId: createdResource.category_id || createdResource.CATEGORY_ID,
        authorId: createdResource.author_id || createdResource.AUTHOR_ID,
        createdAt: createdResource.created_at || createdResource.CREATED_AT,
      });
      
      // Проверяем, что ресурс действительно в базе
      const { query: verifyQuery } = await import('../db.js');
      const verifyResult = await verifyQuery('SELECT * FROM resources WHERE id = $1', [resourceId]);
      const verified = verifyResult.rows ? verifyResult.rows[0] : (Array.isArray(verifyResult) ? verifyResult[0] : null);
      
      if (verified) {
        console.log('✅ Resource verified in database');
      } else {
        console.error('❌ Resource not found in database after creation!');
      }
    } else {
      console.error('❌ Resource creation returned null result');
      console.error('Query result:', {
        hasRows: !!result.rows,
        rowsLength: result.rows?.length,
        isArray: Array.isArray(result),
        resultLength: Array.isArray(result) ? result.length : 0,
      });
    }
    
    return createdResource;
  } catch (error) {
    console.error('❌ Error creating resource from submission:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      submission: {
        id: submission.id,
        title: submission.title,
        categoryId: submission.categoryId,
        authorId: submission.authorId,
      },
    });
    throw error; // Пробрасываем ошибку дальше
  }
}

export default async function handler(req, res) {
  // Логируем ВСЕ запросы в самое начало
  console.log('='.repeat(50));
  console.log('📥 MODERATION HANDLER CALLED:', {
    method: req.method,
    url: req.url,
    query: req.query,
    body: req.body,
    hasAuth: !!req.headers.authorization,
    timestamp: new Date().toISOString(),
  });
  console.log('='.repeat(50));

  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS request, returning 200');
    return res.status(200).end();
  }

  try {
    // Проверка авторизации админа
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ No authorization header');
      return res.status(401).json({ message: 'Требуется авторизация' });
    }

    const token = authHeader.substring(7);
    let user;
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      user = decoded;
      console.log('✅ User decoded:', { id: user.id, username: user.username, role: user.role });
    } catch (e) {
      console.error('❌ Token decode error:', e.message);
      return res.status(401).json({ message: 'Неверный токен' });
    }

    // Проверка роли админа
    if (user.role !== 'admin') {
      console.error('❌ User is not admin:', user.role);
      return res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора' });
    }

    // Определяем действие по query параметру или body
    const action = req.query.action || req.body?.action;
    console.log('🔍 Action determined:', action, 'from', req.query.action ? 'query' : 'body');

    // GET /api/moderation?action=pending - получение заявок на модерацию
    if (req.method === 'GET' && (!action || action === 'pending')) {
      console.log('📋 Loading pending submissions...');
      const pendingSubmissions = await getPendingSubmissions();
      
      console.log('📋 Pending submissions result:', {
        count: pendingSubmissions.length,
        ids: pendingSubmissions.map(s => s.id),
        titles: pendingSubmissions.map(s => s.title),
      });

      // Также проверяем все ресурсы в базе для диагностики
      try {
        const { query } = await import('../db.js');
        const allResources = await query('SELECT COUNT(*) as total FROM resources');
        const resourceCount = allResources.rows ? allResources.rows[0].total : (Array.isArray(allResources) ? allResources[0]?.total : 0);
        console.log('📊 Total resources in database:', resourceCount);
      } catch (e) {
        console.error('Error checking resources count:', e);
      }

      return res.status(200).json({
        submissions: pendingSubmissions,
        count: pendingSubmissions.length,
      });
    }

    // POST /api/moderation с action=approve - одобрение заявки
    console.log('🔍 Checking approve condition:', {
      method: req.method,
      action: action,
      isPost: req.method === 'POST',
      isApprove: action === 'approve',
      willExecute: req.method === 'POST' && action === 'approve',
    });
    
    if (req.method === 'POST' && action === 'approve') {
      console.log('🔨 APPROVE REQUEST RECEIVED:', {
        submissionId: req.body.submissionId,
        action: action,
        body: req.body,
      });

      const { submissionId } = req.body;

      if (!submissionId) {
        console.error('❌ No submissionId provided');
        return res.status(400).json({ message: 'Укажите ID заявки' });
      }

      console.log('🔍 Fetching submission:', submissionId);
      const submission = await getSubmissionById(submissionId);

      if (!submission) {
        console.error('❌ Submission not found:', submissionId);
        return res.status(404).json({ message: 'Заявка не найдена' });
      }

      console.log('🔍 Submission found:', {
        id: submission.id,
        title: submission.title,
        status: submission.status,
        categoryId: submission.categoryId,
      });

      if (submission.status !== 'pending') {
        console.warn('⚠️ Submission already processed:', submission.status);
        return res.status(400).json({ message: 'Заявка уже обработана' });
      }

      console.log('📝 Updating submission status to approved...');
      const updated = await updateSubmission(submissionId, {
        status: 'approved',
        moderatedById: user.id,
        moderatedBy: user.username,
        moderatedAt: new Date().toISOString(),
      });
      
      console.log('✅ Submission updated:', {
        id: updated.id,
        status: updated.status,
        title: updated.title,
        categoryId: updated.categoryId,
        subcategoryId: updated.subcategoryId,
        authorId: updated.authorId,
        hasTelegramLink: !!updated.telegramLink,
        hasTelegramUsername: !!updated.telegramUsername,
        hasCoverImage: !!updated.coverImage,
        fullData: JSON.stringify(updated, null, 2),
      });

      // Создаем ресурс из одобренной заявки
      console.log('🔨 Starting resource creation from submission:', {
        submissionId: updated.id,
        title: updated.title,
        categoryId: updated.categoryId,
        subcategoryId: updated.subcategoryId,
        authorId: updated.authorId,
      });
      
      let resource;
      try {
        // Убеждаемся, что все данные на месте перед созданием ресурса
        if (!updated.title) {
          throw new Error('Submission missing title');
        }
        if (!updated.categoryId) {
          throw new Error('Submission missing categoryId');
        }
        if (!updated.authorId) {
          throw new Error('Submission missing authorId');
        }
        
        console.log('✅ All required fields present, calling createResourceFromSubmission...');
        resource = await createResourceFromSubmission(updated);
        console.log('✅ createResourceFromSubmission returned:', {
          hasResource: !!resource,
          resourceId: resource?.id || resource?.ID,
        });
      } catch (createError) {
        console.error('❌ Error during resource creation:', createError);
        console.error('Error stack:', createError.stack);
        console.error('Submission data that failed:', {
          id: updated.id,
          title: updated.title,
          categoryId: updated.categoryId,
          authorId: updated.authorId,
        });
        return res.status(500).json({ 
          message: 'Ошибка при создании ресурса: ' + createError.message,
          error: process.env.NODE_ENV === 'development' ? createError.stack : undefined,
        });
      }
      
      if (!resource) {
        console.error('❌ Failed to create resource from approved submission');
        console.error('Submission data:', {
          id: updated.id,
          title: updated.title,
          categoryId: updated.categoryId,
          authorId: updated.authorId,
        });
        return res.status(500).json({ message: 'Заявка одобрена, но не удалось создать ресурс' });
      }

      console.log('✅ Resource created from approved submission:', {
        resourceId: resource.id || resource.ID,
        submissionId: updated.id,
        title: resource.title || resource.TITLE,
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

