import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/auth.service';
import './Auth.css';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    login: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(formData.login, formData.password);
      navigate('/');
      window.location.reload(); // Обновляем страницу для обновления Header
    } catch (error: any) {
      setError(error.response?.data?.message || 'Ошибка входа. Проверьте данные.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Вход</h1>
        <p className="auth-subtitle">Войдите в свой аккаунт</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Логин или Email</label>
            <input
              type="text"
              value={formData.login}
              onChange={(e) => setFormData({ ...formData, login: e.target.value })}
              required
              placeholder="Введите логин или email"
            />
          </div>

          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Введите пароль"
            />
          </div>

          <div className="form-group">
            <Link to="/forgot-password" className="auth-link">
              Забыли пароль?
            </Link>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="auth-footer">
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;

