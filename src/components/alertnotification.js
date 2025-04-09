import { useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Notification({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000); // Tự động đóng sau 3 giây
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`toast align-items-center text-white ${type === 'success' ? 'bg-success' : 'bg-danger'} position-fixed top-0 end-0 m-3 show`} role="alert">
            <div className="d-flex">
                <div className="toast-body">{message}</div>
                <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={onClose}></button>
            </div>
        </div>
    );
}
