"use client";
import { useState, useEffect } from "react";
import { decodeTokenBackend } from "@/utils/auth";

export default function UserProgress() {
  const [userId, setUserId] = useState(null);
  const [progress, setProgress] = useState({
    totalWordsLearned: 0,
    stateStats: { new: 0, easy: 0, medium: 0, hard: 0, skipped: 0 },
    lessons: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Vui lòng đăng nhập để xem tiến trình.");
        setLoading(false);
        return;
      }

      const data = await decodeTokenBackend(token);
      if (data?.userId) {
        setUserId(data.userId);
      } else {
        setError("Không thể giải mã token.");
        setLoading(false);
      }
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    if (!userId) return;

    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/user_progress?userId=${userId}`);
        if (!res.ok) {
          throw new Error("Không thể tải tiến trình");
        }

        const { success, progress } = await res.json();
        console.log("API response:", { success, progress });

        const lessons = Array.isArray(progress) ? progress : [];
        let totalWords = 0;
        let stateCounts = { new: 0, easy: 0, medium: 0, hard: 0, skipped: 0 };

        lessons.forEach((lesson) => {
          totalWords += lesson.learnedWords?.length || 0;
          lesson.learnedWords?.forEach((word) => {
            const state = word.state || "new";
            if (stateCounts[state] !== undefined) {
              stateCounts[state]++;
            }
          });
        });

        setProgress({
          totalWordsLearned: totalWords,
          stateStats: stateCounts,
          lessons: lessons,
        });
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        setError(error.message);
        setProgress({
          totalWordsLearned: 0,
          stateStats: { new: 0, easy: 0, medium: 0, hard: 0, skipped: 0 },
          lessons: [],
        }); // Reset progress khi lỗi
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-vh-100 bg-light py-4 px-3">
      <div className="main-content py-5">
        {/* Tiêu đề */}
        <h2 className="display-5 fw-bold text-center text-dark mb-4">
          <i className="bi bi-bar-chart-fill me-2 text-primary"></i> Tiến Trình Học
        </h2>
  
        {/* Tổng số từ và Phân loại từ nằm ngang */}
        <div className="d-flex justify-content-center gap-4 mb-4 flex-wrap">
          {/* Tổng số từ đã học */}
          <div
            className="card shadow border-0 flex-grow-1"
            style={{ maxWidth: "20rem", minWidth: "16rem" }}
          >
            <div className="card-body text-center py-3 px-4">
              <p className="fs-5 fw-semibold text-dark mb-0">
                <i className="bi bi-book-fill me-2 text-info"></i> Tổng số từ
              </p>
              <p className="fs-2 fw-bold text-primary mt-1">
                {progress.totalWordsLearned}
              </p>
            </div>
          </div>
  
          {/* Phân loại từ */}
          <div
            className="card shadow border-0 flex-grow-1"
            style={{ maxWidth: "28rem", minWidth: "20rem" }}
          >
            <div className="card-body text-center py-3 px-4">
              <h3 className="fs-5 fw-bold text-dark mb-3">
                <i className="bi bi-tags-fill me-2 text-warning"></i> Phân loại từ
              </h3>
              <div className="d-flex flex-wrap gap-2">
                {Object.entries(progress.stateStats).map(([state, count]) => (
                  <span
                    key={state}
                    className={`badge fs-6 px-3 py-2 ${
                      state === "easy"
                        ? "bg-success text-white shadow-sm"
                        : state === "medium"
                        ? "bg-warning text-dark shadow-sm"
                        : state === "hard"
                        ? "bg-danger text-white shadow-sm"
                        : state === "skipped"
                        ? "bg-secondary text-white shadow-sm"
                        : "bg-primary text-white shadow-sm"
                    }`}
                    style={{
                      borderRadius: "1rem",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.target.style.transform = "scale(1.1)")}
                    onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
                  >
                    {state.charAt(0).toUpperCase() + state.slice(1)}: {count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
  
        {/* Danh sách bài học */}
        <div className="card shadow border-0 mx-auto" style={{ maxWidth: "62rem" }}>
          <div className="card-body py-4 px-5">
            <h3 className="fs-3 fw-bold text-center text-dark mb-4">
              <i className="bi bi-book-half me-2 text-indigo"></i> Danh sách bài học
            </h3>
  
            <div
              className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3"
              style={{ maxHeight: "20rem", overflowY: "auto" }}
            >
              {progress.lessons.length > 0 ? (
                progress.lessons.map((lesson) => (
                  <div key={lesson._id} className="col">
                    <div
                      className="card h-100 border-0 shadow-sm bg-gradient"
                      style={{
                        background: "linear-gradient(135deg, #ffffff, #f8f9fa)",
                        transition: "all 0.3s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.2)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)")
                      }
                    >
                      <div className="card-body p-3">
                        <h5 className="card-title fs-5 fw-semibold text-dark mb-2 text-center">
                          <i className="bi bi-mortarboard-fill me-2 text-primary"></i>
                          {lesson.lesson.title}
                        </h5>
                        {/* <p className="card-text text-muted text-center mb-2">
                          <i className="bi bi-check-circle-fill me-2 text-success"></i>
                          <strong>Trạng thái:</strong>{" "}
                          <span
                            className={`badge fw-medium ${
                              lesson.status === "completed"
                                ? "bg-success text-white"
                                : "bg-warning text-dark"
                            }`}
                          >
                            {lesson.status === "completed" ? "Hoàn thành" : "Đang học"}
                          </span>
                        </p> */}
                        <p className="card-text text-center text-muted">
                          <i className="bi bi-bookmark-fill me-2 text-info"></i>
                          <strong>Số từ mới:</strong>{" "}
                          <span className="fw-bold text-info">
                            {lesson.learnedWords?.length || 0}
                          </span>
                        </p>
                        <p className="card-text text-muted text-center">
                        <strong>Ngày học: {lesson.createdAt ? new Date(lesson.createdAt).toISOString().split('T')[0] : "Không xác định"}</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12 text-center py-4">
                  <p className="text-muted fs-5">
                    <i className="bi bi-exclamation-circle me-2"></i> Chưa có bài học nào.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
  
        {/* CSS tùy chỉnh */}
        <style jsx>{`
          .main-content {
          margin-left: 250px;
          padding: 0 15px;
          min-height: 100vh;
          }
          .bg-gradient {
            background: linear-gradient(135deg, #ffffff, #f8f9fa);
          }
          .card {
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            border-radius: 0.75rem;
          }
          .card:hover {
            transform: translateY(-3px);
          }
          .badge {
            font-weight: 500;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          ::-webkit-scrollbar {
            width: 6px;
          }
          ::-webkit-scrollbar-track {
            background: #e9ecef;
            border-radius: 3px;
          }
          ::-webkit-scrollbar-thumb {
            background: #6c757d;
            border-radius: 3px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #495057;
          }
        `}</style>
      </div>
    </div>
  );

}