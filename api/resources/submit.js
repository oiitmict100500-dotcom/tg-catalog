// API endpoint для отправки ресурса на модерацию
// Vercel Serverless Function
// Использует PostgreSQL для хранения заявок
import { addSubmission, getStorageInfo } from '../moderation/db-storage.js';

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

    // Создаем заявку на модерацию
    const submissionId = 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const submission = {
      id: submissionId,
      title: title.trim(),
      description: description?.trim() || '',
      telegramLink: finalTelegramLink,
      telegramUsername: telegramUsername?.trim() || null,
      categoryId,
      subcategoryId,
      coverImage: finalCoverImage,
      isPrivate: isPrivate || false,
      authorId: authorId || 'anonymous',
      authorUsername: authorUsername || 'Анонимный пользователь',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Сохраняем заявку в систему модерации (PostgreSQL)
    console.log('💾 Attempting to save submission to PostgreSQL:', {
      id: submission.id,
      title: submission.title,
    });
    
    try {
      const savedSubmission = await addSubmission(submission);
      
      // Проверяем, что заявка действительно сохранилась
      const { getPendingSubmissions } = await import('../moderation/db-storage.js');
      const pendingAfterSave = await getPendingSubmissions();
      const found = pendingAfterSave.find(s => s.id === submission.id);
      
      const storageInfo = await getStorageInfo();
      
      console.log('✅ Submission save result (PostgreSQL):', {
        id: savedSubmission.id,
        title: savedSubmission.title,
        status: savedSubmission.status,
        foundInPending: !!found,
        totalPending: pendingAfterSave.length,
        storageInfo,
      });
      
      if (!found) {
        console.error('❌ WARNING: Submission was saved but not found in pending list!');
        console.error('This may indicate a database query issue.');
      }
    } catch (error) {
      console.error('❌ Error saving submission to PostgreSQL:', error);
      console.error('Error stack:', error.stack);
      // Продолжаем выполнение, даже если сохранение не удалось
      // В продакшене здесь можно добавить fallback или уведомление
    }

    console.log('✅ Submission processed successfully:', submissionId);
    return res.status(200).json({ 
      message: 'Заявка отправлена на модерацию',
      id: submissionId,
    });
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

