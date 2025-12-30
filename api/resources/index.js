// Простой API endpoint для ресурсов (пока пустой)
export default function handler(req, res) {
  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Пока возвращаем пустой список
    return res.status(200).json({
      data: [],
      total: 0,
      page: 1,
      totalPages: 1,
    });
  }

  if (req.method === 'POST') {
    // Просто возвращаем успех (данные не сохраняются)
    return res.status(200).json({ 
      message: 'Resource submitted (not saved - backend not configured)',
      id: 'temp-' + Date.now(),
    });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}


