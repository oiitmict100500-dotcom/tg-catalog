import { useEffect } from 'react';
import authService from '../services/auth.service';
import { getApiEndpoint } from '../config/api.config';
import './TelegramLogin.css';

declare global {
  interface Window {
    onTelegramAuth?: (user: any) => void;
  }
}

interface TelegramLoginProps {
  onAuth?: (user: any) => void;
  botName: string;
}

function TelegramLogin({ onAuth, botName }: TelegramLoginProps) {
  useEffect(() => {
    // Получаем текущий домен для проверки
    const currentDomain = window.location.hostname;
    const apiBaseUrl = import.meta.env.VITE_API_URL;
    
    // Предупреждение в production если VITE_API_URL не установлен
    if (import.meta.env.PROD && !apiBaseUrl) {
      console.error('⚠️ ВНИМАНИЕ: VITE_API_URL не установлен!');
      console.error('📖 Установите переменную окружения VITE_API_URL в Vercel:');
      console.error('   Settings → Environment Variables → Add');
      console.error('   Name: VITE_API_URL');
      console.error('   Value: https://ваш-backend-url.com');
      console.error('📖 Подробная инструкция: НАСТРОЙКА_VERCEL_PRODUCTION.md');
    }
    
    console.log('🔍 TelegramLogin: Initializing...', {
      botName,
      currentDomain,
      fullUrl: window.location.href,
      apiBaseUrl: apiBaseUrl || 'не установлен (используются относительные пути)',
      isProduction: import.meta.env.PROD,
    });
    
    // Загружаем скрипт Telegram Login Widget
    const container = document.getElementById('telegram-login-container');
    if (!container) {
      console.error('❌ Telegram login container not found!');
      return;
    }

    console.log('✅ Container found, clearing and adding script...');

    // Очищаем контейнер перед добавлением скрипта
    container.innerHTML = '';
    
    // Добавляем уникальный параметр для предотвращения кэширования
    const timestamp = Date.now();
    
    const script = document.createElement('script');
    script.src = `https://telegram.org/js/telegram-widget.js?22&t=${timestamp}`;
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;
    
    script.onerror = (error) => {
      console.error('❌ Failed to load Telegram Login Widget script:', error);
      console.error('Check if domain is set in BotFather:', currentDomain);
    };
    
    script.onload = () => {
      console.log('✅ Telegram Login Widget script loaded successfully');
      console.log('📋 Configuration:', {
        botName,
        currentDomain,
        fullUrl: window.location.href,
      });
      
      // Проверяем через небольшую задержку, появился ли виджет
      setTimeout(() => {
        const widget = container.querySelector('iframe');
        const allElements = container.querySelectorAll('*');
        console.log('🔍 Container contents:', {
          innerHTML: container.innerHTML.substring(0, 200),
          childCount: container.children.length,
          allElements: allElements.length,
          hasIframe: !!widget,
        });
        
        if (widget) {
          console.log('✅ Widget iframe found in container');
          console.log('📏 Iframe dimensions:', {
            width: widget.offsetWidth,
            height: widget.offsetHeight,
            display: window.getComputedStyle(widget).display,
          });
        } else {
          console.warn('⚠️ Widget iframe not found. This might indicate "Bot domain invalid" error.');
          console.warn('💡 Check BotFather: /setdomain -> tg_cataIog_bot ->', currentDomain);
          console.warn('💡 Make sure to set domain WITHOUT https:// and WITHOUT trailing slash');
          console.warn('💡 Current domain:', currentDomain);
          console.warn('💡 Set this exact domain in BotFather:', currentDomain);
          console.warn('💡 Container HTML:', container.innerHTML);
        }
      }, 3000);
    };
    
    container.appendChild(script);
    
    console.log('📤 Script appended to container');

    // Обработчик авторизации Telegram
    window.onTelegramAuth = async (telegramUser: any) => {
      try {
        console.log('Telegram auth callback received:', {
          id: telegramUser.id,
          username: telegramUser.username,
          hasHash: !!telegramUser.hash,
        });

        // Формируем тело запроса, исключая пустые поля
        const requestBody: any = {
          id: telegramUser.id,
          first_name: telegramUser.first_name,
          auth_date: telegramUser.auth_date,
          hash: telegramUser.hash,
        };

        // Добавляем опциональные поля только если они не пустые
        if (telegramUser.last_name) {
          requestBody.last_name = telegramUser.last_name;
        }
        if (telegramUser.username) {
          requestBody.username = telegramUser.username;
        }
        if (telegramUser.photo_url) {
          requestBody.photo_url = telegramUser.photo_url;
        }

        const apiUrl = getApiEndpoint('api/auth/telegram');
        const fullUrl = apiUrl.startsWith('http') ? apiUrl : window.location.origin + apiUrl;
        console.log('📤 Sending auth request to:', apiUrl);
        console.log('📤 Full URL:', fullUrl);
        console.log('📤 Request body:', requestBody);
        console.log('📤 API Base URL:', import.meta.env.VITE_API_URL || 'не установлен (используются относительные пути)');
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          credentials: 'include', // Важно для CORS с credentials
        });

        console.log('📥 Auth response status:', response.status);
        console.log('📥 Auth response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch (e) {
            errorData = { message: 'Неизвестная ошибка' };
          }
          
          console.error('❌ Auth error response:', errorData);
          console.error('❌ Response status:', response.status);
          console.error('❌ Response statusText:', response.statusText);
          
          // Более понятные сообщения об ошибках
          let errorMessage = errorData.message || 'Ошибка авторизации';
          if (response.status === 401) {
            errorMessage = errorData.message || 'Неверные данные авторизации Telegram. Проверьте настройки домена в BotFather.';
          } else if (response.status === 404) {
            const apiBaseUrl = import.meta.env.VITE_API_URL || 'не установлен';
            errorMessage = `Backend API не найден (404). Проверьте:\n` +
              `1. Backend развернут и доступен\n` +
              `2. VITE_API_URL установлен в Vercel: ${apiBaseUrl}\n` +
              `3. URL backend правильный: ${fullUrl}\n` +
              `📖 См. инструкцию: НАСТРОЙКА_VERCEL_PRODUCTION.md`;
          } else if (response.status === 500) {
            errorMessage = errorData.message || 'Ошибка сервера. Проверьте логи backend и настройки TELEGRAM_BOT_TOKEN.';
          } else if (response.status === 0 || response.status === 503) {
            const apiBaseUrl = import.meta.env.VITE_API_URL || 'не установлен';
            errorMessage = `Не удалось подключиться к серверу. Проверьте:\n` +
              `1. Backend запущен и доступен\n` +
              `2. VITE_API_URL установлен: ${apiBaseUrl}\n` +
              `3. CORS настроен правильно\n` +
              `4. URL backend: ${fullUrl}\n` +
              `📖 См. инструкцию: НАСТРОЙКА_VERCEL_PRODUCTION.md`;
          } else if (response.status === 400) {
            errorMessage = errorData.message || 'Неверный запрос. Проверьте данные авторизации.';
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('✅ Auth successful, response data:', data);
        console.log('✅ User:', data.user?.username || data.user?.email || data.user?.id);
        
        // Сохраняем токен
        if (data.token) {
          authService.setToken(data.token);
          console.log('✅ Token saved to localStorage');
        } else {
          console.warn('⚠️ No token in response');
          throw new Error('Токен не получен от сервера');
        }

        // Сохраняем пользователя
        if (data.user) {
          authService.setUser(data.user);
          console.log('✅ User saved to localStorage');
        }

        // Вызываем callback если есть
        if (onAuth) {
          onAuth(data.user);
        }

        // Отправляем событие об изменении авторизации
        window.dispatchEvent(new Event('authChange'));
        
        // Перезагружаем страницу для обновления состояния
        console.log('🔄 Reloading page...');
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } catch (error: any) {
        console.error('❌ Ошибка авторизации через Telegram:', error);
        
        let errorMessage = 'Ошибка авторизации. Попробуйте еще раз.';
        
        // Обработка сетевых ошибок
        if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
          const apiBaseUrl = import.meta.env.VITE_API_URL || 'не установлен';
          errorMessage = `Не удалось подключиться к backend серверу.\n\n` +
            `Возможные причины:\n` +
            `1. Backend не развернут или недоступен\n` +
            `2. VITE_API_URL не установлен в Vercel: ${apiBaseUrl}\n` +
            `3. Неправильный URL backend\n\n` +
            `📖 Инструкция по настройке: НАСТРОЙКА_VERCEL_PRODUCTION.md\n\n` +
            `Проверьте консоль браузера (F12) для подробностей.`;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        alert(errorMessage);
      }
    };

    return () => {
      // Очищаем обработчик при размонтировании
      window.onTelegramAuth = undefined;
      // Очищаем контейнер
      const container = document.getElementById('telegram-login-container');
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [botName, onAuth]);

  return (
    <div className="telegram-login-wrapper">
      <div id="telegram-login-container"></div>
    </div>
  );
}

export default TelegramLogin;
