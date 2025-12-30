import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import authService from '../services/auth.service';
import './Profile.css';

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: '',
    avatar: '',
    bio: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        // Не авторизован - просто не показываем профиль
        return;
      }
      setUser(currentUser);
      setFormData({
        username: currentUser.username || '',
        avatar: currentUser.avatar || '',
        bio: currentUser.bio || '',
      });
    } catch (error) {
      navigate('/login');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const response = await axios.put('/api/users/me/profile', formData);
      setUser(response.data);
      setError('');
      alert('Профиль обновлен!');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Ошибка обновления профиля');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h1>Профиль</h1>

        {error && <div className="profile-error">{error}</div>}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="profile-avatar-section">
            <div className="avatar-preview">
              {formData.avatar ? (
                <img src={formData.avatar} alt="Avatar" />
              ) : (
                <div className="avatar-placeholder">👤</div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Логин</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              minLength={3}
            />
          </div>

          <div className="form-group">
            <label>Фото профиля (URL)</label>
            <input
              type="url"
              value={formData.avatar}
              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          <div className="form-group">
            <label>О себе</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={5}
              placeholder="Расскажите о себе..."
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="disabled-input"
            />
            <small>Email нельзя изменить</small>
          </div>

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;

