import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import axios from 'axios';
import './Admin.css';

function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalResources: 0,
    totalUsers: 0,
    totalCategories: 0,
  });

  useEffect(() => {
    checkAdminAccess();
    loadStats();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        navigate('/');
        return;
      }
      setUser(currentUser);
      setLoading(false);
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/');
    }
  };

  const loadStats = async () => {
    try {
      // Здесь можно добавить загрузку статистики с бэкенда
      // Пока используем заглушку
      setStats({
        totalResources: 0,
        totalUsers: 0,
        totalCategories: 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="admin-loading">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>⚙️ Админ панель</h1>
        <p>Добро пожаловать, {user?.username}!</p>
      </div>

      <div className="admin-content">
        <div className="admin-stats">
          <div className="stat-card">
            <h3>📚 Ресурсы</h3>
            <p className="stat-number">{stats.totalResources}</p>
          </div>
          <div className="stat-card">
            <h3>👥 Пользователи</h3>
            <p className="stat-number">{stats.totalUsers}</p>
          </div>
          <div className="stat-card">
            <h3>📁 Категории</h3>
            <p className="stat-number">{stats.totalCategories}</p>
          </div>
        </div>

        <div className="admin-sections">
          <section className="admin-section">
            <h2>Управление ресурсами</h2>
            <p>Здесь будет управление ресурсами (модерация, редактирование, удаление)</p>
          </section>

          <section className="admin-section">
            <h2>Управление пользователями</h2>
            <p>Здесь будет управление пользователями (назначение админов, блокировка)</p>
          </section>

          <section className="admin-section">
            <h2>Управление категориями</h2>
            <p>Здесь будет управление категориями (создание, редактирование, удаление)</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Admin;

