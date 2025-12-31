// API для работы с рекламными слотами
// Хранилище в PostgreSQL

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

// Получение количества активных платных слотов в категории
export async function getActivePaidSlotsCount(categoryId) {
  try {
    await ensureTables();
    
    const selectQuery = `
      SELECT COUNT(*) as count
      FROM resources
      WHERE category_id = $1
        AND is_paid = TRUE
        AND (paid_until IS NULL OR paid_until > CURRENT_TIMESTAMP)
    `;
    
    const result = await query(selectQuery, [categoryId]);
    const row = result.rows ? result.rows[0] : (Array.isArray(result) ? result[0] : {});
    
    return parseInt(row.count || row.COUNT || 0);
  } catch (error) {
    console.error('❌ Error getting active paid slots count:', error);
    return 0;
  }
}

// Получение активных платных ресурсов в категории
export async function getActivePaidResources(categoryId, limit = 3) {
  try {
    await ensureTables();
    
    const selectQuery = `
      SELECT *
      FROM resources
      WHERE category_id = $1
        AND status = 'approved'
        AND is_paid = TRUE
        AND (paid_until IS NULL OR paid_until > CURRENT_TIMESTAMP)
      ORDER BY paid_until DESC NULLS LAST, created_at DESC
      LIMIT $2
    `;
    
    const result = await query(selectQuery, [categoryId, limit]);
    const rows = result.rows || result;
    const resources = Array.isArray(rows) ? rows : [];
    
    return resources.map(mapRowToResource);
  } catch (error) {
    console.error('❌ Error getting active paid resources:', error);
    return [];
  }
}

// Получение всех активных платных ресурсов (для главной страницы)
export async function getAllActivePaidResources() {
  try {
    await ensureTables();
    
    const selectQuery = `
      SELECT *
      FROM resources
      WHERE status = 'approved'
        AND is_paid = TRUE
        AND (paid_until IS NULL OR paid_until > CURRENT_TIMESTAMP)
      ORDER BY paid_until DESC NULLS LAST, created_at DESC
    `;
    
    const result = await query(selectQuery);
    const rows = result.rows || result;
    const resources = Array.isArray(rows) ? rows : [];
    
    return resources.map(mapRowToResource);
  } catch (error) {
    console.error('❌ Error getting all active paid resources:', error);
    return [];
  }
}

// Создание или обновление ресурса как платного
export async function setResourceAsPaid(resourceId, durationDays) {
  try {
    await ensureTables();
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);
    
    const updateQuery = `
      UPDATE resources
      SET is_paid = TRUE,
          paid_until = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await query(updateQuery, [expiresAt.toISOString(), resourceId]);
    
    if (result.rows && result.rows.length > 0) {
      return mapRowToResource(result.rows[0]);
    }
    
    if (Array.isArray(result) && result.length > 0) {
      return mapRowToResource(result[0]);
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error setting resource as paid:', error);
    return null;
  }
}

// Создание записи о покупке рекламного слота
export async function createAdSlotPurchase(userId, resourceId, categoryId, durationDays, price, paymentId = null) {
  try {
    await ensureTables();
    
    const purchaseId = 'purchase-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);
    
    const insertQuery = `
      INSERT INTO ad_slot_purchases (
        id, user_id, resource_id, category_id, duration_days,
        price, status, payment_id, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const result = await query(insertQuery, [
      purchaseId,
      userId,
      resourceId,
      categoryId,
      durationDays,
      price,
      'completed',
      paymentId,
      expiresAt.toISOString(),
    ]);
    
    if (result.rows && result.rows.length > 0) {
      return mapRowToPurchase(result.rows[0]);
    }
    
    if (Array.isArray(result) && result.length > 0) {
      return mapRowToPurchase(result[0]);
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error creating ad slot purchase:', error);
    return null;
  }
}

// Получение ресурсов пользователя
export async function getUserResources(userId) {
  try {
    await ensureTables();
    
    console.log('🔍 getUserResources query:', {
      userId: userId,
      userIdType: typeof userId,
    });
    
    const selectQuery = `
      SELECT *
      FROM resources
      WHERE author_id = $1 AND status = 'approved'
      ORDER BY created_at DESC
    `;
    
    console.log('🔍 getUserResources query (approved only):', {
      userId: userId,
      query: selectQuery,
    });
    
    const result = await query(selectQuery, [userId]);
    const rows = result.rows || result;
    const resources = Array.isArray(rows) ? rows : [];
    
    console.log('📋 getUserResources result (approved only):', {
      userId: userId,
      rawRowsCount: resources.length,
      resources: resources.map(r => ({
        id: r.id || r.ID,
        title: r.title || r.TITLE,
        authorId: r.author_id || r.AUTHOR_ID,
        status: r.status || r.STATUS,
      })),
    });
    
    const mapped = resources.map(mapRowToResource);
    
    console.log('✅ getUserResources mapped:', {
      userId: userId,
      count: mapped.length,
      mappedResources: mapped.map(r => ({
        id: r.id,
        title: r.title,
        authorId: r.authorId,
      })),
    });
    
    return mapped;
  } catch (error) {
    console.error('❌ Error getting user resources:', error);
    console.error('Error stack:', error.stack);
    return [];
  }
}

// Получение ресурса по ID
export async function getResourceById(resourceId) {
  try {
    await ensureTables();
    
    const selectQuery = 'SELECT * FROM resources WHERE id = $1';
    const result = await query(selectQuery, [resourceId]);
    
    if (result.rows && result.rows.length > 0) {
      return mapRowToResource(result.rows[0]);
    }
    
    if (Array.isArray(result) && result.length > 0) {
      return mapRowToResource(result[0]);
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting resource by id:', error);
    return null;
  }
}

// Обновление ресурса (для админов)
export async function updateResource(resourceId, updates) {
  try {
    await ensureTables();
    
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (updates.title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      updateValues.push(updates.title);
    }
    if (updates.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(updates.description);
    }
    if (updates.telegramLink !== undefined) {
      updateFields.push(`telegram_link = $${paramIndex++}`);
      updateValues.push(updates.telegramLink);
    }
    if (updates.telegramUsername !== undefined) {
      updateFields.push(`telegram_username = $${paramIndex++}`);
      updateValues.push(updates.telegramUsername);
    }
    if (updates.categoryId !== undefined) {
      updateFields.push(`category_id = $${paramIndex++}`);
      updateValues.push(updates.categoryId);
    }
    if (updates.subcategoryId !== undefined) {
      updateFields.push(`subcategory_id = $${paramIndex++}`);
      updateValues.push(updates.subcategoryId);
    }
    if (updates.coverImage !== undefined) {
      updateFields.push(`cover_image = $${paramIndex++}`);
      updateValues.push(updates.coverImage);
    }
    if (updates.isPrivate !== undefined) {
      updateFields.push(`is_private = $${paramIndex++}`);
      updateValues.push(updates.isPrivate);
    }

    if (updateFields.length === 0) {
      return getResourceById(resourceId);
    }

    // Добавляем updated_at
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(resourceId);
    
    const updateQuery = `
      UPDATE resources
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);
    
    if (result.rows && result.rows.length > 0) {
      return mapRowToResource(result.rows[0]);
    }
    
    if (Array.isArray(result) && result.length > 0) {
      return mapRowToResource(result[0]);
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error updating resource:', error);
    return null;
  }
}

// Преобразование строки БД в объект ресурса
function mapRowToResource(row) {
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
    isPaid: row.is_paid || row.IS_PAID || row.isPaid || false,
    paidUntil: row.paid_until || row.PAID_UNTIL || row.paidUntil,
    createdAt: row.created_at || row.CREATED_AT || row.createdAt,
    updatedAt: row.updated_at || row.UPDATED_AT || row.updatedAt,
  };
}

// Преобразование строки БД в объект покупки
function mapRowToPurchase(row) {
  if (!row) return null;
  
  return {
    id: row.id || row.ID,
    userId: row.user_id || row.USER_ID || row.userId,
    resourceId: row.resource_id || row.RESOURCE_ID || row.resourceId,
    categoryId: row.category_id || row.CATEGORY_ID || row.categoryId,
    durationDays: row.duration_days || row.DURATION_DAYS || row.durationDays,
    price: parseFloat(row.price || row.PRICE || row.price || 0),
    status: row.status || row.STATUS || 'pending',
    paymentId: row.payment_id || row.PAYMENT_ID || row.paymentId,
    purchasedAt: row.purchased_at || row.PURCHASED_AT || row.purchasedAt,
    expiresAt: row.expires_at || row.EXPIRES_AT || row.expiresAt,
  };
}

