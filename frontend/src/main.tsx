import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import { API_BASE_URL } from './config/api.config'
import App from './App'
import './index.css'

// Настраиваем axios для использования правильного baseURL
if (API_BASE_URL) {
  axios.defaults.baseURL = API_BASE_URL;
  console.log('🔧 API Base URL configured:', API_BASE_URL);
} else {
  console.log('🔧 Using relative API paths (for local development)');
}

// Устанавливаем тему по умолчанию
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)


