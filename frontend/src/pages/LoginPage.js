import React, { useState } from 'react';
//use information from temporary userAuth info
import { authenticateUser } from '../temporaryBackEnd/loginAuth';

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const user = await authenticateUser(email, password);
      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1 className="logo">AutoSuggestion Quiz</h1>
        </div>
      </header>

      <div className="login-page">
        <div className="login-card">
          <div className="login-header">
            <h2 className="login-title">Sign In</h2>
            <p className="login-subtitle">Enter your credentials to continue</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="text"
                className="form-input"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <button
              type="submit"
              className="btn login-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="login-footer">
            <p className="login-footer-text">
              Don't have an account?{' '}
              <button
                className="link-btn"
                onClick={() => {
                  if (!email.trim()) setEmail('newstudent@university.edu');
                  if (!password.trim()) setPassword('password');
                }}
              >
                Register
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;