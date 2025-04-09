'use client'
export default function Footer() {
    return (
      <footer className="bg-primary text-white text-center py-3">
        <div className="container">
          <p>&copy; 2025 Douzipp. All rights reserved.</p>
          <p>
            <a href="/terms" className="text-white">Terms of Service</a> | 
            <a href="/privacy" className="text-white"> Privacy Policy</a>
          </p>
        </div>
      </footer>
    );
  }
  