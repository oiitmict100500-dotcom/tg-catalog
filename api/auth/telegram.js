// Простой API endpoint для авторизации через Telegram
import crypto from 'node:crypto';

export default async function handler(req, res) {
  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id, first_name, last_name, username, photo_url, auth_date, hash } = req.body;

    // Проверяем наличие обязательных полей
    if (!id || !first_name || !auth_date || !hash) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Получаем токен бота из переменных окружения
    const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
    
    if (!botToken) {
      console.error('Telegram bot token not configured');
      return res.status(500).json({ message: 'Telegram bot token не настроен' });
    }

    // Проверяем подлинность данных Telegram
    const isValid = verifyTelegramAuth(req.body, botToken);
    
    if (!isValid) {
      return res.status(401).json({ message: 'Неверные данные авторизации Telegram' });
    }

    // Создаем простой JWT токен (упрощенная версия)
    // В реальном приложении используйте библиотеку jsonwebtoken
    const token = createSimpleToken(id, username || first_name);

    // Возвращаем данные пользователя и токен
    return res.status(200).json({
      user: {
        id: id.toString(),
        username: username || first_name,
        email: `${id}@telegram.local`, // Временный email
        avatar: photo_url || null,
        bio: null,
        createdAt: new Date().toISOString(),
      },
      token: token,
    });
  } catch (error) {
    console.error('Telegram auth error:', error);
    return res.status(500).json({ message: 'Ошибка авторизации' });
  }
}

// Функция проверки подлинности данных Telegram
function verifyTelegramAuth(data, botToken) {
  try {
    const { hash, ...dataToCheck } = data;
    
    // Создаем строку для проверки
    const dataCheckString = Object.keys(dataToCheck)
      .filter(key => dataToCheck[key] !== null && dataToCheck[key] !== undefined && dataToCheck[key] !== '')
      .sort()
      .map(key => `${key}=${dataToCheck[key]}`)
      .join('\n');

    // Создаем секретный ключ
    const secretKey = crypto
      .createHash('sha256')
      .update(botToken)
      .digest();

    // Вычисляем HMAC-SHA256
    const hmac = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Сравниваем хеши
    return hmac === hash;
  } catch (error) {
    console.error('Error verifying Telegram auth:', error);
    return false;
  }
}

// Простая функция создания токена (в реальном приложении используйте jsonwebtoken)
function createSimpleToken(userId, username) {
  const payload = {
    id: userId,
    username: username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 дней
  };
  
  // Простое кодирование (в реальном приложении используйте JWT)
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

