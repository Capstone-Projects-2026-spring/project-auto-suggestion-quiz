import React, { useState } from 'react';
import './App.css';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ProblemPage from './pages/ProblemPage';
import { PROBLEMS } from './constants';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleOpenProblem = (problem) => {
    setSelectedProblem(problem);
    setCurrentPage('problem');
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
    setSelectedProblem(null);
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

  return (
    <Dashboard
      problems={PROBLEMS}
      onOpenProblem={handleOpenProblem}
    />
  );
}

export default App;
