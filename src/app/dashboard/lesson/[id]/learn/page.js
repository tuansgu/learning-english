"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { decodeTokenBackend } from "@/utils/auth";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params?.id || "";
  const [userId, setUserId] = useState(null);
  const [vocabularies, setVocabularies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [state, setState] = useState("Tiếp");
  const [wordsLearned, setWordsLearned] = useState(0);
  const [newWords, setNewWords] = useState([]);
  const [totalWords, setTotalWords] = useState(0);
  const [error, setError] = useState(null);
  const [vocalInLesson, setVocalInLesson] = useState(0);

  // Decode UserID
  useEffect(() => {
    const fetchUserId = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Không có token! Vui lòng đăng nhập.");
        setTimeout(() => router.push("/signin"), 1000);
        return;
      }
      const data = await decodeTokenBackend(token);
      if (data?.userId) {
        setUserId(data.userId);
      } else {
        setError("Không thể giải mã token.");
        setTimeout(() => router.push("/signin"), 1000);
      }
    };
    fetchUserId();
  }, [router]);

  // Display vocabularies
  useEffect(() => {
    if (!userId || !lessonId) return;

    async function fetchData() {
      try {
        // Lấy danh sách từ đã học
        const progressRes = await fetch(`/api/user/learned-vocab?userId=${userId}`);
        if (!progressRes.ok) throw new Error("Không thể tải danh sách từ đã học");
        const progressData = await progressRes.json();
        console.log("Response Data: ", progressData);
        const learnedVocabularyIds = progressData.vocabs.map(vocab => vocab._id) || [];
        console.log("LearnedVocabularyId: ", learnedVocabularyIds)

        // Lấy danh sách từ vựng của bài học
        const vocabRes = await fetch(`/api/vocabularies?lessonId=${lessonId}`);
        if (!vocabRes.ok) throw new Error("Không thể tải danh sách từ vựng");
        const vocabData = await vocabRes.json();
        setVocalInLesson(vocabData.length);

        // Lọc các từ mới (chưa học)
        let newWords = [];
        if (learnedVocabularyIds.length > 0) {
          newWords = vocabData
            .filter(word => !learnedVocabularyIds.includes(word._id.toString()))
            .slice(0, 10);
        } else {
          newWords = vocabData.slice(0, 10);
        }

        const detailNewWords = newWords.map(word => ({
          vocabularyId: word._id,
          term: word.term, // Đổi term thành word để khớp với schema
          pronunciation: word.pronunciation,
          definition: word.definition, // Đổi definition thành meaning
          example: word.example,
        }));
        setNewWords(detailNewWords);

        // Lấy danh sách từ đã học trong bài học này
        let learnedWordsDetails = [];
        if (learnedVocabularyIds.length > 0) {
          learnedWordsDetails = vocabData
            .filter(word => learnedVocabularyIds.includes(word._id.toString()))
            .map(word => ({
              vocabularyId: word._id,
              term: word.term,
              pronunciation: word.pronunciation,
              definition: word.definition,
              example: word.example,
            }));
        }

        const finalWords = [...learnedWordsDetails, ...detailNewWords];
        setVocabularies(finalWords);
        const count1 = learnedWordsDetails.length;
        const count2 = detailNewWords.length;
        setTotalWords(count1 + count2);
        setWordsLearned(0); // Đặt số từ đã học ban đầu
        console.log("Số từ đã học:", count1);
        console.log("Số từ mới:", count2);
        console.log("Tổng số từ:", count1 + count2);
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        setError("Lỗi tải dữ liệu: " + error.message);
      }
    }

    fetchData();
  }, [userId, lessonId]);

  // Notification when task completed
  useEffect(() => {
    if (state === "Kết Thúc") {
      setTimeout(() => {
        alert("🎉 Bạn đã hoàn thành việc học ngày hôm nay!");
        router.push('/dashboard'); // Chuyển hướng về Dashboard
      }, 1000);
    }
  }, [state, router]);

  // Handle controls
  const handleNext = async () => {
    if (vocabularies.length === 0) return;

    setIsFlipped(false);
    const newIndex = (currentIndex + 1) % vocabularies.length;
    setCurrentIndex(newIndex);
    setWordsLearned((prev) => prev + 1);

    // Nếu đây là từ mới (chưa học), gọi API để lưu
    const currentVocab = vocabularies[currentIndex];
    if (newWords.some(word => word.vocabularyId === currentVocab.vocabularyId)) {
      console.log("New Words: ", newWords);
      console.log(currentVocab.vocabularyId)
      try {
        const response = await fetch('/api/user/learned-vocab', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            vocabId: currentVocab.vocabularyId,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Không thể lưu từ đã học');
        }
        console.log("Đã lưu từ:", currentVocab.term);
      } catch (error) {
        console.error("Lỗi khi lưu từ đã học:", error);
        setError("Lỗi khi lưu từ: " + error.message);
      }
    }
    // Kiểm tra nếu đã học hết từ
    if (wordsLearned + 1 === totalWords) {
      setState("Kết Thúc");
      try {
        const res = await fetch(`/api/user_progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            lessonId,
            vocabularies: newWords.slice(0, 10).map(vocab => ({
              _id: vocab.vocabularyId,
              state: vocab.state || "new"
            })),
          }),
        });
        if (totalWords == vocalInLesson) {
          const res = await fetch(`/api/user_progress`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              lessonId,
            })
          })
          if (!res.ok) throw new Error("Không thể lưu tiến trình");
          console.log("Tiến trình đã được cập nhật!");
        };
        if (!res.ok) throw new Error("Không thể lưu tiến trình");
        console.log("Tiến trình đã được lưu!");

      } catch (error) {
        console.error("Lỗi khi lưu tiến trình:", error);
      }
    }
  }
  const handlePrev = () => {
    if (vocabularies.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + vocabularies.length) % vocabularies.length);
  };

  return (
    <div className="container-fluid min-vh-100 d-flex flex-column align-items-center justify-content-center py-5" style={{ background: "linear-gradient(135deg, #e0f7fa, #b2ebf2)" }}>
      {error && (
        <div className="alert alert-danger text-center mb-4" role="alert">
          {error}
        </div>
      )}

      <h2 className="text-center mb-5 text-dark fw-bold fs-1 d-flex align-items-center gap-2">
        <i className="bi bi-book text-primary"></i> Học Từ Vựng
      </h2>

      {vocabularies.length > 0 ? (
        <div className="w-100" style={{ maxWidth: "800px" }}>
          {/* Flip Card */}
          <div
            className={`card shadow-lg flip-card ${isFlipped ? 'flipped' : ''}`}
            onClick={() => setIsFlipped(!isFlipped)}
            style={{ minHeight: "400px", borderRadius: "15px", cursor: "pointer" }}
          >
            <div className="card-inner">
              <div className="card-front bg-light d-flex flex-column justify-content-center align-items-center" style={{ padding: '13rem' }}>
                <h3 className="text-primary fw-bold fs-2 mb-3">{vocabularies[currentIndex]?.term}</h3>
                <p className="text-muted fs-4">/{vocabularies[currentIndex]?.pronunciation}/</p>
              </div>
              <div className="card-back bg-primary text-white d-flex flex-column justify-content-center align-items-start" style={{ padding: '13rem' }}>
                <p className="fs-5 mb-3"><strong>Định nghĩa:</strong> {vocabularies[currentIndex]?.definition || "Chưa có định nghĩa"}</p>
                <p className="fs-5 mb-3"><strong>Ví dụ:</strong> <em>"{vocabularies[currentIndex]?.example || "Chưa có ví dụ"}"</em></p>
                <p className="fs-5"><strong>Phát âm:</strong> /{vocabularies[currentIndex]?.pronunciation}/</p>
              </div>
            </div>
          </div>

          {/* Nút đánh giá */}
          <div className="mt-4 d-flex flex-wrap justify-content-center gap-3">
            <button className="btn px-4 py-2 shadow-sm" style={{ background: "linear-gradient(45deg, #28a745, #34d058)", color: "white" }}>
              <i className="bi bi-check-circle me-2"></i> Dễ
            </button>
            <button className="btn px-4 py-2 shadow-sm" style={{ background: "linear-gradient(45deg, #ffc107, #ffda6a)", color: "black" }}>
              <i className="bi bi-exclamation-circle me-2"></i> Trung bình
            </button>
            <button className="btn px-4 py-2 shadow-sm" style={{ background: "linear-gradient(45deg, #dc3545, #ff6b6b)", color: "white" }}>
              <i className="bi bi-x-circle me-2"></i> Khó
            </button>
            <button className="btn px-4 py-2 shadow-sm" style={{ background: "linear-gradient(45deg, #6c757d, #adb5bd)", color: "white" }}>
              <i className="bi bi-skip-forward me-2"></i> Bỏ qua
            </button>
          </div>

          {/* Nút điều hướng */}
          <div className="mt-4 d-flex justify-content-center gap-3">
            <button
              className="btn fw-semibold px-4 py-2 shadow-sm"
              onClick={handlePrev}
              disabled={vocabularies.length === 0}
              style={{ background: "linear-gradient(45deg, #6c757d, #adb5bd)", color: "white" }}
            >
              <i className="bi bi-arrow-left me-2"></i> Trước
            </button>
            <button
              className="btn fw-semibold px-4 py-2 shadow-sm"
              onClick={handleNext}
              disabled={vocabularies.length === 0}
              style={{ background: "linear-gradient(45deg, #007bff, #00c4ff)", color: "white" }}
            >
              {state} <i className="bi bi-arrow-right ms-2"></i>
            </button>
          </div>

          {/* Tiến trình */}
          <div className="mt-4 text-center">
            <p className="text-muted">Tiến trình: {wordsLearned}/{totalWords}</p>
            <div className="progress" style={{ height: "10px" }}>
              <div
                className="progress-bar bg-success"
                style={{ width: `${(wordsLearned / totalWords) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-5">
          <div className="spinner-grow text-primary" style={{ width: "3rem", height: "3rem" }}>
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p className="text-muted mt-3">Đang tải từ vựng...</p>
        </div>
      )}

      <Link href="/dashboard/lesson" className="mt-4 text-primary fw-semibold d-flex align-items-center gap-2">
        <i className="bi bi-arrow-left-circle"></i> Quay lại danh sách bài học
      </Link>

      {/* CSS tùy chỉnh */}
      <style jsx>{`
        .flip-card {
          perspective: 1000px;
        }
        .card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }
        .flip-card.flipped .card-inner {
          transform: rotateY(180deg);
        }
        .card-front, .card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 15px;
        }
        .card-back {
          transform: rotateY(180deg);
        }
        .card-front, .card-back {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }
        .card-back {
          align-items: start;
          text-align: left;
        }
      `}</style>
    </div>
  );
}
