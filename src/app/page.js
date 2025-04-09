
import Header from '@/components/header';
import Footer from '@/components/footer';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <div className="container flex-grow-1 d-flex align-items-center justify-content-center">
        <div className='d-flex align-items-center justify-content-center'>
          <img src='/work.avif' />
          <div className='text-center'>
            <h1>
              Learn English in just 5 minutes a day. For free.
            </h1>
            <div className='d-inline-grid'>
              <Link href="/signup" className="btn btn-primary text-white fw-bold mb-3 p-2 text-decoration-none">
                SIGN UP
              </Link>

              <Link href="/signin" className="btn btn-light text-primary fw-bold p-2 text-decoration-none">
                I ALREADY HAVE AN ACCOUNT
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
