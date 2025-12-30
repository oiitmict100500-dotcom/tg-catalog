// API endpoint для одобрения заявки на модерацию
// Vercel Serverless Function

import { getSubmissionById, updateSubmission } from './shared-storage.js';

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

    const { submissionId } = req.body;

    if (!submissionId) {
      return res.status(400).json({ message: 'Укажите ID заявки' });
    }

    // Получаем заявку
    const submission = getSubmissionById(submissionId);

    if (!submission) {
      return res.status(404).json({ message: 'Заявка не найдена' });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({ message: 'Заявка уже обработана' });
    }

    // Обновляем статус заявки
    const updated = updateSubmission(submissionId, {
      status: 'approved',
      moderatedById: user.id,
      moderatedBy: user.username,
      moderatedAt: new Date().toISOString(),
    });

    // В продакшене здесь должна быть логика:
    // 1. Создание ресурса из заявки
    // 2. Сохранение в базу данных
    // 3. Увеличение счетчика категории
    // 4. Отправка уведомления автору

    return res.status(200).json({
      message: 'Заявка одобрена',
      submission: updated,
    });
  } catch (error) {
    console.error('Error approving submission:', error);
    return res.status(500).json({ message: 'Ошибка при одобрении заявки' });
  }
}

