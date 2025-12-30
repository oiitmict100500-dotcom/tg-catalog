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
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const checkAuth = async () => {
    try {
      if (authService.isAuthenticated()) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      authService.logout();
      setUser(null);
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
    window.location.href = '/';
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
                  <div className="dropdown-divider"></div>
                  <button onClick={() => { handleLogout(); setIsUserMenuOpen(false); }} className="dropdown-item">Выйти</button>
                </div>
              )}
            </div>
          ) : (
            <div className="telegram-auth-wrapper">
              <TelegramLogin 
                botName="tg_catalog_bot" 
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
