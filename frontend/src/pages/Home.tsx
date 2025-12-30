import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import authService from '../services/auth.service';
import './Home.css';

interface Resource {
  id: string;
  title: string;
  description: string;
  telegramLink: string;
  coverImage?: string;
  viewCount: number;
  rating: number;
  category: {
    name: string;
    type: string;
  };
  isPaid?: boolean;
}

function Home() {
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [paidResources, setPaidResources] = useState<Record<string, Resource[]>>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadCategories();
    loadPaidResources();
  }, []);

  useEffect(() => {
    loadResources();
  }, [selectedCategory, page]);

  // Загружаем ресурсы при изменении категории из URL
  useEffect(() => {
    const categoryParam = new URLSearchParams(window.location.search).get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, []);

  const loadCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data || []);
      setError('');
    } catch (error: any) {
      console.error('Error loading categories:', error);
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        setError('Backend не запущен! Запустите Backend на порту 3000.');
      } else {
        setError('Ошибка загрузки категорий: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const loadPaidResources = async () => {
    try {
      const response = await axios.get('/api/resources/paid');
      // Группируем по категориям
      const grouped: Record<string, Resource[]> = {};
      response.data.forEach((resource: Resource) => {
        const categoryType = resource.category?.type || 'other';
        if (!grouped[categoryType]) {
          grouped[categoryType] = [];
        }
        if (grouped[categoryType].length < 3) {
          grouped[categoryType].push(resource);
        }
      });
      setPaidResources(grouped);
    } catch (error) {
      console.error('Error loading paid resources:', error);
    }
  };

  const loadResources = async () => {
    if (!selectedCategory) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const params: any = { page, limit: 20 };
      const category = categories.find(c => c.id === selectedCategory);
      if (category) {
        params.category = category.id;
      }
      const response = await axios.get('/api/resources', { params });
      setResources(response.data?.data || []);
      setTotalPages(response.data?.totalPages || 1);
      setError('');
    } catch (error: any) {
      console.error('Error loading resources:', error);
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        setError('Backend не запущен! Запустите Backend на порту 3000.');
      } else {
        setError('Ошибка загрузки ресурсов: ' + (error.response?.data?.message || error.message));
      }
      setResources([]);
    } finally {
      setLoading(false);
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

  const handleAddResource = () => {
      if (!authService.isAuthenticated()) {
        alert('Для добавления ресурса необходимо авторизоваться через Telegram');
      } else {
        navigate('/submit');
      }
  };

  const largeCategoryTypes = ['channel', 'group'];
  const smallCategoryTypes = ['bot', 'sticker', 'emoji'];

  const getCategoryBadge = (type: string) => {
    const badges: Record<string, string> = {
      channel: '⭐ Премиум каналы',
      group: '🔥 Топ группы',
      bot: '🤖 Популярные боты',
      sticker: '✨ Новые стикеры',
      emoji: '🎨 Свежие эмодзи',
    };
    return badges[type] || '💎 Платное размещение';
  };

  const renderPaidSection = (categoryType: string) => {
    const category = categories.find(c => c.type === categoryType);
    if (!category) return null;
    
    const paid = paidResources[categoryType] || [];
    const emptySlots = Math.max(0, 3 - paid.length);

    return (
      <div key={categoryType} className={`paid-section paid-section-${categoryType}`}>
        <div className="paid-section-header">
          <h2>
            <span className="category-icon-large">{getCategoryIcon(categoryType)}</span>
            {category.name}
            <span className="paid-section-subtitle"> - Рекомендуемые</span>
          </h2>
          <Link
            to={`/buy-ad/${category.id}`}
            className={`paid-badge paid-badge-${categoryType} badge-link`}
            onClick={(e) => e.stopPropagation()}
          >
            {getCategoryBadge(categoryType)}
          </Link>
        </div>
        <div className="paid-resources-grid">
          {/* Показываем платные ресурсы */}
          {paid.map((resource) => (
            <Link
              key={resource.id}
              to={`/resource/${resource.id}`}
              className="paid-resource-card"
            >
              {resource.coverImage && (
                <div className="paid-resource-cover">
                  <img src={resource.coverImage} alt={resource.title} />
                </div>
              )}
              <div className="paid-resource-content">
                <h3>{resource.title}</h3>
                <p>{resource.description?.substring(0, 80)}...</p>
                <div className="paid-resource-link">🔗 Открыть</div>
              </div>
            </Link>
          ))}
          {/* Показываем пустые слоты */}
          {Array.from({ length: emptySlots }).map((_, index) => (
            <Link
              key={`empty-${index}`}
              to={`/buy-ad/${category.id}`}
              className="paid-resource-card empty-slot clickable-slot"
            >
              <div className="paid-resource-cover empty-cover">
                <div className="empty-placeholder">{getCategoryIcon(categoryType)}</div>
              </div>
              <div className="paid-resource-content">
                <h3 className="empty-title">Свободное место</h3>
                <p className="empty-text">Купить рекламный слот</p>
                <div className="paid-resource-link empty-link">💎 Разместить</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="home">
      {/* Платные размещения - Каналы и Группы (рядом) */}
      <div className="paid-sections-row paid-sections-row-large">
        {largeCategoryTypes.map(renderPaidSection)}
      </div>

      {/* Платные размещения - Боты, Стикерпаки, Эмодзипаки (рядом) */}
      <div className="paid-sections-row paid-sections-row-small">
        {smallCategoryTypes.map(renderPaidSection)}
      </div>

      {/* Большая кнопка добавления ресурса */}
      <div className="add-resource-section">
        <button className="add-resource-btn" onClick={handleAddResource}>
          <span className="add-icon">➕</span>
          <span className="add-text">Добавить свой ресурс</span>
        </button>
      </div>

      {/* Категории */}
      <div className="categories-section">
        <h2 className="section-title">Категории</h2>
        <div className="categories-grid">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/?category=${category.id}`}
              className={`category-card ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="category-card-icon">{getCategoryIcon(category.type)}</span>
              <span className="category-card-name">{category.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Ресурсы - показываем только при выборе категории */}
      {selectedCategory ? (
        <div className="resources-section">
          <h2 className="section-title">
            {categories.find(c => c.id === selectedCategory)?.name || 'Ресурсы'}
          </h2>

          {error ? (
            <div className="error-state">
              <h2>Ошибка подключения</h2>
              <p>{error}</p>
            </div>
          ) : loading ? (
            <div className="loading">Загрузка...</div>
          ) : resources.length === 0 ? (
            <div className="empty-state">
              <h2>Пока нет ресурсов</h2>
              <p>Будьте первым, кто добавит ресурс в эту категорию!</p>
            </div>
          ) : (
            <>
              <div className="resources-grid">
                {resources.map((resource) => (
                  <Link
                    key={resource.id}
                    to={`/resource/${resource.id}`}
                    className="resource-card"
                  >
                    {resource.coverImage && (
                      <div className="resource-cover">
                        <img src={resource.coverImage} alt={resource.title} />
                      </div>
                    )}
                    <div className="resource-content">
                      <div className="resource-header">
                        <span className="resource-category">
                          {getCategoryIcon(resource.category?.type || '')} {resource.category?.name}
                        </span>
                      </div>
                      <h3>{resource.title}</h3>
                      <p>{resource.description?.substring(0, 100)}...</p>
                      <div className="resource-stats">
                        <span>👁️ {resource.viewCount}</span>
                        {resource.rating > 0 && (
                          <span>⭐ {resource.rating.toFixed(1)}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Назад
                  </button>
                  <span>Страница {page} из {totalPages}</span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Вперед
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="categories-section">
          <h2 className="section-title">Выберите категорию для просмотра ресурсов</h2>
        </div>
      )}
    </div>
  );
}

export default Home;
