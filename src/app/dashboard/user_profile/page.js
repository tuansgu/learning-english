"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter từ next/navigation
import { decodeTokenBackend } from "@/utils/auth";
import 'bootstrap/dist/css/bootstrap.min.css';
import Notification from '@/components/alertnotification'; // Sửa tên import

export default function UserProfile() {
  const router = useRouter(); // Sử dụng useRouter
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ email: '', fullname: '' });
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    const fetchUserId = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Vui lòng đăng nhập để xem hồ sơ.");
        setMessage("Vui lòng đăng nhập để xem hồ sơ.");
        setMessageType("failed");
        setTimeout(() => {
          router.push("/signin"); // Sử dụng router.push
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
          router.push("/signin"); // Sử dụng router.push
        }, 1000);
        setLoading(false);
      }
    };
    fetchUserId();
  }, [router]); // Thêm router vào dependency array

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/user?userId=${userId}`);
        if (!res.ok) {
          throw new Error(`Lỗi ${res.status}: ${await res.text()}`);
        }
        const data = await res.json();
        setUser(data);
        setFormData({ email: data.email, fullname: data.fullname });
        setError(null);
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu user:", err);
        setError(err.message);
        setMessage("Lỗi khi lấy dữ liệu user: " + err.message);
        setMessageType("failed");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdateError(null);
    setUpdateSuccess(null);
    setMessage('');
    setMessageType('success');

    try {
      const res = await fetch(`/api/user?userId=${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          fullname: formData.fullname,
        }),
      });

      if (!res.ok) {
        throw new Error(`Lỗi ${res.status}: ${await res.text()}`);
      }
      setMessage("Cập nhật thành công!!!");
      setMessageType("success");
      const updatedUser = await res.json();
      setUser(updatedUser);
      setIsEditing(false);
    } catch (err) {
      setUpdateError(err.message);
      setMessage("Cập nhật thất bại: " + err.message);
      setMessageType("failed");
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    setMessage('');
    setMessageType('success');

    const { oldPassword, newPassword, confirmPassword } = passwordData;

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("Vui lòng điền đầy đủ các trường.");
      setMessage("Vui lòng điền đầy đủ các trường.");
      setMessageType("failed");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu mới và xác nhận mật khẩu không khớp.");
      setMessage("Mật khẩu mới và xác nhận mật khẩu không khớp.");
      setMessageType("failed");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      setMessage("Mật khẩu mới phải có ít nhất 6 ký tự.");
      setMessageType("failed");
      return;
    }

    try {
      const res = await fetch(`/api/user/password?userId=${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      if (!res.ok) {
        throw new Error(`Lỗi ${res.status}: ${await res.text()}`);
      }

      setPasswordSuccess("Đổi mật khẩu thành công!");
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordModal(false);
      setMessage("Đổi mật khẩu thành công!!!");
      setMessageType("success");
    } catch (err) {
      setPasswordError(err.message);
      setMessage("Đổi mật khẩu thất bại: " + err.message);
      setMessageType("failed");
    }
  };

  if (loading) return <div className="main-content text-center mt-5">Đang tải...</div>;
  if (error) return <div className="main-content text-center mt-5 text-danger">Lỗi: {error}</div>;
  if (!user) return <div className="main-content text-center mt-5">Không có dữ liệu user</div>;

  return (
    <div className="main-content py-5">
      {/* Hiển thị thông báo ở đầu trang */}
      {message && <Notification message={message} type={messageType} onClose={() => setMessage("")} />}

      <div className="container">
        {/* Profile Header */}
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h1 className="card-title text-primary fw-bold mb-3 text-center">
              THÔNG TIN NGƯỜI DÙNG
            </h1>

            <form onSubmit={handleUpdate}>
              <div className="mb-3">
                <label htmlFor="username" className="form-label fw-semibold">
                  Tên người dùng
                </label>
                <input
                  type="text"
                  id="username"
                  className="form-control"
                  value={user.username}
                  disabled
                />
              </div>
              <div className="mb-3">
                <label htmlFor="email" className="form-label fw-semibold">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-control"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="fullname" className="form-label fw-semibold">
                  Họ và tên
                </label>
                <input
                  type="text"
                  id="fullname"
                  name="fullname"
                  className="form-control"
                  value={formData.fullname}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="d-flex justify-content-end gap-2">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({ email: user.email, fullname: user.fullname });
                        setUpdateError(null);
                        setUpdateSuccess(null);
                        setMessage('');
                      }}
                    >
                      Hủy
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Lưu
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setIsEditing(true)}
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      type="button"
                      className="btn btn-warning"
                      onClick={() => setShowPasswordModal(true)}
                    >
                      Đổi mật khẩu
                    </button>
                  </>
                )}
              </div>
            </form>

            <div className="d-flex justify-content-around flex-wrap gap-3 bg-light p-3 rounded mt-4">
              <div>
                <p className="fw-semibold mb-0">Total Words</p>
                <p className="text-success fs-4">{user.total_words}</p>
              </div>
              <div>
                <p className="fw-semibold mb-0">Streak</p>
                <p className="text-success fs-4">{user.streak} days</p>
              </div>
              <div>
                <p className="fw-semibold mb-0">Days Learned</p>
                <p className="text-success fs-4">{user.days_learned}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal đổi mật khẩu */}
        <div className={`modal fade ${showPasswordModal ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Đổi mật khẩu</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                    setPasswordError(null);
                    setPasswordSuccess(null);
                    setMessage('');
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handlePasswordUpdate}>
                  <div className="mb-3">
                    <label htmlFor="oldPassword" className="form-label">Mật khẩu cũ</label>
                    <input
                      type="password"
                      id="oldPassword"
                      name="oldPassword"
                      className="form-control"
                      value={passwordData.oldPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="newPassword" className="form-label">Mật khẩu mới</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      className="form-control"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      className="form-control"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowPasswordModal(false);
                        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                        setPasswordError(null);
                        setPasswordSuccess(null);
                        setMessage('');
                      }}
                    >
                      Hủy
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Lưu
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <h2 className="mb-4 text-secondary border-bottom pb-2">Achievements</h2>
        {user.earnedAchievements && user.earnedAchievements.length > 0 ? (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            {user.earnedAchievements.map((ach, index) => (
              <div key={index} className="col">
                <div className="card h-100 shadow-sm border-success">
                  <div className="card-body d-flex align-items-start">
                    <span className="fs-2 me-3 text-success">{ach.achievementId.icon}</span>
                    <div>
                      <h5 className="card-title fw-bold text-success">{ach.achievementId.title}</h5>
                      <p className="card-text">{ach.achievementId.description}</p>
                      <small className="text-muted">
                        Earned: {new Date(ach.earnedAt).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="alert alert-info text-center" role="alert">
            Chưa có thành tựu nào.
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