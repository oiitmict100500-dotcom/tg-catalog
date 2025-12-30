import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import authService from '../services/auth.service';
import './SubmitResource.css';

function SubmitResource() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    telegramLink: '',
    categoryId: '',
    coverImage: '',
  });
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);

  useEffect(() => {
    // Проверяем авторизацию
    if (!authService.isAuthenticated()) {
      alert('Для добавления ресурса необходимо авторизоваться через Telegram');
      navigate('/');
      return;
    }
    loadCategories();
  }, [navigate]);

  const loadCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleParseLink = async () => {
    if (!formData.telegramLink) {
      alert('Введите ссылку на ресурс');
      return;
    }

    setParsing(true);
    try {
      const response = await axios.post('/api/telegram/parse', {
        url: formData.telegramLink,
      });
      const data = response.data;
      setFormData({
        ...formData,
        title: data.title || formData.title,
        description: data.description || formData.description,
      });
      alert('Информация о ресурсе загружена!');
    } catch (error) {
      console.error('Error parsing link:', error);
      alert('Не удалось загрузить информацию о ресурсе. Заполните вручную.');
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('/api/resources/submit', {
        ...formData,
        source: 'web',
      });

      alert('Заявка отправлена на модерацию! Вы получите уведомление после проверки.');
      navigate('/');
    } catch (error: any) {
      console.error('Error submitting resource:', error);
      alert(error.response?.data?.message || 'Ошибка при отправке заявки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="submit-resource">
      <h1>Добавить ресурс в каталог</h1>
      <p className="subtitle">
        Заполните форму ниже или используйте{' '}
        <a href="https://t.me/tgcatalog_bot" target="_blank" rel="noopener noreferrer">
          Telegram-бота
        </a>{' '}
        для быстрого добавления
      </p>

      <form onSubmit={handleSubmit} className="submit-form">
        <div className="form-group">
          <label>Ссылка на Telegram-ресурс *</label>
          <div className="link-input-group">
            <input
              type="url"
              value={formData.telegramLink}
              onChange={(e) => setFormData({ ...formData, telegramLink: e.target.value })}
              placeholder="https://t.me/channelname"
              required
            />
            <button
              type="button"
              onClick={handleParseLink}
              disabled={parsing}
              className="btn-parse"
            >
              {parsing ? 'Загрузка...' : 'Автозаполнение'}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Категория *</label>
          <select
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            required
          >
            <option value="">Выберите категорию</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Название *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Название ресурса"
            required
          />
        </div>

        <div className="form-group">
          <label>Описание</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Краткое описание ресурса"
            rows={5}
          />
        </div>

        <div className="form-group">
          <label>Обложка (URL)</label>
          <input
            type="url"
            value={formData.coverImage}
            onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? 'Отправка...' : 'Отправить на модерацию'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SubmitResource;


