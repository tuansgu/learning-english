import React from "react";
import Sidebar from "@/components/sidebar";
import { Container } from "react-bootstrap";


export default function Layout({ children }) {
  return (
    <div className="d-flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Nội dung chính */}
      <Container fluid className="p-4">
        {children}
      </Container>
    </div>
  );
}
