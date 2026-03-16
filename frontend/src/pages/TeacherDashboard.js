import React, { useState } from 'react';
import { DIFFICULTY_COLORS, PROBLEMS } from '../constants';

/**
 * @fileoverview Teacher Dashboard component for the AutoSuggestion Quiz app.
 * Provides problem management, student submission review, and analytics.
 * @module TeacherDashboard
 */

/**
 * @typedef {Object} Submission
 * @property {number} id - Unique submission ID.
 * @property {string} studentName - Display name of the student.
 * @property {string} studentInitials - Two-letter initials for the avatar.
 * @property {number} problemId - ID of the problem submitted.
 * @property {string} problemTitle - Title of the problem submitted.
 * @property {string} language - Language the student used.
 * @property {number} score - Score percentage (0–100).
 * @property {string} submittedAt - Human-readable submission timestamp.
 * @property {number} timeTakenMin - Minutes the student spent on the problem.
 * @property {'graded'|'pending'} status - Grading status.
 */

/** Mock submission data — replace with API calls to GET /submissions */
const MOCK_SUBMISSIONS = [
    { id: 1, studentName: 'Jamie Lee', studentInitials: 'JL', problemId: 1, problemTitle: 'Two Sum', language: 'Python', score: 95, submittedAt: 'Mar 16, 2:14 PM', timeTakenMin: 18, status: 'graded' },
    { id: 2, studentName: 'Marcus Kim', studentInitials: 'MK', problemId: 2, problemTitle: 'Valid Parentheses', language: 'JavaScript', score: 68, submittedAt: 'Mar 16, 1:03 PM', timeTakenMin: 34, status: 'graded' },
    { id: 3, studentName: 'Aisha Patel', studentInitials: 'AP', problemId: 1, problemTitle: 'Two Sum', language: 'Java', score: 88, submittedAt: 'Mar 16, 11:22 AM', timeTakenMin: 22, status: 'graded' },
    { id: 4, studentName: 'Tyler Ross', studentInitials: 'TR', problemId: 3, problemTitle: 'Reverse Linked List', language: 'Python', score: 42, submittedAt: 'Mar 16, 10:55 AM', timeTakenMin: 51, status: 'graded' },
    { id: 5, studentName: 'Sofia Nguyen', studentInitials: 'SN', problemId: 4, problemTitle: 'Binary Search', language: 'C', score: 80, submittedAt: 'Mar 15, 4:40 PM', timeTakenMin: 25, status: 'graded' },
    { id: 6, studentName: 'David Chen', studentInitials: 'DC', problemId: 2, problemTitle: 'Valid Parentheses', language: 'Python', score: null, submittedAt: 'Mar 15, 2:10 PM', timeTakenMin: null, status: 'pending' },
    { id: 7, studentName: 'Priya Shah', studentInitials: 'PS', problemId: 5, problemTitle: 'Merge Two Sorted Lists', language: 'JavaScript', score: 91, submittedAt: 'Mar 14, 3:30 PM', timeTakenMin: 29, status: 'graded' },
    { id: 8, studentName: 'Leo Martinez', studentInitials: 'LM', problemId: 3, problemTitle: 'Reverse Linked List', language: 'Java', score: null, submittedAt: 'Mar 14, 1:45 PM', timeTakenMin: null, status: 'pending' },
];

/**
 * Returns a score color using the app's existing color palette.
 * @param {number|null} score
 * @returns {string}
 */
function scoreColor(score) {
    if (score == null) return '#888';
    if (score >= 80) return '#16825d';
    if (score >= 60) return '#c08b30';
    return '#e05555';
}

/**
 * Small avatar circle matching the VSCode dark theme.
 */
function Avatar({ initials }) {
    return (
        <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(86,156,214,0.15)',
            border: '1px solid rgba(86,156,214,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 600, color: '#569cd6', flexShrink: 0,
        }}>
            {initials}
        </div>
    );
}

/**
 * Teacher Dashboard. Tabs: Overview | Problems | Submissions | Analytics.
 *
 * @component
 * @param {Object} props
 * @param {Object|null} props.user - The logged-in teacher user.
 * @param {function(): void} props.onCreateProblem - Navigate to CreateProblemPage.
 * @param {function(Object): void} props.onOpenProblem - Navigate to ProblemPage for preview.
 * @returns {React.ReactElement}
 */
function TeacherDashboard({ user, onCreateProblem, onOpenProblem }) {
    const [tab, setTab] = useState('overview');
    const [problemFilter, setProblemFilter] = useState('all');
    const [problemSearch, setProblemSearch] = useState('');
    const [subFilter, setSubFilter] = useState('all');
    const [problems, setProblems] = useState(PROBLEMS);

    // ─── Derived stats ───────────────────────────────────────────────────────────
    const totalProblems = problems.length;
    const totalSubmissions = MOCK_SUBMISSIONS.length;
    const gradedSubs = MOCK_SUBMISSIONS.filter((s) => s.status === 'graded');
    const avgScore = gradedSubs.length
        ? Math.round(gradedSubs.reduce((acc, s) => acc + s.score, 0) / gradedSubs.length)
        : 0;
    const pendingCount = MOCK_SUBMISSIONS.filter((s) => s.status === 'pending').length;

    // ─── Filtered problems ────────────────────────────────────────────────────────
    const filteredProblems = problems.filter((p) => {
        const matchesDiff = problemFilter === 'all' || p.difficulty.toLowerCase() === problemFilter;
        const matchesSearch =
            problemSearch === '' ||
            p.title.toLowerCase().includes(problemSearch.toLowerCase()) ||
            p.tags.some((t) => t.toLowerCase().includes(problemSearch.toLowerCase()));
        return matchesDiff && matchesSearch;
    });

    // ─── Filtered submissions ─────────────────────────────────────────────────────
    const filteredSubs = MOCK_SUBMISSIONS.filter((s) => {
        if (subFilter === 'all') return true;
        if (subFilter === 'pending') return s.status === 'pending';
        if (subFilter === 'graded') return s.status === 'graded';
        return true;
    });

    // ─── Delete a problem ─────────────────────────────────────────────────────────
    const handleDeleteProblem = (id) => {
        if (window.confirm('Delete this problem? This cannot be undone.')) {
            setProblems((prev) => prev.filter((p) => p.id !== id));
        }
    };

    // ─── Shared tab bar ───────────────────────────────────────────────────────────
    const TABS = [
        { key: 'overview', label: 'Overview' },
        { key: 'problems', label: 'Problems' },
        { key: 'submissions', label: `Submissions${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
        { key: 'analytics', label: 'Analytics' },
    ];

    return (
        <div className="app">
            {/* ── Header ── */}
            <header className="app-header">
                <div className="header-left">
                    <h1 className="logo">AutoSuggestion Quiz</h1>
                    <span style={{ fontSize: 11, color: '#569cd6', background: 'rgba(86,156,214,0.12)', border: '1px solid rgba(86,156,214,0.25)', borderRadius: 3, padding: '2px 7px', fontWeight: 600, letterSpacing: '0.3px' }}>
            TEACHER
          </span>
                </div>
                <div className="header-right">
                    <span className="dashboard-greeting">Welcome back, {user?.name || 'Teacher'}</span>
                    <button className="btn btn-outline" onClick={onCreateProblem}>
                        + New Problem
                    </button>
                </div>
            </header>

            {/* ── Tab bar ── */}
            <div style={{ display: 'flex', background: '#252526', borderBottom: '1px solid #3c3c3c', paddingLeft: 24, flexShrink: 0 }}>
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        className={`tab-btn${tab === t.key ? ' active' : ''}`}
                        onClick={() => setTab(t.key)}
                        style={{ fontSize: 13 }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── Page body ── */}
            <div className="dashboard">

                {/* ══════════════════════════════════════
            OVERVIEW TAB
        ══════════════════════════════════════ */}
                {tab === 'overview' && (
                    <>
                        {/* Stat cards */}
                        <div className="stats-bar">
                            <div className="stat-card">
                                <span className="stat-value">{totalProblems}</span>
                                <span className="stat-label">Total Problems</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-value" style={{ color: '#569cd6' }}>{totalSubmissions}</span>
                                <span className="stat-label">Submissions</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-value" style={{ color: scoreColor(avgScore) }}>{avgScore}%</span>
                                <span className="stat-label">Avg Score</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-value" style={{ color: pendingCount > 0 ? '#c08b30' : '#888' }}>{pendingCount}</span>
                                <span className="stat-label">Pending Review</span>
                            </div>
                            <div className="stat-card">
                                <div className="progress-bar-container">
                                    <div className="progress-bar-fill" style={{ width: `${(gradedSubs.length / totalSubmissions) * 100}%` }} />
                                </div>
                                <span className="stat-label">{Math.round((gradedSubs.length / totalSubmissions) * 100)}% Graded</span>
                            </div>
                        </div>

                        {/* Two-column layout */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                            {/* Recent submissions */}
                            <div style={{ background: '#252526', border: '1px solid #3c3c3c', borderRadius: 8, overflow: 'hidden' }}>
                                <div style={{ padding: '10px 16px', borderBottom: '1px solid #3c3c3c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="panel-title">Recent Submissions</span>
                                    <button className="btn-back" onClick={() => setTab('submissions')}>View all</button>
                                </div>
                                <div style={{ padding: '8px 0' }}>
                                    {MOCK_SUBMISSIONS.slice(0, 5).map((s) => (
                                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px' }}>
                                            <Avatar initials={s.studentInitials} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 13, color: '#ccc', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.studentName}</div>
                                                <div style={{ fontSize: 11, color: '#666' }}>{s.problemTitle} · {s.submittedAt}</div>
                                            </div>
                                            {s.status === 'pending' ? (
                                                <span style={{ fontSize: 10, fontWeight: 600, color: '#c08b30', background: 'rgba(192,139,48,0.12)', border: '1px solid rgba(192,139,48,0.25)', borderRadius: 3, padding: '2px 7px', letterSpacing: '0.3px' }}>PENDING</span>
                                            ) : (
                                                <span style={{ fontSize: 13, fontWeight: 600, color: scoreColor(s.score) }}>{s.score}%</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Problem list preview */}
                            <div style={{ background: '#252526', border: '1px solid #3c3c3c', borderRadius: 8, overflow: 'hidden' }}>
                                <div style={{ padding: '10px 16px', borderBottom: '1px solid #3c3c3c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="panel-title">Active Problems</span>
                                    <button className="btn-back" onClick={() => setTab('problems')}>Manage</button>
                                </div>
                                <div style={{ padding: '8px 0' }}>
                                    {problems.slice(0, 5).map((p) => {
                                        const subCount = MOCK_SUBMISSIONS.filter((s) => s.problemId === p.id).length;
                                        return (
                                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px' }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: 13, color: '#ccc', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                                                    <div style={{ fontSize: 11, color: '#666' }}>{p.tags.slice(0, 2).join(', ')}</div>
                                                </div>
                                                <span style={{ fontSize: 11, color: DIFFICULTY_COLORS[p.difficulty], fontWeight: 600 }}>{p.difficulty}</span>
                                                <span style={{ fontSize: 11, color: '#666', minWidth: 48, textAlign: 'right' }}>{subCount} sub{subCount !== 1 ? 's' : ''}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ══════════════════════════════════════
            PROBLEMS TAB
        ══════════════════════════════════════ */}
                {tab === 'problems' && (
                    <>
                        {/* Toolbar */}
                        <div className="dashboard-toolbar">
                            <div className="search-box">
                                <span className="search-icon">⌕</span>
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="Search problems or tags..."
                                    value={problemSearch}
                                    onChange={(e) => setProblemSearch(e.target.value)}
                                />
                            </div>
                            <div className="filter-group">
                                {['all', 'easy', 'medium', 'hard'].map((f) => (
                                    <button
                                        key={f}
                                        className={`filter-btn${problemFilter === f ? ' active' : ''}`}
                                        onClick={() => setProblemFilter(f)}
                                    >
                                        {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                                    </button>
                                ))}
                            </div>
                            <button className="btn btn-outline" onClick={onCreateProblem} style={{ flexShrink: 0 }}>
                                + New Problem
                            </button>
                        </div>

                        {/* Table */}
                        <div style={{ background: '#252526', border: '1px solid #3c3c3c', borderRadius: 8, overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                <tr style={{ borderBottom: '1px solid #3c3c3c' }}>
                                    {['Title', 'Tags', 'Difficulty', 'Languages', 'Submissions', 'Actions'].map((h) => (
                                        <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.4px', background: '#252526' }}>{h}</th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {filteredProblems.map((p) => {
                                    const subCount = MOCK_SUBMISSIONS.filter((s) => s.problemId === p.id).length;
                                    const langs = Object.keys(p.starterCode);
                                    return (
                                        <tr key={p.id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                                            <td style={{ padding: '10px 14px', color: '#ccc', fontWeight: 500 }}>{p.title}</td>
                                            <td style={{ padding: '10px 14px' }}>
                                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                    {p.tags.map((t) => (
                                                        <span key={t} className="tag">{t}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={{ padding: '10px 14px', color: DIFFICULTY_COLORS[p.difficulty], fontWeight: 600, fontSize: 12 }}>{p.difficulty}</td>
                                            <td style={{ padding: '10px 14px', color: '#888', fontSize: 12 }}>{langs.join(', ')}</td>
                                            <td style={{ padding: '10px 14px', color: '#888', fontSize: 12 }}>{subCount}</td>
                                            <td style={{ padding: '10px 14px' }}>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button className="btn-back" onClick={() => onOpenProblem(p)} style={{ fontSize: 11 }}>Preview</button>
                                                    <button className="btn-back" onClick={onCreateProblem} style={{ fontSize: 11 }}>Edit</button>
                                                    <button
                                                        className="btn-back"
                                                        onClick={() => handleDeleteProblem(p.id)}
                                                        style={{ fontSize: 11, color: '#e05555', borderColor: 'rgba(224,85,85,0.3)' }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                            {filteredProblems.length === 0 && (
                                <div className="empty-state"><p>No problems match your search.</p></div>
                            )}
                        </div>
                    </>
                )}

                {/* ══════════════════════════════════════
            SUBMISSIONS TAB
        ══════════════════════════════════════ */}
                {tab === 'submissions' && (
                    <>
                        <div className="dashboard-toolbar">
                            <span style={{ fontSize: 13, color: '#888' }}>{filteredSubs.length} submission{filteredSubs.length !== 1 ? 's' : ''}</span>
                            <div className="filter-group">
                                {['all', 'pending', 'graded'].map((f) => (
                                    <button
                                        key={f}
                                        className={`filter-btn${subFilter === f ? ' active' : ''}`}
                                        onClick={() => setSubFilter(f)}
                                    >
                                        {f.charAt(0).toUpperCase() + f.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ background: '#252526', border: '1px solid #3c3c3c', borderRadius: 8, overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                <tr style={{ borderBottom: '1px solid #3c3c3c' }}>
                                    {['Student', 'Problem', 'Language', 'Time Taken', 'Score', 'Status', 'Submitted'].map((h) => (
                                        <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.4px', background: '#252526' }}>{h}</th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {filteredSubs.map((s) => (
                                    <tr key={s.id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                                        <td style={{ padding: '10px 14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Avatar initials={s.studentInitials} />
                                                <span style={{ color: '#ccc', fontWeight: 500 }}>{s.studentName}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '10px 14px', color: '#9cdcfe' }}>{s.problemTitle}</td>
                                        <td style={{ padding: '10px 14px', color: '#888', fontSize: 12 }}>{s.language}</td>
                                        <td style={{ padding: '10px 14px', color: '#888', fontSize: 12 }}>
                                            {s.timeTakenMin != null ? `${s.timeTakenMin} min` : '—'}
                                        </td>
                                        <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: 13, color: scoreColor(s.score) }}>
                                            {s.score != null ? `${s.score}%` : '—'}
                                        </td>
                                        <td style={{ padding: '10px 14px' }}>
                                            {s.status === 'pending' ? (
                                                <span style={{ fontSize: 10, fontWeight: 600, color: '#c08b30', background: 'rgba(192,139,48,0.12)', border: '1px solid rgba(192,139,48,0.25)', borderRadius: 3, padding: '2px 7px', letterSpacing: '0.3px' }}>PENDING</span>
                                            ) : (
                                                <span style={{ fontSize: 10, fontWeight: 600, color: '#16825d', background: 'rgba(22,130,93,0.12)', border: '1px solid rgba(22,130,93,0.25)', borderRadius: 3, padding: '2px 7px', letterSpacing: '0.3px' }}>GRADED</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '10px 14px', color: '#666', fontSize: 12 }}>{s.submittedAt}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            {filteredSubs.length === 0 && (
                                <div className="empty-state"><p>No submissions match this filter.</p></div>
                            )}
                        </div>
                    </>
                )}

                {/* ══════════════════════════════════════
            ANALYTICS TAB
        ══════════════════════════════════════ */}
                {tab === 'analytics' && (
                    <>
                        <div className="stats-bar">
                            <div className="stat-card">
                                <span className="stat-value" style={{ color: '#16825d' }}>{avgScore}%</span>
                                <span className="stat-label">Avg Score</span>
                            </div>
                            <div className="stat-card">
                <span className="stat-value" style={{ color: '#569cd6' }}>
                  {gradedSubs.length > 0 ? Math.round(gradedSubs.reduce((a, s) => a + s.timeTakenMin, 0) / gradedSubs.length) : 0} min
                </span>
                                <span className="stat-label">Avg Time</span>
                            </div>
                            <div className="stat-card">
                <span className="stat-value" style={{ color: '#e05555' }}>
                  {(() => {
                      const byProblem = {};
                      gradedSubs.forEach((s) => {
                          if (!byProblem[s.problemTitle]) byProblem[s.problemTitle] = [];
                          byProblem[s.problemTitle].push(s.score);
                      });
                      let lowest = null, lowestAvg = 101;
                      Object.entries(byProblem).forEach(([title, scores]) => {
                          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                          if (avg < lowestAvg) { lowestAvg = avg; lowest = title; }
                      });
                      return lowest ? lowest.split(' ').slice(0, 2).join(' ') : '—';
                  })()}
                </span>
                                <span className="stat-label">Hardest Problem</span>
                            </div>
                            <div className="stat-card">
                <span className="stat-value" style={{ color: '#16825d' }}>
                  {Math.round((gradedSubs.length / totalSubmissions) * 100)}%
                </span>
                                <span className="stat-label">Graded Rate</span>
                            </div>
                        </div>

                        {/* Score by problem */}
                        <div style={{ background: '#252526', border: '1px solid #3c3c3c', borderRadius: 8, padding: '16px 20px', marginBottom: 16 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>Avg Score by Problem</div>
                            {(() => {
                                const byProblem = {};
                                gradedSubs.forEach((s) => {
                                    if (!byProblem[s.problemTitle]) byProblem[s.problemTitle] = [];
                                    byProblem[s.problemTitle].push(s.score);
                                });
                                return Object.entries(byProblem).map(([title, scores]) => {
                                    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
                                    return (
                                        <div key={title} style={{ marginBottom: 12 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#ccc', marginBottom: 5 }}>
                                                <span>{title}</span>
                                                <span style={{ color: scoreColor(avg), fontWeight: 600 }}>{avg}%</span>
                                            </div>
                                            <div className="progress-bar-container">
                                                <div
                                                    className="progress-bar-fill"
                                                    style={{ width: `${avg}%`, background: scoreColor(avg) }}
                                                />
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>

                        {/* Language breakdown */}
                        <div style={{ background: '#252526', border: '1px solid #3c3c3c', borderRadius: 8, padding: '16px 20px' }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>Submissions by Language</div>
                            {(() => {
                                const byLang = {};
                                MOCK_SUBMISSIONS.forEach((s) => {
                                    byLang[s.language] = (byLang[s.language] || 0) + 1;
                                });
                                const total = MOCK_SUBMISSIONS.length;
                                return Object.entries(byLang)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([lang, count]) => (
                                        <div key={lang} style={{ marginBottom: 12 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#ccc', marginBottom: 5 }}>
                                                <span>{lang}</span>
                                                <span style={{ color: '#888' }}>{count} submission{count !== 1 ? 's' : ''}</span>
                                            </div>
                                            <div className="progress-bar-container">
                                                <div
                                                    className="progress-bar-fill"
                                                    style={{ width: `${Math.round((count / total) * 100)}%`, background: '#569cd6' }}
                                                />
                                            </div>
                                        </div>
                                    ));
                            })()}
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}

export default TeacherDashboard;