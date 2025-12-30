import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import authService from '../services/auth.service';
import './MyResources.css';

function MyResources() {
  const navigate = useNavigate();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      alert('Для просмотра ресурсов необходимо авторизоваться через Telegram');
      navigate('/');
      return;
    }
    loadResources();
  }, [navigate]);

  const loadResources = async () => {
    try {
      const response = await axios.get('/api/users/me/resources');
      setResources(response.data || []);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="my-resources-container">
      <div className="my-resources-header">
        <h1>Мои ресурсы</h1>
        <Link to="/submit" className="btn-primary">
          ➕ Добавить ресурс
        </Link>
      </div>

      {resources.length === 0 ? (
        <div className="empty-state">
          <h2>У вас пока нет ресурсов</h2>
          <p>Начните добавлять ресурсы в каталог!</p>
          <Link to="/submit" className="btn-primary">
            Добавить первый ресурс
          </Link>
        </div>
      ) : (
        <div className="resources-list">
          {resources.map((resource) => (
            <div key={resource.id} className="resource-item">
              <div className="resource-item-content">
                {resource.coverImage && (
                  <img src={resource.coverImage} alt={resource.title} className="resource-item-image" />
                )}
                <div className="resource-item-info">
                  <h3>{resource.title}</h3>
                  <p>{resource.description}</p>
                  <div className="resource-item-meta">
                    <span className="resource-status">
                      {resource.isPublished ? '✅ Опубликован' : '⏳ На модерации'}
                    </span>
                    {resource.category && (
                      <span className="resource-category">{resource.category.name}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="resource-item-actions">
                {resource.isPublished && (
                  <Link to={`/resource/${resource.id}`} className="btn-view">
                    Посмотреть
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyResources;

