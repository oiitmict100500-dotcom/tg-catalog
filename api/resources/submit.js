// API endpoint для отправки ресурса на модерацию
// Vercel Serverless Function
// Использует PostgreSQL - создает ресурс сразу в таблице resources со статусом 'pending'
import { query, initTables } from '../db.js';

export default async function handler(req, res) {
  console.log('📥 Submit resource request received:', {
    method: req.method,
    hasBody: !!req.body,
    bodyKeys: req.body ? Object.keys(req.body) : [],
  });

  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS request, returning 200');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.warn('⚠️ Invalid method:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🔍 Processing submission...');
    // Парсим JSON данные
    const data = req.body || {};

    const {
      title,
      description,
      telegramLink,
      telegramUsername,
      categoryId,
      subcategoryId,
      coverImage,
      isPrivate,
    } = data;

    // Логирование для отладки
    console.log('Received data:', {
      hasTitle: !!title,
      hasCategoryId: !!categoryId,
      hasSubcategoryId: !!subcategoryId,
      hasDescription: !!description,
      categoryId,
      subcategoryId,
      isPrivate,
      hasTelegramLink: !!telegramLink,
      hasTelegramUsername: !!telegramUsername,
      hasCoverImage: !!coverImage,
    });

    // Валидация обязательных полей
    if (!title || !title.trim()) {
      return res.status(400).json({ 
        message: 'Заполните все обязательные поля: название, категория, подкатегория' 
      });
    }

    if (!categoryId) {
      return res.status(400).json({ 
        message: 'Заполните все обязательные поля: название, категория, подкатегория' 
      });
    }

    if (!subcategoryId) {
      return res.status(400).json({ 
        message: 'Заполните все обязательные поля: название, категория, подкатегория' 
      });
    }

    // Для каналов, групп и ботов нужен username или link (если приватный)
    const categoryType = getCategoryType(categoryId);
    if (['channel', 'group', 'bot'].includes(categoryType)) {
      if (!telegramUsername && !telegramLink) {
        return res.status(400).json({ 
          message: 'Укажите username или ссылку (если ресурс приватный)' 
        });
      }
    } else if (['sticker', 'emoji'].includes(categoryType)) {
      // Для паков нужна ссылка
      if (!telegramLink) {
        return res.status(400).json({ 
          message: 'Укажите ссылку на стикерпак или эмодзипак' 
        });
      }
    }

    // Проверка наличия обложки
    if (!coverImage) {
      return res.status(400).json({ 
        message: 'Загрузите обложку (файл изображения)' 
      });
    }

    // Обработка загрузки файла обложки (base64 строка)
    // В реальном приложении здесь будет логика загрузки base64 на S3, Cloudinary и т.д.
    // Пока просто сохраняем base64 строку
    const finalCoverImage = coverImage;

    // Получаем информацию о пользователе из токена (если есть)
    let authorId = null;
    let authorUsername = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
        authorId = decoded.id;
        authorUsername = decoded.username;
      } catch (e) {
        console.warn('Could not decode token:', e);
      }
    }

    // Формируем финальную ссылку
    let finalTelegramLink = telegramLink;
    if (!finalTelegramLink && telegramUsername) {
      finalTelegramLink = `https://t.me/${telegramUsername.replace('@', '')}`;
    }

    // Создаем ресурс сразу в таблице resources со статусом 'pending'
    await initTables();
    
    const resourceId = 'resource-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const finalAuthorId = String(authorId || 'anonymous');
    const finalAuthorUsername = authorUsername || 'Анонимный пользователь';

    console.log('💾 Creating resource with status pending:', {
      id: resourceId,
      title: title.trim(),
      categoryId,
      authorId: finalAuthorId,
    });

    const insertQuery = `
      INSERT INTO resources (
        id, title, description, telegram_link, telegram_username,
        category_id, subcategory_id, cover_image, is_private,
        author_id, author_username, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const insertParams = [
      resourceId,
      title.trim(),
      description?.trim() || '',
      finalTelegramLink || null,
      telegramUsername?.trim() || null,
      categoryId,
      subcategoryId || null,
      finalCoverImage || null,
      isPrivate || false,
      finalAuthorId,
      finalAuthorUsername,
      'pending', // Статус pending - на модерации
    ];

    try {
      const result = await query(insertQuery, insertParams);
      const createdResource = result.rows && result.rows.length > 0 
        ? result.rows[0] 
        : (Array.isArray(result) && result.length > 0 ? result[0] : null);

      if (!createdResource) {
        throw new Error('Resource creation returned null result');
      }

      console.log('✅ Resource created successfully with status pending:', {
        id: createdResource.id || createdResource.ID,
        title: createdResource.title || createdResource.TITLE,
        status: createdResource.status || createdResource.STATUS,
      });

      return res.status(200).json({ 
        message: 'Заявка отправлена на модерацию',
        id: resourceId,
      });
    } catch (error) {
      console.error('❌ Error creating resource:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
      });
      return res.status(500).json({ 
        message: 'Ошибка при создании заявки: ' + error.message 
      });
    }
  } catch (error) {
    console.error('❌ Error submitting resource:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    return res.status(500).json({ 
      message: 'Ошибка при отправке заявки',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

// Вспомогательная функция для определения типа категории
function getCategoryType(categoryId) {
  const categoryMap = {
    '1': 'channel',
    '2': 'group',
    '3': 'bot',
    '4': 'sticker',
    '5': 'emoji',
  };
  return categoryMap[categoryId] || 'unknown';
}

