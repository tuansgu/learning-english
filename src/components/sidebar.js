"use client";
import React from "react";
import { Nav } from "react-bootstrap";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Book, Clipboard, User, LogOut, ChartBar, Trophy, PenSquare } from "lucide-react";

const Sidebar = () => {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/signin");
  };

  return (
    <div className="sidebar d-flex flex-column p-4 bg-light border-end shadow-sm">
      <div className="justify-content-center d-flex">
        <h4 className="text-primary fw-bold mb-4">Douzipp</h4>
      </div>
      <Nav className="flex-grow-1 flex-column gap-4 p-3">
        <Link href="/dashboard" className="d-flex align-items-center gap-2 text-dark" style={{ textDecoration: "none" }}>
          <Home size={18} /> Dashboard
        </Link>
        <Link href="/dashboard/flashcardSet" className="d-flex align-items-center gap-2 text-dark" style={{ textDecoration: "none" }}>
          <Book size={18} /> Flashcard
        </Link>
        <Link href="/dashboard/lesson" className="d-flex align-items-center gap-2 text-dark" style={{ textDecoration: "none" }}>
          <PenSquare size={18} /> Lesson
        </Link>
        <Link href="/dashboard/exercise" className="d-flex align-items-center gap-2 text-dark" style={{ textDecoration: "none" }}>
          <Clipboard size={18} /> Exercise
        </Link>
        <Link href="/dashboard/user_progress" className="d-flex align-items-center gap-2 text-dark" style={{ textDecoration: "none" }}>
          <ChartBar size={18} /> Progress
        </Link>
        <Link href="/dashboard/achievement" className="d-flex align-items-center gap-2 text-dark" style={{ textDecoration: "none" }}>
          <Trophy size={18} /> Achievements
        </Link>
        <Link href="/dashboard/user_profile" className="d-flex align-items-center gap-2 text-dark" style={{ textDecoration: "none" }}>
          <User size={18} /> Profile
        </Link>
      </Nav>
      <button
        onClick={handleLogout}
        className="d-flex align-items-center gap-2 text-dark bg-transparent border-0 p-0"
        style={{ textDecoration: "none", cursor: "pointer" }}
      >
        <LogOut size={18} /> Log Out
      </button>

      {/* CSS tùy chỉnh */}
      <style jsx>{`
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: 250px; /* Chiều rộng cố định */
          height: 100vh; /* Chiều cao full viewport */
          overflow-y: auto; /* Cuộn nếu nội dung dài */
          z-index: 1000; /* Đảm bảo sidebar nằm trên content */
        }
        .sidebar::-webkit-scrollbar {
          width: 8px;
        }
        .sidebar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        .sidebar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;