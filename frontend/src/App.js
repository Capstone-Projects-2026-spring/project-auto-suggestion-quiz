import React, { useState } from 'react';
import './App.css';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ProblemPage from './pages/ProblemPage';
import CreateProblemPage from './pages/CreateProblemPage';
import { PROBLEMS } from './constants';

/**
 * @fileoverview Root application component for the Auto Suggestion Quiz app.
 * Handles top-level routing between Login, Dashboard, and Problem pages.
 * @module App
 */

/**
 * Main App component. Manages page navigation and shared state
 * for the current user and selected problem.
 *
 * @component
 * @returns {JSX.Element} The currently active page component.
 */
function App() {
  /**
   * @type {[string, Function]} Current page identifier — 'login', 'dashboard', or 'problem'.
   */
  const [currentPage, setCurrentPage] = useState('login');

  /**
   * @type {[Object|null, Function]} The currently selected problem object, or null if none.
   */
  const [selectedProblem, setSelectedProblem] = useState(null);

  /**
   * @type {[Object|null, Function]} The logged-in user's data, or null if not logged in.
   */
  const [user, setUser] = useState(null);

  /**
   * Handles successful login by storing user data and navigating to the dashboard.
   * @param {Object} userData - The authenticated user's data.
   */
  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  /**
   * Opens a specific problem and navigates to the Problem page.
   * @param {Object} problem - The problem object to display.
   */
  const handleOpenProblem = (problem) => {
    setSelectedProblem(problem);
    setCurrentPage('problem');
  };

  /**
   * Navigates back to the dashboard and clears the selected problem.
   */
  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
    setSelectedProblem(null);
  };

  const handleCreateProblem = () => {
    setCurrentPage('createProblem');
  };

  if (currentPage === 'login') {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (currentPage === 'problem' && selectedProblem) {
    return (
      <ProblemPage
        problem={selectedProblem}
        onBack={handleBackToDashboard}
      />
    );
  }

  if (currentPage === 'createProblem') {
    return <CreateProblemPage onBack={handleBackToDashboard} />;
  }

  return (
    <Dashboard
      problems={PROBLEMS}
      onOpenProblem={handleOpenProblem}
      onCreateProblem={handleCreateProblem}
      user={user}
    />
  );
}

export default App;