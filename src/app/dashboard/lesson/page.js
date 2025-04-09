"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import alertNo from '@/components/alertnotification';
import { SearchIcon } from "lucide-react";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function LessonPage() {
  const [lessons, setLessons] = useState([]);
  const [filteredLessons, setFilteredLessons] = useState([]);
  const [newLesson, setNewLesson] = useState({ title: "", description: "" });
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchLessons() {
      try {
        const res = await fetch("/api/lessons");
        if (!res.ok) throw new Error("Failed to fetch lessons");

        const data = await res.json();
        setLessons(data);
        setFilteredLessons(data);
      } catch (error) {
        console.error(error);
        setMessageType("error");
        setMessage("Không thể tải danh sách bài học.");
      }
    }
    fetchLessons();
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = lessons.filter(lesson =>
      lesson.title.toLowerCase().includes(term)
    );
    setFilteredLessons(filtered);
  };

  const addLesson = async () => {
    if (!newLesson.title || !newLesson.description) {
      setMessageType("warning");
      setMessage("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    try {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newLesson.title,
          description: newLesson.description,
          userId: "123",
          isPublic: true
        }),
      });

      if (!res.ok) throw new Error("Failed to add lesson");

      const data = await res.json();
      const updatedLessons = [...lessons, { _id: data.id, ...newLesson }];
      setLessons(updatedLessons);
      setFilteredLessons(updatedLessons);
      setNewLesson({ title: "", description: "" });
      setShowModal(false);

      setMessageType("success");
      setMessage("Bài học đã được thêm thành công!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error(error);
      setMessageType("error");
      setMessage("Thêm bài học thất bại.");
    }
  };

  return (
    <div className="main-content py-5" style={{ background: "linear-gradient(135deg, #e0f7fa, #b2ebf2)" }}>
      <div className="container">
        <h2 className="text-center mb-5 text-dark fw-bold" style={{ fontSize: "2.5rem", textShadow: "1px 1px 2px rgba(0,0,0,0.1)" }}>
          Bài Học Bạn Có Thể Học
        </h2>

        {message && <alertNo message={message} type={messageType} onClose={() => setMessage("")} />}

        {/* Thanh tìm kiếm và nút */}
        <div className="d-flex justify-content-between align-items-center mb-5">
          <button
            className="btn btn-primary fw-semibold px-4 py-2 shadow-sm"
            onClick={() => setShowModal(true)}
            style={{ background: "linear-gradient(45deg, #007bff, #00c4ff)", border: "none" }}
          >
            <i className="bi bi-plus-lg me-2"></i>Thêm Bài Học
          </button>
          <div className="input-group w-50 w-md-25 shadow-sm">
            <span className="input-group-text bg-white border-end-0">
              <SearchIcon size={20} className="text-primary" />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm bài học..."
              className="form-control border-start-0"
              value={searchTerm}
              onChange={handleSearch}
              style={{ borderRadius: "0 10px 10px 0" }}
            />
          </div>
        </div>

        {/* Modal thêm bài học */}
        {showModal && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
            <div className="modal-dialog modal-dialog-centered animate__animated animate__zoomIn">
              <div className="modal-content shadow-lg border-0" style={{ borderRadius: "15px" }}>
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title mx-auto fw-bold">Thêm Bài Học Mới</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <div className="modal-body p-4">
                  <input
                    type="text"
                    placeholder="Tiêu đề bài học"
                    className="form-control mb-3 shadow-sm"
                    value={newLesson.title}
                    onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                    style={{ borderRadius: "10px" }}
                  />
                  <textarea
                    placeholder="Mô tả bài học"
                    className="form-control mb-3 shadow-sm"
                    value={newLesson.description}
                    onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                    rows="4"
                    style={{ borderRadius: "10px" }}
                  />
                </div>
                <div className="modal-footer border-0">
                  <button
                    className="btn btn-outline-secondary fw-semibold px-4"
                    onClick={() => setShowModal(false)}
                  >
                    Hủy
                  </button>
                  <button
                    className="btn btn-primary fw-semibold px-4"
                    onClick={addLesson}
                    style={{ background: "linear-gradient(45deg, #007bff, #00c4ff)", border: "none" }}
                  >
                    Lưu Bài Học
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Danh sách bài học */}
        <div className="row row-cols-1 row-cols-md-3 row-cols-lg-4 g-4">
          {filteredLessons.length > 0 ? (
            filteredLessons.map((lesson, index) => (
              <div key={lesson._id || index} className="col">
                <Link href={`/dashboard/lesson/${lesson._id}`} className="text-decoration-none">
                  <div className="card h-100 shadow-sm border-0 hover-card">
                    <div
                      className="card-img-top bg-primary"
                      style={{
                        height: "100px",
                        background: "linear-gradient(45deg, #007bff, #00c4ff)",
                        borderRadius: "10px 10px 0 0"
                      }}
                    />
                    <div className="card-body text-center">
                      <h4 className="card-title text-dark fw-bold mb-2">{lesson.title}</h4>
                      <h6 className="card-subtitle mb-2 text-muted">
                        Level: {lesson.level || "Chưa xác định"}
                      </h6>
                      <p className="card-text text-muted small">{lesson.description}</p>
                      <span className="badge bg-success mt-2">Public</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))
          ) : (
            <div className="col-12 text-center text-muted py-5">
              <i className="bi bi-book fs-1 mb-3"></i>
              <p>Không tìm thấy bài học nào.</p>
            </div>
          )}
        </div>
      </div>

      {/* CSS tùy chỉnh */}
      <style jsx>{`
        .main-content {
          margin-left: 250px;
          padding: 0 15px;
          min-height: 100vh;
        }
        .hover-card:hover {
          transform: translateY(-8px);
          transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }
        .animate__zoomIn {
          animation: zoomIn 0.3s ease-in-out;
        }
        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}