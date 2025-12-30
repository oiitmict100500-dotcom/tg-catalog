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
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Валидация названия
    if (!formData.title.trim()) {
      newErrors.title = 'Заполните название';
    }

    // Валидация категории
    if (!formData.categoryId) {
      newErrors.categoryId = 'Выберите категорию';
    }

    // Валидация подкатегории
    if (!formData.subcategoryId) {
      newErrors.subcategoryId = 'Выберите подкатегорию';
    }

    // Валидация описания
    if (!formData.description.trim()) {
      newErrors.description = 'Заполните описание';
    }

    const categoryType = selectedCategory?.type;
    
    // Для каналов, групп и ботов
    if (['channel', 'group', 'bot'].includes(categoryType || '')) {
      if (!formData.isPrivate && !formData.telegramUsername.trim()) {
        newErrors.telegramUsername = 'Укажите username (без @) или отметьте "Приватный ресурс"';
      }
      if (formData.isPrivate && !formData.telegramLink.trim()) {
        newErrors.telegramLink = 'Для приватного ресурса укажите ссылку';
      }
    }
    
    // Для паков (стикеры, эмодзи)
    if (['sticker', 'emoji'].includes(categoryType || '')) {
      if (!formData.telegramLink.trim()) {
        newErrors.telegramLink = 'Укажите ссылку на стикерпак или эмодзипак';
      }
    }

    // Проверка обложки
    if (!formData.coverImage.trim() && !formData.coverImageFile) {
      newErrors.coverImage = 'Загрузите обложку или укажите ссылку на изображение';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация формы
    if (!validateForm()) {
      // Прокручиваем к первой ошибке
      const firstErrorField = document.querySelector('.field-error');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);

    try {

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
        <div className={`form-group ${errors.categoryId ? 'field-error' : ''}`}>
          <label>Категория *</label>
          <select
            value={formData.categoryId}
            onChange={(e) => {
              setFormData({ ...formData, categoryId: e.target.value, subcategoryId: '' });
              if (errors.categoryId) {
                setErrors(prev => ({ ...prev, categoryId: '' }));
              }
            }}
            required
            className={errors.categoryId ? 'error' : ''}
          >
            <option value="">Выберите категорию</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <span className="error-message">{errors.categoryId}</span>}
        </div>

        {selectedCategory && selectedCategory.subcategories && (
          <div className={`form-group ${errors.subcategoryId ? 'field-error' : ''}`}>
            <label>Подкатегория *</label>
            <select
              value={formData.subcategoryId}
              onChange={(e) => {
                setFormData({ ...formData, subcategoryId: e.target.value });
                if (errors.subcategoryId) {
                  setErrors(prev => ({ ...prev, subcategoryId: '' }));
                }
              }}
              required
              className={errors.subcategoryId ? 'error' : ''}
            >
              <option value="">Выберите подкатегорию</option>
              {selectedCategory.subcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </option>
              ))}
            </select>
            {errors.subcategoryId && <span className="error-message">{errors.subcategoryId}</span>}
          </div>
        )}

        <div className={`form-group ${errors.title ? 'field-error' : ''}`}>
          <label>Название *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => {
              setFormData({ ...formData, title: e.target.value });
              if (errors.title) {
                setErrors(prev => ({ ...prev, title: '' }));
              }
            }}
            placeholder="Название ресурса"
            required
            className={errors.title ? 'error' : ''}
          />
          {errors.title && <span className="error-message">{errors.title}</span>}
        </div>

        <div className={`form-group ${errors.description ? 'field-error' : ''}`}>
          <label>Описание *</label>
          <textarea
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value });
              if (errors.description) {
                setErrors(prev => ({ ...prev, description: '' }));
              }
            }}
            placeholder="Краткое описание ресурса"
            rows={5}
            required
            className={errors.description ? 'error' : ''}
          />
          {errors.description && <span className="error-message">{errors.description}</span>}
        </div>

        {/* Для паков (стикеры, эмодзи) - только ссылка */}
        {isPackType && (
          <div className={`form-group ${errors.telegramLink ? 'field-error' : ''}`}>
            <label>Ссылка на стикерпак/эмодзипак *</label>
            <input
              type="url"
              value={formData.telegramLink}
              onChange={(e) => {
                setFormData({ ...formData, telegramLink: e.target.value });
                if (errors.telegramLink) {
                  setErrors(prev => ({ ...prev, telegramLink: '' }));
                }
              }}
              placeholder="https://t.me/addstickers/packname"
              required
              className={errors.telegramLink ? 'error' : ''}
            />
            {errors.telegramLink && <span className="error-message">{errors.telegramLink}</span>}
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
              <div className={`form-group ${errors.telegramUsername ? 'field-error' : ''}`}>
                <label>Username (без @) *</label>
                <input
                  type="text"
                  value={formData.telegramUsername}
                  onChange={(e) => {
                    setFormData({ ...formData, telegramUsername: e.target.value });
                    if (errors.telegramUsername) {
                      setErrors(prev => ({ ...prev, telegramUsername: '' }));
                    }
                  }}
                  placeholder="channelname"
                  required
                  className={errors.telegramUsername ? 'error' : ''}
                />
                <small>Укажите username без символа @</small>
                {errors.telegramUsername && <span className="error-message">{errors.telegramUsername}</span>}
              </div>
            ) : (
              <div className={`form-group ${errors.telegramLink ? 'field-error' : ''}`}>
                <label>Ссылка на ресурс *</label>
                <input
                  type="url"
                  value={formData.telegramLink}
                  onChange={(e) => {
                    setFormData({ ...formData, telegramLink: e.target.value });
                    if (errors.telegramLink) {
                      setErrors(prev => ({ ...prev, telegramLink: '' }));
                    }
                  }}
                  placeholder="https://t.me/channelname"
                  required
                  className={errors.telegramLink ? 'error' : ''}
                />
                {errors.telegramLink && <span className="error-message">{errors.telegramLink}</span>}
              </div>
            )}
          </>
        )}

        <div className={`form-group ${errors.coverImage ? 'field-error' : ''}`}>
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
                  if (errors.coverImage && formData.coverImage) {
                    setErrors(prev => ({ ...prev, coverImage: '' }));
                  }
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
                  if (errors.coverImage && formData.coverImageFile) {
                    setErrors(prev => ({ ...prev, coverImage: '' }));
                  }
                }}
              >
                Загрузить файл
              </button>
            </div>

            {!useImageFile ? (
              <>
                <input
                  type="url"
                  value={formData.coverImage}
                  onChange={(e) => {
                    setFormData({ ...formData, coverImage: e.target.value });
                    if (errors.coverImage) {
                      setErrors(prev => ({ ...prev, coverImage: '' }));
                    }
                  }}
                  placeholder="https://example.com/image.jpg"
                  required={!formData.coverImageFile}
                  className={errors.coverImage ? 'error' : ''}
                />
                {errors.coverImage && <span className="error-message">{errors.coverImage}</span>}
              </>
            ) : (
              <div className="file-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    handleImageFileChange(e);
                    if (errors.coverImage) {
                      setErrors(prev => ({ ...prev, coverImage: '' }));
                    }
                  }}
                  required={!formData.coverImage}
                  className={errors.coverImage ? 'error' : ''}
                />
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                  </div>
                )}
                {errors.coverImage && <span className="error-message">{errors.coverImage}</span>}
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
