
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';

export default function Layout({ children }) {
  return (
    <html lang="en">
      <head />
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <main style={{ flex: 1 }}>
          {children} {/* Nội dung chính */}
        </main>
      </body>
    </html>
  );
}
