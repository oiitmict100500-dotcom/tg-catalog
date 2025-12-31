import { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../services/auth.service';
import './EditResourceModal.css';

interface EditResourceModalProps {
  resource: any;
  onClose: () => void;
  onSave: () => void;
}

function EditResourceModal({ resource, onClose, onSave }: EditResourceModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    telegramLink: '',
    telegramUsername: '',
    categoryId: '',
    subcategoryId: '',
    coverImage: '',
    isPrivate: false,
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (resource) {
      setFormData({
        title: resource.title || '',
        description: resource.description || '',
        telegramLink: resource.telegramLink || '',
        telegramUsername: resource.telegramUsername || '',
        categoryId: resource.categoryId || '',
        subcategoryId: resource.subcategoryId || '',
        coverImage: resource.coverImage || '',
        isPrivate: resource.isPrivate || false,
      });
    }
    loadCategories();
  }, [resource]);

  const loadCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data || []);
      
      if (resource?.categoryId) {
        const cat = response.data.find((c: any) => c.id === resource.categoryId);
        setSelectedCategory(cat || null);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  useEffect(() => {
    if (formData.categoryId) {
      const category = categories.find(c => c.id === formData.categoryId);
      setSelectedCategory(category || null);
      if (!category || !category.subcategories?.find((s: any) => s.id === formData.subcategoryId)) {
        setFormData(prev => ({ ...prev, subcategoryId: '' }));
      }
    }
  }, [formData.categoryId, categories]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Выберите файл изображения');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Размер файла не должен превышать 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, coverImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = authService.getToken();
      const response = await axios.put(
        `/api/resources/edit?resourceId=${resource.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data) {
        alert('Ресурс успешно обновлен!');
        onSave();
        onClose();
      }
    } catch (error: any) {
      console.error('Error updating resource:', error);
      setError(error.response?.data?.message || 'Ошибка при обновлении ресурса');
    } finally {
      setLoading(false);
    }
  };

  if (!resource) return null;

  return (
    <div className="edit-resource-modal-overlay" onClick={onClose}>
      <div className="edit-resource-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-resource-modal-header">
          <h2>✏️ Редактировать ресурс</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="edit-resource-form">
          <div className="form-group">
            <label>Название *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Категория *</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              required
            >
              <option value="">Выберите категорию</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
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
                {selectedCategory.subcategories.map((sub: any) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Telegram ссылка</label>
            <input
              type="text"
              value={formData.telegramLink}
              onChange={(e) => setFormData({ ...formData, telegramLink: e.target.value })}
              placeholder="https://t.me/..."
            />
          </div>

          <div className="form-group">
            <label>Telegram username</label>
            <input
              type="text"
              value={formData.telegramUsername}
              onChange={(e) => setFormData({ ...formData, telegramUsername: e.target.value })}
              placeholder="@username"
            />
          </div>

          <div className="form-group">
            <label>Обложка</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
            />
            {formData.coverImage && (
              <img src={formData.coverImage} alt="Preview" className="image-preview" />
            )}
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.isPrivate}
                onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
              />
              Приватный ресурс
            </label>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Отмена
            </button>
            <button type="submit" disabled={loading} className="btn-save">
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditResourceModal;

