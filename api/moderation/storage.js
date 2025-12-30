// Простое файловое хранилище для заявок на модерацию
// Использует /tmp директорию Vercel для записи файлов
import fs from 'fs';
import path from 'path';

const STORAGE_FILE = '/tmp/moderation_submissions.json';

// Инициализация хранилища
function initStorage() {
  try {
    if (!fs.existsSync(STORAGE_FILE)) {
      fs.writeFileSync(STORAGE_FILE, JSON.stringify([]), 'utf8');
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}

// Загрузка всех заявок
export function loadSubmissions() {
  try {
    initStorage();
    const data = fs.readFileSync(STORAGE_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error loading submissions:', error);
    return [];
  }
}

// Сохранение всех заявок
function saveSubmissions(submissions) {
  try {
    initStorage();
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(submissions, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving submissions:', error);
  }
}

// Добавление новой заявки
export function addSubmission(submission) {
  try {
    const submissions = loadSubmissions();
    submissions.push(submission);
    saveSubmissions(submissions);
    console.log('💾 Submission added to storage:', {
      id: submission.id,
      totalSubmissions: submissions.length,
    });
    return submission;
  } catch (error) {
    console.error('❌ Error in addSubmission:', error);
    throw error;
  }
}

// Получение заявки по ID
export function getSubmissionById(id) {
  const submissions = loadSubmissions();
  return submissions.find(s => s.id === id);
}

// Обновление заявки
export function updateSubmission(id, updates) {
  const submissions = loadSubmissions();
  const index = submissions.findIndex(s => s.id === id);
  if (index !== -1) {
    submissions[index] = { ...submissions[index], ...updates };
    saveSubmissions(submissions);
    return submissions[index];
  }
  return null;
}

// Получение заявок со статусом pending
export function getPendingSubmissions() {
  const submissions = loadSubmissions();
  return submissions.filter(s => s.status === 'pending');
}

