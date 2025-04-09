"use client";
import { Book, PlusIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Notification from "@/components/alertnotification";
import Link from "next/link";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function LessonPage() {
    const params = useParams();
    const lessonId = params?.id || "";
    const [vocabularies, setVocabularies] = useState([]);
    const [message, setMessage] = useState("");
    const [newVocab, setNewVocab] = useState({
        term: "",
        definition: "",
        example: "",
        pronunciation: "",
        partOfSpeech: "",
    });
    const [showModal, setShowModal] = useState(false);
    const [messageType, setMessageType] = useState("success");

    useEffect(() => {
        if (!lessonId) return;

        async function fetchVocabularies() {
            try {
                const res = await fetch(`/api/vocabularies?lessonId=${lessonId}`);
                const data = await res.json();

                if (res.ok) {
                    if (Array.isArray(data) && data.length > 0) {
                        setVocabularies(data);
                        setMessage("");
                        setMessageType("success");
                    } else {
                        setMessage("Không có từ vựng trong bài học này.");
                        setMessageType("warning");
                    }
                } else {
                    setMessage(data.error || "Lỗi tải dữ liệu.");
                    setMessageType("error");
                }
            } catch (error) {
                setMessage("Lỗi kết nối server.");
                setMessageType("error");
            }
        }

        fetchVocabularies();
    }, [lessonId]);

    const handleChange = (e) => {
        setNewVocab({ ...newVocab, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!lessonId) return;

        try {
            const res = await fetch(`/api/vocabularies/${lessonId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...newVocab, lessonId }),
            });

            const data = await res.json();
            if (res.ok) {
                setVocabularies([...vocabularies, data]);
                setNewVocab({ term: "", definition: "", example: "", pronunciation: "", partOfSpeech: "" });
                setShowModal(false);
                setMessage("Thêm từ vựng thành công!");
                setMessageType("success");
                setTimeout(() => setMessage(""), 3000);
            } else {
                setMessage(data.error || "Lỗi khi thêm từ vựng.");
                setMessageType("error");
            }
        } catch (error) {
            setMessage("Lỗi kết nối server.");
            setMessageType("error");
        }
    };

    return (
        <div className="main-content">
            <div className="container">
                {/* Tiêu đề */}
                <h2 className="lesson-title">
                    <Book size={32} /> Từ Vựng Của Bài Học
                </h2>

                {/* Thông báo */}
                {message && <Notification message={message} type={messageType} onClose={() => setMessage("")} />}

                {/* Nút Thêm từ vựng và Học */}
                <div className="action-buttons">
                    <button
                        className="add-vocab-btn"
                        onClick={() => setShowModal(true)}
                    >
                        <PlusIcon size={20} className="me-2" /> Thêm Từ Vựng
                    </button>
                    <Link
                        href={`/dashboard/lesson/${lessonId}/learn`}
                        className="btn fw-semibold px-4 py-2 shadow-sm"
                        style={{ background: "linear-gradient(45deg, #28a745, #34d058)", border: "none", color: "white" }}
                    >
                        <Book size={20} className="me-2" /> Học
                    </Link>
                </div>

                {/* Danh sách từ vựng */}
                <div className="vocab-grid">
                    {vocabularies.length > 0 ? (
                        vocabularies.map((vocab) => (
                            <div key={vocab._id} className="vocab-card-wrapper">
                                <div className="vocab-card">
                                    <div className="card-header">
                                        {vocab.term} <span>({vocab.partOfSpeech})</span>
                                    </div>
                                    <div className="card-body">
                                        <p><strong>Nghĩa:</strong> {vocab.definition}</p>
                                        {vocab.pronunciation && (
                                            <p className="pronunciation">
                                                <strong>Phát âm:</strong> /{vocab.pronunciation}/
                                            </p>
                                        )}
                                        {vocab.example && (
                                            <p className="example">"{vocab.example}"</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-vocab">
                            <i className="bi bi-book"></i>
                            <p>Chưa có từ vựng nào trong bài học này.</p>
                        </div>
                    )}
                </div>

                {/* Modal thêm từ vựng */}
                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content animate__animated animate__fadeIn">
                            <div className="modal-header">
                                <h5 className="modal-title">Thêm Từ Vựng Mới</h5>
                                <button
                                    className="modal-close-btn"
                                    onClick={() => setShowModal(false)}
                                >
                                    <i className="bi bi-x-lg"></i>
                                </button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label>Từ vựng</label>
                                        <input
                                            type="text"
                                            name="term"
                                            value={newVocab.term}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Nghĩa</label>
                                        <input
                                            type="text"
                                            name="definition"
                                            value={newVocab.definition}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Ví dụ</label>
                                        <textarea
                                            name="example"
                                            value={newVocab.example}
                                            onChange={handleChange}
                                            rows="2"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Phát âm</label>
                                        <input
                                            type="text"
                                            name="pronunciation"
                                            value={newVocab.pronunciation}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Loại từ</label>
                                        <input
                                            type="text"
                                            name="partOfSpeech"
                                            value={newVocab.partOfSpeech}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="cancel-btn"
                                            onClick={() => setShowModal(false)}
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            type="submit"
                                            className="save-btn"
                                        >
                                            Lưu
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* CSS tùy chỉnh */}
            <style jsx>{`
        .main-content {
          margin-left: 250px;
          padding: 40px 20px;
          min-height: 100vh;
          background: linear-gradient(135deg, #f0f4ff, #d9e8ff);
        }

        /* Tiêu đề */
        .lesson-title {
          font-size: 2.5rem;
          font-weight: bold;
          text-align: center;
          color: #1a3c5e;
          margin-bottom: 40px;
          text-transform: uppercase;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .lesson-title svg {
          color: #007bff;
        }

        /* Nút Thêm từ vựng và Học */
        .action-buttons {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .add-vocab-btn, .learn-btn {
          display: flex;
          align-items: center;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .add-vocab-btn {
          background: linear-gradient(45deg, #007bff, #00c4ff);
        }

        .add-vocab-btn:hover {
          background: linear-gradient(45deg, #00c4ff, #007bff);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
        }

        .learn-btn {
          background: linear-gradient(45deg, #28a745, #34d058);
          text-decoration: none;
        }

        .learn-btn:hover {
          background: linear-gradient(45deg, #34d058, #28a745);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
        }

        /* Danh sách từ vựng */
        .vocab-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .vocab-card-wrapper {
          perspective: 1000px;
        }

        .vocab-card {
          background: #ffffff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .vocab-card:hover {
          transform: translateY(-8px) rotateX(5deg);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
          min-height: 260px;
        }

        .card-header {
          background: linear-gradient(45deg, #007bff, #00c4ff);
          color: #ffffff;
          padding: 15px;
          font-size: 18px;
          font-weight: 600;
          text-align: center;
        }

        .card-header span {
          font-size: 14px;
          color: #e0e0e0;
        }

        .card-body {
          padding: 20px;
        }

        .card-body p {
          margin: 0 0 10px;
          font-size: 16px;
          color: #333;
        }

        .pronunciation {
          color: #6c757d;
          font-size: 14px;
        }

        .example {
          color: #007bff;
          font-style: italic;
          font-size: 14px;
        }

        /* Không có từ vựng */
        .no-vocab {
          text-align: center;
          padding: 60px 0;
          color: #6c757d;
        }

        .no-vocab i {
          font-size: 48px;
          margin-bottom: 15px;
        }

        .no-vocab p {
          font-size: 18px;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: #ffffff;
          border-radius: 15px;
          width: 100%;
          max-width: 500px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          background: linear-gradient(45deg, #007bff, #00c4ff);
          color: #ffffff;
          padding: 20px;
          border-radius: 15px 15px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-title {
          font-size: 20px;
          font-weight: bold;
          margin: 0;
        }

        .modal-close-btn {
          background: transparent;
          border: none;
          color: #ffffff;
          font-size: 20px;
          cursor: pointer;
          transition: color 0.3s ease;
        }

        .modal-close-btn:hover {
          color: #ff4d4d;
        }

        .modal-body {
          padding: 30px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
          outline: none;
          transition: border-color 0.3s ease;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          border-color: #007bff;
          box-shadow: 0 0 8px rgba(0, 123, 255, 0.2);
        }

        .form-group textarea {
          resize: none;
        }

        .modal-footer {
          padding: 20px;
          display: flex;
          justify-content: flex-end;
          gap: 15px;
          border-top: none;
        }

        .cancel-btn {
          background: #f1f1f1;
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          font-size: 16px;
          font-weight: 600;
          color: #333;
          transition: all 0.3s ease;
        }

        .cancel-btn:hover {
          background: #e0e0e0;
          transform: translateY(-2px);
        }

        .save-btn {
          background: linear-gradient(45deg, #28a745, #34d058);
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
        }

        .save-btn:hover {
          background: linear-gradient(45deg, #34d058, #28a745);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(40, 167, 69, 0.5);
        }

        /* Animation cho modal */
        .animate__fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .main-content {
            margin-left: 0;
            padding: 20px;
          }

          .action-buttons {
            flex-direction: column;
            gap: 15px;
          }

          .add-vocab-btn, .learn-btn {
            width: 100%;
            justify-content: center;
          }

          .vocab-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
}