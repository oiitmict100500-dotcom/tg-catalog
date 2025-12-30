// API endpoint для получения заявок на модерацию
// Vercel Serverless Function
// ВАЖНО: Для продакшена нужно использовать базу данных вместо in-memory хранилища

// Временное хранилище в памяти (в продакшене использовать БД)
// В реальном приложении это должно быть в базе данных
// Используем глобальный объект для сохранения между вызовами в Vercel
let submissions = [];
if (typeof global !== 'undefined') {
  if (!global.moderationStorage) {
    global.moderationStorage = { submissions: [] };
  }
  submissions = global.moderationStorage.submissions;
}

// Функция для загрузки заявок (в продакшене из БД)
function loadSubmissions() {
  // В продакшене: загрузка из базы данных
  // Пока используем in-memory хранилище
  return submissions.filter(s => s.status === 'pending');
}

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
    // Проверка авторизации админа
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Требуется авторизация' });
    }

    const token = authHeader.substring(7);
    let user;
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      user = decoded;
    } catch (e) {
      return res.status(401).json({ message: 'Неверный токен' });
    }

    // Проверка роли админа
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора' });
    }

    // Загружаем заявки на модерацию
    // В продакшене: загрузка из базы данных
    const pendingSubmissions = loadSubmissions();

    return res.status(200).json({
      submissions: pendingSubmissions,
      count: pendingSubmissions.length,
    });
  } catch (error) {
    console.error('Error loading pending submissions:', error);
    return res.status(500).json({ message: 'Ошибка при загрузке заявок' });
  }
}

// Экспортируем функции для доступа из других модулей
// В Vercel Serverless Functions используем глобальный объект для хранения
if (typeof global !== 'undefined') {
  global.moderationStorage = global.moderationStorage || { submissions: [] };
  submissions = global.moderationStorage.submissions;
}

export function addSubmission(submission) {
  submissions.push(submission);
  if (typeof global !== 'undefined' && global.moderationStorage) {
    global.moderationStorage.submissions = submissions;
  }
}

export function getSubmissionById(id) {
  return submissions.find(s => s.id === id);
}

export function updateSubmission(id, updates) {
  const index = submissions.findIndex(s => s.id === id);
  if (index !== -1) {
    submissions[index] = { ...submissions[index], ...updates };
    if (typeof global !== 'undefined' && global.moderationStorage) {
      global.moderationStorage.submissions = submissions;
    }
    return submissions[index];
  }
  return null;
}

