"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { decodeTokenBackend } from "@/utils/auth";
import 'bootstrap/dist/css/bootstrap.min.css';
import Notification from '@/components/alertnotification';

export default function FlashcardSetList() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Tải Bootstrap JavaScript
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Lấy userId từ token
  useEffect(() => {
    const fetchUserId = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Vui lòng đăng nhập để tiếp tục.");
        setMessage("Vui lòng đăng nhập để tiếp tục.");
        setMessageType("failed");
        setTimeout(() => router.push("/signin"), 1000);
        setLoading(false);
        return;
      }

      try {
        const data = await decodeTokenBackend(token);
        if (data?.userId) {
          setUserId(data.userId);
        } else {
          setError("Không thể giải mã token.");
          setMessage("Không thể giải mã token.");
          setMessageType("failed");
          setLoading(false);
        }
      } catch (err) {
        setError("Token không hợp lệ hoặc đã hết hạn.");
        setMessage("Đã hết phiên đăng nhập, vui lòng đăng nhập lại");
        setMessageType("failed");
        setTimeout(() => router.push("/signin"), 1000);
        setLoading(false);
      }
    };
    fetchUserId();
  }, [router]);

  // Lấy danh sách FlashcardSet
  useEffect(() => {
    const fetchFlashcardSets = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const res = await fetch(`/api/flashcard-sets?userId=${userId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Không thể lấy danh sách FlashcardSet");
        setFlashcardSets(data.flashcardSets || []);
      } catch (err) {
        setError(err.message);
        setMessage("Lỗi khi lấy danh sách FlashcardSet: " + err.message);
        setMessageType("failed");
      } finally {
        setLoading(false);
      }
    };
    fetchFlashcardSets();
  }, [userId]);

  // Xử lý tạo FlashcardSet mới
  const handleCreateFlashcardSet = async (formData) => {
    try {
      const res = await fetch('/api/flashcard-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          userId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể tạo FlashcardSet");
      setFlashcardSets(prev => [...prev, data.flashcardSet]);
      setMessage("Tạo FlashcardSet thành công!");
      setMessageType("success");
      // Đóng modal
      document.getElementById('createFlashcardSetModal').querySelector('.btn-close').click();
    } catch (err) {
      setError(err.message);
      setMessage("Lỗi khi tạo FlashcardSet: " + err.message);
      setMessageType("failed");
    }
  };

  if (loading) return <div className="main-content text-center mt-5">Đang tải...</div>;
  if (error) return <div className="main-content text-center mt-5 text-danger">Lỗi: {error}</div>;

  return (
    <div className="main-content py-5">
      {message && <Notification message={message} type={messageType} onClose={() => setMessage("")} />}

      <div className="container">
        <h1 className="text-primary fw-bold mb-4 text-center">Flashcard Cá Nhân Hóa</h1>

        {/* Nút mở modal tạo FlashcardSet */}
        <div className="text-center mb-4">
          <button
            type="button"
            className="btn btn-primary"
            data-bs-toggle="modal"
            data-bs-target="#createFlashcardSetModal"
          >
            Tạo FlashcardSet Mới
          </button>
        </div>

        {/* Modal tạo FlashcardSet */}
        <div
          className="modal fade"
          id="createFlashcardSetModal"
          tabIndex="-1"
          aria-labelledby="createFlashcardSetModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="createFlashcardSetModalLabel">Tạo FlashcardSet Mới</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    handleCreateFlashcardSet({
                      title: formData.get('title'),
                      description: formData.get('description'),
                    });
                  }}
                >
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">Tên FlashcardSet</label>
                    <input type="text" className="form-control" id="title" name="title" required />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">Mô tả</label>
                    <textarea className="form-control" id="description" name="description"></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary">Tạo FlashcardSet</button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Danh sách FlashcardSet */}
        <h2 className="mb-4 text-secondary border-bottom pb-2">Danh sách FlashcardSet</h2>
        {flashcardSets.length > 0 ? (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            {flashcardSets.map((set) => (
              <div key={set._id} className="col">
                <div className="card h-100 shadow-sm border-primary">
                  <div className="card-body">
                    <h5 className="card-title fw-bold text-primary">{set.title}</h5>
                    <p className="card-text">{set.description || "Không có mô tả"}</p>
                    {/* <p className="card-text"><strong>Số flashcard:</strong> {set.flashcardCount || 0}</p> */}
                    <button
                      className="btn btn-primary"
                      onClick={() => router.push(`/dashboard/flashcardSet/${set._id}`)}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="alert alert-info text-center" role="alert">
            Bạn chưa tạo FlashcardSet nào.
          </div>
        )}
      </div>

      <style jsx>{`
        .main-content {
          margin-left: 250px;
          padding: 0 15px;
          min-height: 100vh;
        }

        @media (max-width: 768px) {
          .main-content {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
}