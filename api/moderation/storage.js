// Хранилище для заявок на модерацию
// Использует глобальный объект в памяти + файловое хранилище как резерв
// ВАЖНО: В Vercel Serverless Functions каждый инстанс имеет свою память
// Для продакшена рекомендуется использовать базу данных

import fs from 'fs';
import path from 'path';

// Глобальное хранилище в памяти (работает в рамках одного инстанса)
// ВАЖНО: В Vercel каждый инстанс имеет свою память, поэтому данные не синхронизируются
let globalStorage;
if (typeof global !== 'undefined') {
  if (!global.moderationStorage) {
    global.moderationStorage = { submissions: [] };
  }
  globalStorage = global.moderationStorage;
} else {
  // Fallback для случаев, когда global недоступен
  globalStorage = { submissions: [] };
}

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

// Синхронизация с файлом при старте
function syncFromFile() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf8');
      const fileSubmissions = JSON.parse(data || '[]');
      if (fileSubmissions.length > 0) {
        console.log('📂 Syncing from file:', fileSubmissions.length, 'submissions');
        globalStorage.submissions = fileSubmissions;
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not sync from file:', error.message);
  }
}

// Синхронизация в файл
function syncToFile() {
  try {
    const dir = path.dirname(STORAGE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(globalStorage.submissions, null, 2), 'utf8');
  } catch (error) {
    console.warn('⚠️ Could not sync to file:', error.message);
  }
}

// Инициализация при загрузке модуля
syncFromFile();

// Загрузка всех заявок
export function loadSubmissions() {
  try {
    // Сначала пробуем синхронизировать с файлом
    syncFromFile();
    
    const submissions = globalStorage.submissions || [];
    console.log('📂 Loaded submissions from memory:', submissions.length);
    console.log('📋 Submission IDs:', submissions.map(s => s.id));
    return submissions;
  } catch (error) {
    console.error('❌ Error loading submissions:', error);
    return [];
  }
}

// Сохранение всех заявок
function saveSubmissions(submissions) {
  try {
    globalStorage.submissions = submissions;
    // Пробуем синхронизировать с файлом (но не критично если не получится)
    syncToFile();
    console.log('💾 Saved submissions to memory:', submissions.length);
  } catch (error) {
    console.error('❌ Error saving submissions:', error);
    throw error;
  }
}

// Добавление новой заявки
export function addSubmission(submission) {
  try {
    const submissions = loadSubmissions();
    
    // Проверяем, нет ли уже такой заявки
    const existingIndex = submissions.findIndex(s => s.id === submission.id);
    if (existingIndex !== -1) {
      console.log('⚠️ Submission already exists, updating:', submission.id);
      submissions[existingIndex] = submission;
    } else {
      submissions.push(submission);
    }
    
    saveSubmissions(submissions);
    console.log('💾 Submission added to storage:', {
      id: submission.id,
      title: submission.title,
      status: submission.status,
      totalSubmissions: submissions.length,
      allIds: submissions.map(s => s.id),
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

