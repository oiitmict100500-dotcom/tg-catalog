import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import authService from '../services/auth.service';
import ThemeToggle from './ThemeToggle';
import TelegramLogin from './TelegramLogin';
import './Header.css';

interface Category {
  id: string;
  slug: string;
  name: string;
  type: string;
}

function Header() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCategories();
    checkAuth();

    // Обработчик события изменения авторизации
    const handleAuthChange = () => {
      console.log('🔄 Auth change event received, checking auth...');
      checkAuth();
    };

    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const loadCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      const data = response.data;
      // Проверяем, что данные - это массив
      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        console.error('❌ Categories API returned non-array:', data);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]); // Устанавливаем пустой массив при ошибке
    }
  };

  const checkAuth = async () => {
    try {
      console.log('🔍 checkAuth: Starting authentication check...');
      
      // Сначала проверяем localStorage для быстрого отображения
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');
      
      console.log('🔍 checkAuth: localStorage check:', {
        hasUser: !!savedUser,
        hasToken: !!savedToken,
        userData: savedUser ? JSON.parse(savedUser) : null,
      });
      
      if (savedUser && savedToken) {
        try {
          const userData = JSON.parse(savedUser);
          // Проверяем, что данные валидные
          if (userData && userData.id) {
            console.log('✅ checkAuth: Valid user found in localStorage, setting user state');
            setUser(userData);
            
            // Проверяем через API для актуальных данных (в фоне, не блокируем UI)
            if (authService.isAuthenticated()) {
              console.log('🔍 checkAuth: Token exists, checking API...');
              try {
                const currentUser = await authService.getCurrentUser();
                if (currentUser) {
                  console.log('✅ checkAuth: API returned user, updating state');
                  setUser(currentUser);
                  authService.setUser(currentUser); // Обновляем localStorage
                } else {
                  // Если API вернул null, но токен есть - возможно токен невалидный
                  // Оставляем пользователя из localStorage, но логируем предупреждение
                  console.warn('⚠️ checkAuth: API не вернул пользователя, используем данные из localStorage');
                  // НЕ очищаем - оставляем пользователя из localStorage
                }
              } catch (apiError: any) {
                // Если ошибка API, но есть данные в localStorage - используем их
                console.warn('⚠️ checkAuth: Ошибка проверки через API, используем данные из localStorage:', apiError?.message || apiError);
                // НЕ очищаем - оставляем пользователя из localStorage
              }
            }
            console.log('✅ checkAuth: User authenticated from localStorage');
            return; // Выходим, если пользователь найден
          } else {
            console.warn('⚠️ checkAuth: Invalid user data in localStorage');
          }
        } catch (e) {
          console.error('❌ checkAuth: Error parsing saved user:', e);
          // Очищаем поврежденные данные
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }

      // Если нет сохраненных данных, проверяем через API
      console.log('🔍 checkAuth: No valid localStorage data, checking API...');
      if (authService.isAuthenticated()) {
        try {
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            console.log('✅ checkAuth: API returned user');
            setUser(currentUser);
            authService.setUser(currentUser);
          } else {
            // Если API вернул null, очищаем состояние
            console.warn('⚠️ checkAuth: API returned null, clearing auth');
            authService.logout();
            setUser(null);
          }
        } catch (apiError: any) {
          console.error('❌ checkAuth: Error getting current user from API:', apiError?.message || apiError);
          // Не очищаем сразу - возможно временная ошибка сети
          // authService.logout();
          // setUser(null);
        }
      } else {
        console.log('🔍 checkAuth: No token found, user is not authenticated');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ checkAuth: Unexpected error:', error);
      // Не очищаем при неожиданной ошибке
      // authService.logout();
      // setUser(null);
    }
  };

  const getCategoryIcon = (type: string) => {
    const icons: Record<string, string> = {
      channel: '📢',
      group: '👥',
      bot: '🤖',
      sticker: '😄',
      emoji: '🎭',
    };
    return icons[type] || '📌';
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setIsUserMenuOpen(false);
    // Очищаем localStorage полностью
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Перезагружаем страницу для полного сброса состояния
    window.location.reload();
  };

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">
          <span className="logo-icon">📚</span>
          <span className="logo-text">TG Catalog</span>
        </Link>
        
        <nav className="header-nav">
          {/* Выпадающее меню "Ресурсы" */}
          <div 
            className="dropdown"
            onMouseEnter={() => setIsResourcesOpen(true)}
            onMouseLeave={() => setIsResourcesOpen(false)}
          >
            <button className="nav-link dropdown-toggle">
              Ресурсы
            </button>
            {isResourcesOpen && (
              <div className="dropdown-menu">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/?category=${category.id}`}
                    className="dropdown-item"
                    onClick={() => setIsResourcesOpen(false)}
                  >
                    <span className="category-icon">{getCategoryIcon(category.type)}</span>
                    <span>{category.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Кнопка "Добавить ресурс" по центру */}
          <Link to="/submit" className="nav-link nav-link-primary">
            ➕ Добавить ресурс
          </Link>

          {/* Кнопка Telegram */}
          <a 
            href="https://t.me/tgcatalog_bot" 
            target="_blank" 
            rel="noopener noreferrer"
            className="nav-link"
          >
            📱 Telegram-бот
          </a>

          {/* Авторизация */}
          {user ? (
            <div 
              className="user-menu"
              ref={userMenuRef}
            >
              <button 
                className="nav-link user-avatar"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username || user.email} />
                ) : (
                  <span>👤</span>
                )}
              </button>
              {isUserMenuOpen && (
                <div className="dropdown-menu user-dropdown">
                  <Link to="/profile" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>Профиль</Link>
                  <Link to="/my-resources" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>Мои ресурсы</Link>
                  {user?.role === 'admin' && (
                    <>
                      <div className="dropdown-divider"></div>
                      <Link to="/admin" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                        ⚙️ Админ панель
                      </Link>
                    </>
                  )}
                  <div className="dropdown-divider"></div>
                  <button onClick={() => { handleLogout(); setIsUserMenuOpen(false); }} className="dropdown-item">Выйти</button>
                </div>
              )}
            </div>
          ) : (
            <div className="telegram-auth-wrapper">
              <TelegramLogin 
                botName="tg_cataIog_bot" 
                onAuth={(user) => {
                  setUser(user);
                }}
              />
            </div>
          )}
        </nav>

        {/* Переключатель темы в правом верхнем углу */}
        <ThemeToggle />
      </div>
    </header>
  );
}

export default Header;
