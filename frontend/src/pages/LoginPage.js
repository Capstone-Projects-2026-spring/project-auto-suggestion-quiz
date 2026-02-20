import React, { useState } from 'react';
import { authenticateUser, registerUser } from '../api';

/**
 * @fileoverview Login page component for the AutoSuggestion Quiz application.
 * @module LoginPage
 */

/**
 * @typedef {Object} User
 * @property {string} email - The authenticated user's email address.
 * @property {string} [name] - The authenticated user's display name.
 * @property {string} [role] - The authenticated user's role (e.g. 'student', 'admin').
 */

/**
 * A login page component that handles user authentication.
 * Renders a sign-in form with email and password fields, error messaging,
 * and a shortcut "Register" button that pre-fills demo credentials.
 *
 * @component
 * @param {Object} props
 * @param {function(User): void} props.onLogin - Callback invoked with the authenticated
 *   user object upon successful login.
 * @returns {React.ReactElement} The rendered login page.
 *
 * @example
 * <LoginPage onLogin={(user) => console.log('Logged in as', user.email)} />
 */
function LoginPage({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  /** @type {[string, function(string): void]} The controlled password input value. */
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [isLoading, setIsLoading] = useState(false);

  /** @type {[string, function(string): void]} The current error message, or empty string if none. */
  const [error, setError] = useState('');

  /**
   * Handles form submission by validating inputs and calling the authentication service.
   * Sets an error message if validation fails or the authentication request rejects.
   *
   * @async
   * @function
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   * @returns {Promise<void>}
   */
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
