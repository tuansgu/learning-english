"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { decodeTokenBackend } from "@/utils/auth";
import 'bootstrap/dist/css/bootstrap.min.css';
import Notification from '@/components/alertnotification';
import Link from 'next/link';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [progressData, setProgressData] = useState([]); // Dữ liệu từ /api/user-progress
  const [lessons, setLessons] = useState([]); // Danh sách bài học đã học
  const [learnedVocabs, setLearnedVocabs] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [wordHistory, setWordHistory] = useState([]);
  const [vocabPage, setVocabPage] = useState(1);
  const [totalVocabPages, setTotalVocabPages] = useState(1);

  // Decode UserID
  useEffect(() => {
    const fetchUserId = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Vui lòng đăng nhập để xem dashboard.");
        setMessage("Vui lòng đăng nhập để xem dashboard.");
        setMessageType("failed");
        setTimeout(() => {
          router.push("/signin");
        }, 1000);
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
        setTimeout(() => {
          router.push("/signin");
        }, 1000);
        setLoading(false);
      }
    };
    fetchUserId();
  }, [router]);

  // Lấy dữ liệu từ các API
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        setLoading(true);

        // Lấy thông tin người dùng
        const userRes = await fetch(`/api/user?userId=${userId}`);
        if (!userRes.ok) {
          throw new Error(`Lỗi ${userRes.status}: ${await userRes.text()}`);
        }
        const userData = await userRes.json();
        setUser(userData);

        // Lấy tiến trình học từ /api/user-progress/[userId]
        const progressRes = await fetch(`/api/user_progress/${userId}`);
        let progressDataResponse = { progress: [] }; // Giá trị mặc định
        if (!progressRes.ok) {
          if (progressRes.status === 404) {
            setProgressData([]);
          } else {
            throw new Error(`Lỗi ${progressRes.status}: ${await progressRes.text()}`);
          }
        } else {
          progressDataResponse = await progressRes.json();
          if (!progressDataResponse.success) {
            setProgressData([]);
          } else {
            setProgressData(progressDataResponse.progress || []);
          }
        }

        // Nhóm các document UserProgress theo lessonId và tính tổng learnedWords
        const groupedProgress = progressDataResponse.progress.reduce((acc, progress) => {
          const lessonId = progress.lessonId.toString();
          if (!acc[lessonId]) {
            acc[lessonId] = {
              lessonId,
              lessonTitle: progress.lessonTitle,
              learnedWords: new Set(), // Sử dụng Set để tránh trùng lặp vocabularyId
              status: progress.status,
              progressDocs: [], // Lưu tất cả document để kiểm tra status
            };
          }
          // Thêm tất cả vocabularyId từ learnedWords vào Set
          progress.learnedWords.forEach(word => {
            acc[lessonId].learnedWords.add(word.vocabularyId.toString());
          });
          acc[lessonId].progressDocs.push(progress);
          // Nếu bất kỳ document nào có status "completed", thì toàn bộ lesson được coi là completed
          if (progress.status === "completed") {
            acc[lessonId].status = "completed";
          }
          return acc;
        }, {});

        // Tính tiến trình cho từng lesson
        const lessonsWithProgress = await Promise.all(
          Object.values(groupedProgress).map(async (group) => {
            // Lấy tổng số từ trong bài học
            const vocabRes = await fetch(`/api/vocabularies?lessonId=${group.lessonId}`);
            if (!vocabRes.ok) {
              throw new Error(`Lỗi ${vocabRes.status}: ${await vocabRes.text()}`);
            }
            const vocabData = await vocabRes.json();
            const totalWords = vocabData.length;

            // Tổng số từ đã học (không trùng lặp)
            const learnedWords = group.learnedWords.size;

            // Nếu status là "completed", tiến trình là 100%, nếu không thì tính như bình thường
            const progressPercentage = group.status === "completed"
              ? 100
              : totalWords > 0 ? (learnedWords / totalWords) * 100 : 0;

            return {
              _id: group.progressDocs[0]._id, // Lấy _id của document đầu tiên
              lessonId: group.lessonId,
              title: group.lessonTitle,
              progress: Math.round(progressPercentage),
              totalWords,
              learnedWords,
              status: group.status,
            };
          })
        );
        setLessons(lessonsWithProgress);

        // Lấy lịch sử học từ
        const wordHistoryRes = await fetch(`/api/user/word-history?userId=${userId}`);
        if (!wordHistoryRes.ok) {
          throw new Error(`Lỗi ${wordHistoryRes.status}: ${await wordHistoryRes.text()}`);
        }
        const wordHistoryData = await wordHistoryRes.json();
        setWordHistory(wordHistoryData);

        // Lấy danh sách từ đã học
        const learnedVocabRes = await fetch(`/api/user/learned-vocab?userId=${userId}&page=${vocabPage}`);
        if (!learnedVocabRes.ok) {
          throw new Error(`Lỗi ${learnedVocabRes.status}: ${await learnedVocabRes.text()}`);
        }
        const learnedVocabData = await learnedVocabRes.json();
        setLearnedVocabs(learnedVocabData.vocabs || []);
        setTotalVocabPages(learnedVocabData.totalPages || 1);

        setError(null);
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu:", err);
        setError(err.message);
        setMessage("Lỗi khi lấy dữ liệu: " + err.message);
        setMessageType("failed");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [userId, vocabPage]);

  // Dữ liệu cho biểu đồ Line (số từ học theo ngày)
  const lineChartData = {
    labels: wordHistory.map((entry) => entry.date),
    datasets: [
      {
        label: 'Số từ đã học',
        data: wordHistory.map((entry) => entry.words),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Dữ liệu cho biểu đồ Bar (tiến trình bài học)
  const barChartData = {
    labels: lessons.map((lesson) => lesson.title),
    datasets: [
      {
        label: 'Tiến trình (%)',
        data: lessons.map((lesson) => lesson.progress || 0),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Gợi ý bài học tiếp theo
  const suggestedLesson = lessons.find(
    (lesson) => (lesson.progress || 0) > 0 && (lesson.progress || 0) < 100
  );

  if (loading) return <div className="main-content text-center mt-5">Đang tải...</div>;
  if (error) return <div className="main-content text-center mt-5 text-danger">Lỗi: {error}</div>;
  if (!user) return <div className="main-content text-center mt-5">Không có dữ liệu user</div>;

  return (
    <div className="main-content py-5">
      {message && <Notification message={message} type={messageType} onClose={() => setMessage("")} />}

      <div className="container">
        <h1 className="text-primary fw-bold mb-4 text-center">
          Chào mừng, {user.fullname}!
        </h1>

        <div className="card shadow-sm mb-4">
          <div className="card-body text-center">
            <div className="d-flex justify-content-around flex-wrap gap-3 bg-light p-3 rounded">
              <div>
                <p className="fw-semibold mb-0">Total Words</p>
                <p className="text-success fs-4">{user.total_words || 0}</p>
              </div>
              <div>
                <p className="fw-semibold mb-0">Streak</p>
                <p className="text-success fs-4">{user.streak || 0} days</p>
              </div>
              <div>
                <p className="fw-semibold mb-0">Days Learned</p>
                <p className="text-success fs-4">{user.days_learned || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title text-center">Số từ học (7 ngày gần nhất)</h5>
                {wordHistory.length > 0 ? (
                  <Line
                    data={lineChartData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: 'top' },
                        title: { display: false },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: { display: true, text: 'Số từ' },
                        },
                        x: {
                          title: { display: true, text: 'Ngày' },
                        },
                      },
                    }}
                  />
                ) : (
                  <p className="text-center text-muted">Chưa có dữ liệu lịch sử học từ.</p>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-6 mb-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title text-center">Tiến trình bài học</h5>
                {lessons.length > 0 ? (
                  <Bar
                    data={barChartData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: 'top' },
                        title: { display: false },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          title: { display: true, text: 'Tiến trình (%)' },
                        },
                        x: {
                          title: { display: true, text: 'Bài học' },
                        },
                      },
                    }}
                  />
                ) : (
                  <p className="text-center text-muted">Chưa có dữ liệu tiến trình bài học.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {suggestedLesson && (
          <div className="card shadow-sm mb-4 bg-success-subtle border-success">
            <div className="card-body">
              <h5 className="card-title fw-bold text-success">Gợi ý học tiếp</h5>
              <p className="card-text">
                Tiếp tục bài học: <strong>{suggestedLesson.title}</strong> (Tiến trình: {suggestedLesson.progress}%)
              </p>
              <Link href={`/dashboard/lesson/${suggestedLesson.lessonId}/learn`} className="btn btn-success">
                Học ngay
              </Link>
            </div>
          </div>
        )}

        {user.earnedAchievements && user.earnedAchievements.length > 0 && (
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="card-title fw-bold text-success">Thành tựu gần đây</h5>
              <div className="d-flex align-items-start">
                <span className="fs-2 me-3 text-success">
                  {user.earnedAchievements[user.earnedAchievements.length - 1].achievementId.icon}
                </span>
                <div>
                  <h6 className="fw-bold text-success">
                    {user.earnedAchievements[user.earnedAchievements.length - 1].achievementId.title}
                  </h6>
                  <p className="card-text">
                    {user.earnedAchievements[user.earnedAchievements.length - 1].achievementId.description}
                  </p>
                  <small className="text-muted">
                    Đạt được: {new Date(user.earnedAchievements[user.earnedAchievements.length - 1].earnedAt).toLocaleDateString()}
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}

        <h2 className="mb-4 text-secondary border-bottom pb-2">Danh sách bài học đã học</h2>
        {lessons.length > 0 ? (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            {lessons.map((lesson) => (
              <div key={lesson._id} className="col">
                <div className="card h-100 shadow-sm border-primary">
                  <div className="card-body">
                    <h5 className="card-title fw-bold text-primary">{lesson.title}</h5>
                    <p className="card-text">
                      Số từ đã học: <span className="text-success">{lesson.learnedWords}</span> / {lesson.totalWords}
                    </p>
                    <p className="card-text">
                      Tiến trình: <span className="text-success">{lesson.progress}%</span>
                    </p>
                    <p className="card-text">
                      Trạng thái: <span className="text-success">{lesson.status}</span>
                    </p>
                    <Link href={`/dashboard/lesson/${lesson.lessonId}/learn`} className="btn btn-primary">
                      Học ngay
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="alert alert-info text-center" role="alert">
            Bạn chưa học bài nào.
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