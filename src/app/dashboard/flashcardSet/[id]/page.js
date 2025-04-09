"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { decodeTokenBackend } from "@/utils/auth";
import 'bootstrap/dist/css/bootstrap.min.css';
import Notification from '@/components/alertnotification';
import { Modal, Button } from 'react-bootstrap';

export default function FlashcardSetDetail() {
  const router = useRouter();
  const { id } = useParams();
  const [userId, setUserId] = useState(null);
  const [flashcardSet, setFlashcardSet] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [showModal, setShowModal] = useState(false);

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

  // Lấy thông tin FlashcardSet và Flashcards
  useEffect(() => {
    const fetchFlashcardSet = async () => {
      if (!userId || !id) return;

      try {
        setLoading(true);
        console.log({id});
        const res = await fetch(`/api/flashcard-sets/${id}`);
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 404) {
            setFlashcardSet(null);
            setFlashcards([]);
            setMessage("Không tìm thấy FlashcardSet này.");
            setMessageType("failed");
          } else {
            throw new Error(data.message || "Không thể lấy FlashcardSet");
          }
        } else {
          setFlashcardSet(data.flashcardSet);
          setFlashcards(data.flashcardSet.flashcards || []);
        }
      } catch (err) {
        setError(err.message);
        setMessage("Lỗi khi lấy FlashcardSet: " + err.message);
        setMessageType("failed");
      } finally {
        setLoading(false);
      }
    };
    fetchFlashcardSet();
  }, [userId, id]);

  // Xử lý tạo Flashcard mới
  const handleCreateFlashcard = async (formData) => {
    try {
      const res = await fetch('/api/flashcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: formData.term,
          definition: formData.definition,
          example: formData.example,
          pronunciation: formData.pronunciation,
          partOfSpeech: formData.partOfSpeech,
          flashcardSetId: id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể tạo Flashcard");
      setFlashcards(prev => [...prev, data.flashcard]);
      setMessage("Thêm Flashcard thành công!");
      setMessageType("success");
      setShowModal(false); // Đóng modal
    } catch (err) {
      setMessage("Lỗi khi thêm Flashcard: " + err.message);
      setMessageType("failed");
    }
  };

  if (loading) return <div className="main-content text-center mt-5">Đang tải...</div>;
  if (error) return <div className="main-content text-center mt-5 text-danger">Lỗi: {error}</div>;

  return (
    <div className="main-content py-5">
      {message && <Notification message={message} type={messageType} onClose={() => setMessage("")} />}

      <div className="container">
        {flashcardSet ? (
          <>
            <h1 className="text-primary fw-bold mb-4 text-center">{flashcardSet.title}</h1>
            <p className="text-center mb-4">{flashcardSet.description || "Không có mô tả"}</p>

            {/* Nút Học */}
            <div className="text-center mb-4">
              <button
                className="btn btn-success"
                onClick={() => router.push(`/dashboard/flashcardSet/${id}/learn`)}
                disabled={flashcards.length === 0}
              >
                Học ngay
              </button>
            </div>

            {/* Danh sách Flashcard */}
            <h2 className="mb-4 text-secondary border-bottom pb-2">Danh sách Flashcard</h2>
            {flashcards.length > 0 ? (
              <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                {flashcards.map((flashcard) => (
                  <div key={flashcard._id} className="col">
                    <div className="card h-100 shadow-sm border-primary">
                      <div className="card-body">
                        <h5 className="card-title fw-bold text-primary">{flashcard.term}</h5>
                        <p className="card-text"><strong>Nghĩa:</strong> {flashcard.definition}</p>
                        <p className="card-text"><strong>Ví dụ:</strong> {flashcard.example || "Không có ví dụ"}</p>
                        <p className="card-text"><strong>Phát âm:</strong> {flashcard.pronunciation || "Không có phát âm"}</p>
                        <p className="card-text"><strong>Loại từ:</strong> {flashcard.partOfSpeech || "Không xác định"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="alert alert-info text-center" role="alert">
                FlashcardSet này chưa có flashcard nào.
              </div>
            )}

            {/* Nút mở modal thêm Flashcard */}
            <div className="text-center mt-4">
              <Button variant="primary" onClick={() => setShowModal(true)}>
                Thêm Flashcard
              </Button>
            </div>

            {/* Modal thêm Flashcard với react-bootstrap */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
              <Modal.Header closeButton>
                <Modal.Title>Thêm Flashcard Mới</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    handleCreateFlashcard({
                      term: formData.get('term'),
                      definition: formData.get('definition'),
                      example: formData.get('example'),
                      pronunciation: formData.get('pronunciation'),
                      partOfSpeech: formData.get('partOfSpeech'),
                    });
                  }}
                >
                  <div className="mb-3">
                    <label htmlFor="term" className="form-label">Từ vựng</label>
                    <input type="text" className="form-control" id="term" name="term" required />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="definition" className="form-label">Nghĩa</label>
                    <input type="text" className="form-control" id="definition" name="definition" required />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="example" className="form-label">Ví dụ</label>
                    <input type="text" className="form-control" id="example" name="example" />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="pronunciation" className="form-label">Phát âm</label>
                    <input type="text" className="form-control" id="pronunciation" name="pronunciation" />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="partOfSpeech" className="form-label">Loại từ</label>
                    <input type="text" className="form-control" id="partOfSpeech" name="partOfSpeech" />
                  </div>
                  <Button variant="primary" type="submit">
                    Thêm
                  </Button>
                </form>
              </Modal.Body>
            </Modal>
          </>
        ) : (
          <div className="alert alert-warning text-center mt-5" role="alert">
            Không tìm thấy FlashcardSet này.
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