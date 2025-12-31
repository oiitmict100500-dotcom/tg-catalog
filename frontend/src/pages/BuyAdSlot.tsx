import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import authService from '../services/auth.service';
import './BuyAdSlot.css';

interface Category {
  id: string;
  slug: string;
  name: string;
  type: string;
}

const PRICES: Record<string, number> = {
  channel: 500, // рублей за день
  group: 400,
  bot: 300,
  sticker: 250,
  emoji: 200,
};

const DURATION_OPTIONS = [
  { days: 1, label: '1 день', discount: 0 },
  { days: 3, label: '3 дня', discount: 5 },
  { days: 7, label: '7 дней', discount: 10 },
  { days: 14, label: '14 дней', discount: 15 },
  { days: 30, label: '30 дней', discount: 20 },
];

interface UserResource {
  id: string;
  title: string;
  categoryId: string;
  isPaid: boolean;
  paidUntil?: string;
}

function BuyAdSlot() {
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [userResources, setUserResources] = useState<UserResource[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');
  const [loadingResources, setLoadingResources] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      // Показываем сообщение о необходимости авторизации
      alert('Для покупки рекламного слота необходимо авторизоваться через Telegram');
      navigate('/');
      return;
    }

    loadCategory();
    loadUserResources();
  }, [categoryId]);

  const loadCategory = async () => {
    try {
      const response = await axios.get(`/api/categories`);
      const categories = response.data || [];
      const cat = categories.find((c: Category) => c.id === categoryId || c.type === categoryId);
      setCategory(cat || null);
    } catch (error: any) {
      console.error('Error loading category:', error);
      setError('Ошибка загрузки категории');
    }
  };

  const loadUserResources = async () => {
    setLoadingResources(true);
    try {
      const token = authService.getToken();
      // Используем альтернативный endpoint без вложенных путей для совместимости с Vercel
      const response = await axios.get('/api/users-me-resources', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Фильтруем ресурсы по категории и только неоплаченные или с истекшим сроком
      const resources = (response.data || []).filter((r: UserResource) => {
        if (r.categoryId !== categoryId) return false;
        if (!r.isPaid) return true;
        if (r.paidUntil) {
          const paidUntil = new Date(r.paidUntil);
          return paidUntil <= new Date();
        }
        return false;
      });
      
      setUserResources(resources);
      
      // Автоматически выбираем первый ресурс, если есть
      if (resources.length > 0 && !selectedResourceId) {
        setSelectedResourceId(resources[0].id);
      }
    } catch (error: any) {
      console.error('Error loading user resources:', error);
      // Не показываем ошибку, просто оставляем пустой список
    } finally {
      setLoadingResources(false);
    }
  };

  const handlePurchase = async () => {
    if (!acceptedRules) {
      setError('Необходимо принять правила публикации');
      return;
    }

    if (!category) {
      setError('Категория не найдена');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // TODO: Интеграция с платежной системой (ЮKassa, Stripe и т.д.)
      // Пока показываем информацию о необходимости создать ресурс
      if (!selectedResourceId) {
        setError('Выберите ресурс для размещения рекламы');
        return;
      }

      const response = await axios.post('/api/resources/purchase-ad-slot', {
        categoryId: category.id,
        durationDays: selectedDuration,
        resourceId: selectedResourceId,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.success) {
        alert('Рекламный слот успешно куплен! Ваш ресурс будет размещен в платном разделе.');
        navigate('/my-resources');
      } else {
        // Если нужно сначала создать ресурс
        if (response.data.requiresResource || response.data.message.includes('создайте ресурс')) {
          const proceed = window.confirm(
            response.data.message + '\n\nПерейти к созданию ресурса?'
          );
          if (proceed) {
            navigate('/submit?category=' + category.id);
          }
        } else {
          setError(response.data.message || 'Не удалось купить рекламный слот');
        }
      }
    } catch (error: any) {
      console.error('Error purchasing ad slot:', error);
      setError(error.response?.data?.message || 'Ошибка при покупке рекламного слота');
    } finally {
      setLoading(false);
    }
  };

  if (!category) {
    return (
      <div className="buy-ad-slot">
        <div className="container">
          <div className="loading">Загрузка...</div>
        </div>
      </div>
    );
  }

  const basePrice = PRICES[category.type] || 300;
  const duration = DURATION_OPTIONS.find(d => d.days === selectedDuration) || DURATION_OPTIONS[2];
  const discount = (basePrice * selectedDuration * duration.discount) / 100;
  const totalPrice = basePrice * selectedDuration - discount;

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

  return (
    <div className="buy-ad-slot">
      <div className="container">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Назад
        </button>

        <div className="buy-ad-header">
          <h1>
            <span className="category-icon-large">{getCategoryIcon(category.type)}</span>
            Покупка рекламного слота
          </h1>
          <p className="subtitle">Категория: {category.name}</p>
        </div>

        <div className="pricing-section">
          <div className="price-card">
            <div className="price-info">
              <span className="price-label">Цена за день</span>
              <span className="base-price">{basePrice} ₽</span>
            </div>
            <div className="price-breakdown">
              <p>Выберите срок размещения:</p>
              <div className="duration-options">
                {DURATION_OPTIONS.map((option) => (
                  <button
                    key={option.days}
                    className={`duration-btn ${selectedDuration === option.days ? 'active' : ''}`}
                    onClick={() => setSelectedDuration(option.days)}
                  >
                    <span className="duration-label">{option.label}</span>
                    {option.discount > 0 && (
                      <span className="discount-badge">-{option.discount}%</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="total-section">
            <div className="total-row">
              <span>Цена за {selectedDuration} {selectedDuration === 1 ? 'день' : selectedDuration < 5 ? 'дня' : 'дней'}:</span>
              <span className="total-amount">{totalPrice} ₽</span>
            </div>
            {discount > 0 && (
              <div className="total-row discount-row">
                <span>Скидка ({duration.discount}%):</span>
                <span className="discount-amount">-{discount} ₽</span>
              </div>
            )}
            <div className="total-row final-total">
              <span>Итого к оплате:</span>
              <span className="final-price">{totalPrice} ₽</span>
            </div>
          </div>
        </div>

        <div className="rules-section">
          <h2>⚠️ Правила публикации рекламы</h2>
          <div className="rules-list">
            <div className="rule-item">
              <span className="rule-icon">🚫</span>
              <span>Запрещен контент сексуального характера, порнографические материалы и эротика</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">🚫</span>
              <span>Запрещена пропаганда наркотических веществ, их продажа и распространение</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">🚫</span>
              <span>Запрещен контент, нарушающий авторские права и интеллектуальную собственность</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">🚫</span>
              <span>Запрещены мошеннические схемы, финансовые пирамиды и обман пользователей</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">🚫</span>
              <span>Запрещена пропаганда насилия, экстремизма и терроризма</span>
            </div>
          </div>
          <div className="warning-box">
            <p>
              <strong>Внимание!</strong> За нарушение правил публикации ваш ресурс будет немедленно удален 
              из рекламных слотов <strong>без возврата денежных средств</strong>. Администрация оставляет 
              за собой право на модерацию и удаление любого контента без объяснения причин.
            </p>
          </div>
          <label className="rules-checkbox">
            <input
              type="checkbox"
              checked={acceptedRules}
              onChange={(e) => setAcceptedRules(e.target.checked)}
            />
            <span>Я ознакомился с правилами публикации и обязуюсь их соблюдать</span>
          </label>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="actions">
          <button
            className="cancel-btn"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Отмена
          </button>
          <button
            className="purchase-btn"
            onClick={handlePurchase}
            disabled={loading || !acceptedRules || !selectedResourceId || userResources.length === 0}
          >
            {loading ? 'Обработка...' : `Купить за ${totalPrice} ₽`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BuyAdSlot;
