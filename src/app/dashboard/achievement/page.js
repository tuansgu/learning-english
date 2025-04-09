"use client";
import { useState, useEffect } from 'react';
import { decodeTokenBackend } from '@/utils/auth';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function AchievementsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAchievements = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vui lòng đăng nhập để xem thành tựu.');
        setLoading(false);
        return;
      }

      try {
        const decoded = await decodeTokenBackend(token);
        if (!decoded?.userId) {
          throw new Error('Không thể giải mã token.');
        }

        const res = await fetch(`/api/achievement?userId=${decoded.userId}`);
        if (!res.ok) {
          throw new Error(`Lỗi ${res.status}: ${await res.text()}`);
        }
        const result = await res.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, []);

  if (loading) return <div className="main-content text-center mt-5">Đang tải...</div>;
  if (error) return <div className="main-content text-center mt-5 text-danger">Lỗi: {error}</div>;
  if (!data) return <div className="main-content text-center mt-5">Không có dữ liệu</div>;

  return (
    <div className="main-content py-5">
      <div className="container">
        <h1 className="text-center mb-4 text-primary fw-bold">
          Thành tựu của {data.user.fullname}
        </h1>
        <div className="d-flex justify-content-around mb-4 bg-light p-3 rounded shadow-sm">
          <p className="mb-0 fw-semibold">Total Words: <span className="text-success">{data.user.total_words}</span></p>
          <p className="mb-0 fw-semibold">Streak: <span className="text-success">{data.user.streak}</span> days</p>
          <p className="mb-0 fw-semibold">Days Learned: <span className="text-success">{data.user.days_learned}</span></p>
        </div>
        <h2 className="mb-3 text-secondary border-bottom pb-2">Danh sách thành tựu</h2>
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {data.achievements.map((ach, index) => (
            <div key={index} className="col">
              <div
                className={`card h-100 shadow-sm ${
                  ach.earned ? 'border-success bg-success-subtle' : 'border-secondary bg-light opacity-75'
                }`}
              >
                <div className="card-body d-flex align-items-start">
                  <span className="fs-2 me-3">{ach.icon}</span>
                  <div>
                    <h5 className="card-title fw-bold">{ach.title}</h5>
                    <p className="card-text">{ach.description}</p>
                    <p className="card-text">
                      Tiến trình: {ach.progress}/{ach.goal} (
                      {Math.round((ach.progress / ach.goal) * 100)}%)
                    </p>
                    {ach.earned && (
                      <small className="text-muted">
                        Earned: {new Date(ach.earnedAt).toLocaleDateString()}
                      </small>
                    )}
                    <span
                      className={`badge mt-2 ${
                        ach.earned ? 'bg-success' : 'bg-secondary'
                      }`}
                    >
                      {ach.earned ? 'Đã đạt' : 'Chưa đạt'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CSS tùy chỉnh */}
      <style jsx>{`
        .main-content {
          margin-left: 250px; /* Điều chỉnh theo chiều rộng của sidebar */
          padding: 0 15px; /* Thêm padding để không sát lề */
          min-height: 100vh; /* Đảm bảo chiều cao tối thiểu */
        }

        @media (max-width: 768px) {
          .main-content {
            margin-left: 0; /* Bỏ margin-left trên màn hình nhỏ nếu sidebar ẩn */
          }
        }
      `}</style>
    </div>
  );
}