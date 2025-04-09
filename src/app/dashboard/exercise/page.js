"use client";
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { decodeTokenBackend } from "@/utils/auth";
import 'bootstrap/dist/css/bootstrap.min.css';
import Notification from '@/components/alertnotification';
import { progress } from 'framer-motion';

export default function Exercise() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [learnedWords, setLearnedWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
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
        setMessage("Vui lòng đăng nhập để tiếp tục. Bạn sẽ được chuyển hướng sau 3 giây...");
        setMessageType("failed");
        setTimeout(() => router.push("/signin"), 3000);
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
        setMessage("Đã hết phiên đăng nhập, vui lòng đăng nhập lại. Bạn sẽ được chuyển hướng sau 3 giây...");
        setMessageType("failed");
        setTimeout(() => router.push("/signin"), 3000);
        setLoading(false);
      }
    };
    fetchUserId();
  }, [router]);

  useEffect(() => {
    const fetchLearnedWords = async () => {
      if (!userId) return;

      try {
        setLoading(true);

        console.log("userId:", userId); // Kiểm tra userId

        // Bước 1: Lấy danh sách learnedWordId từ user_progress
        const progressRes = await fetch(`/api/user_progress?userId=${userId}`);
        const progressData = await progressRes.json();
        if (!progressRes.ok) throw new Error(progressData.message || "Không thể lấy tiến trình học");

        console.log("progressData:", progressData); // Kiểm tra toàn bộ dữ liệu trả về
        console.log("progressData.progress:", progressData.progress); // Kiểm tra progress

        const learnedWordIds = Array.isArray(progressData.progress)
          ? progressData.progress
            .flatMap(item => {
              console.log("learnedWords:", item.learnedWords);
              if (Array.isArray(item.learnedWords)) {
                return item.learnedWords
                  .map(word => word.vocabularyId) // Chỉ lấy vocabularyId
                  .filter(_id => _id);
              }
              return [];
            })
            .filter(_id => _id)
          : [];
        console.log("learnedWordIds:", learnedWordIds);

        if (learnedWordIds.length === 0) {
          setLearnedWords([]);
          setMessage("Bạn chưa học từ vựng nào để làm bài tập.");
          setMessageType("info");
          setLoading(false);
          return;
        }

        // Bước 2: Lấy thông tin chi tiết của các từ vựng từ vocabulary
        const vocabRes = await fetch(`/api/vocabulary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: learnedWordIds }),
        });
        const vocabData = await vocabRes.json();
        if (!vocabRes.ok) throw new Error(vocabData.message || "Không thể lấy thông tin từ vựng");

        const validWords = Array.isArray(vocabData.vocabularies)
          ? vocabData.vocabularies.filter(word => word && word.term && word.definition)
          : [];
        if (validWords.length === 0) {
          setLearnedWords([]);
          setMessage("Không tìm thấy thông tin từ vựng đã học.");
          setMessageType("info");
          setLoading(false);
          return;
        }

        setLearnedWords(validWords);
      } catch (err) {
        setError(err.message);
        setMessage("Lỗi khi lấy từ đã học: " + err.message);
        setMessageType("failed");
      } finally {
        setLoading(false);
      }
    };
    fetchLearnedWords();
  }, [userId]);

  // Tạo đáp án multiple choice
  const currentOptions = useMemo(() => {
    if (learnedWords.length < 4 || currentIndex >= learnedWords.length) return [];

    const currentWord = learnedWords[currentIndex];
    if (!currentWord || !currentWord.definition || !currentWord.term) return [];

    const correctAnswer = currentWord.definition;

    const otherDefinitions = learnedWords
      .filter((_, index) => index !== currentIndex)
      .map(word => word.definition)
      .filter(def => def && typeof def === 'string');

    if (otherDefinitions.length < 3) return [];

    const wrongAnswers = [];
    const usedIndices = new Set();
    while (wrongAnswers.length < 3) {
      const randomIndex = Math.floor(Math.random() * otherDefinitions.length);
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        wrongAnswers.push(otherDefinitions[randomIndex]);
      }
    }

    const allOptions = [correctAnswer, ...wrongAnswers];
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }

    return allOptions;
  }, [learnedWords, currentIndex]);

  useEffect(() => {
    if (currentOptions.length === 0 && learnedWords.length >= 4) {
      setMessage("Không đủ dữ liệu để tạo đáp án.");
      setMessageType("info");
    }
    setOptions(currentOptions);
  }, [currentOptions, learnedWords]);

  // Xử lý khi người dùng chọn đáp án
  const handleOptionSelect = (option) => {
    if (selectedOption) return;

    setSelectedOption(option);
    const correctAnswer = learnedWords[currentIndex]?.definition;
    const isAnswerCorrect = option === correctAnswer;
    setIsCorrect(isAnswerCorrect);

    if (isAnswerCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }
  };

  // Xử lý chuyển sang câu hỏi tiếp theo
  const handleNext = () => {
    if (currentIndex < learnedWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      setMessage(`Bạn đã hoàn thành bài tập! Số câu đúng: ${correctAnswers}/${learnedWords.length}`);
      setMessageType("success");
      setTimeout(() => router.push('/dashboard'), 2000);
    }
  };

  // Xử lý bỏ qua câu hỏi
  const handleSkip = () => {
    if (currentIndex < learnedWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    }
  };

  if (loading) return <div className="main-content text-center mt-5">Đang tải...</div>;
  if (error) return <div className="main-content text-center mt-5 text-danger">Lỗi: {error}</div>;

  return (
    <div className="main-content py-5">
      {message && <Notification message={message} type={messageType} onClose={() => setMessage("")} />}

      <div className="container">
        <h1 className="text-primary fw-bold mb-4 text-center">Bài tập từ vựng đã học</h1>

        {/* Nút Quay về */}
        <div className="text-center mb-4">
          <button
            className="btn btn-secondary"
            onClick={() => router.push('/dashboard')}
          >
            Quay về Dashboard
          </button>
        </div>

        {learnedWords.length >= 4 && currentIndex < learnedWords.length ? (
          <div className="card shadow-lg" style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div className="card-body text-center">
              {/* Câu hỏi */}
              <h3 className="text-primary fw-bold fs-2 mb-4">
                Từ "{learnedWords[currentIndex].term || 'Không có từ'}" có nghĩa là gì?
              </h3>

              {/* Đáp án */}
              <div className="row g-3">
                {options.map((option, index) => (
                  <div className="col-6" key={index}>
                    <button
                      className={`btn px-4 py-2 shadow-sm w-100 ${selectedOption === option
                          ? isCorrect
                            ? "btn-success"
                            : "btn-danger"
                          : "btn-outline-primary"
                        }`}
                      onClick={() => handleOptionSelect(option)}
                      disabled={selectedOption !== null}
                      style={{minHeight: '100px'}}
                    >
                      {String.fromCharCode(65 + index)}. {option}
                    </button>
                  </div>
                ))}
              </div>

              {/* Phản hồi */}
              {selectedOption && (
                <div className="mt-3">
                  {isCorrect ? (
                    <p className="text-success fw-bold">Đúng rồi! 🎉</p>
                  ) : (
                    <p className="text-danger fw-bold">
                      Sai rồi! Đáp án đúng là: {learnedWords[currentIndex]?.definition || 'Không có định nghĩa'}
                    </p>
                  )}
                </div>
              )}

              {/* Nút Tiếp theo và Bỏ qua */}
              <div className="mt-4 d-flex justify-content-center gap-3">
                {selectedOption ? (
                  <button
                    className="btn btn-primary px-4 py-2"
                    onClick={handleNext}
                  >
                    {currentIndex < learnedWords.length - 1 ? "Tiếp theo" : "Hoàn thành"}
                  </button>
                ) : (
                  <button
                    className="btn btn-outline-secondary px-4 py-2"
                    onClick={handleSkip}
                    disabled={currentIndex >= learnedWords.length - 1}
                  >
                    Bỏ qua
                  </button>
                )}
              </div>

              {/* Tiến trình */}
              <div className="mt-4">
                <p className="text-muted">
                  Tiến trình: {currentIndex + 1}/{learnedWords.length} | Số câu đúng: {correctAnswers}
                </p>
                <div className="progress" style={{ height: "10px" }}>
                  <div
                    className="progress-bar bg-success"
                    style={{ width: `${((currentIndex + 1) / learnedWords.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="alert alert-info text-center" role="alert">
            Bạn cần học ít nhất 4 từ vựng để làm bài tập.{' '}
            <button className="btn btn-link p-0" onClick={() => router.push('/dashboard')}>
              Quay về Dashboard
            </button>
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