// API Configuration
// В production используйте переменную окружения VITE_API_URL
// Например: https://your-backend.herokuapp.com или https://api.yourdomain.com

const getApiUrl = () => {
  // В production используем переменную окружения
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // По умолчанию используем относительные пути (API на том же домене Vercel)
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

