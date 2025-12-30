// Тестовый endpoint для проверки работы хранилища
// Vercel Serverless Function

import { loadSubmissions, addSubmission } from './storage.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const submissions = loadSubmissions();
      return res.status(200).json({
        message: 'Storage test',
        submissions: submissions,
        count: submissions.length,
        storageInfo: {
          hasGlobalStorage: typeof global !== 'undefined' && !!global.moderationStorage,
          globalStorageCount: global.moderationStorage?.submissions?.length || 0,
        },
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      // Добавляем тестовую заявку
      const testSubmission = {
        id: 'test-' + Date.now(),
        title: 'Тестовая заявка',
        description: 'Это тестовая заявка для проверки хранилища',
        telegramLink: 'https://t.me/test',
        categoryId: '1',
        subcategoryId: '1-1',
        coverImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        isPrivate: false,
        authorId: 'test-user',
        authorUsername: 'Тестовый пользователь',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      addSubmission(testSubmission);
      return res.status(200).json({
        message: 'Test submission added',
        submission: testSubmission,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

