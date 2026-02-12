import React, { useState } from 'react';
import { DIFFICULTY_COLORS, STATUS_CONFIG } from '../constants';

function Dashboard({ problems, onOpenProblem }) {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const completedCount = problems.filter((p) => p.status === 'completed').length;
  const inProgressCount = problems.filter((p) => p.status === 'in-progress').length;
  const totalCount = problems.length;

  const filtered = problems.filter((p) => {
    const matchesFilter = filter === 'all' || p.status === filter;
    const matchesSearch =
      searchQuery === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1 className="logo">AutoSuggestion Quiz</h1>
        </div>
        <div className="header-right">
          <span className="dashboard-greeting">Welcome back, Student</span>
        </div>
      </header>

      <div className="dashboard">
        <div className="stats-bar">
          <div className="stat-card">
            <span className="stat-value">{totalCount}</span>
            <span className="stat-label">Total Problems</span>
          </div>
          <div className="stat-card">
            <span className="stat-value" style={{ color: '#16825d' }}>{completedCount}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-card">
            <span className="stat-value" style={{ color: '#569cd6' }}>{inProgressCount}</span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-card">
            <span className="stat-value" style={{ color: '#888' }}>{totalCount - completedCount - inProgressCount}</span>
            <span className="stat-label">Not Started</span>
          </div>
          <div className="stat-card">
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
            <span className="stat-label">{Math.round((completedCount / totalCount) * 100)}% Complete</span>
          </div>
        </div>

        <div className="dashboard-toolbar">
          <div className="search-box">
            <span className="search-icon">⌕</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search problems or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-group">
            {['all', 'not-started', 'in-progress', 'completed'].map((f) => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : STATUS_CONFIG[f]?.label || f}
              </button>
            ))}
          </div>
        </div>

        <div className="problem-grid">
          {filtered.map((problem) => {
            const status = STATUS_CONFIG[problem.status];
            return (
              <button
                key={problem.id}
                className="problem-card"
                onClick={() => onOpenProblem(problem)}
              >
                <div className="card-top">
                  <span
                    className="difficulty-badge"
                    style={{ color: DIFFICULTY_COLORS[problem.difficulty] }}
                  >
                    {problem.difficulty}
                  </span>
                  <span className="status-indicator" style={{ color: status.color }}>
                    {status.icon}
                  </span>
                </div>

                <h3 className="card-title">{problem.title}</h3>

                <div className="card-tags">
                  {problem.tags.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>

                <div className="card-bottom">
                  <span className="status-label" style={{ color: status.color }}>
                    {status.label}
                  </span>
                  {problem.grade && (
                    <span className="grade-badge">{problem.grade}%</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            <p>No problems match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
