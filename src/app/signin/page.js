'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Notification from '@/components/alertnotification';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const router = useRouter();

  const handleSignin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setMessage('Please enter full information in form !!!');
      return;
    }
    try {
      const response = await fetch('/api/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      console.log(data);
      if (response.ok) {
        setMessage(`Success: ${data.message}`);
        setMessageType('success');
        localStorage.setItem('token', data.token);
        router.push('/dashboard');
      } else {
        setMessage(`Error: ${data.message}`);
        setMessageType('failed');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessageType('failed');
      setMessage('An error occurred while signing in.');
    }
  };

  return (
    <div className="signin-container">
      {/* Top Bar */}
      <div className="top-bar">
        <Link href="/" className="home-link">
          <i className="fa fa-home" style={{ color: 'white', fontSize: '35px' }}></i>
        </Link>
        <Link href="/signup" className="signup-btn" style={{textDecoration: 'none', color: 'white',}}>
          Sign Up
        </Link>
      </div>

      {/* Sign In Form */}
      <div className="form-wrapper">
        <h2 className="form-title">Sign In to Your Account</h2>
        <form onSubmit={handleSignin} className="signin-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" className="submit-btn">
            Sign In
          </button>
        </form>

        {/* Divider
        <div className="divider">
          <span>OR</span>
        </div>

        {/* Social Login Buttons */}
        {/* <div className="social-login">
          <button type="button" className="social-btn facebook-btn">
            <i className="fa fa-facebook" aria-hidden="true"></i>
            Sign in with Facebook
          </button>
          <button type="button" className="social-btn google-btn">
            <i className="fa fa-google" aria-hidden="true"></i>
            Sign in with Google
          </button>
        </div> */}

        {/* Notification */}
        {message && <Notification message={message} type={messageType} onClose={() => setMessage('')} />}
      </div>

      <style jsx>{`
        .signin-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #131f24 0%, #2c3e50 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }

        /* Background Animation */
        .signin-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 10%, transparent 10%);
          background-size: 50px 50px;
          opacity: 0.3;
          z-index: 0;
          animation: moveBackground 20s linear infinite;
        }

        @keyframes moveBackground {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }

        /* Top Bar */
        .top-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          padding: 20px 30px;
          z-index: 10;
        }

        .home-link {
          font-size: 35px;
          color: #ffffff;
          transition: color 0.3s ease;
        }

        .home-link:hover {
          color: #1e90ff;
        }

        .signup-btn {
          padding: 10px 20px;
          font-size: 16px;
          font-weight: bold;
          color: #ffffff;
          border: 2px solid #ffffff;
          border-radius: 25px;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .signup-btn:hover {
          background-color: #ffffff;
          color: #131f24;
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }

        /* Form Wrapper */
        .form-wrapper {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          padding: 40px;
          border-radius: 15px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
          width: 100%;
          max-width: 400px;
          z-index: 1;
          transition: transform 0.3s ease;
        }

        .form-wrapper:hover {
          transform: translateY(-5px);
        }

        .form-title {
          color: #ffffff;
          font-size: 28px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 30px;
          text-transform: uppercase;
          letter-spacing: 1px;
          background: linear-gradient(to right, #1e90ff, #ffffff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Form Inputs */
        .signin-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          color: #ffffff;
          font-size: 16px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-input {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 12px;
          color: #ffffff;
          font-size: 16px;
          transition: all 0.3s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: #1e90ff;
          background: rgba(255, 255, 255, 0.15);
          box-shadow: 0 0 10px rgba(30, 144, 255, 0.3);
        }

        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
          font-style: italic;
        }

        /* Submit Button */
        .submit-btn {
          background: linear-gradient(90deg, #1e90ff, #00bcd4);
          border: none;
          border-radius: 8px;
          padding: 14px;
          color: #ffffff;
          font-size: 16px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(30, 144, 255, 0.3);
        }

        .submit-btn:hover {
          background: linear-gradient(90deg, #00bcd4, #1e90ff);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(30, 144, 255, 0.5);
        }

        /* Divider */
        .divider {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 20px 0;
          position: relative;
        }

        .divider span {
          background: rgba(255, 255, 255, 0.05);
          padding: 0 15px;
          color: rgba(255, 255, 255, 0.5);
          font-size: 14px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255, 255, 255, 0.2);
        }

        /* Social Login Buttons */
        .social-login {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          text-transform: uppercase;
          transition: all 0.3s ease;
        }

        .facebook-btn {
          background: #3b5998;
          color: #ffffff;
          border: none;
          box-shadow: 0 4px 15px rgba(59, 89, 152, 0.3);
        }

        .facebook-btn:hover {
          background: #2d4373;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 89, 152, 0.5);
        }

        .google-btn {
          background: #ffffff;
          color: #333333;
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .google-btn:hover {
          background: #f1f1f1;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}