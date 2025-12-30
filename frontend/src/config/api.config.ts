// API Configuration
// В production используйте переменную окружения VITE_API_URL
// Например: https://your-backend.railway.app или https://api.yourdomain.com
// 
// Настройка в Vercel:
// Settings → Environment Variables → Add:
// Name: VITE_API_URL
// Value: https://ваш-backend-url.com (БЕЗ слеша в конце!)

const getApiUrl = () => {
  // В production используем переменную окружения
  if (import.meta.env.VITE_API_URL) {
    const url = import.meta.env.VITE_API_URL.trim();
    
    // Проверяем, что это не URL frontend (должен быть URL backend)
    if (url.includes('vercel.app') && !url.includes('railway') && !url.includes('render') && !url.includes('heroku') && !url.includes('api.')) {
      console.error('❌ ОШИБКА: VITE_API_URL указывает на frontend домен!');
      console.error('📖 VITE_API_URL должен быть URL вашего BACKEND сервера, а не frontend!');
      console.error('📖 Пример правильного значения: https://tg-catalog-backend.railway.app');
      console.error('📖 Текущее значение:', url);
      console.error('📖 Инструкция: см. файл БЫСТРАЯ_НАСТРОЙКА.md');
      // Не используем неправильный URL, возвращаем пустую строку
      return '';
    }
    
    // Проверяем, что URL начинается с http:// или https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      console.warn('⚠️ VITE_API_URL должен начинаться с http:// или https://');
      console.warn('📖 Текущее значение:', url);
      // Добавляем https:// если не указан протокол
      return `https://${url}`;
    }
    
    // Убираем слеш в конце если есть
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }
  
  // В development используем относительные пути (через proxy в vite.config.ts)
  if (import.meta.env.DEV) {
    return '';
  }
  
  // В production без VITE_API_URL используем относительные пути
  // Это нормально для Vercel Serverless Functions (API в директории /api)
  // Предупреждение показываем только если это не Vercel домен
  if (import.meta.env.PROD && !window.location.hostname.includes('vercel.app')) {
    console.warn('⚠️ VITE_API_URL не установлен! Если backend на другом домене, установите переменную окружения VITE_API_URL');
  }
  
  // По умолчанию используем относительные пути (работает для Vercel Serverless Functions)
  return '';
};

export const API_BASE_URL = getApiUrl();

// Функция для создания полного URL к API
export const getApiEndpoint = (endpoint: string): string => {
  // Убираем начальный слеш если есть
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  if (API_BASE_URL) {
    // Если есть базовый URL, добавляем endpoint
    return `${API_BASE_URL}/${cleanEndpoint}`;
  }
  
  // Иначе используем относительный путь
  return `/${cleanEndpoint}`;
};

// Создаем axios instance с правильным baseURL
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: API_BASE_URL || '',
});

