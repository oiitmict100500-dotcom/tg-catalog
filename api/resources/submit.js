// API endpoint для отправки ресурса на модерацию
// Vercel Serverless Function
export default async function handler(req, res) {
  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Парсим данные в зависимости от типа контента
    let data = {};
    
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      // Для multipart/form-data используем встроенный парсер
      // В Vercel это обрабатывается автоматически через req.body
      data = req.body || {};
    } else {
      // Для JSON
      data = req.body || {};
    }

    const {
      title,
      description,
      telegramLink,
      telegramUsername,
      categoryId,
      subcategoryId,
      coverImage,
      coverImageFile,
      isPrivate,
    } = data;

    // Валидация обязательных полей
    if (!title || !categoryId || !subcategoryId) {
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

    // Обработка загрузки файла обложки (если есть)
    let finalCoverImage = coverImage;
    if (coverImageFile) {
      // Здесь должна быть логика загрузки файла на хостинг
      // Пока просто возвращаем успех
      // В реальном приложении нужно загрузить файл на S3, Cloudinary и т.д.
      finalCoverImage = coverImageFile; // Временное решение
    }

    // Здесь должна быть логика сохранения в базу данных
    // Пока просто возвращаем успех
    return res.status(200).json({ 
      message: 'Заявка отправлена на модерацию',
      id: 'temp-' + Date.now(),
    });
  } catch (error) {
    console.error('Error submitting resource:', error);
    return res.status(500).json({ message: 'Ошибка при отправке заявки' });
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

