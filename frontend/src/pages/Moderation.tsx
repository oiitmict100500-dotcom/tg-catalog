import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import authService from '../services/auth.service';
import './Moderation.css';

interface Submission {
  id: string;
  title: string;
  description: string;
  telegramLink: string;
  telegramUsername?: string;
  categoryId: string;
  subcategoryId: string;
  coverImage: string;
  isPrivate: boolean;
  authorId: string;
  authorUsername: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  moderatedBy?: string;
  moderatedAt?: string;
  rejectionReason?: string;
}

function Moderation() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 Moderation: Component mounted, checking admin access...');
    checkAdminAccess();
  }, []);

  useEffect(() => {
    console.log('🔍 Moderation: User state changed:', {
      hasUser: !!user,
      userRole: user?.role,
      loading: loading,
    });
    if (user && !loading) {
      console.log('✅ Moderation: User is admin, loading submissions...');
      loadSubmissions();
    } else if (!loading && !user) {
      console.warn('⚠️ Moderation: No user found, cannot load submissions');
    }
  }, [user, loading]);

  const checkAdminAccess = async () => {
    try {
      console.log('🔍 Moderation: Checking admin access...');
      const currentUser = await authService.getCurrentUser();
      console.log('🔍 Moderation: Current user:', {
        hasUser: !!currentUser,
        role: currentUser?.role,
        id: currentUser?.id,
      });
      if (!currentUser || currentUser.role !== 'admin') {
        console.warn('⚠️ Moderation: User is not admin, redirecting...');
        navigate('/admin');
        return;
      }
      console.log('✅ Moderation: User is admin, setting user state...');
      setUser(currentUser);
      setLoading(false);
    } catch (error) {
      console.error('❌ Moderation: Error checking admin access:', error);
      navigate('/admin');
    }
  };

  const loadSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const token = authService.getToken();
      console.log('📤 Loading submissions from API...');
      const response = await axios.get('/api/moderation/pending', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('📥 API response:', {
        count: response.data.count,
        submissions: response.data.submissions,
      });
      setSubmissions(response.data.submissions || []);
      
      // Если заявок нет, показываем информацию
      if (!response.data.submissions || response.data.submissions.length === 0) {
        console.warn('⚠️ No submissions received from API');
      }
    } catch (error: any) {
      console.error('❌ Error loading submissions:', error);
      console.error('Error details:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        data: error.response?.data,
      });
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Ошибка доступа. Проверьте права администратора.');
        navigate('/admin');
      } else {
        console.error('Failed to load submissions:', error.message);
      }
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleApprove = async (submissionId: string) => {
    if (!confirm('Одобрить эту заявку?')) {
      return;
    }

    setApprovingId(submissionId);
    try {
      const token = authService.getToken();
      await axios.post(
        '/api/moderation/approve',
        { submissionId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert('Заявка одобрена!');
      loadSubmissions();
    } catch (error: any) {
      console.error('Error approving submission:', error);
      alert(error.response?.data?.message || 'Ошибка при одобрении заявки');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (submissionId: string) => {
    if (!rejectReason.trim()) {
      alert('Укажите причину отклонения');
      return;
    }

    if (!confirm('Отклонить эту заявку?')) {
      return;
    }

    setRejectingId(submissionId);
    try {
      const token = authService.getToken();
      await axios.post(
        '/api/moderation/reject',
        { submissionId, reason: rejectReason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert('Заявка отклонена!');
      setRejectReason('');
      loadSubmissions();
    } catch (error: any) {
      console.error('Error rejecting submission:', error);
      alert(error.response?.data?.message || 'Ошибка при отклонении заявки');
    } finally {
      setRejectingId(null);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const categories: Record<string, string> = {
      '1': 'Каналы',
      '2': 'Группы',
      '3': 'Боты',
      '4': 'Стикерпаки',
      '5': 'Эмодзипаки',
    };
    return categories[categoryId] || 'Неизвестно';
  };

  if (loading) {
    return (
      <div className="moderation-container">
        <div className="moderation-loading">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="moderation-container">
      <div className="moderation-header">
        <button onClick={() => navigate('/admin')} className="back-button">
          ← Назад к админ-панели
        </button>
        <h1>🔍 Модерация заявок</h1>
        <p>Ожидающих модерации: {submissions.length}</p>
      </div>

      {loadingSubmissions ? (
        <div className="moderation-loading">Загрузка заявок...</div>
      ) : submissions.length === 0 ? (
        <div className="moderation-empty">
          <p>Нет заявок на модерацию</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--tg-color-text-secondary)', marginTop: '10px' }}>
            Если вы только что отправили заявку, она может появиться через несколько секунд.
            <br />
            <strong>Важно:</strong> В Vercel Serverless Functions заявки могут сохраняться на разных инстансах.
            <br />
            Для постоянного хранения нужна база данных (PostgreSQL, MongoDB).
          </p>
          <button
            onClick={() => {
              console.log('🔄 Manually reloading submissions...');
              loadSubmissions();
            }}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              background: 'var(--tg-button-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            🔄 Обновить список
          </button>
        </div>
      ) : (
        <div className="submissions-list">
          {submissions.map((submission) => (
            <div key={submission.id} className="submission-card">
              <div className="submission-cover">
                {submission.coverImage ? (
                  <img src={submission.coverImage} alt={submission.title} />
                ) : (
                  <div className="submission-cover-placeholder">Нет обложки</div>
                )}
              </div>
              <div className="submission-content">
                <h3>{submission.title}</h3>
                <p className="submission-description">{submission.description}</p>
                <div className="submission-meta">
                  <span className="submission-category">
                    📁 {getCategoryName(submission.categoryId)}
                  </span>
                  <span className="submission-author">
                    👤 {submission.authorUsername}
                  </span>
                  <span className="submission-date">
                    📅 {new Date(submission.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <div className="submission-links">
                  {submission.telegramLink && (
                    <a
                      href={submission.telegramLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="submission-link"
                    >
                      🔗 Открыть в Telegram
                    </a>
                  )}
                  {submission.telegramUsername && (
                    <span className="submission-username">
                      @{submission.telegramUsername}
                    </span>
                  )}
                  {submission.isPrivate && (
                    <span className="submission-private">🔒 Приватный</span>
                  )}
                </div>
                <div className="submission-actions">
                  <button
                    onClick={() => handleApprove(submission.id)}
                    disabled={approvingId === submission.id}
                    className="btn-approve"
                  >
                    {approvingId === submission.id ? 'Одобрение...' : '✅ Одобрить'}
                  </button>
                  <div className="reject-section">
                    <input
                      type="text"
                      placeholder="Причина отклонения"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="reject-input"
                    />
                    <button
                      onClick={() => handleReject(submission.id)}
                      disabled={rejectingId === submission.id || !rejectReason.trim()}
                      className="btn-reject"
                    >
                      {rejectingId === submission.id ? 'Отклонение...' : '❌ Отклонить'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Moderation;

