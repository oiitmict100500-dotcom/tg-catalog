import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import authService from '../services/auth.service';
import './SubmitResource.css';

interface Category {
  id: string;
  slug: string;
  name: string;
  type: string;
  subcategories?: Array<{ id: string; name: string; slug: string }>;
}

function SubmitResource() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    telegramLink: '',
    telegramUsername: '',
    categoryId: '',
    subcategoryId: '',
    coverImage: '',
    coverImageFile: null as File | null,
    isPrivate: false,
  });
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [useImageFile, setUseImageFile] = useState(false);

  useEffect(() => {
    // Проверяем авторизацию
    if (!authService.isAuthenticated()) {
      alert('Для добавления ресурса необходимо авторизоваться через Telegram');
      navigate('/');
      return;
    }
    loadCategories();
  }, [navigate]);

  useEffect(() => {
    // Обновляем выбранную категорию при изменении categoryId
    if (formData.categoryId) {
      const category = categories.find(c => c.id === formData.categoryId);
      setSelectedCategory(category || null);
      // Сбрасываем подкатегорию при смене категории
      setFormData(prev => ({ ...prev, subcategoryId: '' }));
    } else {
      setSelectedCategory(null);
    }
  }, [formData.categoryId, categories]);

  const loadCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        alert('Выберите файл изображения');
        return;
      }
      // Проверяем размер (макс 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Размер файла не должен превышать 5MB');
        return;
      }
      setFormData(prev => ({ ...prev, coverImageFile: file }));
      // Создаем превью
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Валидация
      if (!formData.title.trim()) {
        alert('Заполните название');
        setLoading(false);
        return;
      }

      if (!formData.categoryId) {
        alert('Выберите категорию');
        setLoading(false);
        return;
      }

      if (!formData.subcategoryId) {
        alert('Выберите подкатегорию');
        setLoading(false);
        return;
      }

      const categoryType = selectedCategory?.type;
      
      // Для каналов, групп и ботов
      if (['channel', 'group', 'bot'].includes(categoryType || '')) {
        if (!formData.isPrivate && !formData.telegramUsername.trim()) {
          alert('Укажите username (без @) или отметьте "Приватный ресурс" и укажите ссылку');
          setLoading(false);
          return;
        }
        if (formData.isPrivate && !formData.telegramLink.trim()) {
          alert('Для приватного ресурса укажите ссылку');
          setLoading(false);
          return;
        }
      }
      
      // Для паков (стикеры, эмодзи)
      if (['sticker', 'emoji'].includes(categoryType || '')) {
        if (!formData.telegramLink.trim()) {
          alert('Укажите ссылку на стикерпак или эмодзипак');
          setLoading(false);
          return;
        }
      }

      // Проверка обложки
      if (!formData.coverImage.trim() && !formData.coverImageFile) {
        alert('Загрузите обложку или укажите ссылку на изображение');
        setLoading(false);
        return;
      }

      // Подготовка данных для отправки
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description || '');
      submitData.append('categoryId', formData.categoryId);
      submitData.append('subcategoryId', formData.subcategoryId);
      submitData.append('isPrivate', formData.isPrivate.toString());
      
      if (formData.telegramLink) {
        submitData.append('telegramLink', formData.telegramLink);
      }
      if (formData.telegramUsername) {
        submitData.append('telegramUsername', formData.telegramUsername);
      }
      if (formData.coverImage) {
        submitData.append('coverImage', formData.coverImage);
      }
      if (formData.coverImageFile) {
        submitData.append('coverImageFile', formData.coverImageFile);
      }

      await axios.post('/api/resources/submit', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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

  const isPackType = ['sticker', 'emoji'].includes(selectedCategory?.type || '');
  const isChannelGroupBot = ['channel', 'group', 'bot'].includes(selectedCategory?.type || '');
  
  // Отладочная информация
  console.log('Form state:', {
    selectedCategory: selectedCategory?.name,
    categoryType: selectedCategory?.type,
    isChannelGroupBot,
    isPackType,
    isPrivate: formData.isPrivate,
  });

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
          <label>Категория *</label>
          <select
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value, subcategoryId: '' })}
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

        {selectedCategory && selectedCategory.subcategories && (
          <div className="form-group">
            <label>Подкатегория *</label>
            <select
              value={formData.subcategoryId}
              onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })}
              required
            >
              <option value="">Выберите подкатегорию</option>
              {selectedCategory.subcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </option>
              ))}
            </select>
          </div>
        )}

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
          <label>Описание *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Краткое описание ресурса"
            rows={5}
            required
          />
        </div>

        {/* Для паков (стикеры, эмодзи) - только ссылка */}
        {isPackType && (
          <div className="form-group">
            <label>Ссылка на стикерпак/эмодзипак *</label>
            <input
              type="url"
              value={formData.telegramLink}
              onChange={(e) => setFormData({ ...formData, telegramLink: e.target.value })}
              placeholder="https://t.me/addstickers/packname"
              required
            />
          </div>
        )}

        {/* Для каналов, групп, ботов - username или ссылка (если приватный) */}
        {isChannelGroupBot && (
          <>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isPrivate}
                  onChange={(e) => {
                    const isPrivate = e.target.checked;
                    setFormData({ 
                      ...formData, 
                      isPrivate: isPrivate,
                      telegramUsername: isPrivate ? '' : formData.telegramUsername,
                      telegramLink: isPrivate ? formData.telegramLink : ''
                    });
                  }}
                />
                <span>Приватный ресурс (использовать ссылку вместо username)</span>
              </label>
            </div>
            {!formData.isPrivate ? (
              <div className="form-group">
                <label>Username (без @) *</label>
                <input
                  type="text"
                  value={formData.telegramUsername}
                  onChange={(e) => setFormData({ ...formData, telegramUsername: e.target.value })}
                  placeholder="channelname"
                  required
                />
                <small>Укажите username без символа @</small>
              </div>
            ) : (
              <div className="form-group">
                <label>Ссылка на ресурс *</label>
                <input
                  type="url"
                  value={formData.telegramLink}
                  onChange={(e) => setFormData({ ...formData, telegramLink: e.target.value })}
                  placeholder="https://t.me/channelname"
                  required
                />
              </div>
            )}
          </>
        )}

        <div className="form-group">
          <label>Обложка *</label>
          <div className="image-upload-options">
            <div className="upload-option-tabs">
              <button
                type="button"
                className={!useImageFile ? 'active' : ''}
                onClick={() => {
                  setUseImageFile(false);
                  setFormData(prev => ({ ...prev, coverImageFile: null }));
                  setImagePreview(null);
                }}
              >
                Ссылка
              </button>
              <button
                type="button"
                className={useImageFile ? 'active' : ''}
                onClick={() => {
                  setUseImageFile(true);
                  setFormData(prev => ({ ...prev, coverImage: '' }));
                }}
              >
                Загрузить файл
              </button>
            </div>

            {!useImageFile ? (
              <input
                type="url"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                placeholder="https://example.com/image.jpg"
                required={!formData.coverImageFile}
              />
            ) : (
              <div className="file-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  required={!formData.coverImage}
                />
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                  </div>
                )}
              </div>
            )}
          </div>
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
