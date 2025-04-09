"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { decodeTokenBackend } from "@/utils/auth";
import 'bootstrap/dist/css/bootstrap.min.css';
import Notification from '@/components/alertnotification';

export default function LearnFlashcard() {
  const router = useRouter();
  const { id } = useParams();
  const [userId, setUserId] = useState(null);
  const [flashcardSet, setFlashcardSet] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

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

  // Xử lý lật thẻ
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  // Xử lý chuyển sang flashcard tiếp theo
  const handleNext = () => {
    if (flashcards.length === 0) return;

    setIsFlipped(false);
    const newIndex = (currentIndex + 1) % flashcards.length;
    setCurrentIndex(newIndex);
  };

  // Xử lý chuyển về flashcard trước đó
  const handlePrevious = () => {
    if (flashcards.length === 0) return;

    setIsFlipped(false);
    const newIndex = (currentIndex - 1 + flashcards.length) % flashcards.length;
    setCurrentIndex(newIndex);
  };

  if (loading) return <div className="main-content text-center mt-5">Đang tải...</div>;
  if (error) return <div className="main-content text-center mt-5 text-danger">Lỗi: {error}</div>;

  return (
    <div className="main-content py-5">
      {message && <Notification message={message} type={messageType} onClose={() => setMessage("")} />}

      <div className="container">
        {flashcardSet ? (
          <>
            <h1 className="text-primary fw-bold mb-4 text-center">Học Flashcard: {flashcardSet.title}</h1>

            {/* Nút Quay về */}
            <div className="text-center mb-4">
              <button
                className="btn btn-secondary"
                onClick={() => router.push('/dashboard/flashcardSet')}
              >
                Quay về danh sách FlashcardSet
              </button>
            </div>

            {flashcards.length > 0 ? (
              <div className="card shadow-lg" style={{ maxWidth: "800px", margin: "0 auto" }}>
                <div className="card-body text-center" style={{}}>
                  <div
                    className={`flip-card ${isFlipped ? 'flipped' : ''}`}
                    onClick={handleFlip}
                    style={{ minHeight: "400px", borderRadius: "15px", cursor: "pointer", marginBottom: "30px" }}
                  >
                    <div className="flip-card-inner">
                      <div className="flip-card-front bg-light d-flex flex-column justify-content-center align-items-center" style={{ padding: '13rem' }}>
                        <h3 className="text-primary fw-bold fs-2 mb-3">{flashcards[currentIndex].term}</h3>
                        <p className="text-muted fs-4">/{flashcards[currentIndex].pronunciation || "Không có phát âm"}/</p>
                      </div>
                      <div className="flip-card-back bg-primary text-white d-flex flex-column justify-content-center align-items-start" style={{ padding: '13rem' }}>
                        <p className="fs-5 mb-3"><strong>Định nghĩa:</strong> {flashcards[currentIndex].definition || "Không có định nghĩa"}</p>
                        <p className="fs-5 mb-3"><strong>Ví dụ:</strong> <em>"{flashcards[currentIndex].example || "Không có ví dụ"}"</em></p>
                        <p className="fs-5"><strong>Phát âm:</strong> /{flashcards[currentIndex].pronunciation || "Không có phát âm"}/</p>
                        <p className="fs-5"><strong>Loại từ:</strong> {flashcards[currentIndex].partOfSpeech || "Không xác định"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      className="btn btn-secondary me-2"
                      onClick={handlePrevious}
                      disabled={flashcards.length <= 1}
                    >
                      Trước
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleNext}
                      disabled={flashcards.length <= 1}
                    >
                      Tiếp theo
                    </button>
                  </div>
                  <p className="mt-3">Flashcard {currentIndex + 1}/{flashcards.length}</p>
                </div>
              </div>
            ) : (
              <div className="alert alert-info text-center" role="alert">
                FlashcardSet này chưa có flashcard nào.
              </div>
            )}
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

        /* Hiệu ứng lật thẻ */
        .flip-card {
          perspective: 1000px;
          width: 100%;
        }

        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          text-align: center;
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }

        .flip-card.flipped .flip-card-inner {
          transform: rotateY(180deg);
        }

        .flip-card-front,
        .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 15px;
        }

        .flip-card-front {
          transform: rotateY(0deg);
        }

        .flip-card-back {
          transform: rotateY(180deg);
        }

        .flip-card-back {
          align-items: start;
          text-align: left;
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