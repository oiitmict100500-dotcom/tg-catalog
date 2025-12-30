// Простое файловое хранилище для заявок на модерацию
// Использует /tmp директорию Vercel для записи файлов
// ВАЖНО: В Vercel Serverless Functions /tmp может не работать между разными инстансами
// Для продакшена рекомендуется использовать базу данных

import fs from 'fs';
import path from 'path';

// Пробуем использовать /tmp, если не доступно - используем текущую директорию
let STORAGE_FILE = '/tmp/moderation_submissions.json';

// Проверяем доступность /tmp
try {
  if (!fs.existsSync('/tmp')) {
    fs.mkdirSync('/tmp', { recursive: true });
  }
  // Пробуем записать тестовый файл
  fs.writeFileSync('/tmp/test_write.txt', 'test', 'utf8');
  fs.unlinkSync('/tmp/test_write.txt');
} catch (error) {
  console.warn('⚠️ /tmp not available, using current directory');
  STORAGE_FILE = path.join(process.cwd(), 'moderation_submissions.json');
}

// Инициализация хранилища
function initStorage() {
  try {
    const dir = path.dirname(STORAGE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(STORAGE_FILE)) {
      fs.writeFileSync(STORAGE_FILE, JSON.stringify([]), 'utf8');
      console.log('📁 Created storage file:', STORAGE_FILE);
    }
  } catch (error) {
    console.error('❌ Error initializing storage:', error);
    console.error('Storage file path:', STORAGE_FILE);
  }
}

// Загрузка всех заявок
export function loadSubmissions() {
  try {
    initStorage();
    if (!fs.existsSync(STORAGE_FILE)) {
      console.log('📁 Storage file does not exist, returning empty array');
      return [];
    }
    const data = fs.readFileSync(STORAGE_FILE, 'utf8');
    const submissions = JSON.parse(data || '[]');
    console.log('📂 Loaded submissions from:', STORAGE_FILE, 'Count:', submissions.length);
    return submissions;
  } catch (error) {
    console.error('❌ Error loading submissions:', error);
    console.error('Storage file:', STORAGE_FILE);
    return [];
  }
}

// Сохранение всех заявок
function saveSubmissions(submissions) {
  try {
    initStorage();
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(submissions, null, 2), 'utf8');
    console.log('💾 Saved submissions to:', STORAGE_FILE, 'Count:', submissions.length);
  } catch (error) {
    console.error('❌ Error saving submissions:', error);
    console.error('Storage file:', STORAGE_FILE);
    throw error;
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

