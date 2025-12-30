import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/auth.service';
import './Auth.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setMessage('Если аккаунт с таким email существует, письмо отправлено на вашу почту.');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Ошибка. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Восстановление пароля</h1>
        <p className="auth-subtitle">Введите email для восстановления пароля</p>

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-success">{message}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Введите ваш email"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Отправка...' : 'Отправить'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login">Вернуться к входу</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;

