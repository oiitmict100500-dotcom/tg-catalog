// Общее хранилище для всех функций модерации
// Использует глобальный объект Node.js для хранения данных в памяти
// ВАЖНО: Работает только в рамках одного инстанса Vercel Serverless Function

// Инициализируем глобальное хранилище один раз
if (typeof global !== 'undefined') {
  if (!global.moderationStorage) {
    global.moderationStorage = {
      submissions: [],
      initialized: true,
      lastUpdate: Date.now(),
    };
    console.log('🔧 Initialized global moderation storage');
  }
}

// Получаем ссылку на хранилище
function getStorage() {
  if (typeof global !== 'undefined' && global.moderationStorage) {
    return global.moderationStorage;
  }
  // Fallback для случаев, когда global недоступен
  return { submissions: [], initialized: false };
}

// Загрузка всех заявок
export function loadSubmissions() {
  try {
    const storage = getStorage();
    const submissions = storage.submissions || [];
    console.log('📂 loadSubmissions:', {
      count: submissions.length,
      hasStorage: !!storage,
      initialized: storage.initialized,
      lastUpdate: storage.lastUpdate,
      ids: submissions.map(s => s.id),
    });
    return submissions;
  } catch (error) {
    console.error('❌ Error in loadSubmissions:', error);
    return [];
  }
}

// Сохранение всех заявок
function saveSubmissions(submissions) {
  try {
    const storage = getStorage();
    storage.submissions = submissions;
    storage.lastUpdate = Date.now();
    console.log('💾 saveSubmissions:', {
      count: submissions.length,
      ids: submissions.map(s => s.id),
    });
  } catch (error) {
    console.error('❌ Error in saveSubmissions:', error);
    throw error;
  }
}

// Добавление новой заявки
export function addSubmission(submission) {
  try {
    console.log('➕ addSubmission called:', {
      id: submission.id,
      title: submission.title,
    });
    
    const submissions = loadSubmissions();
    
    // Проверяем, нет ли уже такой заявки
    const existingIndex = submissions.findIndex(s => s.id === submission.id);
    if (existingIndex !== -1) {
      console.log('⚠️ Submission already exists, updating:', submission.id);
      submissions[existingIndex] = submission;
    } else {
      console.log('✅ Adding new submission:', submission.id);
      submissions.push(submission);
    }
    
    saveSubmissions(submissions);
    
    // Проверяем, что заявка действительно сохранилась
    const verify = loadSubmissions();
    const found = verify.find(s => s.id === submission.id);
    if (!found) {
      console.error('❌ CRITICAL: Submission was not saved!', submission.id);
      throw new Error('Submission was not saved to storage');
    }
    
    console.log('✅ Submission successfully saved and verified:', {
      id: submission.id,
      totalSubmissions: verify.length,
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
  const pending = submissions.filter(s => s.status === 'pending');
  console.log('🔍 getPendingSubmissions:', {
    total: submissions.length,
    pending: pending.length,
    pendingIds: pending.map(s => s.id),
  });
  return pending;
}

// Получение информации о хранилище (для диагностики)
export function getStorageInfo() {
  const storage = getStorage();
  return {
    hasStorage: !!storage,
    initialized: storage.initialized || false,
    submissionCount: (storage.submissions || []).length,
    lastUpdate: storage.lastUpdate || null,
    hasGlobal: typeof global !== 'undefined',
    hasGlobalStorage: typeof global !== 'undefined' && !!global.moderationStorage,
  };
}

