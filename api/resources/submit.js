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

