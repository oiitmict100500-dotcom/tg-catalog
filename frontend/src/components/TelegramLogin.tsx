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
    
    console.log('🔍 TelegramLogin: Initializing...', {
      botName,
      currentDomain,
      fullUrl: window.location.href,
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
    
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
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
          console.warn('💡 Check BotFather: /setdomain -> tg_catalog_bot ->', currentDomain);
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
        console.log('📤 Sending auth request to:', apiUrl);
        console.log('📤 Request body:', requestBody);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        console.log('📥 Auth response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Неизвестная ошибка' }));
          console.error('❌ Auth error response:', errorData);
          
          // Более понятные сообщения об ошибках
          let errorMessage = errorData.message || 'Ошибка авторизации';
          if (response.status === 404) {
            errorMessage = 'Backend API не найден. Убедитесь, что backend запущен.';
          } else if (response.status === 500) {
            errorMessage = 'Ошибка сервера. Проверьте логи backend.';
          } else if (response.status === 0 || response.status === 503) {
            errorMessage = 'Не удалось подключиться к серверу. Проверьте, что backend запущен.';
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('✅ Auth successful, user:', data.user?.username || data.user?.email);
        
        // Сохраняем токен
        if (data.token) {
          authService.setToken(data.token);
          window.dispatchEvent(new Event('authChange'));
          console.log('✅ Token saved');
        } else {
          console.warn('⚠️ No token in response');
        }

        if (onAuth) {
          onAuth(data.user);
        }
        
        // Перезагружаем страницу для обновления состояния
        console.log('🔄 Reloading page...');
        window.location.reload();
      } catch (error: any) {
        console.error('Ошибка авторизации через Telegram:', error);
        const errorMessage = error.message || 'Ошибка авторизации. Попробуйте еще раз.';
        alert(errorMessage);
      }
    };

    return () => {
      window.onTelegramAuth = undefined;
    };
  }, [botName, onAuth]);

  return (
    <div className="telegram-login-wrapper">
      <div id="telegram-login-container"></div>
    </div>
  );
}

export default TelegramLogin;
