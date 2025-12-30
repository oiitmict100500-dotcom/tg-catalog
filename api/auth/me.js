// API endpoint для получения текущего пользователя
// Проверяет токен из заголовка Authorization

export default async function handler(req, res) {
  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Получаем токен из заголовка Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Токен не предоставлен' });
    }

    const token = authHeader.substring(7); // Убираем "Bearer "

    // Декодируем токен (простая версия, в реальном приложении используйте JWT)
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      
      // Проверяем, что токен не истек
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) {
        return res.status(401).json({ message: 'Токен истек' });
      }

      // Возвращаем данные пользователя из токена
      return res.status(200).json({
        id: decoded.id,
        username: decoded.username,
        email: `${decoded.id}@telegram.local`,
        avatar: null, // Можно добавить сохранение аватара в будущем
        bio: null,
        createdAt: new Date(decoded.iat * 1000).toISOString(),
      });
    } catch (decodeError) {
      console.error('Error decoding token:', decodeError);
      return res.status(401).json({ message: 'Неверный токен' });
    }
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
}

