import React, { useState } from 'react';
import { authenticateUser, registerUser } from '../api';

function LoginPage({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    if (isRegistering && !name.trim()) {
      setError('Please enter your name.');
      return;
    }

    setIsLoading(true);

    try {
      let user;
      if (isRegistering) {
        user = await registerUser(name, email, password, role);
      } else {
        user = await authenticateUser(email, password);
      }
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
            <h2 className="login-title">{isRegistering ? 'Create Account' : 'Sign In'}</h2>
            <p className="login-subtitle">
              {isRegistering ? 'Register a new account' : 'Enter your credentials to continue'}
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {isRegistering && (
              <div className="form-field">
                <label className="form-label" htmlFor="name">Name</label>
                <input
                  id="name"
                  type="text"
                  className="form-input"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
            )}

            <div className="form-field">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="text"
                className="form-input"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus={!isRegistering}
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

            {isRegistering && (
              <div className="form-field">
                <label className="form-label" htmlFor="role">Role</label>
                <select
                  id="role"
                  className="form-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
            )}

            {error && <p className="form-error">{error}</p>}

            <button
              type="submit"
              className="btn login-btn"
              disabled={isLoading}
            >
              {isLoading
                ? (isRegistering ? 'Creating account...' : 'Signing in...')
                : (isRegistering ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="login-footer">
            <p className="login-footer-text">
              {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
              <button
                className="link-btn"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                }}
              >
                {isRegistering ? 'Sign In' : 'Register'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
