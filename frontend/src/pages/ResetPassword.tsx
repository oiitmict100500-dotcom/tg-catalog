import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import authService from '../services/auth.service';
import './Auth.css';

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Неверная ссылка для сброса пароля');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Неверная ссылка');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(token, formData.password);
      navigate('/login');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Ошибка. Токен недействителен или истек.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Новый пароль</h1>
        <p className="auth-subtitle">Введите новый пароль</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Новый пароль</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
              placeholder="Введите новый пароль"
            />
          </div>

          <div className="form-group">
            <label>Подтвердите пароль</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              placeholder="Повторите пароль"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading || !token}>
            {loading ? 'Сохранение...' : 'Сохранить пароль'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login">Вернуться к входу</Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;

