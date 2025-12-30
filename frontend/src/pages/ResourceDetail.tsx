import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './ResourceDetail.css';

function ResourceDetail() {
  const { id } = useParams();
  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState({ comment: '', rating: 5 });

  useEffect(() => {
    loadResource();
  }, [id]);

  const loadResource = async () => {
    try {
      const response = await axios.get(`/api/resources/${id}`);
      setResource(response.data);
    } catch (error) {
      console.error('Error loading resource:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`/api/resources/${id}/reviews`, review);
      alert('Отзыв добавлен!');
      setReview({ comment: '', rating: 5 });
      loadResource();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Ошибка при добавлении отзыва');
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!resource) {
    return <div className="error">Ресурс не найден</div>;
  }

  return (
    <div className="resource-detail">
      <Link to="/" className="back-link">← Назад к каталогу</Link>
      
      <div className="resource-header">
        {resource.coverImage && (
          <img src={resource.coverImage} alt={resource.title} className="detail-cover" />
        )}
        <div className="resource-info">
          <h1>{resource.title}</h1>
          <p className="category">{resource.category?.name}</p>
          <p className="description">{resource.description}</p>
          <div className="stats">
            <span>👁️ {resource.viewCount} просмотров</span>
            {resource.rating > 0 && (
              <span>⭐ {resource.rating.toFixed(1)}/5 ({resource.reviewCount} отзывов)</span>
            )}
          </div>
          <a
            href={resource.telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-telegram"
          >
            Перейти в Telegram →
          </a>
        </div>
      </div>

      <div className="reviews-section">
        <h2>Отзывы</h2>
        {resource.reviews && resource.reviews.length > 0 ? (
          <div className="reviews-list">
            {resource.reviews.map((r: any) => (
              <div key={r.id} className="review-item">
                <div className="review-header">
                  <span className="review-rating">⭐ {r.rating}/5</span>
                  <span className="review-date">
                    {new Date(r.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <p>{r.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-reviews">Пока нет отзывов. Будьте первым!</p>
        )}

        <form onSubmit={handleSubmitReview} className="review-form">
          <h3>Добавить отзыв</h3>
          <div className="form-group">
            <label>Рейтинг</label>
            <select
              value={review.rating}
              onChange={(e) => setReview({ ...review, rating: parseInt(e.target.value) })}
            >
              <option value={5}>5 - Отлично</option>
              <option value={4}>4 - Хорошо</option>
              <option value={3}>3 - Нормально</option>
              <option value={2}>2 - Плохо</option>
              <option value={1}>1 - Очень плохо</option>
            </select>
          </div>
          <div className="form-group">
            <label>Комментарий</label>
            <textarea
              value={review.comment}
              onChange={(e) => setReview({ ...review, comment: e.target.value })}
              rows={4}
              required
            />
          </div>
          <button type="submit" className="btn-submit">Отправить отзыв</button>
        </form>
      </div>
    </div>
  );
}

export default ResourceDetail;


